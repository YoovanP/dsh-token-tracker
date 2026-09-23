/**
 * dsh-token-tracker — Host half.
 *
 * Token accounting for the DeepSeek Harness. Every session's token usage is
 * already durable: the projection registry checkpoints the `tokenUsage`,
 * `contextPressure`, `sessionStats`, `modelSelection`, and `title` units per
 * session, and `session-projection-cache` persists those checkpoints as one
 * JSON record per session under `<home>/storages/session_projcache/sessions/`.
 *
 * This plugin reads that corpus (never the logs, so a scan is I/O-light and
 * repeat reads are cached by file mtime), folds it into one aggregation
 * payload, and serves it to the browser half over an authenticated exact Fetch
 * route registered on Connection's shared `/api` handler. Because the route
 * lives on that fence, it inherits the Host/Origin trust fence and browser
 * authentication for free — the browser reads it with a plain same-origin
 * `fetch` and nothing else can.
 *
 * Live sessions are overlaid from the projection registry, so the session you
 * are talking to right now reports current numbers instead of the last
 * checkpoint (the cache writes every 200 events or 5 s).
 *
 * The route answers two shapes:
 *   GET /api/token-tracker                      → aggregation payload
 *       ?days=1|7|30|90|0|all                   calendar-day window (0/all = all time)
 *       ?fresh=1                                bypass the file/aggregate caches
 *       ?limit=<n>                              cap the session rows (default: all)
 *   GET /api/token-tracker?session=<sessionId>  → per-turn drill-down for one session
 *
 * Nothing here writes to the Harness home except the optional price-override
 * file the user owns; the plugin is read-only over session state.
 *
 * @module dsh-token-tracker
 */

import { createRequire } from 'node:module'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { promises as fsp } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** Stable Cordis plugin name. */
const name = 'token-tracker'

/** Required service: the Host Fetch seam the browser reads through. */
const inject = ['connection']

/** Exact Fetch endpoint on Connection's shared, authenticated `/api` channel. */
const API_PATH = '/api/token-tracker'

/** Payload contract version; the browser half refuses a mismatch. */
const DATA_VERSION = 1

/** Projection-cache record directory, relative to the Harness home. */
const RECORD_SEGMENTS = ['storages', 'session_projcache', 'sessions']

/** Defaults for the optional config block. */
const DEFAULTS = Object.freeze({
  cacheTtlMs: 4000,
  detailTtlMs: 20000,
  sessionRowLimit: 0,
})

const DAY_MS = 86400000

/** Usage bucket fields, in the order the projections name them. */
const BUCKET_KEYS = Object.freeze([
  'uncachedInputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
])

//#region small helpers

/** Zeroed usage buckets. */
function zeroBuckets() {
  return { uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 }
}

/** Add one bucket set into another, in place. */
function addInto(target, source) {
  for (const key of BUCKET_KEYS) target[key] += numberOr(source?.[key], 0)
  return target
}

/** Sum of every bucket (what a provider bills for, cache reads included). */
function bucketTotal(bucket) {
  let total = 0
  for (const key of BUCKET_KEYS) total += numberOr(bucket?.[key], 0)
  return total
}

/** Tokens that are new work: uncached input + output + cache writes. */
function bucketBillable(bucket) {
  return numberOr(bucket?.uncachedInputTokens, 0)
    + numberOr(bucket?.outputTokens, 0)
    + numberOr(bucket?.cacheWriteTokens, 0)
}

/** Cache-read share of all prompt-side tokens, or null when there are none. */
function cacheHitRate(bucket) {
  const reads = numberOr(bucket?.cacheReadTokens, 0)
  const fresh = numberOr(bucket?.uncachedInputTokens, 0) + numberOr(bucket?.cacheWriteTokens, 0)
  const prompt = reads + fresh
  return prompt === 0 ? null : reads / prompt
}

/** Coerce to a finite number, or the fallback. */
function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Coerce to a non-empty string, or undefined. */
function stringOr(value) {
  return typeof value === 'string' && value !== '' ? value : undefined
}

