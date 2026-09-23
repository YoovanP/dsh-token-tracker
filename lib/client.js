window.__ModuleLoader__.load({
  id: "dsh-token-tracker",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var h = react.createElement;

    //#region stylesheet
    //
    // One prefixed stylesheet, themed entirely through the app's own design
    // tokens, injected once per document (materialization is lazy, so the
    // guard matters: the tag may already exist from an earlier mount).
    var css = [
      ".dtt-root{width:100%;max-width:760px;box-sizing:border-box;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}",
      ".dtt-root *,.dtt-root *:before,.dtt-root *:after{box-sizing:border-box}",
      ".dtt-toolbar{align-items:center;flex-wrap:wrap;gap:8px;display:flex}",
      ".dtt-chips{border-radius:10px;background:var(--dsw-alias-bg-module-platform);padding:2px;display:inline-flex;gap:2px}",
      ".dtt-chip{color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;line-height:18px;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px 10px}",
      ".dtt-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".dtt-chip[data-on=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);font-weight:600;box-shadow:var(--dsw-elevation-stroke)}",
      ".dtt-chip:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}",
      ".dtt-spacer{flex:1}",
      ".dtt-button{color:var(--dsw-alias-label-secondary);font:inherit;font-size:12.5px;cursor:pointer;background:0 0;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;align-items:center;gap:6px;padding:4px 10px;display:inline-flex}",
      ".dtt-button:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}",
      ".dtt-button[disabled]{opacity:.5;cursor:default}",
      ".dtt-button[data-on=true]{color:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent)}",
      ".dtt-button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}",
      ".dtt-kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;display:grid}",
      "@media (width<=680px){.dtt-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      ".dtt-tile{background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-elevation-stroke);border-radius:12px;flex-direction:column;gap:2px;min-width:0;padding:10px 12px;display:flex}",
      ".dtt-tileLabel{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dtt-tileValue{font-size:17px;font-weight:600;line-height:24px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dtt-tileHint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".dtt-tile[data-tone=good] .dtt-tileValue{color:var(--dsw-alias-state-success-primary)}",
      ".dtt-tile[data-tone=warn] .dtt-tileValue{color:var(--dsw-alias-state-warn-primary)}",
      ".dtt-tile[data-tone=bad] .dtt-tileValue{color:var(--dsw-alias-state-error-primary)}",
      ".dtt-panel{background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-elevation-stroke);border-radius:14px;flex-direction:column;gap:10px;padding:12px 14px 14px;display:flex}",
      ".dtt-panelHead{align-items:center;flex-wrap:wrap;gap:8px;display:flex}",
      ".dtt-panelTitle{font-size:13px;font-weight:600;line-height:20px;margin:0}",
      ".dtt-panelSub{color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:17px;margin:0}",
      ".dtt-bars{height:132px;align-items:flex-end;gap:2px;display:flex}",
      ".dtt-barSlot{flex:1;min-width:0;height:100%;align-items:stretch;display:flex;position:relative}",
      ".dtt-bar{width:100%;min-height:2px;background:linear-gradient(180deg,color-mix(in srgb, var(--dsw-alias-state-business-primary) 88%, transparent),color-mix(in srgb, var(--dsw-alias-state-business-primary) 42%, transparent));border-radius:3px 3px 1px 1px;margin-top:auto}",
      ".dtt-bar[data-empty=true]{background:var(--dsw-alias-border-l2)}",
      ".dtt-barSlot:hover .dtt-bar{filter:brightness(1.15)}",
      ".dtt-axis{color:var(--dsw-alias-label-tertiary);font-size:10.5px;font-variant-numeric:tabular-nums;justify-content:space-between;display:flex}",
      ".dtt-tableWrap{width:100%;overflow-x:auto}",
      ".dtt-table{border-collapse:collapse;width:100%;font-size:12.5px;line-height:18px}",
      ".dtt-table th{color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:500;text-align:left;white-space:nowrap;border-bottom:.5px solid var(--dsw-alias-border-l2);padding:4px 6px;position:sticky;top:0;background:var(--dsw-alias-bg-layer-3)}",
      ".dtt-table th[data-num=true]{text-align:right}",
      ".dtt-table th[data-sortable=true]{cursor:pointer;user-select:none}",
      ".dtt-table th[data-sortable=true]:hover{color:var(--dsw-alias-label-secondary)}",
      ".dtt-table th[data-active=true]{color:var(--dsw-alias-label-primary)}",
      ".dtt-table td{border-bottom:.5px solid var(--dsw-alias-border-l1);padding:5px 6px;vertical-align:middle}",
      ".dtt-table tr:last-child td{border-bottom:0}",
      ".dtt-table tbody tr[data-clickable=true]{cursor:pointer}",
      ".dtt-table tbody tr[data-clickable=true]:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".dtt-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".dtt-mono{font-family:var(--ds-font-family-code);font-size:11.5px}",
      ".dtt-ellipsis{max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}",
      ".dtt-dim{color:var(--dsw-alias-label-tertiary)}",
      ".dtt-share{background:var(--dsw-alias-border-l2);border-radius:2px;width:52px;height:4px;display:inline-block;overflow:hidden;vertical-align:middle}",
      ".dtt-share>i{background:var(--dsw-alias-state-business-primary);display:block;height:100%}",
      ".dtt-badge{font-size:10.5px;line-height:16px;border-radius:6px;align-items:center;padding:0 6px;display:inline-flex}",
      ".dtt-badge[data-kind=live]{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent)}",
      ".dtt-badge[data-kind=warn]{color:var(--dsw-alias-state-warn-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 14%, transparent)}",
      ".dtt-badge[data-kind=bad]{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent)}",
      ".dtt-badge[data-kind=plain]{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-module-platform)}",
      ".dtt-heat{grid-template-columns:34px repeat(24,minmax(0,1fr));gap:2px;display:grid;align-items:center}",
      ".dtt-heatLabel{color:var(--dsw-alias-label-tertiary);font-size:10.5px}",
      ".dtt-cell{aspect-ratio:1;border-radius:3px;background:var(--dsw-alias-bg-module-platform)}",
      ".dtt-cell[data-empty=true]{opacity:.55}",
      ".dtt-legend{color:var(--dsw-alias-label-tertiary);align-items:center;gap:6px;font-size:11px;display:flex}",
      ".dtt-legend i{border-radius:3px;width:11px;height:11px;display:inline-block}",
      ".dtt-note{color:var(--dsw-alias-label-tertiary);font-size:11.5px;line-height:17px;margin:0}",
      ".dtt-note code{font-family:var(--ds-font-family-code);background:var(--dsw-alias-markdown-inline-code);border-radius:4px;padding:0 4px}",
      ".dtt-list{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}",
      ".dtt-listItem{align-items:center;gap:8px;min-width:0;display:flex}",
      ".dtt-listMain{flex:1;min-width:0}",
      ".dtt-input{color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;background:var(--dsw-alias-bg-layer-1);border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;outline:none;width:100%;height:30px;padding:0 10px}",
      ".dtt-input:focus-visible{border-color:var(--dsw-alias-state-business-primary)}",
      ".dtt-search{max-width:280px;flex:1}",
      ".dtt-failure{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);border-radius:10px;flex-direction:column;gap:4px;padding:10px 12px;font-size:12.5px;line-height:18px;display:flex}",
      ".dtt-failure p{margin:0}",
      ".dtt-empty{color:var(--dsw-alias-label-tertiary);font-size:12.5px;line-height:18px;padding:18px 0;text-align:center}",
      ".dtt-footer{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px;flex-wrap:wrap;gap:4px 12px;display:flex}",
      ".dtt-sr{clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}",
      ".dtt-detail{border-top:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;margin-top:4px;padding-top:10px;display:flex}",
      ".dtt-turnBar{background:var(--dsw-alias-border-l2);border-radius:2px;height:5px;overflow:hidden;display:flex}",
      ".dtt-turnBar>i{height:100%;display:block}",
      ".dtt-turnBar>i[data-part=cache]{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent)}",
      ".dtt-turnBar>i[data-part=input]{background:var(--dsw-alias-state-business-primary)}",
      ".dtt-turnBar>i[data-part=output]{background:var(--dsw-static-amber-500, var(--dsw-alias-state-warn-primary))}",
      ".dtt-turnBar>i[data-part=write]{background:var(--dsw-static-green-500, var(--dsw-alias-state-success-primary))}",
      ".dtt-spin{animation:dtt-spin 1s linear infinite;display:inline-block}",
      "@keyframes dtt-spin{to{transform:rotate(360deg)}}",
      "@media (prefers-reduced-motion:reduce){.dtt-spin{animation:none}}",
      // GitHub-profile chrome: a masked graph glyph for the sidebar Settings
      // seat (shell chrome owned by another package, so the swap is a mask
      // rather than a patch there), plus the profile header, badges and the
      // contribution grid.
      // Only the Token usage row in the settings nav: the shell renders that
      // row's icon itself (a fallback gear), so the row is tagged from
      // markSectionNavRow() and its own glyph masked here. The sidebar
      // Settings seat and every other nav row are left untouched.
      "[data-dtt-nav='token-usage'] > svg{display:none}",
      "[data-dtt-nav='token-usage']::before{content:'';width:16px;height:16px;flex:0 0 auto;background-color:currentColor;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M1.6 13.4h1.7V7.2H1.6v6.2Zm3.5 0h1.7V2.6H5.1v10.8Zm3.5 0h1.7V5.1H8.6v8.3Zm3.5 0h1.7V9H12.1v4.4ZM1.6 15h13.1v-1.4H1.6V15Z'/%3E%3C/svg%3E\") center/contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M1.6 13.4h1.7V7.2H1.6v6.2Zm3.5 0h1.7V2.6H5.1v10.8Zm3.5 0h1.7V5.1H8.6v8.3Zm3.5 0h1.7V9H12.1v4.4ZM1.6 15h13.1v-1.4H1.6V15Z'/%3E%3C/svg%3E\") center/contain no-repeat}",
      ".dtt-glyph{width:16px;height:16px;display:block}",
      ".dtt-profile{align-items:center;flex-wrap:wrap;gap:14px 18px;padding:14px 16px;border-radius:14px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-stroke);display:flex}",
      ".dtt-avatar{width:62px;height:62px;border-radius:31px;flex:0 0 auto;place-items:center;display:grid;color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}",
      ".dtt-avatar svg{width:30px;height:30px}",
      ".dtt-id{flex:1 1 220px;min-width:0}",
      ".dtt-name{color:var(--dsw-alias-label-primary);align-items:center;gap:8px;font-size:15.5px;font-weight:650;display:flex;flex-wrap:wrap}",
      ".dtt-handle{color:var(--dsw-alias-label-secondary);margin-top:3px;font-size:12.5px;word-break:break-all}",
      ".dtt-bio{color:var(--dsw-alias-label-secondary);margin-top:6px;font-size:12.5px;line-height:19px}",
      ".dtt-profileStats{flex:0 0 auto;gap:20px;display:flex}",
      ".dtt-profileStat{text-align:right}",
      ".dtt-profileStat b{font-variant-numeric:tabular-nums;font-size:17px;font-weight:650;display:block}",
      ".dtt-profileStat span{color:var(--dsw-alias-label-secondary);letter-spacing:.04em;text-transform:uppercase;font-size:10.5px}",
      ".dtt-badges{basis:100%;gap:6px;width:100%;display:flex;flex-wrap:wrap}",
      ".dtt-badge{color:var(--dsw-alias-label-secondary);border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-module-platform);border-radius:999px;padding:2px 9px;font-size:11.5px;line-height:18px}",
      ".dtt-badge[data-tone=good]{color:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent)}",
      ".dtt-badge[data-tone=warn]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent)}",
      ".dtt-cal{flex-direction:column;gap:7px;display:flex}",
      ".dtt-calScroll{overflow-x:auto;padding-bottom:2px}",
      ".dtt-calBody{gap:6px;display:flex}",
      ".dtt-calDays{grid-template-rows:repeat(7,12px);gap:3px;padding-right:4px;font-size:9.5px;color:var(--dsw-alias-label-secondary);display:grid}",
      ".dtt-calDays span{line-height:12px}",
      ".dtt-calWeeks{grid-auto-flow:column;gap:3px;display:grid}",
      ".dtt-calWeek{grid-template-rows:repeat(7,12px);gap:3px;display:grid}",
      ".dtt-calMonths{grid-auto-flow:column;gap:3px;padding-left:28px;font-size:10.5px;color:var(--dsw-alias-label-secondary);display:grid}",
      ".dtt-calCell{width:12px;height:12px;border-radius:3px;background:var(--dsw-alias-bg-module-platform);box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l3)}",
      ".dtt-calCell[data-level]:not([data-level='0']){box-shadow:none}",
      ".dtt-calFoot{align-items:center;gap:14px;font-size:11.5px;color:var(--dsw-alias-label-secondary);display:flex;flex-wrap:wrap}",
      ".dtt-streaks{gap:16px;font-size:12.5px;display:flex;flex-wrap:wrap}",
      ".dtt-streak b{font-variant-numeric:tabular-nums}",
      ".dtt-streak span{color:var(--dsw-alias-label-secondary)}",
      ".dtt-calCaption{align-items:center;gap:8px;font-size:11.5px;color:var(--dsw-alias-label-secondary);display:flex}",
      ".dtt-calCaptionSpacer{flex:1 1 auto}",
      ".dtt-calMarker{width:12px;height:12px;border-radius:3px;box-shadow:inset 0 0 0 1.5px var(--dsw-alias-label-primary);display:inline-block}",
      ".dtt-calCell[data-first='true']{outline:1.5px solid var(--dsw-alias-label-primary);outline-offset:1px}",
      ".dtt-legendCells{gap:3px;display:inline-flex}"
    ].join("");

    var styleTagId = "dsh-token-tracker/client.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(styleTagId) + "]") === null) {
      var styleTag = document.createElement("style");
      styleTag.dataset.plugin = "dsh-token-tracker";
      styleTag.dataset.pluginCss = styleTagId;
      styleTag.textContent = css;
      document.head.appendChild(styleTag);
    }
    //#endregion

    //#region formatting

    // Token counts and money read as engineering notation (K/M/B) regardless of
    // page locale: lakh/crore spelling is exact but ambiguous for token math.
    // Dates and times stay in the user's own locale.
    var compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
    var plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
    var ratio = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 });
    var precise = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

    function fmtTokens(value) {
      if (value === null || value === undefined) return "—";
      if (Math.abs(value) < 1000) return plain.format(value);
      return compact.format(value);
    }

    function fmtInt(value) {
      return value === null || value === undefined ? "—" : plain.format(value);
    }

    function fmtUsd(value) {
      if (value === null || value === undefined) return "—";
      if (value === 0) return "$0";
      if (value < 0.01) return "$" + value.toFixed(4);
      if (value < 1) return "$" + value.toFixed(3);
      if (value < 1000) return "$" + value.toFixed(2);
      return "$" + compact.format(value);
    }

    function fmtPct(value) {
      return value === null || value === undefined ? "—" : ratio.format(value);
    }

    function fmtDuration(ms) {
      if (ms === null || ms === undefined || ms <= 0) return "—";
      if (ms < 1000) return plain.format(ms) + " ms";
      var seconds = ms / 1000;
      if (seconds < 90) return precise.format(seconds) + " s";
      var minutes = seconds / 60;
      if (minutes < 90) return precise.format(minutes) + " min";
      var hours = minutes / 60;
      if (hours < 48) return precise.format(hours) + " h";
      return precise.format(hours / 24) + " d";
    }

    function fmtTime(ms) {
      if (ms === null || ms === undefined) return "—";
      var date = new Date(ms);
      return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    function fmtDay(key) {
      if (typeof key !== "string" || key === "(unknown)") return "—";
      var parts = key.split("-");
      if (parts.length !== 3) return key;
      var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    function fmtWindow(key) {
      if (key === null || key === undefined) return "—";
      var hours = Math.floor(key / 60);
      var minutes = Math.round(key % 60);
      return minutes === 0 ? hours + " h" : hours + " h " + minutes + " m";
    }

    function timezoneName() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
      } catch (error) {
        return "local time";
      }
    }

    var RANGES = [
      { days: 1, label: "Today" },
      { days: 7, label: "7 days" },
      { days: 30, label: "30 days" },
      { days: 90, label: "90 days" },
      { days: 0, label: "All time" }
    ];

    var METRICS = [
      { key: "totalTokens", label: "Tokens" },
      { key: "billableTokens", label: "Billable" },
      { key: "cacheReadTokens", label: "Cache read" },
      { key: "outputTokens", label: "Output" },
      { key: "costUsd", label: "Cost" },
      { key: "sessions", label: "Sessions" },
      { key: "steps", label: "Steps" }
    ];

    function metricOf(group, key) {
      if (group === null || group === undefined) return 0;
      if (key === "cacheReadTokens" || key === "outputTokens" || key === "uncachedInputTokens" || key === "cacheWriteTokens") {
        return (group.usage && group.usage[key]) || 0;
      }
      if (key === "costUsd") return group.costUsd === null || group.costUsd === undefined ? 0 : group.costUsd;
      return group[key] || 0;
    }

    function metricLabel(key) {
      var found = METRICS.filter(function (entry) { return entry.key === key; })[0];
      return found === undefined ? key : found.label;
    }

    function formatMetric(value, key) {
      if (key === "costUsd") return fmtUsd(value);
      if (key === "sessions" || key === "steps") return fmtInt(value);
      return fmtTokens(value);
    }

    //#endregion

    //#region data access

    var ENDPOINT = "/api/token-tracker";

    function fetchJson(url, signal) {
      return fetch(url, { method: "GET", credentials: "same-origin", headers: { accept: "application/json" }, signal: signal })
        .then(function (response) {
          return response.text().then(function (text) {
            var parsed = null;
            try {
              parsed = JSON.parse(text);
            } catch (error) {
              parsed = null;
            }
            if (!response.ok) {
              var message = parsed && parsed.message ? parsed.message : text.slice(0, 240) || response.statusText;
              var failure = new Error(response.status + " " + message);
              failure.status = response.status;
              throw failure;
            }
            if (parsed === null) throw new Error("The tracker endpoint answered no JSON");
            return parsed;
          });
        });
    }

    function loadSummary(days, fresh, signal) {
      var query = "?days=" + String(days) + (fresh ? "&fresh=1" : "");
      return fetchJson(ENDPOINT + query, signal).then(function (payload) {
        if (payload.ok !== true) throw new Error(payload.message || payload.error || "The tracker answered an error");
        if (payload.dataVersion !== 1) throw new Error("Token tracker data version mismatch (" + String(payload.dataVersion) + ")");
        return payload;
      });
    }

    function loadSession(id, signal) {
      return fetchJson(ENDPOINT + "?session=" + encodeURIComponent(id), signal).then(function (payload) {
        if (payload.ok !== true) throw new Error(payload.message || payload.error || "The drill-down answered an error");
        return payload;
      });
    }

    //#endregion

    //#region small components

    function Chip(props) {
      return h("button", {
        type: "button",
        className: "dtt-chip",
        "data-on": props.on === true,
        onClick: props.onClick
      }, props.label);
    }

    function Button(props) {
      return h("button", {
        type: "button",
        className: "dtt-button",
        "data-on": props.on === true ? true : undefined,
        disabled: props.disabled === true,
        title: props.title,
        onClick: props.onClick
      }, props.children);
    }

    function Kpi(props) {
      return h("div", { className: "dtt-tile", "data-tone": props.tone }, [
        h("div", { className: "dtt-tileLabel", key: "label" }, props.label),
        h("div", { className: "dtt-tileValue", title: props.full === undefined ? undefined : props.full, key: "value" }, props.value),
        props.hint === undefined ? null : h("div", { className: "dtt-tileHint", title: props.hintFull, key: "hint" }, props.hint)
      ]);
    }

    function Panel(props) {
      return h("section", { className: "dtt-panel" }, [
        props.title === undefined ? null : h("div", { className: "dtt-panelHead", key: "head" }, [
          h("h3", { className: "dtt-panelTitle", key: "title" }, props.title),
          props.sub === undefined ? null : h("p", { className: "dtt-panelSub", key: "sub" }, props.sub),
          h("div", { className: "dtt-spacer", key: "spacer" }),
          props.actions === undefined ? null : h(react.Fragment, { key: "actions" }, props.actions)
        ]),
        h(react.Fragment, { key: "body" }, props.children)
      ]);
    }

    function SortHeader(props) {
      var active = props.sort.key === props.columnKey;
      return h("th", {
        "data-num": props.num === true,
        "data-sortable": props.sortable === false ? undefined : true,
        "data-active": active,
        title: props.title,
        onClick: props.sortable === false ? undefined : function () { props.onSort(props.columnKey); }
      }, props.label + (active ? (props.sort.dir === 1 ? " ↑" : " ↓") : ""));
    }

    function ShareBar(props) {
      var value = props.value === null || props.value === undefined ? 0 : props.value;
      var width = Math.max(0, Math.min(1, value)) * 100;
      return h("span", { className: "dtt-share" }, h("i", { style: { width: width + "%" } }));
    }

    function BarChart(props) {
      var rows = props.rows;
      var key = props.metric;
      var values = rows.map(function (row) { return metricOf(row, key); });
      var max = values.reduce(function (left, right) { return Math.max(left, right); }, 0);
      var bars = rows.map(function (row, index) {
        var value = values[index];
        var height = max === 0 ? 0 : Math.max(value === 0 ? 0 : 2, (value / max) * 100);
        var bar = h("div", {
          className: "dtt-bar",
          key: "bar",
          "data-empty": value === 0,
          style: { height: height + "%" }
        });
        var slot = h("div", {
          className: "dtt-barSlot",
          key: row.day || String(index),
          title: fmtDay(row.day) + "\n" + metricLabel(key) + ": " + formatMetric(value, key)
            + "\nTokens: " + fmtTokens(row.totalTokens === undefined ? 0 : row.totalTokens)
            + "\nSessions: " + fmtInt(row.sessions)
            + "\nSteps: " + fmtInt(row.steps)
            + (row.costUsd === null || row.costUsd === undefined ? "" : "\nCost: " + fmtUsd(row.costUsd))
        }, [bar]);
        return slot;
      });
      var span = rows.length <= 1 ? 1 : rows.length - 1;
      var axis = rows.length === 0 ? null : h("div", { className: "dtt-axis", key: "axis" },
        rows.filter(function (row, index) { return index === 0 || index === rows.length - 1 || index === Math.round(rows.length / 2); })
          .map(function (row, index, all) {
            return h("span", { key: row.day + String(index) }, fmtDay(row.day));
          }));
      return h("div", null, [
        h("div", { className: "dtt-bars", key: "bars" }, bars),
        axis
      ]);
    }

    function Heatmap(props) {
      var cells = props.cells || [];
      var index = {};
      var max = 0;
      cells.forEach(function (cell) {
        index[String(cell.weekday) + "-" + String(cell.hour)] = cell;
        max = Math.max(max, props.metric === "costUsd" ? cell.costUsd || 0 : cell.tokens || 0);
      });
      var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var rows = [];
      for (var weekday = 0; weekday < 7; weekday += 1) {
        var row = [h("div", { className: "dtt-heatLabel", key: "label-" + String(weekday) }, days[weekday])];
        for (var hour = 0; hour < 24; hour += 1) {
          var cell = index[String(weekday) + "-" + String(hour)];
          var value = cell === undefined ? 0 : (props.metric === "costUsd" ? cell.costUsd || 0 : cell.tokens || 0);
          var share = max === 0 ? 0 : value / max;
          var alpha = value === 0 ? 0 : 0.12 + 0.78 * Math.pow(share, 0.5);
          row.push(h("div", {
            className: "dtt-cell",
            key: "cell-" + String(weekday) + "-" + String(hour),
            "data-empty": value === 0,
            style: value === 0 ? undefined : { background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) " + String(Math.round(alpha * 100)) + "%, transparent)" },
            title: days[weekday] + " " + String(hour).padStart(2, "0") + ":00 — " + (cell === undefined ? "no activity" : fmtTokens(cell.tokens) + " tokens, " + fmtInt(cell.sessions) + " sessions")
          }));
        }
        rows.push(row);
      }
      return h("div", null, [
        h("div", { className: "dtt-heat", key: "grid" }, rows),
        h("div", { className: "dtt-legend", key: "legend" }, [
          h("span", { key: "label" }, "Session starts, " + timezoneName()),
          h("i", { key: "lo", style: { background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 20%, transparent)" } }),
          h("i", { key: "mid", style: { background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, transparent)" } }),
          h("i", { key: "hi", style: { background: "var(--dsw-alias-state-business-primary)" } }),
          h("span", { key: "hi-label" }, "more tokens")
        ])
      ]);
    }

    /** Stacked input/cache/output bar used by the per-turn drill-down. */
    function TurnBar(props) {
      var usage = props.usage || {};
      var total = (usage.uncachedInputTokens || 0) + (usage.cacheReadTokens || 0) + (usage.cacheWriteTokens || 0) + (usage.outputTokens || 0);
      if (total === 0) return h("div", { className: "dtt-turnBar" });
      var parts = [
        ["cache", usage.cacheReadTokens || 0],
        ["write", usage.cacheWriteTokens || 0],
        ["input", usage.uncachedInputTokens || 0],
        ["output", usage.outputTokens || 0]
      ];
      return h("div", { className: "dtt-turnBar" }, parts.map(function (part) {
        var width = (part[1] / total) * 100;
        return h("i", { key: part[0], "data-part": part[0], style: { width: width + "%" }, title: part[0] + ": " + fmtTokens(part[1]) });
      }));
    }

    function Failure(props) {
      return h("div", { className: "dtt-failure" }, [
        h("p", { key: "title" }, h("strong", null, props.title)),
        props.message === undefined ? null : h("p", { key: "message" }, props.message),
        props.hint === undefined ? null : h("p", { key: "hint", className: "dtt-dim" }, props.hint)
      ]);
    }

    //#endregion

    //#region drill-down

    function DetailPanel(props) {
      var detail = props.detail;
      if (detail === null || detail === undefined) return null;
      if (detail.loading === true) {
        return h("div", { className: "dtt-detail" }, h("p", { className: "dtt-note" }, "Reading the session log…"));
      }
      if (detail.error !== null && detail.error !== undefined) {
        return h("div", { className: "dtt-detail" }, [
          h(Failure, { key: "failure", title: "Per-turn detail unavailable", message: detail.error }),
          h("div", { key: "close" }, h(Button, { onClick: props.onClose }, "Close"))
        ]);
      }
      var data = detail.data;
      if (data === null || data === undefined) return null;
      var totals = data.totals;
      var turns = data.turns || [];
      return h("div", { className: "dtt-detail" }, [
        h("div", { className: "dtt-panelHead", key: "head" }, [
          h("p", { className: "dtt-panelSub", key: "sub" },
            fmtInt(data.events) + " events · " + fmtInt(totals.turns) + " turns · " + fmtInt(totals.steps) + " steps · "
            + fmtInt(totals.toolCalls) + " tool calls · " + fmtInt(totals.retries) + " retries · " + fmtInt(totals.compactions) + " compactions"
            + (totals.toolFailures > 0 ? " · " + fmtInt(totals.toolFailures) + " tool failures" : "")),
          h("div", { className: "dtt-spacer", key: "spacer" }),
          h(Button, { key: "close", onClick: props.onClose }, "Close")
        ]),
        h("p", { className: "dtt-note", key: "totals" },
          "Log total: " + fmtTokens(totals.totalTokens) + " tokens ("
          + fmtTokens(totals.usage.uncachedInputTokens) + " in, "
          + fmtTokens(totals.usage.outputTokens) + " out, "
          + fmtTokens(totals.usage.cacheReadTokens) + " cache read, "
          + fmtTokens(totals.usage.cacheWriteTokens) + " cache write) · hit rate " + fmtPct(totals.cacheHitRate)
          + " · " + fmtUsd(totals.costUsd)
          + (data.contextWindow === null || data.contextWindow === undefined ? "" : " · context window " + fmtTokens(data.contextWindow))),
        turns.length === 0
          ? h("p", { className: "dtt-empty", key: "empty" }, "No turns recorded in this log.")
          : h("div", { className: "dtt-tableWrap", key: "table" }, h("table", { className: "dtt-table" }, [
            h("thead", { key: "head" }, h("tr", null, [
              h("th", { key: "turn" }, "Turn"),
              h("th", { key: "prompt" }, "Prompt"),
              h("th", { key: "bar" }, "Mix"),
              h("th", { className: "dtt-num", key: "in" }, "In"),
              h("th", { className: "dtt-num", key: "cache" }, "Cache"),
              h("th", { className: "dtt-num", key: "out" }, "Out"),
              h("th", { className: "dtt-num", key: "total" }, "Total"),
              h("th", { className: "dtt-num", key: "hit" }, "Hit"),
              h("th", { className: "dtt-num", key: "cost" }, "Cost"),
              h("th", { className: "dtt-num", key: "steps" }, "Steps"),
              h("th", { className: "dtt-num", key: "dur" }, "Wall")
            ])),
            h("tbody", { key: "body" }, turns.map(function (turn) {
              return h("tr", { key: String(turn.turn) }, [
                h("td", { key: "turn", className: "dtt-mono" }, String(turn.turn)),
                h("td", { key: "prompt", title: (turn.prompt || "") + (turn.response ? "\n\n→ " + turn.response : "") },
                  h("span", { className: "dtt-ellipsis" }, turn.prompt || "(no prompt text)")),
                h("td", { key: "bar", style: { minWidth: "70px" } }, h(TurnBar, { usage: turn.usage })),
                h("td", { className: "dtt-num", key: "in" }, fmtTokens(turn.usage.uncachedInputTokens)),
                h("td", { className: "dtt-num", key: "cache" }, fmtTokens(turn.usage.cacheReadTokens)),
                h("td", { className: "dtt-num", key: "out" }, fmtTokens(turn.usage.outputTokens)),
                h("td", { className: "dtt-num", key: "total" }, h("strong", null, fmtTokens(turn.totalTokens))),
                h("td", { className: "dtt-num", key: "hit" }, fmtPct(turn.cacheHitRate)),
                h("td", { className: "dtt-num", key: "cost" }, fmtUsd(turn.costUsd)),
                h("td", { className: "dtt-num", key: "steps", title: "steps " + fmtInt(turn.steps) + " · tool-calling steps " + fmtInt(turn.toolSteps)
                  + (turn.outcome === null || turn.outcome === undefined ? "" : " · ended: " + turn.outcome)
                  + (turn.model === null || turn.model === undefined ? "" : " · " + turn.model)
                  + (turn.stopReasons === undefined || Object.keys(turn.stopReasons).length === 0 ? "" : " · stop reasons " + JSON.stringify(turn.stopReasons)) },
                  fmtInt(turn.steps) + (turn.retries > 0 ? " (" + fmtInt(turn.retries) + "r)" : "")),
                h("td", { className: "dtt-num", key: "dur" }, fmtDuration(turn.durationMs))
              ]);
            }))
          ])),
        data.ignoredUsageEvents > 0
          ? h("p", { className: "dtt-note", key: "ignored" }, fmtInt(data.ignoredUsageEvents) + " usage samples had no turn attribution and were left out.")
          : null
      ]);
    }

    //#endregion

    //#region section

    var BREAKDOWN_GROUPS = [
      { key: "model", label: "Model" },
      { key: "provider", label: "Provider" },
      { key: "workspace", label: "Workspace" },
      { key: "day", label: "Day" },
      { key: "preset", label: "Agent preset" },
      { key: "effort", label: "Effort" }
    ];

    function breakdownRows(data, group) {
      if (group === "provider") return data.byProvider || [];
      if (group === "workspace") return data.byWorkspace || [];
      if (group === "day") return data.byDay || [];
      if (group === "preset") return data.byPreset || [];
      if (group === "effort") return data.byEffort || [];
      return data.byModel || [];
    }

    function breakdownLabel(row, group) {
      if (group === "model") return (row.provider === null ? "(unknown)" : row.provider) + " / " + (row.model === null ? "(unknown)" : row.model);
      if (group === "provider") return row.provider === null ? "(unknown)" : row.provider;
      if (group === "workspace") return row.name === null || row.name === undefined ? (row.cwd || "(unknown)") : row.name;
      if (group === "day") return fmtDay(row.day === undefined ? row.key : row.day);
      return row.key === undefined ? "(unknown)" : row.key;
    }

    function sortRows(rows, sort, group) {
      var key = sort.key;
      var direction = sort.dir;
      var copy = rows.slice();
      copy.sort(function (left, right) {
        var leftValue = key === "label" ? breakdownLabel(left, group) : metricOf(left, key);
        var rightValue = key === "label" ? breakdownLabel(right, group) : metricOf(right, key);
        if (typeof leftValue === "string" || typeof rightValue === "string") {
          var leftText = String(leftValue);
          var rightText = String(rightValue);
          return leftText < rightText ? -direction : leftText > rightText ? direction : 0;
        }
        var leftNumber = leftValue === null ? -1 : leftValue;
        var rightNumber = rightValue === null ? -1 : rightValue;
        return (leftNumber - rightNumber) * direction;
      });
      return copy;
    }

    function Breakdown(props) {
      var data = props.data;
      var group = props.group;
      var sort = props.sort;
      var rows = sortRows(breakdownRows(data, group), sort, group);
      var totalsUsage = data.totals.totalTokens;
      return h("div", { className: "dtt-tableWrap" }, h("table", { className: "dtt-table" }, [
        h("thead", { key: "head" }, h("tr", null, [
          h(SortHeader, { key: "th-label", sort: sort, columnKey: "label", label: BREAKDOWN_GROUPS.filter(function (entry) { return entry.key === group; })[0].label, onSort: props.onSort }),
          h(SortHeader, { key: "th-sessions", sort: sort, columnKey: "sessions", label: "Sessions", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-total", sort: sort, columnKey: "totalTokens", label: "Tokens", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-billable", sort: sort, columnKey: "billableTokens", label: "Billable", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-in", sort: sort, columnKey: "uncachedInputTokens", label: "In", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-cache", sort: sort, columnKey: "cacheReadTokens", label: "Cache rd", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-out", sort: sort, columnKey: "outputTokens", label: "Out", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-hit", sort: sort, columnKey: "cacheHitRate", label: "Hit", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-steps", sort: sort, columnKey: "steps", label: "Steps", num: true, onSort: props.onSort }),
          h(SortHeader, { key: "th-cost", sort: sort, columnKey: "costUsd", label: "Cost", num: true, onSort: props.onSort })
        ])),
        h("tbody", { key: "body" }, rows.map(function (row, index) {
          var label = breakdownLabel(row, group);
          var share = totalsUsage === 0 ? 0 : row.totalTokens / totalsUsage;
          return h("tr", { key: row.key + String(index) }, [
            h("td", { key: "label", title: row.cwd || undefined }, [
              h("span", { key: "text" }, label),
              group === "model" && row.unit !== undefined && row.unit !== null
                ? h("span", { className: "dtt-dim dtt-mono", key: "unit", style: { marginLeft: "6px" } },
                  "($" + precise.format(row.unit.input) + "/" + precise.format(row.unit.output) + " per M)")
                : null
            ]),
            h("td", { className: "dtt-num", key: "sessions" }, fmtInt(row.sessions)),
            h("td", { className: "dtt-num", key: "total" }, [
              h("strong", { key: "value" }, fmtTokens(row.totalTokens)),
              h("span", { className: "dtt-dim", key: "share", style: { marginLeft: "6px" } }, fmtPct(share))
            ]),
            h("td", { className: "dtt-num", key: "billable" }, fmtTokens(row.billableTokens)),
            h("td", { className: "dtt-num", key: "in" }, fmtTokens(row.usage.uncachedInputTokens)),
            h("td", { className: "dtt-num", key: "cache" }, fmtTokens(row.usage.cacheReadTokens)),
            h("td", { className: "dtt-num", key: "out" }, fmtTokens(row.usage.outputTokens)),
            h("td", { className: "dtt-num", key: "hit" }, fmtPct(row.cacheHitRate)),
            h("td", { className: "dtt-num", key: "steps" }, fmtInt(row.steps)),
            h("td", { className: "dtt-num", key: "cost" }, [
              h("span", { key: "value" }, fmtUsd(row.costUsd)),
              row.unpricedSessions > 0
                ? h("span", { className: "dtt-badge", "data-kind": "plain", key: "unpriced", style: { marginLeft: "4px" }, title: fmtInt(row.unpricedSessions) + " session(s) in this group have no known price" }, "+" + fmtInt(row.unpricedSessions))
                : null
            ])
          ]);
        }))
      ]));
    }

    /** Sortable, searchable session table with a per-session drill-down. */
    function Sessions(props) {
      var sessions = props.sessions;
      var sort = props.sort;
      var query = props.query.trim().toLowerCase();
      var filtered = query === "" ? sessions : sessions.filter(function (row) {
        var haystack = [row.title || "", row.workspace || "", row.cwd || "", row.model || "", row.provider || "", row.id].join(" ").toLowerCase();
        return haystack.indexOf(query) !== -1;
      });
      var rows = sortRows(filtered, sort, "session");
      var visible = props.showAll ? rows : rows.slice(0, 25);
      var columns = [
        { key: "title", label: "Session" },
        { key: "workspace", label: "Workspace" },
        { key: "model", label: "Model" },
        { key: "createdAt", label: "Started", num: true },
        { key: "turns", label: "Turns", num: true },
        { key: "steps", label: "Steps", num: true },
        { key: "uncachedInputTokens", label: "In", num: true },
        { key: "cacheReadTokens", label: "Cache rd", num: true },
        { key: "outputTokens", label: "Out", num: true },
        { key: "totalTokens", label: "Total", num: true },
        { key: "cacheHitRate", label: "Hit", num: true },
        { key: "llmMs", label: "LLM time", num: true },
        { key: "costUsd", label: "Cost", num: true }
      ];
      return h("div", null, [
        h("div", { className: "dtt-tableWrap", key: "table" }, h("table", { className: "dtt-table" }, [
          h("thead", { key: "head" }, h("tr", null, columns.map(function (column) {
            return h(SortHeader, {
              key: "th-" + column.key,
              sort: sort,
              columnKey: column.key,
              label: column.label,
              num: column.num === true,
              onSort: props.onSort
            });
          }))),
          h("tbody", { key: "body" }, visible.map(function (row) {
            var selected = props.selected === row.id;
            return h(react.Fragment, { key: row.id }, [
              h("tr", { key: "row", "data-clickable": true, onClick: function () { props.onSelect(row.id); } }, [
                h("td", { key: "title", title: (row.title || row.id) + "\n" + (row.cwd || "") }, [
                  h("span", { className: "dtt-ellipsis", key: "text" }, row.title || row.id),
                  row.live === true ? h("span", { className: "dtt-badge", "data-kind": "live", key: "live", style: { marginLeft: "6px" } }, "live") : null,
                  row.pricedVia === "model" || row.pricedVia === "route-alias"
                    ? h("span", { className: "dtt-badge", "data-kind": "plain", key: "est", style: { marginLeft: "4px" }, title: "Cost resolved by a fallback price source (" + row.pricedVia + ")" }, "est")
                    : null
                ]),
                h("td", { key: "workspace", className: "dtt-dim" }, row.workspace || "—"),
                h("td", { key: "model", className: "dtt-mono" }, (row.model || "—") + (row.effort ? " · " + row.effort : "")),
                h("td", { key: "started", className: "dtt-num dtt-dim" }, fmtTime(row.createdAt)),
                h("td", { key: "turns", className: "dtt-num" }, fmtInt(row.turns)),
                h("td", { key: "steps", className: "dtt-num" }, fmtInt(row.steps)),
                h("td", { key: "in", className: "dtt-num" }, fmtTokens(row.usage.uncachedInputTokens)),
                h("td", { key: "cache", className: "dtt-num" }, fmtTokens(row.usage.cacheReadTokens)),
                h("td", { key: "out", className: "dtt-num" }, fmtTokens(row.usage.outputTokens)),
                h("td", { key: "total", className: "dtt-num" }, h("strong", null, fmtTokens(row.totalTokens))),
                h("td", { key: "hit", className: "dtt-num" }, fmtPct(row.cacheHitRate)),
                h("td", { key: "llm", className: "dtt-num" }, fmtDuration(row.llmMs)),
                h("td", { key: "cost", className: "dtt-num" }, fmtUsd(row.costUsd))
              ]),
              selected
                ? h("tr", { key: "detail" }, h("td", { colSpan: columns.length, style: { padding: "0 6px 8px" } },
                  h(DetailPanel, { detail: props.detail, onClose: props.onCloseDetail })))
                : null
            ]);
          }))
        ])),
        rows.length === 0
          ? h("p", { className: "dtt-empty", key: "empty" }, query === "" ? "No sessions in this window." : "No session matches “" + props.query + "”.")
          : null,
        rows.length > 25
          ? h("div", { key: "more", className: "dtt-panelHead", style: { marginTop: "8px" } },
            h(Button, { onClick: props.onToggleAll }, props.showAll ? "Show top 25 only" : "Show all " + fmtInt(rows.length) + " sessions"))
          : null
      ]);
    }

    function HighlightList(props) {
      var rows = props.rows || [];
      if (rows.length === 0) return h("p", { className: "dtt-note" }, props.emptyText || "Nothing to report.");
      return h("ul", { className: "dtt-list" }, rows.map(function (row, index) {
        return h("li", { className: "dtt-listItem", key: String(index) }, [
          h("div", { className: "dtt-listMain", key: "main" }, [
            h("span", { className: "dtt-ellipsis", key: "title", title: row.title || row.key || row.id }, row.title || row.key || row.id),
            h("span", { className: "dtt-dim", key: "sub" }, props.sub(row))
          ]),
          h("span", { className: "dtt-num", key: "value" }, props.value(row))
        ]);
      }));
    }

    //#region github-profile chrome

    /** Bar-chart glyph: the tracker's avatar, and the mask on the Settings seat. */
    var GRAPH_PATH = "M1.6 13.4h1.7V7.2H1.6v6.2Zm3.5 0h1.7V2.6H5.1v10.8Zm3.5 0h1.7V5.1H8.6v8.3Zm3.5 0h1.7V9H12.1v4.4ZM1.6 15h13.1v-1.4H1.6V15Z";
    var CAL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var CAL_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function GraphGlyph(props) {
      return h("svg", {
        className: props.className === undefined ? "dtt-glyph" : props.className,
        viewBox: "0 0 16 16",
        "aria-hidden": "true",
        focusable: "false"
      }, h("path", { d: GRAPH_PATH, fill: "currentColor" }));
    }

    function parseDayKey(key) {
      var parts = String(key).split("-");
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    /** Local YYYY-MM-DD, matching the host's day keys. */
    function dayKeyOf(date) {
      var month = String(date.getMonth() + 1);
      var day = String(date.getDate());
      return date.getFullYear() + "-" + (month.length < 2 ? "0" + month : month) + "-" + (day.length < 2 ? "0" + day : day);
    }

    function ProfileHeader(props) {
      var identity = props.identity;
      return h("section", { className: "dtt-profile" }, [
        h("div", { className: "dtt-avatar", key: "avatar", title: identity.handle }, h(GraphGlyph, {})),
        h("div", { className: "dtt-id", key: "id" }, [
          h("div", { className: "dtt-name", key: "name" }, [
            h("span", { key: "title" }, identity.title),
            identity.live === 0 ? null : h("span", { className: "dtt-badge", key: "live", "data-tone": "good" }, fmtInt(identity.live) + " live in memory")
          ]),
          h("div", { className: "dtt-handle", key: "handle" }, identity.handle),
          h("p", { className: "dtt-bio", key: "bio" }, identity.bio)
        ]),
        h("div", { className: "dtt-badges", key: "badges" }, props.badges.map(function (badge) {
          return h("span", { className: "dtt-badge", key: badge.label, "data-tone": badge.tone }, badge.label);
        }))
      ]);
    }

    /**
     * Contribution-style grid: one 12px square per day, weeks as columns.
     * Levels are sqrt-scaled so one 40M-token day cannot flatten every other
     * day to the first step.
     */
    function ContributionCalendar(props) {
      var calendar = props.calendar;
      var streaks = props.streaks === undefined || props.streaks === null ? {} : props.streaks;
      if (calendar === undefined || calendar === null || calendar.start === undefined) {
        return h("p", { className: "dtt-note" }, "No daily activity recorded yet.");
      }
      var recorded = new Map();
      var recordedDays = calendar.days === undefined ? [] : calendar.days;
      for (var record = 0; record < recordedDays.length; record += 1) recorded.set(recordedDays[record].day, recordedDays[record]);
      // The host sends only days with activity; the grid is the whole fixed
      // window — oldest week on the left, today in the last column — so the days
      // before the first session stay empty squares.
      var days = [];
      var walk = new Date(calendar.start);
      while (walk.getTime() <= calendar.end) {
        var key = dayKeyOf(walk);
        var hit = recorded.get(key);
        days.push(hit === undefined ? { day: key, sessions: 0, tokens: 0, steps: 0, costUsd: null } : hit);
        walk = new Date(walk.getFullYear(), walk.getMonth(), walk.getDate() + 1);
      }
      var firstKey = calendar.firstDay === undefined || calendar.firstDay === null ? null : calendar.firstDay.day;

      var offset = parseDayKey(days[0].day).getDay();
      var weeks = [];
      for (var index = 0; index < days.length; index += 1) {
        var slot = Math.floor((index + offset) / 7);
        if (weeks[slot] === undefined) weeks[slot] = [];
        weeks[slot].push(days[index]);
      }
      var peak = days.reduce(function (top, entry) { return entry.tokens > top ? entry.tokens : top; }, 0);
      var fill = [
        null,
        "color-mix(in srgb, var(--dsw-alias-state-business-primary) 22%, transparent)",
        "color-mix(in srgb, var(--dsw-alias-state-business-primary) 44%, transparent)",
        "color-mix(in srgb, var(--dsw-alias-state-business-primary) 68%, transparent)",
        "var(--dsw-alias-state-business-primary)"
      ];
      var levelOf = function (entry) {
        if (entry.sessions === 0 || peak === 0) return 0;
        var share = Math.sqrt(entry.tokens / peak);
        if (share <= 0.25) return 1;
        if (share <= 0.5) return 2;
        if (share <= 0.75) return 3;
        return 4;
      };
      var cellTitle = function (entry) {
        var cost = entry.costUsd === null || entry.costUsd === undefined ? "" : " · " + fmtUsd(entry.costUsd);
        var marker = entry.day === firstKey ? " · first session" : "";
        return CAL_WEEKDAYS[parseDayKey(entry.day).getDay()] + " " + fmtDay(entry.day) + " — " + fmtTokens(entry.tokens) + " tokens · " + fmtInt(entry.sessions) + " session(s) · " + fmtInt(entry.steps) + " steps" + cost + marker;
      };

      var seenMonth = null;
      var monthCells = weeks.map(function (week, weekIndex) {
        var first = parseDayKey(week[0].day);
        if (seenMonth === null || first.getMonth() !== seenMonth) {
          seenMonth = first.getMonth();
          return h("span", { key: String(weekIndex) }, CAL_MONTHS[seenMonth]);
        }
        return h("span", { key: String(weekIndex) }, "");
      });

      var activeDays = streaks.activeDays === undefined ? 0 : streaks.activeDays;
      var windowDays = streaks.totalDays === undefined ? days.length : streaks.totalDays;

      return h("div", { className: "dtt-cal" }, [
        h("div", { className: "dtt-calCaption", key: "caption" }, [
          h("span", { className: "dtt-calMarker", key: "marker", "data-first": "true" }),
          h("span", { key: "first" }, firstKey === null ? "no sessions yet" : "first session " + fmtDay(firstKey)),
          h("span", { className: "dtt-calCaptionSpacer", key: "spacer" }),
          h("span", { key: "active" }, fmtInt(activeDays) + " active day(s) in the last " + fmtInt(windowDays) + " days")
        ]),
        h("div", { className: "dtt-calScroll", key: "scroll" }, [
          h("div", { className: "dtt-calMonths", key: "months" }, monthCells),
          h("div", { className: "dtt-calBody", key: "body" }, [
            h("div", { className: "dtt-calDays", key: "days" }, ["", "Mon", "", "Wed", "", "Fri", ""].map(function (label, row) {
              return h("span", { key: String(row) }, label);
            })),
            h("div", { className: "dtt-calWeeks", key: "weeks" }, weeks.map(function (week, weekIndex) {
              return h("div", { className: "dtt-calWeek", key: String(weekIndex) }, [0, 1, 2, 3, 4, 5, 6].map(function (row) {
                var entry = week[row];
                if (entry === undefined) return h("div", { className: "dtt-calCell", key: String(row), "data-level": "0" });
                var level = levelOf(entry);
                return h("div", {
                  className: "dtt-calCell",
                  key: String(row),
                  "data-level": String(level),
                  "data-first": entry.day === firstKey ? "true" : undefined,
                  style: level === 0 ? undefined : { backgroundColor: fill[level] },
                  title: cellTitle(entry)
                });
              }));
            }))
          ])
        ]),
        h("div", { className: "dtt-calFoot", key: "foot" }, [
          h("div", { className: "dtt-streaks", key: "streaks" }, [
            h("span", { className: "dtt-streak", key: "current" }, [h("b", { key: "value" }, fmtInt(streaks.current)), h("span", { key: "label" }, " day current streak")]),
            h("span", { className: "dtt-streak", key: "longest" }, [h("b", { key: "value" }, fmtInt(streaks.longest)), h("span", { key: "label" }, " day longest streak")]),
            streaks.bestDay === null || streaks.bestDay === undefined ? null : h("span", { className: "dtt-streak", key: "best" }, [
              h("b", { key: "value" }, fmtTokens(streaks.bestDay.tokens)),
              h("span", { key: "label" }, " on " + fmtDay(streaks.bestDay.day) + " (best day)")
            ])
          ]),
          h("div", { className: "dtt-legendCells", key: "legend" }, [
            h("span", { key: "less" }, "Less"),
            [0, 1, 2, 3, 4].map(function (level) {
              return h("span", { className: "dtt-calCell", key: String(level), "data-level": String(level), style: level === 0 ? undefined : { backgroundColor: fill[level] } });
            }),
            h("span", { key: "more" }, "More")
          ])
        ])
      ]);
    }

    //#endregion

    function TokenTrackerSection() {
      var state = react.useState({ status: "loading", data: null, error: null, cached: false });
      var summary = state[0];
      var setSummary = state[1];
      var rangeState = react.useState(30);
      var days = rangeState[0];
      var setDays = rangeState[1];
      var autoState = react.useState(true);
      var auto = autoState[0];
      var setAuto = autoState[1];
      var metricState = react.useState("totalTokens");
      var metric = metricState[0];
      var setMetric = metricState[1];
      var groupState = react.useState("model");
      var group = groupState[0];
      var setGroup = groupState[1];
      var breakdownSortState = react.useState({ key: "totalTokens", dir: -1 });
      var breakdownSort = breakdownSortState[0];
      var setBreakdownSort = breakdownSortState[1];
      var sessionSortState = react.useState({ key: "totalTokens", dir: -1 });
      var sessionSort = sessionSortState[0];
      var setSessionSort = sessionSortState[1];
      var queryState = react.useState("");
      var query = queryState[0];
      var setQuery = queryState[1];
      var showAllState = react.useState(false);
      var showAll = showAllState[0];
      var setShowAll = showAllState[1];
      var selectedState = react.useState(null);
      var selected = selectedState[0];
      var setSelected = selectedState[1];
      var detailState = react.useState(null);
      var detail = detailState[0];
      var setDetail = detailState[1];
      var refreshState = react.useState({ token: 0, fresh: false });
      var refresh = refreshState[0];
      var setRefresh = refreshState[1];

      react.useEffect(function () {
        var controller = new AbortController();
        setSummary(function (previous) {
          return { status: previous.data === null ? "loading" : "refreshing", data: previous.data, error: null, cached: previous.cached };
        });
        loadSummary(days, refresh.fresh, controller.signal).then(function (payload) {
          setSummary({ status: "ready", data: payload, error: null, cached: payload.cached === true });
        }).catch(function (error) {
          if (controller.signal.aborted) return;
          setSummary(function (previous) {
            return { status: previous.data === null ? "failed" : "ready", data: previous.data, error: error.message, cached: previous.cached };
          });
        });
        return function () { controller.abort(); };
      }, [days, refresh]);

      react.useEffect(function () {
        if (!auto) return undefined;
        var timer = setInterval(function () {
          setRefresh(function (previous) { return { token: previous.token + 1, fresh: false }; });
        }, 15000);
        return function () { clearInterval(timer); };
      }, [auto]);

      react.useEffect(function () {
        if (selected === null) {
          setDetail(null);
          return undefined;
        }
        var controller = new AbortController();
        setDetail({ loading: true, data: null, error: null });
        loadSession(selected, controller.signal).then(function (payload) {
          setDetail({ loading: false, data: payload, error: null });
        }).catch(function (error) {
          if (controller.signal.aborted) return;
          setDetail({ loading: false, data: null, error: error.message });
        });
        return function () { controller.abort(); };
      }, [selected]);

      var data = summary.data;
      var sortToggle = function (setter) {
        return function (key) {
          setter(function (previous) {
            return previous.key === key ? { key: key, dir: -previous.dir } : { key: key, dir: key === "title" || key === "label" || key === "workspace" || key === "model" ? 1 : -1 };
          });
        };
      };

      if (data === null) {
        return h("div", { className: "dtt-root" }, [
          summary.status === "failed"
            ? h(Failure, {
              key: "failure",
              title: "The token tracker could not read its data",
              message: summary.error,
              hint: "The Host half registers /api/token-tracker. Check that the dsh-token-tracker plugin is mounted in this profile and that the app was restarted after it was added."
            })
            : h("p", { className: "dtt-note", key: "loading" }, "Loading token usage…")
        ]);
      }

      var totals = data.totals;
      var sessions = data.sessions || [];
      var sources = data.sources || {};
      var pricing = data.pricing || {};
      var highlights = data.highlights || {};
      var costKnown = totals.costCoverage !== null && totals.costCoverage !== undefined && totals.costCoverage > 0;
      var unpriced = highlights.unpricedModels || [];

      var toolbar = h("div", { className: "dtt-toolbar", key: "toolbar" }, [
        h("div", { className: "dtt-chips", key: "range" }, RANGES.map(function (entry) {
          return h(Chip, { key: entry.days, label: entry.label, on: entry.days === days, onClick: function () { setDays(entry.days); } });
        })),
        h("div", { className: "dtt-spacer", key: "spacer" }),
        summary.status === "refreshing" ? h("span", { className: "dtt-note", key: "busy" }, "refreshing…") : null,
        summary.error !== null ? h("span", { className: "dtt-badge", "data-kind": "bad", key: "error", title: summary.error }, "stale") : null,
        h(Button, { key: "auto", on: auto, onClick: function () { setAuto(!auto); }, title: "Re-read every 15 seconds while this page is open" }, auto ? "Auto ✓" : "Auto"),
        h(Button, {
          key: "refresh",
          onClick: function () { setRefresh(function (previous) { return { token: previous.token + 1, fresh: true }; }); },
          title: "Re-scan every session record now"
        }, "↻ Refresh")
      ]);

      var kpis = h("div", { className: "dtt-kpis", key: "kpis" }, [
        h(Kpi, {
          key: "total",
          label: "Tokens (billed)",
          value: fmtTokens(totals.totalTokens),
          full: fmtInt(totals.totalTokens),
          hint: "in + out + cache read"
        }),
        h(Kpi, {
          key: "billable",
          label: "New tokens",
          value: fmtTokens(totals.billableTokens),
          full: fmtInt(totals.billableTokens),
          hint: "in " + fmtTokens(totals.usage.uncachedInputTokens) + " · out " + fmtTokens(totals.usage.outputTokens)
        }),
        h(Kpi, {
          key: "cache",
          label: "Cache reads",
          value: fmtTokens(totals.usage.cacheReadTokens),
          full: fmtInt(totals.usage.cacheReadTokens),
          hint: "served from prompt cache",
          tone: totals.cacheHitRate !== null && totals.cacheHitRate !== undefined && totals.cacheHitRate >= 0.9 ? "good" : "warn"
        }),
        h(Kpi, {
          key: "cost",
          label: "Estimated cost",
          value: costKnown ? fmtUsd(totals.costUsd) : "—",
          full: costKnown ? "$" + precise.format(totals.costUsd) : undefined,
          hint: costKnown ? fmtPct(totals.costCoverage) + " of sessions priced" : "no price data",
          tone: costKnown ? undefined : "warn"
        }),
        h(Kpi, {
          key: "turn",
          label: "Per turn",
          value: fmtTokens(totals.avgTokensPerTurn),
          hint: "billed ÷ turns"
        }),
        h(Kpi, {
          key: "session",
          label: "Per session",
          value: fmtTokens(totals.avgTokensPerSession),
          hint: "median TTFT " + fmtDuration(totals.ttftMedianMs)
        }),
        h(Kpi, {
          key: "llm",
          label: "LLM time",
          value: fmtDuration(totals.llmMs),
          hint: "tool time " + fmtDuration(totals.toolMs)
        }),
        h(Kpi, {
          key: "speed",
          label: "Decode speed",
          value: totals.decodeTokensPerSecond === null || totals.decodeTokensPerSecond === undefined ? "—" : precise.format(totals.decodeTokensPerSecond) + " tok/s",
          hint: fmtTokens(totals.decodeTokens) + " decoded"
        })
      ]);

      var dayRows = data.byDay || [];

      var chart = h(Panel, {
        key: "chart",
        title: "Activity",
        sub: "Daily totals in this window",
        actions: h("div", { className: "dtt-chips" }, METRICS.map(function (entry) {
          return h(Chip, { key: entry.key, label: entry.label, on: entry.key === metric, onClick: function () { setMetric(entry.key); } });
        }))
      }, h(BarChart, { rows: dayRows, metric: metric }));

      var breakdown = h(Panel, {
        key: "breakdown",
        title: "Where the tokens went",
        actions: h("div", { className: "dtt-chips" }, BREAKDOWN_GROUPS.map(function (entry) {
          return h(Chip, { key: entry.key, label: entry.label, on: entry.key === group, onClick: function () { setGroup(entry.key); } });
        }))
      }, h(Breakdown, { data: data, group: group, sort: breakdownSort, onSort: sortToggle(setBreakdownSort) }));

      var cachePanel = h(Panel, { key: "cache", title: "Cache efficiency", sub: "Every cache read is work the provider did not redo" }, [
        h("p", { className: "dtt-note", key: "note" },
          "Overall hit rate " + fmtPct(totals.cacheHitRate) + " — " + fmtTokens(totals.usage.cacheReadTokens)
          + " tokens came from cache, " + fmtTokens(totals.billableTokens) + " were new work."),
        h("div", { key: "worst" }, [
          h("p", { className: "dtt-note", key: "label", style: { marginBottom: "6px" } }, "Lowest hit rates (sessions with 5+ steps) — these pay the most for the same context:"),
          h(HighlightList, {
            key: "worstRows",
            rows: worstCacheRows(sessions),
            emptyText: "Not enough multi-step sessions in this window.",
            sub: function (row) { return (row.workspace || "—") + " · " + fmtInt(row.steps) + " steps · " + fmtTime(row.createdAt); },
            value: function (row) { return fmtPct(row.cacheHitRate) + " · " + fmtTokens(row.billableTokens) + " new"; }
          })
        ])
      ]);

      var contextPanel = h(Panel, { key: "context", title: "Context pressure", sub: "Newest request size against the routed context window" }, [
        h("p", { className: "dtt-note", key: "note" },
          "A session near 100% compacts: the harness prunes history before the window overflows, and that pruning is what the next request pays for."),
        h(HighlightList, {
          key: "risk",
          rows: highlights.contextRisk || [],
          emptyText: "No session in this window reported a context window.",
          sub: function (row) {
            return (row.workspace || "—") + " · " + (row.model || "—") + " · " + fmtInt(row.steps) + " steps";
          },
          value: function (row) { return fmtPct(Math.min(1, row.contextPressure)) + " · " + fmtTokens(row.totalTokens); }
        })
      ]);

      var heatPanel = h(Panel, {
        key: "heat",
        title: "When you work",
        sub: "Session starts by weekday and hour"
      }, h(Heatmap, { cells: data.heatmap || [], metric: "totalTokens" }));

      var sessionsPanel = h(Panel, {
        key: "sessions",
        title: "Sessions",
        sub: fmtInt(sessions.length) + " of " + fmtInt(data.sessionCount) + " shown · click a row for per-turn detail",
        actions: h("div", { className: "dtt-panelHead", style: { flex: "0 1 auto" } },
          h("input", {
            className: "dtt-input dtt-search",
            type: "search",
            placeholder: "Filter by title, workspace, model…",
            value: query,
            onChange: function (event) { setQuery(event.target.value); },
            "aria-label": "Filter sessions"
          }))
      }, h(Sessions, {
        sessions: sessions,
        sort: sessionSort,
        onSort: sortToggle(setSessionSort),
        query: query,
        showAll: showAll,
        onToggleAll: function () { setShowAll(!showAll); },
        selected: selected,
        onSelect: function (id) { setSelected(selected === id ? null : id); },
        detail: detail,
        onCloseDetail: function () { setSelected(null); }
      }));

      var footer = h("div", { className: "dtt-footer", key: "footer" }, [
        h("span", { key: "scan" }, fmtInt(sources.recordFiles) + " records · " + fmtInt(sources.scanMs) + " ms"),
        h("span", { key: "took" }, "answered in " + fmtInt(data.tookMs) + " ms" + (summary.cached ? " (cached)" : "")),
        h("span", { key: "pricing" }, costKnown
          ? "Costs are estimates from the provider catalog (" + fmtInt(pricing.catalogModels) + " priced models) plus your overrides."
          : "No price data resolved; add prices to " + (pricing.overridesPath || "<home>/token-tracker/pricing.json") + ".")
      ].concat(unpriced.length === 0 ? [] : [
        h("span", { key: "unpriced", title: unpriced.map(function (row) { return row.key + " — " + fmtTokens(row.totalTokens) + " tokens"; }).join("\n") },
          "unpriced: " + unpriced.map(function (row) { return row.model || row.key; }).filter(function (name) { return String(name).indexOf("(unknown)") === -1; }).join(", "))
      ]));

      var problems = sources.problemCount > 0
        ? h(Failure, {
          key: "problems",
          title: fmtInt(sources.problemCount) + " session record(s) could not be read",
          message: (sources.problems || []).map(function (problem) { return problem.file + ": " + problem.message; }).join("\n"),
          hint: "Unreadable records are usually written by another harness version; they are skipped, never guessed."
        })
        : null;

      // The header carries identity only — every number it used to repeat lives
      // once, in the tile or panel it belongs to below.
      var streaks = data.streaks === undefined || data.streaks === null ? {} : data.streaks;
      var profile = h(ProfileHeader, {
        key: "profile",
        identity: {
          title: "DeepSeek Harness",
          handle: (sources.home === undefined ? "" : sources.home + " · ") + timezoneName(),
          bio: (data.byWorkspace || []).length + " workspaces · " + fmtInt(totals.turns) + " turns · " + fmtInt(totals.steps) + " steps",
          live: sources.liveSessions
        },
        badges: unpriced.length === 0
          ? []
          : [{ label: fmtInt(unpriced.length) + " unpriced route(s)", tone: "warn" }]
      });
      var calendarPanel = h(Panel, {
        key: "calendar",
        title: "Contribution activity"
      }, h(ContributionCalendar, { calendar: data.calendar, streaks: streaks }));

      return h("div", { className: "dtt-root" }, [
        toolbar,
        problems,
        profile,
        kpis,
        calendarPanel,
        chart,
        breakdown,
        sessionsPanel,
        cachePanel,
        contextPanel,
        heatPanel,
        footer
      ]);
    }

    function byDaySummary(rows) {
      if (rows.length === 0) return "No daily activity in this window";
      var active = rows.filter(function (row) { return row.sessions > 0; }).length;
      return fmtInt(active) + " active day(s) in this window";
    }

    function worstCacheRows(sessions) {
      return sessions
        .filter(function (row) { return row.steps >= 5 && row.cacheHitRate !== null && row.cacheHitRate !== undefined; })
        .slice()
        .sort(function (left, right) { return left.cacheHitRate - right.cacheHitRate; })
        .slice(0, 5);
    }

    //#endregion

    //#region plugin

    /** Required services (cordis fiber inject). */
    const inject = ["slots"];

    /**
    /**
     * The settings nav row for this section is painted by the shell, which
     * falls back to a gear icon for sections that declare none. Tag that one
     * row so the stylesheet can mask its glyph into the tracker's graph mark;
     * the sidebar Settings seat and every other row stay exactly as they were.
     */
    var NAV_LABEL = "Token usage";
    var NAV_ATTRIBUTE = "data-dtt-nav";

    function markSectionNavRow() {
      if (typeof document === "undefined") return 0;
      var buttons = document.querySelectorAll("button");
      var tagged = 0;
      for (var index = 0; index < buttons.length; index += 1) {
        var button = buttons[index];
        if (button.getAttribute(NAV_ATTRIBUTE) === "token-usage") continue;
        if (button.querySelector("svg") === null) continue;
        if (button.textContent.trim() !== NAV_LABEL) continue;
        button.setAttribute(NAV_ATTRIBUTE, "token-usage");
        tagged += 1;
      }
      return tagged;
    }

    /** Keep the row tagged across dialog mounts (debounced). */
    function watchSectionNavRow() {
      markSectionNavRow();
      if (typeof MutationObserver !== "function" || typeof document === "undefined" || document.body === null) return;
      var pending = false;
      var observer = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        setTimeout(function () {
          pending = false;
          markSectionNavRow();
        }, 250);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Register the Token usage page. The registration waits for the slot type
     * ui-settings declares, so activation order never matters.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "token-usage",
        order: 30,
        label: () => "Token usage"
      }, TokenTrackerSection));
      watchSectionNavRow();
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.TokenTrackerSection = TokenTrackerSection;
    return module.exports;
    //#endregion
  }
});