/** Local-calendar day key (`YYYY-MM-DD`) for one epoch-ms instant. */
function dayKey(ms) {
  const date = new Date(ms)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${String(date.getFullYear())}-${month}-${day}`
}

/** Local midnight at the start of one epoch-ms instant's day. */
function startOfDay(ms) {
  const date = new Date(ms)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Display name for one workspace path (its last path segment). */
function workspaceName(cwd) {
  if (cwd === undefined) return '(unknown)'
  const normalized = cwd.replace(/[\\/]+$/u, '')
  const segments = normalized.split(/[\\/]/u).filter((segment) => segment !== '')
  return segments.length === 0 ? normalized : segments[segments.length - 1]
}

/** Resolve the Harness home the same way the rest of the harness does. */
function resolveHome(configured) {
  const explicit = stringOr(configured)
  if (explicit !== undefined) return path.resolve(explicit)
  const env = stringOr(process.env['DSH_HOME']?.trim())
  if (env !== undefined) return path.resolve(env)
  return path.join(os.homedir(), '.dsh')
}

//#endregion

//#region pricing

/**
 * One provider catalog: per-provider unit prices plus a model-id index for the
 * routes a catalog does not describe by name (a profile route may be a local
 * alias such as `opencode-go-latest`).
 */
function indexCatalog(files, logger) {
  const byProvider = new Map()
  const byModel = new Map()
  let models = 0
  let providers = 0
  for (const [providerId, value] of files) {
    const modelsForProvider = new Map()
    for (const group of Object.values(value ?? {})) {
      if (group === null || typeof group !== 'object') continue
      for (const [modelId, model] of Object.entries(group)) {
        const cost = model?.cost
        if (cost === null || typeof cost !== 'object') continue
        const unit = {
          input: numberOr(cost.input, 0),
          output: numberOr(cost.output, 0),
          cacheRead: numberOr(cost.cacheRead, 0),
          cacheWrite: numberOr(cost.cacheWrite, 0),
        }
        modelsForProvider.set(modelId, unit)
        const bucket = byModel.get(modelId) ?? []
        bucket.push({ provider: providerId, unit })
        byModel.set(modelId, bucket)
        models += 1
      }
    }
    if (modelsForProvider.size > 0) {
      byProvider.set(providerId, modelsForProvider)
      providers += 1
    }
  }
  logger?.debug?.('pricing: indexed %d models across %d catalog providers', models, providers)
  return { byProvider, byModel, providers, models }
}

/** Candidate directory for the installed pi-ai provider catalog. */
function locateCatalogDir(configured, logger) {
  const explicit = stringOr(configured)
  if (explicit !== undefined && existsSync(explicit)) return explicit
  const candidates = []
  // The launcher's own resolver reaches the installed adapter and its catalog.
  for (const anchor of [process.argv[1], process.execPath, import.meta.url]) {
    if (typeof anchor !== 'string' || anchor === '') continue
    try {
      const require = createRequire(anchor)
      const manifest = require.resolve('@earendil-works/pi-ai/package.json')
      candidates.push(path.join(path.dirname(manifest), 'dist', 'providers', 'data'))
    } catch {
      // The anchor cannot see the adapter; try the next one.
    }
  }
  for (const candidate of candidates) if (existsSync(candidate)) return candidate
  // Fall back to the npx/npm cache layouts when the launcher anchor is opaque.
  const globalRoots = []
  const npxRoots = [
    path.join(os.homedir(), 'AppData', 'Local', 'npm-cache', '_npx'),
    path.join(os.homedir(), '.npm', '_npx'),
  ]
  for (const root of npxRoots) {
    if (!existsSync(root)) continue
    let entries = []
    try {
      entries = readdirSync(root)
    } catch {
      continue
    }
    for (const entry of entries) globalRoots.push(path.join(root, entry, 'node_modules', '@earendil-works', 'pi-ai', 'dist', 'providers', 'data'))
  }
  for (const candidate of globalRoots) {
    if (existsSync(candidate)) {
      logger?.debug?.('pricing: resolved catalog through the package cache at %s', candidate)
      return candidate
    }
  }
  return undefined
}

/** Load the installed catalog plus the user's own price overrides. */
function loadPricing(config, logger) {
  const catalogDir = locateCatalogDir(config.catalogDir, logger)
  let catalog = { byProvider: new Map(), byModel: new Map(), providers: 0, models: 0 }
  if (catalogDir !== undefined) {
    const files = []
    let names = []
    try {
      names = readdirSync(catalogDir).filter((entry) => entry.endsWith('.json'))
    } catch (error) {
      logger?.warn?.('pricing: catalog directory unreadable (%s)', String(error?.message ?? error))
    }
    for (const entry of names) {
      try {
        const text = readFileSync(path.join(catalogDir, entry), 'utf8')
        files.push([entry.slice(0, -'.json'.length), JSON.parse(text)])
      } catch (error) {
        logger?.debug?.('pricing: skipped catalog file %s (%s)', entry, String(error?.message ?? error))
      }
    }
    catalog = indexCatalog(files, logger)
  }
  const overridesPath = stringOr(config.overridesPath) ?? path.join(resolveHome(config.home), 'token-tracker', 'pricing.json')
  const overrides = readOverrides(overridesPath, logger)
  return {
    catalog,
    overrides,
    overridesPath,
    catalogDir,
    resolve: (provider, model) => resolveUnitCost(provider, model, catalog, overrides),
  }
}

/**
 * Read the optional override file. Its shape is deliberately small:
 * `{ "routes": { "<route>": { "<model>": { input, output, cacheRead, cacheWrite } } },
 *    "models": { "<model>": { input, output, cacheRead, cacheWrite } } }`
 * Prices are US dollars per million tokens, matching the provider catalog.
 */
function readOverrides(file, logger) {
  if (!existsSync(file)) return { routes: {}, models: {} }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    return {
      routes: parsed?.routes !== null && typeof parsed?.routes === 'object' ? parsed.routes : {},
      models: parsed?.models !== null && typeof parsed?.models === 'object' ? parsed.models : {},
    }
  } catch (error) {
    logger?.warn?.('pricing: override file %s is not valid JSON (%s)', file, String(error?.message ?? error))
    return { routes: {}, models: {} }
  }
}

/** Resolve one unit price, preferring overrides, then the route, then the model id. */
function resolveUnitCost(provider, model, catalog, overrides) {
  const override = unitOf(overrides?.routes?.[provider]?.[model]) ?? unitOf(overrides?.models?.[model])
  if (override !== undefined) return { unit: override, via: 'override' }
  const exact = catalog.byProvider.get(provider)?.get(model)
  if (exact !== undefined) return { unit: exact, via: 'route' }
  // A profile route may name its catalog provider with a local suffix; match the
  // longest catalog provider the route starts with, then look the model up there.
  let best
  for (const key of catalog.byProvider.keys()) {
    if (provider !== undefined && provider.startsWith(key) && (best === undefined || key.length > best.length)) best = key
  }
  if (best !== undefined) {
    const unit = catalog.byProvider.get(best)?.get(model)
    if (unit !== undefined) return { unit, via: 'route-alias' }
  }
  const candidates = catalog.byModel.get(model) ?? []
  if (candidates.length > 0) return { unit: candidates[0].unit, via: 'model' }
  return undefined
}

/** Validate one override price block. */
function unitOf(value) {
  if (value === null || typeof value !== 'object') return undefined
  const unit = {
    input: numberOr(value.input, NaN),
    output: numberOr(value.output, NaN),
    cacheRead: numberOr(value.cacheRead, 0),
    cacheWrite: numberOr(value.cacheWrite, 0),
  }
  return Number.isNaN(unit.input) || Number.isNaN(unit.output) ? undefined : unit
}

/** Estimated dollars for one bucket set under one unit price. */
function estimateCost(bucket, unit) {
  if (unit === undefined) return null
  return (
    numberOr(bucket?.uncachedInputTokens, 0) * unit.input
    + numberOr(bucket?.outputTokens, 0) * unit.output
    + numberOr(bucket?.cacheReadTokens, 0) * unit.cacheRead
    + numberOr(bucket?.cacheWriteTokens, 0) * unit.cacheWrite
  ) / 1e6
}

//#endregion

//#region session records

/**
 * One durable session record, reduced to the fields the tracker reports.
 * Everything is read defensively: a record written by another harness version
 * simply contributes less, it never throws.
 */
function readRecord(file, text) {
  const document = JSON.parse(text)
  const record = document?.record
  const rows = record?.rows
  if (rows === null || typeof rows !== 'object') throw new Error('record carries no projection rows')
  const identity = record?.identity ?? {}
  const row = (key) => {
    const value = rows[key]
    return value !== null && typeof value === 'object' ? value : undefined
  }
  const tokenUsage = row('tokenUsage')?.val
  const totals = tokenUsage?.totals ?? {}
  const stats = row('sessionStats')?.val ?? {}
  const pressure = row('contextPressure')?.val ?? {}
  const selection = row('modelSelection')?.val ?? {}
  const lastUsed = selection.lastUsed ?? {}
  const listMeta = row('sessionListMetadata')?.val ?? {}
  const usage = {
    uncachedInputTokens: numberOr(totals.uncachedInputTokens, 0),
    outputTokens: numberOr(totals.outputTokens, 0),
    cacheReadTokens: numberOr(totals.cacheReadTokens, 0),
    cacheWriteTokens: numberOr(totals.cacheWriteTokens, 0),
  }
  const watermarks = []
  for (const value of Object.values(rows)) {
    if (value !== null && typeof value === 'object' && typeof value.seq === 'number') watermarks.push(value.seq)
  }
  const createdAt = numberOr(identity.createdAt, undefined)
  const last = tokenUsage?.last ?? undefined
  return {
    id: file.slice(0, -'.json'.length),
    title: stringOr(row('title')?.val),
    cwd: stringOr(identity.cwd),
    workspace: workspaceName(stringOr(identity.cwd)),
    createdAt,
    lastPromptAt: numberOr(listMeta.lastPromptAt, undefined),
    inheritedEventCount: numberOr(identity.inheritedEventCount, 0),
    asOfSeq: watermarks.length === 0 ? null : Math.max(...watermarks),
    provider: stringOr(lastUsed.provider),
    model: stringOr(lastUsed.model),
    effort: stringOr(lastUsed.reasoningEffort),
    preset: stringOr(row('agentPreset')?.val),
    blank: listMeta.blank === true,
    usage,
    turns: numberOr(stats.turns, 0),
    steps: numberOr(stats.steps, 0),
    llmMs: numberOr(stats.llmMs, 0),
    toolMs: numberOr(stats.toolMs, 0),
    ttftMs: numberOr(stats.ttftMs, 0),
    ttftSteps: numberOr(stats.ttftSteps, 0),
    decodeMs: numberOr(stats.decodeMs, 0),
    decodeTokens: numberOr(stats.decodeTokens, 0),
    lastSample: last === undefined ? undefined : { turn: numberOr(last.turn, 0), step: numberOr(last.step, 0) },
    context: {
      contextWindow: numberOr(pressure.contextWindow, undefined),
      pressureTokens: numberOr(pressure.pressureTokens, undefined),
      surfaceTokens: numberOr(pressure.surfaceTokens, undefined),
      sampledSurfaceTokens: numberOr(pressure.sampledSurfaceTokens, undefined),
    },
    turnOutline: Array.isArray(row('turnOutline')?.val?.turns) ? row('turnOutline').val.turns : undefined,
    source: 'cache',
    live: false,
  }
}

/**
 * The record corpus: one parsed record per cache file, reused while the file's
 * mtime and size are unchanged, so a UI poll over 150 sessions costs 150
 * `stat` calls and no JSON parsing.
 */
class RecordStore {
  constructor(dir, logger) {
    this.dir = dir
    this.logger = logger
    this.entries = new Map()
  }

  /** Scan the corpus; `fresh` re-reads every file regardless of mtime. */
  async scan(fresh) {
    const started = Date.now()
    const result = { records: [], problems: [], files: 0, reused: 0, parsed: 0 }
    let names
    try {
      names = (await fsp.readdir(this.dir)).filter((entry) => entry.endsWith('.json'))
    } catch (error) {
      result.error = `record directory unavailable: ${String(error?.message ?? error)}`
      return { ...result, scanMs: Date.now() - started }
    }
    const seen = new Set()
    for (const entry of names) {
      const file = path.join(this.dir, entry)
      seen.add(file)
      result.files += 1
      let stat
      try {
        stat = await fsp.stat(file)
      } catch {
        continue
      }
      const cached = this.entries.get(file)
      if (!fresh && cached !== undefined && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
        result.records.push(cached.record)
        result.reused += 1
        continue
      }
      try {
        const text = await fsp.readFile(file, 'utf8')
        const record = readRecord(entry, text)
        this.entries.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, record })
        result.records.push(record)
        result.parsed += 1
      } catch (error) {
        this.entries.delete(file)
        result.problems.push({ file: entry, message: String(error?.message ?? error) })
      }
    }
    for (const file of [...this.entries.keys()]) if (!seen.has(file)) this.entries.delete(file)
    return { ...result, scanMs: Date.now() - started }
  }
}

//#endregion

//#region aggregation

/** One mutable accumulator for a group of sessions. */
function newGroup(key, extra) {
  return {
    key,
    ...extra,
    sessions: 0,
    blankSessions: 0,
    turns: 0,
    steps: 0,
    llmMs: 0,
    toolMs: 0,
    ttftMs: 0,
    ttftSteps: 0,
    decodeTokens: 0,
    usage: zeroBuckets(),
    costUsd: 0,
    pricedSessions: 0,
    unpricedSessions: 0,
    firstAt: null,
    lastAt: null,
  }
}

/** Fold one session into its group accumulator. */
function foldGroup(group, session, cost) {
  group.sessions += 1
  if (session.blank === true) group.blankSessions += 1
  group.turns += session.turns
  group.steps += session.steps
  group.llmMs += session.llmMs
  group.toolMs += session.toolMs
  group.ttftMs += session.ttftMs
  group.ttftSteps += session.ttftSteps
  group.decodeTokens += session.decodeTokens
  addInto(group.usage, session.usage)
  if (cost === null) group.unpricedSessions += 1
  else {
    group.costUsd += cost
    group.pricedSessions += 1
  }
  const at = session.createdAt
  if (typeof at === 'number') {
    group.firstAt = group.firstAt === null ? at : Math.min(group.firstAt, at)
    group.lastAt = group.lastAt === null ? at : Math.max(group.lastAt, at)
  }
}

/** Public projection of one group accumulator, including derived rates. */
function summarizeGroup(group, totalsUsage) {
  const total = bucketTotal(group.usage)
  const cost = group.pricedSessions === 0 ? null : group.costUsd
  return {
    key: group.key,
    sessions: group.sessions,
    blankSessions: group.blankSessions,
    turns: group.turns,
    steps: group.steps,
    usage: { ...group.usage },
    totalTokens: total,
    billableTokens: bucketBillable(group.usage),
    cacheHitRate: cacheHitRate(group.usage),
    share: totalsUsage === 0 ? null : total / totalsUsage,
    llmMs: group.llmMs,
    toolMs: group.toolMs,
    ttftMs: group.ttftSteps === 0 ? null : group.ttftMs / group.ttftSteps,
    decodeTokens: group.decodeTokens,
    costUsd: cost,
    pricedSessions: group.pricedSessions,
    unpricedSessions: group.unpricedSessions,
    firstAt: group.firstAt,
    lastAt: group.lastAt,
    tokensPerTurn: group.turns === 0 ? null : total / group.turns,
    costPerSession: group.pricedSessions === 0 ? null : group.costUsd / group.pricedSessions,
    // Any per-group extras (provider/model/workspace identity) ride along.
    ...(group.provider === undefined ? {} : { provider: group.provider }),
    ...(group.model === undefined ? {} : { model: group.model }),
    ...(group.cwd === undefined ? {} : { cwd: group.cwd }),
    ...(group.name === undefined ? {} : { name: group.name }),
    ...(group.unit === undefined ? {} : { unit: group.unit }),
    ...(group.pricedVia === undefined ? {} : { pricedVia: group.pricedVia }),
  }
}

/** Group sessions by one key and summarize, sorted by descending total tokens. */
function groupBy(records, keyOf, seedOf) {
  const groups = new Map()
  for (const session of records) {
    const key = keyOf(session)
    let group = groups.get(key)
    if (group === undefined) {
      group = newGroup(key, seedOf === undefined ? {} : seedOf(session))
      groups.set(key, group)
    }
    foldGroup(group, session, session.costUsd ?? null)
  }
  return groups
}

/** Days a contribution graph covers (53 weeks, GitHub's own span). */
const CALENDAR_DAYS = 371

/**
 * Daily buckets and streaks for a contribution-style graph.
 *
 * One entry per calendar day between the first and last activity day (clipped
 * to the last 53 weeks), so the browser can lay out weeks without guessing
 * which days exist. The walk is date-based rather than `+86400000` so a DST
 * shift cannot skip or repeat a day.
 */
function buildCalendar(records, now) {
  const daily = new Map()
  let oldest = null
  for (const session of records) {
    if (session.createdAt === undefined || session.createdAt === null) continue
    const day = dayKey(session.createdAt)
    const entry = daily.get(day) ?? { day, sessions: 0, tokens: 0, billableTokens: 0, cacheReadTokens: 0, steps: 0, turns: 0, costUsd: 0, priced: 0 }
    entry.sessions += 1
    entry.tokens += bucketTotal(session.usage) || 0
    entry.billableTokens += bucketBillable(session.usage) || 0
    entry.cacheReadTokens += (session.usage === undefined ? 0 : session.usage.cacheReadTokens || 0)
    entry.steps += session.steps ?? 0
    entry.turns += session.turns ?? 0
    if (session.costUsd !== null && session.costUsd !== undefined) {
      entry.costUsd += session.costUsd
      entry.priced += 1
    }
    daily.set(day, entry)
    if (oldest === null || session.createdAt < oldest) oldest = session.createdAt
  }

  // The window is fixed (53 weeks) so the newest day always sits in the last
  // column and the days before the first session stay empty squares. Only days
  // with activity travel on the wire — the browser fills the gaps start → end.
  const end = startOfDay(now)
  const start = startOfDay(now - (CALENDAR_DAYS - 1) * DAY_MS)
  const days = []
  const active = []
  let longest = 0
  let run = 0
  let activeDays = 0
  let firstDay = null
  let best = null
  let cursor = new Date(start)
  while (cursor.getTime() <= end) {
    const key = dayKey(cursor.getTime())
    const entry = daily.get(key)
    if (entry !== undefined && entry.sessions > 0) {
      active.push(true)
      activeDays += 1
      run += 1
      if (run > longest) longest = run
      const shaped = {
        day: key,
        sessions: entry.sessions,
        tokens: entry.tokens,
        billableTokens: entry.billableTokens,
        cacheReadTokens: entry.cacheReadTokens,
        steps: entry.steps,
        turns: entry.turns,
        costUsd: entry.priced === 0 ? null : entry.costUsd,
      }
      if (firstDay === null) firstDay = shaped
      if (best === null || entry.tokens > best.tokens) best = { day: key, tokens: entry.tokens, sessions: entry.sessions }
      days.push(shaped)
    } else {
      active.push(false)
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }

  // Streaks read like GitHub's: consecutive days with at least one session.
  let current = 0
  for (let index = active.length - 1; index >= 0; index -= 1) {
    if (active[index]) current += 1
    else break
  }
  return {
    start,
    end,
    days,
    firstDay,
    firstSessionAt: oldest,
    streaks: {
      current,
      longest,
      activeDays,
      totalDays: active.length,
      bestDay: best,
    },
  }
}

/**
 * Build the aggregation payload the settings page renders.
 * @param records - durable session records (already live-overlaid).
 * @param options - window, pricing, and row-limit options.
 * @returns the wire payload.
 */
function aggregate(records, options) {
  const { days, now, pricing, limit, sources } = options
  const from = days > 0 ? startOfDay(now - (days - 1) * DAY_MS) : null
  const priced = []
  for (const session of records) {
    const resolved = pricing.resolve(session.provider, session.model)
    session.unit = resolved?.unit
    session.pricedVia = resolved?.via
    session.costUsd = estimateCost(session.usage, resolved?.unit)
    priced.push(session)
  }
  const inRange = from === null
    ? priced
    : priced.filter((session) => session.createdAt === undefined || session.createdAt >= from)

  const totals = newGroup('all', {})
  for (const session of inRange) foldGroup(totals, session, session.costUsd ?? null)
  const grandTotal = bucketTotal(totals.usage)

  const byDay = [...groupBy(inRange, (session) => (session.createdAt === undefined ? '(unknown)' : dayKey(session.createdAt))).values()]
    .map((group) => ({ ...summarizeGroup(group, grandTotal), day: group.key }))
  byDay.sort((left, right) => (left.day < right.day ? -1 : left.day > right.day ? 1 : 0))

  const byModel = [...groupBy(inRange, (session) => `${session.provider ?? '(unknown)'} / ${session.model ?? '(unknown)'}`, (session) => {
    const resolved = pricing.resolve(session.provider, session.model)
    return {
      provider: session.provider ?? null,
      model: session.model ?? null,
      unit: resolved?.unit ?? null,
      pricedVia: resolved?.via ?? null,
    }
  }).values()]
    .map((group) => summarizeGroup(group, grandTotal))
    .sort((left, right) => right.totalTokens - left.totalTokens)

  const byProvider = [...groupBy(inRange, (session) => session.provider ?? '(unknown)', (session) => ({ provider: session.provider ?? null })).values()]
    .map((group) => summarizeGroup(group, grandTotal))
    .sort((left, right) => right.totalTokens - left.totalTokens)

  const byWorkspace = [...groupBy(inRange, (session) => session.cwd ?? '(unknown)', (session) => ({
    cwd: session.cwd ?? null,
    name: session.workspace ?? null,
  })).values()]
    .map((group) => summarizeGroup(group, grandTotal))
    .sort((left, right) => right.totalTokens - left.totalTokens)

  const byPreset = [...groupBy(inRange, (session) => session.preset ?? '(default)').values()]
    .map((group) => summarizeGroup(group, grandTotal))
    .sort((left, right) => right.totalTokens - left.totalTokens)

  const byEffort = [...groupBy(inRange, (session) => session.effort ?? '(default)').values()]
    .map((group) => summarizeGroup(group, grandTotal))
    .sort((left, right) => right.totalTokens - left.totalTokens)

  // Weekday × hour activity, in tokens; the client renders it as a heatmap.
  const heat = new Map()
  for (const session of inRange) {
    const at = session.createdAt
    if (at === undefined) continue
    const date = new Date(at)
    const key = `${String(date.getDay())}-${String(date.getHours())}`
    const cell = heat.get(key) ?? { weekday: date.getDay(), hour: date.getHours(), sessions: 0, tokens: 0, costUsd: 0, priced: 0 }
    cell.sessions += 1
    cell.tokens += bucketTotal(session.usage)
    if (session.costUsd !== null && session.costUsd !== undefined) {
      cell.costUsd += session.costUsd
      cell.priced += 1
    }
    heat.set(key, cell)
  }

  const rows = inRange.map((session) => ({
    id: session.id,
    title: session.title ?? null,
    cwd: session.cwd ?? null,
    workspace: session.workspace ?? null,
    createdAt: session.createdAt ?? null,
    lastPromptAt: session.lastPromptAt ?? null,
    provider: session.provider ?? null,
    model: session.model ?? null,
    effort: session.effort ?? null,
    preset: session.preset ?? null,
    blank: session.blank === true,
    live: session.live === true,
    asOfSeq: session.asOfSeq ?? null,
    usage: { ...session.usage },
    totalTokens: bucketTotal(session.usage),
    billableTokens: bucketBillable(session.usage),
    cacheHitRate: cacheHitRate(session.usage),
    turns: session.turns,
    steps: session.steps,
    llmMs: session.llmMs,
    toolMs: session.toolMs,
    ttftMs: session.ttftMs,
    ttftSteps: session.ttftSteps,
    decodeTokens: session.decodeTokens,
    decodeMs: session.decodeMs,
    context: { ...session.context },
    contextPressure: contextPressureOf(session),
    costUsd: session.costUsd ?? null,
    pricedVia: session.pricedVia ?? null,
    unit: session.unit ?? null,
  }))
  rows.sort((left, right) => right.totalTokens - left.totalTokens)

  const limited = limit > 0 ? rows.slice(0, limit) : rows

  // Highlights: the one-line answers a tracker should not make you hunt for.
  const sortedByTotal = [...rows].sort((left, right) => right.totalTokens - left.totalTokens)
  const byCost = rows.filter((row) => row.costUsd !== null).sort((left, right) => right.costUsd - left.costUsd)
  const meaningful = rows.filter((row) => row.steps >= 5 && row.cacheHitRate !== null)
  const worstCache = [...meaningful].sort((left, right) => left.cacheHitRate - right.cacheHitRate)
  const busiestDay = [...byDay].sort((left, right) => right.totalTokens - left.totalTokens)[0]
  const longest = [...rows].sort((left, right) => right.llmMs - left.llmMs)[0]
  const risk = rows
    .filter((row) => row.context?.contextWindow !== undefined && row.context?.pressureTokens !== undefined)
    .map((row) => ({ ...row, utilization: row.context.pressureTokens / row.context.contextWindow }))
    .sort((left, right) => right.utilization - left.utilization)
  const ttfts = rows.map((row) => (row.ttftSteps > 0 ? row.ttftMs / row.ttftSteps : null)).filter((value) => value !== null && value > 0).sort((left, right) => left - right)

  const totalsPayload = {
    ...summarizeGroup(totals, grandTotal),
    totalTokens: grandTotal,
    sessionsInRange: inRange.length,
    sessionsAllTime: priced.length,
    costUsd: totals.pricedSessions === 0 ? null : totals.costUsd,
    costCoverage: totals.sessions === 0 ? null : totals.pricedSessions / totals.sessions,
    ttftMedianMs: ttfts.length === 0 ? null : ttfts[Math.floor(ttfts.length / 2)],
    decodeTokensPerSecond: totals.decodeTokens === 0 || totals.llmMs === 0 ? null : totals.decodeTokens / (totals.llmMs / 1000),
    avgTokensPerTurn: totals.turns === 0 ? null : grandTotal / totals.turns,
    avgTokensPerSession: totals.sessions === 0 ? null : grandTotal / totals.sessions,
    cacheReadShareOfBilled: grandTotal === 0 ? null : totals.usage.cacheReadTokens / grandTotal,
  }

  const calendar = buildCalendar(priced, now)

  return {
    ok: true,
    dataVersion: DATA_VERSION,
    generatedAt: now,
    range: { days, from, to: now },
    totals: totalsPayload,
    byDay,
    calendar: { start: calendar.start, end: calendar.end, days: calendar.days, firstDay: calendar.firstDay, firstSessionAt: calendar.firstSessionAt },
    streaks: calendar.streaks,
    byModel,
    byProvider,
    byWorkspace,
    byPreset,
    byEffort,
    heatmap: [...heat.values()],
    sessions: limited,
    sessionCount: rows.length,
    sessionLimit: limit,
    highlights: {
      topSession: sortedByTotal[0] === undefined ? null : pickRow(sortedByTotal[0]),
      topCostSession: byCost[0] === undefined ? null : pickRow(byCost[0]),
      thriftiestSession: worstCache.length === 0 ? null : pickRow(worstCache[worstCache.length - 1]),
      worstCacheSession: worstCache[0] === undefined ? null : pickRow(worstCache[0]),
      longestSession: longest === undefined ? null : pickRow(longest),
      busiestDay: busiestDay ?? null,
      topModel: byModel[0] ?? null,
      topWorkspace: byWorkspace[0] ?? null,
      contextRisk: risk.slice(0, 5).map((row) => ({ ...pickRow(row), utilization: row.utilization })),
      unpricedModels: summarizeUnpriced(rows),
    },
    pricing: {
      catalogDir: pricing.catalogDir ?? null,
      overridesPath: pricing.overridesPath ?? null,
      catalogProviders: pricing.catalog?.providers ?? 0,
      catalogModels: pricing.catalog?.models ?? 0,
    },
    sources,
  }
}

/** Ratio of the newest request pressure to the routed context window. */
function contextPressureOf(session) {
  const window = session.context?.contextWindow
  const pressure = session.context?.pressureTokens
  if (typeof window !== 'number' || window <= 0 || typeof pressure !== 'number') return null
  return pressure / window
}

/** Compact session identity for highlight rows. */
function pickRow(row) {
  return {
    id: row.id,
    title: row.title,
    workspace: row.workspace,
    provider: row.provider,
    model: row.model,
    totalTokens: row.totalTokens,
    cacheHitRate: row.cacheHitRate,
    costUsd: row.costUsd,
    turns: row.turns,
    steps: row.steps,
    llmMs: row.llmMs,
    createdAt: row.createdAt,
    contextPressure: row.contextPressure ?? null,
  }
}

/** The distinct model routes that carry usage but have no known unit price. */
function summarizeUnpriced(rows) {
  const groups = new Map()
  for (const row of rows) {
    if (row.costUsd !== null) continue
    const key = `${row.provider ?? '(unknown)'} / ${row.model ?? '(unknown)'}`
    const entry = groups.get(key) ?? { key, provider: row.provider, model: row.model, sessions: 0, totalTokens: 0 }
    entry.sessions += 1
    entry.totalTokens += row.totalTokens
    groups.set(key, entry)
  }
  return [...groups.values()].sort((left, right) => right.totalTokens - left.totalTokens)
}

//#endregion

//#region per-session drill-down

/** The usage one durable assistant settlement reports, mirroring token-meter. */
function usageOfEvent(event) {
  const data = event?.data
  if (data === null || typeof data !== 'object') return undefined
  if (data.usage !== undefined && data.usage !== null) return data.usage
  const stream = data.stream
  const chunks = Array.isArray(stream) ? stream : Array.isArray(stream?.chunks) ? stream.chunks : undefined
  if (chunks === undefined) return undefined
  // The durable stream is a compacted chunk list; the usage sample is the last
  // chunk whose inner payload says `usage` (`{type:'chunk', chunk:{type:'usage'}}`
  // in the shipped format, `{kind:'usage'}` in older ones).
  for (let index = chunks.length - 1; index >= 0; index -= 1) {
    const chunk = chunks[index]
    const inner = chunk?.chunk ?? chunk
    const kind = inner?.kind ?? inner?.type
    if (kind === 'usage' && inner.usage !== null && typeof inner.usage === 'object') return inner.usage
  }
  return undefined
}

/** The provider's finish reason for one assistant message, wherever it is nested. */
function stopReasonOfEvent(event) {
  const message = event?.data?.message
  return stringOr(
    message?.source?.replayState?.response?.stopReason
    ?? message?.replayState?.response?.stopReason
    ?? message?.stopReason
    ?? event?.data?.stopReason,
  )
}

/** One compact message text from a turn's prompt/response blocks. */
function textOfContent(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return undefined
  const parts = []
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  const joined = parts.join('\n').trim()
  return joined === '' ? undefined : joined
}

/**
 * Fold one session's durable log into per-turn usage.
 *
 * The fold mirrors token-meter's semantics: a step's retried attempt replaces
 * the sample it supersedes (`llm/retry-started` closes the slot), so a retry is
 * never double counted.
 */
function foldTurns(events, outline) {
  const prompts = new Map()
  if (Array.isArray(outline)) for (const entry of outline) prompts.set(numberOr(entry?.turn, -1), entry)
  const turns = new Map()
  let current = null
  let last = null
  let ignored = 0
  let logTitle = null
  let logWindow = null
  const ensure = (turn, time) => {
    let row = turns.get(turn)
    if (row === undefined) {
      row = {
        turn,
        steps: 0,
        retries: 0,
        compactions: 0,
        toolCalls: 0,
        toolFailures: 0,
        toolSteps: 0,
        usage: zeroBuckets(),
        startedAt: time ?? null,
        endedAt: null,
        provider: null,
        model: null,
        effort: null,
        outcome: null,
        contextWindow: null,
        stopReasons: {},
        modelSwitches: [],
      }
      turns.set(turn, row)
    }
    if (row.startedAt === null || (time !== undefined && time < row.startedAt)) row.startedAt = time ?? row.startedAt
    if (time !== undefined) row.endedAt = row.endedAt === null ? time : Math.max(row.endedAt, time)
    return row
  }
  for (const event of events) {
    const type = event?.type
    const data = event?.data ?? {}
    const turn = numberOr(data.turn, undefined)
    const time = numberOr(event?.time, undefined)
    switch (type) {
      case 'turn/start': {
        current = ensure(numberOr(turn, turns.size + 1), time)
        break
      }
      case 'turn/end': {
        if (turn !== undefined) {
          const row = ensure(turn, time)
          // `turn/end` carries why the turn finished: completed, aborted, max-steps…
          row.outcome ??= stringOr(data.reason?.kind ?? data.reason) ?? null
        }
        current = null
        break
      }
      case 'request/context': {
        // The routed window for one request. The newest one wins, and it is the
        // only in-log source for "how full was the context".
        const window = numberOr(data.contextWindow, undefined)
        if (window !== undefined) logWindow = window
        if (turn !== undefined) {
          const row = ensure(turn, time)
          if (window !== undefined) row.contextWindow = window
          row.provider ??= stringOr(data.provider) ?? null
          row.model ??= stringOr(data.model) ?? null
        }
        break
      }
      case 'session/title': {
        const title = stringOr(data.title) ?? textOfContent(data.title)
        if (title !== undefined) logTitle = title
        break
      }
      case 'step/start':
      case 'step/end': {
        if (turn !== undefined) {
          const row = ensure(turn, time)
          if (type === 'step/start') row.steps += 1
        }
        break
      }
      case 'llm/retry-started': {
        if (turn !== undefined && last !== null && last.turn === turn && last.step === numberOr(data.step, -1)) last = null
        if (turn !== undefined) ensure(turn, time).retries += 1
        break
      }
      case 'assistant/attempt':
      case 'assistant/message': {
        const sample = usageOfEvent(event)
        const step = numberOr(data.step, -1)
        if (turn === undefined) {
          if (sample === undefined) break
          ignored += 1
          break
        }
        const row = ensure(turn, time)
        const source = data.message?.source
        if (source?.kind === 'model') {
          if (row.provider === null && row.model === null) {
            row.provider = stringOr(source.provider) ?? null
            row.model = stringOr(source.model) ?? null
            row.effort = stringOr(source.reasoningEffort) ?? null
          } else if (source.model !== undefined && source.model !== row.model) {
            row.modelSwitches.push({ atSeq: numberOr(event?.seq, null), model: source.model, provider: stringOr(source.provider) ?? null })
            row.model = source.model
            row.provider = stringOr(source.provider) ?? row.provider
          }
        }
        if (sample === undefined) break
        const buckets = {
          uncachedInputTokens: numberOr(sample.inputTokens, 0),
          outputTokens: numberOr(sample.outputTokens, 0),
          cacheReadTokens: numberOr(sample.cacheReadTokens, 0),
          cacheWriteTokens: numberOr(sample.cacheWriteTokens, 0),
        }
        const previous = last !== null && last.turn === turn && last.step === step ? last.buckets : undefined
        const target = current !== null && current.turn === turn ? current : row
        if (previous !== undefined) {
          for (const key of BUCKET_KEYS) target.usage[key] -= previous[key]
        }
        addInto(target.usage, buckets)
        // The provider's own finish reason, tallied per turn: `toolUse` steps are
        // the ones that keep the loop running.
        const stopReason = stopReasonOfEvent(event)
        if (stopReason !== undefined) {
          target.stopReasons[stopReason] = (target.stopReasons[stopReason] ?? 0) + 1
          if (stopReason === 'toolUse' || stopReason === 'tool_use' || stopReason === 'tool-calls') target.toolSteps += 1
        }
        last = { turn, step, buckets }
        break
      }
      case 'tool/call': {
        if (turn !== undefined) ensure(turn, time).toolCalls += 1
        break
      }
      case 'tool/result': {
        if (turn !== undefined && data.isError === true) ensure(turn, time).toolFailures += 1
        break
      }
      case 'compaction/start':
      case 'compaction/end': {
        if (turn !== undefined && type === 'compaction/start') ensure(turn, time).compactions += 1
        break
      }
      case 'user/message': {
        if (turn !== undefined) {
          const row = ensure(turn, time)
          row.prompt ??= textOfContent(data.message?.content) ?? textOfContent(data.content)
        }
        break
      }
      case 'model/selection': {
        if (turn !== undefined) {
          const row = ensure(turn, time)
          row.effort = stringOr(data.reasoningEffort) ?? row.effort
        }
        break
      }
      default:
        break
    }
  }
  return {
    title: logTitle,
    contextWindow: logWindow,
    turns: [...turns.values()]
      .map((row) => {
        const outlineEntry = prompts.get(row.turn)
        return {
          turn: row.turn,
          steps: row.steps,
          toolSteps: row.toolSteps,
          retries: row.retries,
          compactions: row.compactions,
          toolCalls: row.toolCalls,
          toolFailures: row.toolFailures,
          usage: { ...row.usage },
          totalTokens: bucketTotal(row.usage),
          billableTokens: bucketBillable(row.usage),
          cacheHitRate: cacheHitRate(row.usage),
          startedAt: row.startedAt,
          endedAt: row.endedAt,
          durationMs: row.startedAt === null || row.endedAt === null ? null : Math.max(0, row.endedAt - row.startedAt),
          provider: row.provider,
          model: row.model,
          effort: row.effort,
          outcome: row.outcome,
          contextWindow: row.contextWindow,
          stopReasons: { ...row.stopReasons },
          modelSwitches: row.modelSwitches,
          prompt: stringOr(row.prompt) ?? stringOr(outlineEntry?.prompt) ?? null,
          response: stringOr(outlineEntry?.response) ?? null,
        }
      })
      .sort((left, right) => left.turn - right.turn),
    ignoredUsageEvents: ignored,
  }
}

/** Build one session's drill-down payload from the durable log. */
async function buildSessionDetail(ctx, request, pricing, logger) {
  const query = ctx.get('sessionQuery')
  const id = request.id
  if (query === undefined || typeof query.readSession !== 'function') {
    return {
      ok: false,
      status: 503,
      error: 'session-query-unavailable',
      message: 'This composition mounts no session-query backend, so per-turn history cannot be read.',
    }
  }
  let snapshot
  try {
    snapshot = await query.readSession(id)
  } catch (error) {
    return {
      ok: false,
      status: 404,
      error: 'session-unreadable',
      message: `Session ${id} could not be read: ${String(error?.message ?? error)}`,
    }
  }
  const events = Array.isArray(snapshot?.events) ? snapshot.events : []
  const header = snapshot?.session ?? {}
  const outline = request.outline
  const folded = foldTurns(events, outline)
  const turns = folded.turns.map((turn) => {
    const resolved = pricing.resolve(turn.provider ?? request.provider, turn.model ?? request.model)
    return { ...turn, costUsd: estimateCost(turn.usage, resolved?.unit), unit: resolved?.unit ?? null }
  })
  const totals = zeroBuckets()
  for (const turn of turns) addInto(totals, turn.usage)
  const cost = turns.reduce((sum, turn) => sum + (turn.costUsd ?? 0), 0)
  const lastTurn = turns.length === 0 ? undefined : turns[turns.length - 1]
  return {
    ok: true,
    dataVersion: DATA_VERSION,
    id,
    title: request.title ?? folded.title ?? null,
    cwd: stringOr(header.cwd) ?? request.cwd ?? null,
    createdAt: numberOr(header.createdAt, null),
    provider: stringOr(request.provider) ?? lastTurn?.provider ?? null,
    model: stringOr(request.model) ?? lastTurn?.model ?? null,
    effort: lastTurn?.effort ?? null,
    events: events.length,
    inheritedEventCount: numberOr(snapshot?.inheritedEventCount, 0),
    ignoredUsageEvents: folded.ignoredUsageEvents,
    contextWindow: folded.contextWindow ?? request.contextWindow ?? null,
    turns,
    totals: {
      usage: { ...totals },
      totalTokens: bucketTotal(totals),
      billableTokens: bucketBillable(totals),
      cacheHitRate: cacheHitRate(totals),
      costUsd: turns.some((turn) => turn.costUsd !== null) ? cost : null,
      turns: turns.length,
      steps: turns.reduce((sum, turn) => sum + turn.steps, 0),
      toolSteps: turns.reduce((sum, turn) => sum + turn.toolSteps, 0),
      toolCalls: turns.reduce((sum, turn) => sum + turn.toolCalls, 0),
      toolFailures: turns.reduce((sum, turn) => sum + turn.toolFailures, 0),
      retries: turns.reduce((sum, turn) => sum + turn.retries, 0),
      compactions: turns.reduce((sum, turn) => sum + turn.compactions, 0),
    },
  }
}

//#endregion

//#region request handling

/** One JSON response with no-store caching. */
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/** Read the `days` window from the query string. */
function parseDays(value) {
  if (value === null) return { days: 0 }
  const normalized = value.trim().toLowerCase()
  if (normalized === '' || normalized === 'all' || normalized === '0') return { days: 0 }
  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3650) return { error: 'days must be an integer between 1 and 3650, or 0/all' }
  return { days: parsed }
}

/** The live overlay: registered projection values for every live session. */
function overlayLive(records, ctx, logger) {
  const sessions = ctx.get('sessions')
  const projections = ctx.get('sessionProjections')
  if (sessions === undefined || projections === undefined) return { overlaid: 0, available: false }
  let live = []
  try {
    live = sessions.list() ?? []
  } catch (error) {
    logger?.debug?.('live overlay: sessions.list() failed (%s)', String(error?.message ?? error))
    return { overlaid: 0, available: false }
  }
  const byId = new Map(records.map((record) => [record.id, record]))
  let overlaid = 0
  for (const session of live) {
    const id = session?.id
    if (typeof id !== 'string') continue
    let values
    let asOfSeq = null
    try {
      const snapshot = projections.snapshot(session)
      values = snapshot?.values ?? {}
      asOfSeq = numberOr(snapshot?.asOfSeq, null)
    } catch (error) {
      logger?.debug?.('live overlay: snapshot(%s) failed (%s)', id, String(error?.message ?? error))
      continue
    }
    const existing = byId.get(id)
    const usage = values?.tokenUsage
    const stats = values?.sessionStats
    const pressure = values?.contextPressure
    const selection = values?.modelSelection
    const target = existing ?? {
      id,
      title: undefined,
      cwd: stringOr(session?.header?.cwd),
      workspace: workspaceName(stringOr(session?.header?.cwd)),
      createdAt: numberOr(session?.header?.createdAt, undefined),
      lastPromptAt: undefined,
      inheritedEventCount: 0,
      asOfSeq: null,
      provider: undefined,
      model: undefined,
      effort: undefined,
      preset: undefined,
      blank: false,
      usage: zeroBuckets(),
      turns: 0,
      steps: 0,
      llmMs: 0,
      toolMs: 0,
      ttftMs: 0,
      ttftSteps: 0,
      decodeMs: 0,
      decodeTokens: 0,
      context: {},
      source: 'live',
      live: true,
    }
    if (existing === undefined) records.push(target)
    if (usage !== undefined) target.usage = {
      uncachedInputTokens: numberOr(usage.uncachedInputTokens, target.usage.uncachedInputTokens),
      outputTokens: numberOr(usage.outputTokens, target.usage.outputTokens),
      cacheReadTokens: numberOr(usage.cacheReadTokens, target.usage.cacheReadTokens),
      cacheWriteTokens: numberOr(usage.cacheWriteTokens, target.usage.cacheWriteTokens),
    }
    if (stats !== undefined) {
      target.turns = numberOr(stats.turns, target.turns)
      target.steps = numberOr(stats.steps, target.steps)
      target.llmMs = numberOr(stats.llmMs, target.llmMs)
      target.toolMs = numberOr(stats.toolMs, target.toolMs)
      target.ttftMs = numberOr(stats.ttftMs, target.ttftMs)
      target.ttftSteps = numberOr(stats.ttftSteps, target.ttftSteps)
      target.decodeMs = numberOr(stats.decodeMs, target.decodeMs)
      target.decodeTokens = numberOr(stats.decodeTokens, target.decodeTokens)
    }
    if (pressure !== undefined) {
      target.context = {
        contextWindow: numberOr(pressure.contextWindow, target.context?.contextWindow),
        pressureTokens: numberOr(pressure.pressureTokens, target.context?.pressureTokens),
        surfaceTokens: numberOr(pressure.surfaceTokens, target.context?.surfaceTokens),
        sampledSurfaceTokens: numberOr(pressure.sampledSurfaceTokens, target.context?.sampledSurfaceTokens),
      }
    }
    // The live projection keeps `modelSelection.lastUsed` null until the session
    // routes its first request, so a null has to stay null-safe here.
    const lastUsed = selection?.lastUsed ?? undefined
    if (lastUsed !== undefined && lastUsed !== null) {
      target.provider = stringOr(lastUsed.provider) ?? target.provider
      target.model = stringOr(lastUsed.model) ?? target.model
      target.effort = stringOr(lastUsed.reasoningEffort) ?? target.effort
    }
    if (typeof values?.title === 'string' && values.title !== '') target.title = values.title
    if (asOfSeq !== null) target.asOfSeq = Math.max(numberOr(target.asOfSeq, 0), asOfSeq)
    target.live = true
    target.source = existing === undefined ? 'live' : 'cache+live'
    overlaid += 1
  }
  return { overlaid, available: true }
}

//#endregion

//#region plugin

/**
 * Register the tracker's Host route.
 * @param ctx - Host plugin context carrying Connection.
 * @param config - optional deployment configuration.
 */
function apply(ctx, config = {}) {
  const logger = ctx.logger('token-tracker')
  const home = resolveHome(config.home)
  const recordsDir = path.join(home, ...RECORD_SEGMENTS)
  const store = new RecordStore(recordsDir, logger)
  const settings = {
    cacheTtlMs: numberOr(config.cacheTtlMs, DEFAULTS.cacheTtlMs),
    detailTtlMs: numberOr(config.detailTtlMs, DEFAULTS.detailTtlMs),
    sessionRowLimit: numberOr(config.sessionRowLimit, DEFAULTS.sessionRowLimit),
  }
  let pricingCache = null
  let aggregateCache = null
  const detailCache = new Map()

  const pricingOf = () => {
    pricingCache ??= loadPricing(config, logger)
    return pricingCache
  }

  /** Aggregation payload for one window, reusing one scan inside the TTL. */
  const aggregateFor = async (days, fresh, limit) => {
    const now = Date.now()
    const key = `${String(days)}/${String(limit)}`
    if (!fresh && aggregateCache !== null && aggregateCache.key === key && now - aggregateCache.at < settings.cacheTtlMs) {
      return { ...aggregateCache.payload, generatedAt: now, cached: true }
    }
    const scan = await store.scan(fresh)
    const overlay = overlayLive(scan.records, ctx, logger)
    const pricing = pricingOf()
    const payload = aggregate(scan.records, {
      days,
      now,
      pricing,
      limit,
      sources: {
        home,
        recordsDir,
        recordFiles: scan.files,
        parsed: scan.parsed,
        reused: scan.reused,
        problems: scan.problems.slice(0, 10),
        problemCount: scan.problems.length,
        scanMs: scan.scanMs,
        liveSessions: overlay.overlaid,
        liveAvailable: overlay.available,
        error: scan.error ?? null,
      },
    })
    aggregateCache = { key, at: now, payload }
    return { ...payload, cached: false }
  }

  /** Drill-down payload for one session, reusing a recent read. */
  const detailFor = async (id, fresh, row) => {
    const now = Date.now()
    const cached = detailCache.get(id)
    if (!fresh && cached !== undefined && now - cached.at < settings.detailTtlMs) return { ...cached.payload, cached: true }
    const payload = await buildSessionDetail(ctx, {
      id,
      title: row?.title,
      cwd: row?.cwd,
      provider: row?.provider,
      model: row?.model,
      outline: row?.turnOutline,
    }, pricingOf(), logger)
    if (payload.ok === true) detailCache.set(id, { at: now, payload })
    return payload
  }

  ctx.connection.fetch.register({
    path: API_PATH,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async (request) => {
      const started = Date.now()
      try {
        const url = new URL(request.url)
        const params = url.searchParams
        const fresh = params.get('fresh') === '1'
        const parsedDays = parseDays(params.get('days'))
        if (parsedDays.error !== undefined) return jsonResponse({ ok: false, error: 'bad-request', message: parsedDays.error }, 400)
        const days = parsedDays.days
        const limitParam = params.get('limit')
        const limit = limitParam === null ? settings.sessionRowLimit : Number.parseInt(limitParam, 10)
        if (!Number.isInteger(limit) || limit < 0 || limit > 5000) return jsonResponse({ ok: false, error: 'bad-request', message: 'limit must be an integer between 0 and 5000' }, 400)
        const sessionId = stringOr(params.get('session')?.trim())
        if (sessionId !== undefined) {
          const scan = await store.scan(fresh)
          const row = scan.records.find((record) => record.id === sessionId)
          const payload = await detailFor(sessionId, fresh, row)
          if (payload.ok !== true) return jsonResponse(payload, payload.status ?? 500)
          return jsonResponse({ ...payload, tookMs: Date.now() - started })
        }
        const payload = await aggregateFor(days, fresh, limit)
        return jsonResponse({ ...payload, tookMs: Date.now() - started })
      } catch (error) {
        logger.warn('request failed: %s', String(error?.stack ?? error))
        return jsonResponse({ ok: false, error: 'internal', message: String(error?.message ?? error) }, 500)
      }
    },
  })
  logger.info('serving token usage on %s (%s)', API_PATH, recordsDir)
}

export { API_PATH, DATA_VERSION, aggregate, apply, foldTurns, inject, name, resolveHome }
export default { name, inject, apply }

//#endregion
