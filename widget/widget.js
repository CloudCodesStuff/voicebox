/**
 * Voicebox widget runtime
 * -------------------------------------------------------------------------
 * Drop-in feedback collector. One script tag, no dependencies, no framework
 * on the host page.
 *
 *   <script async src="https://usevoicebox.dev/widget.js" data-project="pk_..."></script>
 *
 * Design constraints this file is built around:
 *   • Everything renders inside a Shadow DOM root, so host CSS can never leak
 *     in and our styles can never leak out. This is the difference between a
 *     widget that looks right on every site and one that mostly does.
 *   • Nothing renders until the browser is idle. The host's page speed is not
 *     ours to spend.
 *   • Zero dependencies, and nothing for the host to build. The customer pastes
 *     one tag.
 *   • Reduced motion is honoured everywhere.
 *
 * THIS FILE IS THE SOURCE. It is not what gets served. `npm run build:widget`
 * minifies it to public/widget.js, which is what customers load and is the only
 * copy the size claims describe. Edit here; never edit public/widget.js, which
 * is generated and overwritten on every dev start and every deploy.
 *
 * Public API:
 *   Voicebox('open') | Voicebox('close') | Voicebox('identify', { plan: 'pro', ... })
 *
 * Calls made before the config arrives are honoured, not dropped: 'open'
 * queues and fires on boot, 'identify' traits accumulate and are attached to
 * whatever gets submitted. The same is true of clicks on any host-page
 * [data-voicebox-trigger] element, whose listener is bound at script execution
 * rather than after mount.
 */
(function () {
  "use strict";

  if (window.__voiceboxLoaded) return;
  window.__voiceboxLoaded = true;

  var script =
    document.currentScript ||
    document.querySelector("script[data-project]");
  if (!script) return;

  var PROJECT_KEY = script.getAttribute("data-project");
  if (!PROJECT_KEY) return;

  var ORIGIN = new URL(script.src, location.href).origin;
  var traits = {};
  var config = null;
  var root = null;
  var host = null;
  var open = false;
  var openedAt = 0;
  var state = { type: null, rating: null, sent: false };

  /**
   * Someone asked for the panel before the config arrived.
   *
   * Boot waits for an idle callback and then a network round trip, so there is
   * a real one-to-three second window after page load where the widget exists
   * as a script but cannot render. A click on a host-page trigger during that
   * window used to vanish silently, which reads as a broken button on the
   * host's own site. Remember the request and honour it once config lands.
   */
  var pendingOpen = false;

  /**
   * What had focus before the panel opened.
   *
   * Closing a dialog and dumping focus back at the top of the document loses a
   * keyboard user's place entirely on somebody else's site, which is not ours
   * to do.
   */
  var lastFocused = null;

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- icons */

  var ICONS = {
    lightbulb:
      '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
    bug: '<path d="M8 2l1.5 1.5M16 2l-1.5 1.5M12 20v-9M5 9h14M6 13H3M21 13h-3M5.5 17.5 3 19M18.5 17.5 21 19M6 9a6 6 0 0 1 12 0v4a6 6 0 0 1-12 0V9Z"/>',
    heart:
      '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z"/>',
    message:
      '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5a8.5 8.5 0 0 1 8.5-8.5 8.4 8.4 0 0 1 8.5 8.5Z"/>',
  };

  function icon(name, size) {
    return (
      '<svg viewBox="0 0 24 24" width="' +
      (size || 16) +
      '" height="' +
      (size || 16) +
      '" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      (ICONS[name] || "") +
      "</svg>"
    );
  }

  // Font stacks only, never a webfont: loading one from inside someone else's
  // page costs a request, a layout shift, and a privacy conversation that
  // isn't ours to have on their behalf. Keep in sync with src/lib/widget-config.ts.
  var FONTS = {
    sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "ui-serif, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
    rounded: "ui-rounded, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Quicksand, Nunito, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
    inherit: "inherit",
  };

  // Launcher measurements. Keep in sync with src/lib/widget-config.ts, which is
  // where the studio and the live preview read the same numbers from.
  var TRIGGER_SIZES = {
    sm: { height: 34, icon: 14, font: 12.5, gap: 6, padding: 12 },
    md: { height: 40, icon: 16, font: 13.5, gap: 7, padding: 15 },
    lg: { height: 48, icon: 18, font: 15, gap: 8, padding: 19 },
  };

  var TYPE_META = {
    IDEA: { label: "Idea", icon: "lightbulb", ph: "What would you love to see us build?" },
    ISSUE: { label: "Issue", icon: "bug", ph: "What went wrong? What were you trying to do?" },
    PRAISE: { label: "Praise", icon: "heart", ph: "What's working well for you?" },
    QUESTION: { label: "Question", icon: "help", ph: "What can we help you with?" },
  };

  /* ---------------------------------------------------------------- styles */

  /**
   * Black or white on the accent, whichever is actually readable.
   * Hardcoding white breaks the moment someone picks a mint, a yellow, or any
   * light brand colour, and a button nobody can read is worse than an ugly one.
   */
  function readableOn(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length !== 6) return "#ffffff";
    var lin = function (v) {
      v = parseInt(v, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    var L =
      0.2126 * lin(h.slice(0, 2)) +
      0.7152 * lin(h.slice(2, 4)) +
      0.0722 * lin(h.slice(4, 6));
    return L > 0.45 ? "#09090b" : "#ffffff";
  }

  function styles(c) {
    var dark =
      c.theme === "dark" ||
      (c.theme === "auto" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    var bg = dark ? "#0e0e11" : "#ffffff";
    var fg = dark ? "#fafafa" : "#09090b";
    var muted = dark ? "#a1a1a8" : "#62626b";
    var faint = dark ? "#71717a" : "#8f8f98";
    var border = dark ? "#1f1f24" : "#ebebed";
    var field = dark ? "#17171b" : "#fafafa";
    // Real offset plus a soft blur. A zero-offset coloured halo is decoration.
    var shadow = dark
      ? "0 12px 32px -8px rgba(0,0,0,.6), 0 2px 8px -2px rgba(0,0,0,.4)"
      : "0 12px 32px -8px rgba(9,9,11,.12), 0 2px 8px -2px rgba(9,9,11,.06)";
    var onAccent = readableOn(c.accentColor);
    var r = c.radius;

    var atTop = c.position.indexOf("top") === 0;
    var atLeft = c.position.indexOf("left") > -1;

    var size = TRIGGER_SIZES[c.triggerSize] || TRIGGER_SIZES.md;
    var iconOnly = c.triggerStyle === "icon";
    // Distance from the page edge. Configurable because the corner a site can
    // spare is rarely the corner a chat bubble has already taken.
    var edge = typeof c.triggerOffset === "number" ? c.triggerOffset : 20;

    var vertical = (atTop ? "top:" : "bottom:") + edge + "px;";
    var horizontal = (atLeft ? "left:" : "right:") + edge + "px;";
    var slideFrom = atTop ? "-8px" : "8px";

    // The panel hangs off the trigger, so its offset is the button's own height
    // plus a gap. Hardcoded at 56px this only lined up at one button size.
    var panelGap = size.height + 16;

    // The panel is absolutely positioned inside `.wrap`, which is already
    // inset from the viewport and shrink-wraps the trigger. Its offset is
    // therefore measured from the trigger's own edge, and must be 0 for the
    // two to line up. Reusing `horizontal` here (as this did) inset the panel
    // a second 20px, so it sat visibly off-centre from the button on desktop
    // and ran off the screen on mobile, where the panel is nearly as wide as
    // the viewport.
    var panelEdge = atLeft ? "left:0;" : "right:0;";

    // Distance from the viewport edge to the panel on mobile, where the panel
    // is pinned to the viewport rather than to the trigger: the wrap's own
    // inset, plus the trigger, plus the gap. Floored so a zero offset with a
    // hidden button still leaves the panel off the very edge of the screen.
    var MOBILE_CLEAR = Math.max(edge + panelGap, 24);

    // One radius for everything inside the panel. The panel itself is r+4 and
    // its contents are r-2, so the shapes stay concentric at any setting.
    var fieldRadius = Math.max(r - 2, 0);

    var font = FONTS[c.font] || FONTS.sans;

    // Four types read best as a 2x2 block; three or fewer fit one row at this
    // width. Anything else would either crowd the labels or leave one pill
    // stranded on its own line.
    var typeCount = (c.enabledTypes || []).length;
    var typeColumns = typeCount === 4 ? 2 : Math.max(typeCount, 1);

    return (
      ":host{all:initial;}" +
      "*{box-sizing:border-box;margin:0;padding:0;font-family:" + font + ";}" +
      ".wrap{position:fixed;z-index:2147483000;" + vertical + horizontal + "}" +
      // Trigger. Height, padding and type all come from the size table, and
      // icon-only becomes a square whose radius the slider takes all the way
      // from a sharp tile to a round bubble.
      ".trigger{display:inline-flex;align-items:center;justify-content:center;" +
      "gap:" + size.gap + "px;height:" + size.height + "px;" +
      (iconOnly
        ? "width:" + size.height + "px;padding:0;"
        : "padding:0 " + size.padding + "px;") +
      "border:none;border-radius:" + r + "px;cursor:pointer;" +
      "background:" + c.accentColor + ";color:" + onAccent + ";" +
      "font-size:" + size.font + "px;font-weight:560;letter-spacing:-.005em;" +
      "box-shadow:0 4px 12px -3px rgba(9,9,11,.18),0 1px 3px rgba(9,9,11,.1);" +
      "transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s;}" +
      ".trigger svg{flex:none;}" +
      ".trigger:hover{transform:translateY(-1px);" +
      "box-shadow:0 8px 20px -6px rgba(9,9,11,.22),0 2px 5px rgba(9,9,11,.12);}" +
      ".trigger:active{transform:translateY(0);}" +
      ".trigger:focus-visible{outline:2px solid " + c.accentColor + ";outline-offset:3px;}" +

      // Panel
      ".panel{position:absolute;" +
      (atTop ? "top:" : "bottom:") + panelGap + "px;" + panelEdge +
      "width:352px;max-width:calc(100vw - 32px);background:" + bg + ";color:" + fg + ";" +
      "border:1px solid " + border + ";border-radius:" + (r > 0 ? r + 4 : 0) + "px;" +
      "box-shadow:" + shadow + ";overflow:hidden;" +
      // Never taller than the screen. Landscape phones and small windows
      // otherwise push the submit button off the bottom, which makes the form
      // look complete while being impossible to finish. dvh where supported,
      // so an iOS toolbar sliding in doesn't clip it.
      "display:flex;flex-direction:column;" +
      "max-height:calc(100vh - " + (MOBILE_CLEAR + 20) + "px);" +
      "max-height:calc(100dvh - " + (MOBILE_CLEAR + 20) + "px);" +
      (reduceMotion
        ? ""
        : "opacity:0;transform:translateY(" + slideFrom + ") scale(.99);" +
          "transition:opacity .16s ease,transform .2s cubic-bezier(.2,.8,.2,1);") +
      "}" +
      ".panel.in{opacity:1;transform:none;}" +

      // Head
      ".head{padding:16px 16px 0;position:relative;}" +
      ".title{font-size:14.5px;font-weight:600;letter-spacing:-.015em;line-height:1.3;padding-right:26px;}" +
      ".sub{margin-top:5px;font-size:12.5px;line-height:1.5;color:" + muted + ";padding-right:26px;}" +
      ".x{position:absolute;top:12px;right:12px;width:26px;height:26px;display:grid;place-items:center;" +
      "border:none;background:transparent;color:" + faint + ";cursor:pointer;border-radius:" + fieldRadius + "px;" +
      "transition:background .12s,color .12s;}" +
      ".x:hover{background:" + field + ";color:" + fg + ";}" +
      // Scrolls inside the panel rather than growing it. The header, the
      // submit bar and the footer stay put, so the close button and the
      // primary action are always reachable.
      ".body{padding:14px 16px 8px;overflow-y:auto;-webkit-overflow-scrolling:touch;}" +
      // Submit lives outside the scroll area. Inside it, a short window plus
      // four types and a rating pushed "Send feedback" below the fold of the
      // panel's own scroll, so the form looked finished with no way to send it
      // unless you thought to scroll a box that gives no hint it scrolls.
      ".actions{flex:none;padding:0 16px 14px;}" +

      // Type chips. A grid, not wrapping flex. Four content-sized chips overflow 320px of
      // panel and drop the last one onto a line of its own, which reads as a
      // layout accident rather than a choice. Equal columns fill the width
      // edge to edge and can never go ragged: four becomes a balanced 2x2,
      // three sits on one row, and nothing depends on how long a label is in
      // whatever language it was translated into.
      ".types{display:grid;grid-template-columns:repeat(" +
      typeColumns +
      ",minmax(0,1fr));gap:6px;margin-bottom:12px;}" +
      ".type{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:30px;padding:0 8px;" +
      "min-width:0;" +
      // Same radius as the fields below, not a fixed pill. The slider is
      // meant to set the shape of the whole widget, and chips permanently at
      // 999px made the one control that ignored it.
      "border:1px solid " + border + ";border-radius:" + fieldRadius + "px;background:transparent;color:" + muted + ";" +
      "cursor:pointer;font-size:12.5px;font-weight:500;letter-spacing:-.005em;" +
      "transition:border-color .13s,color .13s,background .13s;}" +
      ".type svg{opacity:.75;flex:none;}" +
      // The label, not the icon, is what gets long. Let it ellipsis inside its
      // column rather than pushing the pill wider than the grid allows.
      ".type span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".type:hover{border-color:" + (dark ? "#33333b" : "#d4d4d8") + ";color:" + fg + ";}" +
      ".type.on{border-color:transparent;background:" + c.accentColor + ";color:" + onAccent + ";}" +
      ".type.on svg{opacity:1;}" +

      // Fields
      // No radius floors below: at r=0 the whole widget goes properly sharp.
      // display:block on both fields. As inline-blocks they sit on a text
      // baseline, and the line box under the textarea added a phantom 3.4px
      // that nothing declared: the gap above the email field measured 11.4
      // where the gap below it measured 8, off by just enough to look wrong
      // and not enough to find by reading the CSS.
      "textarea{display:block;width:100%;min-height:82px;max-height:220px;resize:none;padding:10px 11px;" +
      "border:1px solid " + border + ";border-radius:" + fieldRadius + "px;" +
      "background:" + field + ";color:" + fg + ";" +
      "font-size:13.5px;line-height:1.55;letter-spacing:-.005em;outline:none;" +
      "transition:border-color .13s,box-shadow .13s,background .13s;}" +
      "textarea:focus{border-color:" + c.accentColor + ";background:" + bg + ";" +
      "box-shadow:0 0 0 3px " + c.accentColor + "1f;}" +
      "textarea::placeholder{color:" + faint + ";}" +
      // 38px and 13.5px, the same as the submit button and the textarea it
      // sits between. At 36px and 13px it was a hair short and a hair small
      // against both of them, which is the kind of near-miss that reads as
      // sloppy without being obvious enough to name.
      "input[type=email]{display:block;width:100%;height:38px;padding:0 11px;margin-top:8px;" +
      "border:1px solid " + border + ";border-radius:" + fieldRadius + "px;" +
      "background:" + field + ";color:" + fg + ";" +
      "font-size:13.5px;letter-spacing:-.005em;outline:none;" +
      "transition:border-color .13s,box-shadow .13s,background .13s;}" +
      "input[type=email]:focus{border-color:" + c.accentColor + ";background:" + bg + ";" +
      "box-shadow:0 0 0 3px " + c.accentColor + "1f;}" +
      "input[type=email]::placeholder{color:" + faint + ";}" +
      ".hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;}" +

      // Rating. Fills left to right on hover so the control explains itself,
      // and the chosen score is echoed in words so it isn't guesswork.
      //
      // Sits above the message box and spans the full width. Left-aligned
      // under the textarea it occupied about two thirds of the panel and left
      // a ragged gap on the right, which broke the column of full-width
      // controls either side of it. Asking for the score before the sentence
      // also matches the order people answer in.
      ".rate{display:flex;align-items:center;gap:10px;margin-bottom:10px;min-height:28px;}" +
      ".rate-label{font-size:12.5px;color:" + muted + ";white-space:nowrap;}" +
      // The auto margin that anchors this row to the right edge lives on
      // .rate-value now (the word before the stars), so the stars hold still
      // while the word grows. The numbers layout has no word and fills the row
      // with flex:1 instead, so it needs no push of its own.
      ".stars{display:flex;gap:1px;}" +
      // Numbers are boxes rather than glyphs, so they stretch to share the
      // whole remaining width instead of huddling in a corner.
      ".stars.nums{flex:1;margin-left:0;gap:6px;}" +
      ".stars.nums .num{flex:1;}" +
      ".star{width:26px;height:26px;display:grid;place-items:center;border:none;background:transparent;" +
      "cursor:pointer;color:" + (dark ? "#2c2c33" : "#dcdce0") + ";padding:0;" +
      "transition:color .12s;}" +
      ".star svg{fill:currentColor;stroke:none;display:block;}" +
      ".star.on{color:" + c.accentColor + ";}" +
      ".star:focus-visible{outline:2px solid " + c.accentColor + ";outline-offset:1px;border-radius:4px;}" +
      // margin-left:auto anchors the word + stars to the right; the word grows
      // into the empty space to its own left, leaving the stars fixed.
      ".rate-value{font-size:12px;color:" + faint + ";font-variant-numeric:tabular-nums;" +
      "margin-left:auto;white-space:nowrap;}" +
      ".num{min-width:30px;height:28px;display:grid;place-items:center;border:1px solid " + border + ";" +
      "border-radius:" + fieldRadius + "px;background:transparent;cursor:pointer;font-size:12.5px;" +
      "font-variant-numeric:tabular-nums;color:" + muted + ";transition:all .12s;}" +
      ".num.on{border-color:transparent;background:" + c.accentColor + ";color:" + onAccent + ";}" +

      // Submit
      ".submit{width:100%;height:38px;display:inline-flex;align-items:center;" +
      "justify-content:center;gap:6px;border:none;border-radius:" + fieldRadius + "px;" +
      "background:" + c.accentColor + ";color:" + onAccent + ";" +
      "font-size:13.5px;font-weight:560;letter-spacing:-.005em;cursor:pointer;" +
      "transition:filter .13s,transform .1s;}" +
      ".submit:hover:not(:disabled){filter:brightness(.95);}" +
      ".submit:active:not(:disabled){transform:scale(.995);}" +
      ".submit:disabled{opacity:.45;cursor:not-allowed;}" +
      ".submit:focus-visible{outline:2px solid " + c.accentColor + ";outline-offset:2px;}" +
      ".err{margin-top:8px;font-size:12.5px;color:" + (dark ? "#f16a60" : "#d33c33") + ";}" +

      // Success
      ".done{padding:32px 22px 28px;text-align:center;}" +
      ".tick{width:38px;height:38px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;" +
      "background:" + c.accentColor + ";color:" + onAccent + ";" +
      (reduceMotion ? "" : "animation:pop .38s cubic-bezier(.2,1.3,.4,1);") + "}" +
      "@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}" +
      ".done p{font-size:13.5px;color:" + fg + ";line-height:1.5;}" +

      // Footer
      ".foot{padding:8px 16px;border-top:1px solid " + border + ";text-align:center;}" +
      ".foot a{font-size:11px;color:" + faint + ";text-decoration:none;transition:color .12s;}" +
      ".foot a:hover{color:" + muted + ";}" +
      // Mobile. The panel stops hanging off the trigger and pins to the
      // viewport with equal margins on both sides, because at this width it is
      // effectively a sheet, and a sheet aligned to a corner button reads as
      // broken rather than deliberate. `width:auto` with both insets set lets
      // it size itself, so it stays even on every screen width.
      "@media(max-width:420px){" +
      ".panel{position:fixed;left:12px;right:12px;width:auto;max-width:none;" +
      (atTop
        ? "top:" + MOBILE_CLEAR + "px;bottom:auto;"
        : "bottom:" + MOBILE_CLEAR + "px;top:auto;") +
      "max-height:calc(100vh - " + (MOBILE_CLEAR + 16) + "px);" +
      "max-height:calc(100dvh - " + (MOBILE_CLEAR + 16) + "px);}" +
      // 16px is the smallest size iOS will render without zooming the whole
      // page on focus, which on a fixed panel leaves it scrolled off-screen.
      ".panel textarea,.panel input[type=email]{font-size:16px;}" +
      "}" +
      // Short screens: a laptop with the console open, a phone in landscape.
      // The body already scrolls, but a panel that needs scrolling to reach its
      // own Send button feels broken. Tighten the vertical spending so the whole
      // form fits without scrolling down to about 560px of height: a shorter
      // text box (it still grows as you type), less padding, tighter gaps. The
      // 100dvh max-height and the scroll are the backstop below that.
      "@media(max-height:560px){" +
      ".head{padding-top:12px;}" +
      ".sub{margin-top:3px;}" +
      ".body{padding-top:10px;padding-bottom:8px;}" +
      "textarea{min-height:52px;}" +
      ".rate{margin-bottom:8px;min-height:24px;}" +
      ".types{margin-bottom:8px;}" +
      ".foot{padding:6px 16px;}" +
      "}" +
      // Opt-in. A phone has one usable corner and plenty of sites have already
      // spent it. Hiding only the button leaves Voicebox('open') and any
      // [data-voicebox-trigger] on the page working exactly as before.
      (c.triggerHideOnMobile
        ? "@media(max-width:640px){.trigger{display:none;}}"
        : "")
    );
  }

  /* ----------------------------------------------------------------- view */

  function panelHTML(c) {
    var types = c.enabledTypes
      .map(function (t) {
        var m = TYPE_META[t];
        if (!m) return "";
        return (
          '<button class="type" type="button" aria-pressed="false" data-type="' + t + '">' +
          icon(m.icon, 14) +
          "<span>" + m.label + "</span></button>"
        );
      })
      .join("");

    var rating = "";
    if (c.askRating) {
      var useStars = c.ratingStyle !== "numbers";
      var marks = "";
      for (var i = 1; i <= 5; i++) {
        marks += useStars
          ? '<button class="star" data-rate="' + i + '" aria-label="' + i + ' out of 5">' +
            icon("star", 22) + "</button>"
          : '<button class="num" type="button" aria-label="' + i + ' out of 5" data-rate="' +
            i + '">' + i + "</button>";
      }
      // The score word sits BEFORE the stars, not after. It carries the
      // right-pushing auto margin, so when a word appears on hover it grows
      // leftward into empty space and the stars stay pinned to the right edge.
      // After the stars, any width it gained would shove the whole group left
      // and the stars would visibly jump on every hover.
      rating =
        '<div class="rate">' +
        '<span class="rate-label">How was it?</span>' +
        (useStars ? '<span class="rate-value"></span>' : "") +
        '<div class="stars' + (useStars ? "" : " nums") + '">' + marks + "</div>" +
        "</div>";
    }

    return (
      // role/aria-modal so assistive tech announces a dialog opening rather
      // than silently moving focus into unlabelled content, and labelled by
      // its own heading so the announcement says what it is for.
      '<div class="panel" part="panel" role="dialog" aria-modal="true" ' +
      'aria-labelledby="vb-title">' +
      '<div class="head">' +
      '<div class="title" id="vb-title">' + esc(c.heading) + "</div>" +
      '<div class="sub">' + esc(c.subheading) + "</div>" +
      '<button class="x" aria-label="Close">' + icon("close", 15) + "</button>" +
      "</div>" +
      '<div class="body">' +
      (types ? '<div class="types">' + types + "</div>" : "") +
      rating +
      '<textarea placeholder="Tell us what\'s on your mind…"></textarea>' +
      '<input class="hp" tabindex="-1" autocomplete="off" aria-hidden="true" />' +
      (c.askEmail
        ? '<input type="email" placeholder="Email (optional, if you\'d like a reply)" />'
        : "") +
      "</div>" +
      '<div class="actions">' +
      '<button class="submit">' + icon("send", 15) + "<span>Send feedback</span></button>" +
      '<div class="err" role="alert" hidden></div>' +
      "</div>" +
      (c.hideBranding
        ? ""
        : '<div class="foot"><a href="' + ORIGIN + '?ref=widget" target="_blank" rel="noopener">Powered by Voicebox</a></div>') +
      "</div>"
    );
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /* ----------------------------------------------------------------- mount */

  function mount(c) {
    host = document.createElement("div");
    host.setAttribute("data-voicebox", "");
    root = host.attachShadow({ mode: "open" });

    var css = document.createElement("style");
    css.textContent = styles(c);

    var wrap = document.createElement("div");
    wrap.className = "wrap";

    if (!c.triggerHidden) {
      var size = TRIGGER_SIZES[c.triggerSize] || TRIGGER_SIZES.md;
      var trigger = document.createElement("button");
      trigger.className = "trigger";
      trigger.type = "button";

      var markup = "";
      if (c.triggerStyle !== "label") {
        markup += icon(ICONS[c.triggerIcon] ? c.triggerIcon : "message", size.icon);
      }
      if (c.triggerStyle !== "icon") {
        markup += "<span>" + esc(c.triggerLabel) + "</span>";
      }
      trigger.innerHTML = markup;

      // Only when there is no visible text to read. Naming a button that
      // already says "Feedback" would just make a screen reader repeat itself.
      if (c.triggerStyle === "icon") {
        trigger.setAttribute("aria-label", c.triggerLabel || "Give feedback");
        trigger.setAttribute("title", c.triggerLabel || "Give feedback");
      }

      trigger.addEventListener("click", toggle);
      wrap.appendChild(trigger);
    }

    root.appendChild(css);
    root.appendChild(wrap);
    document.body.appendChild(host);
  }

  /**
   * Listeners that must exist before the widget can render.
   *
   * These used to be registered at the end of mount(), which meant a page's
   * own "Send feedback" button did nothing at all until boot finished. The
   * host has no way to know when that is, so the only visible behaviour was an
   * unreliable button on their site. Bound at script execution instead, and
   * openPanel() queues if config hasn't landed.
   */
  function listen() {
    // Host-page elements can open the widget without our button.
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-voicebox-trigger]");
      if (t) {
        e.preventDefault();
        openPanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) {
        closePanel();
        return;
      }

      // Keep Tab inside the dialog. Without this, tabbing out of the panel
      // walks into the host page behind it while the panel is still covering
      // it, which leaves a keyboard user driving something they cannot see.
      if (e.key !== "Tab" || !open || !root) return;

      var panel = root.querySelector(".panel");
      if (!panel) return;

      var focusable = panel.querySelectorAll(
        'button:not([disabled]), textarea, input[type=email], a[href]',
      );
      if (focusable.length === 0) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      var active = root.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  function toggle() {
    if (open) closePanel();
    else openPanel();
  }

  function openPanel() {
    if (open) return;
    if (!config) {
      // Not booted yet. Queue it rather than dropping it, boot() replays this.
      pendingOpen = true;
      return;
    }
    open = true;
    openedAt = Date.now();
    lastFocused = document.activeElement;
    state = { type: null, rating: null, sent: false };

    var wrap = root.querySelector(".wrap");
    wrap.insertAdjacentHTML("beforeend", panelHTML(config));
    var panel = wrap.querySelector(".panel");

    requestAnimationFrame(function () {
      panel.classList.add("in");
      var ta = panel.querySelector("textarea");
      // preventScroll matters on short screens. Focusing the textarea scrolls
      // it into view inside the scrolling .body, and since the textarea sits
      // below the type grid that scroll pushes the types up out of sight, so
      // the panel opens looking like its top was cut off. Keep the cursor in
      // the box without moving the body; the type grid stays visible.
      if (ta) ta.focus({ preventScroll: true });
    });

    bind(panel);
  }

  function closePanel() {
    if (!open) return;
    open = false;

    // Back where they were. Guarded because the element may have been removed
    // by the host page while the panel was open.
    if (lastFocused && typeof lastFocused.focus === "function") {
      try {
        if (document.contains(lastFocused)) lastFocused.focus();
      } catch {
        /* Focus is a courtesy, never a reason to throw on someone's site. */
      }
    }
    lastFocused = null;

    var panel = root.querySelector(".panel");
    if (!panel) return;

    panel.classList.remove("in");
    setTimeout(
      function () {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
      },
      reduceMotion ? 0 : 200,
    );
  }

  function bind(panel) {
    panel.querySelector(".x").addEventListener("click", closePanel);

    var ta = panel.querySelector("textarea");
    ta.addEventListener("input", function () {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
    });

    panel.querySelectorAll(".type").forEach(function (btn) {
      btn.addEventListener("click", function () {
        panel.querySelectorAll(".type").forEach(function (b) {
          b.classList.remove("on");
          // Selection is state, and colour alone does not carry it. Without
          // aria-pressed a screen reader reads four identical buttons and
          // gives no way to tell which one is chosen.
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("on");
        btn.setAttribute("aria-pressed", "true");
        state.type = btn.getAttribute("data-type");
        var meta = TYPE_META[state.type];
        if (meta) ta.setAttribute("placeholder", meta.ph);
        ta.focus({ preventScroll: true });
      });
    });

    var marks = panel.querySelectorAll(".star, .num");
    var rateValue = panel.querySelector(".rate-value");
    var RATE_WORDS = ["", "Awful", "Poor", "Fine", "Good", "Great"];

    function paint(upTo) {
      marks.forEach(function (b) {
        b.classList.toggle("on", Number(b.getAttribute("data-rate")) <= upTo);
      });
      // Say the score out loud. A row of filled shapes is ambiguous about
      // whether four means good or four means four complaints.
      if (rateValue) rateValue.textContent = RATE_WORDS[upTo] || "";
    }

    marks.forEach(function (btn) {
      var v = Number(btn.getAttribute("data-rate"));
      btn.addEventListener("click", function () {
        state.rating = v;
        paint(v);
      });
      // Preview the score on hover, snap back to the chosen one on leave.
      btn.addEventListener("mouseenter", function () {
        paint(v);
      });
      btn.addEventListener("mouseleave", function () {
        paint(state.rating || 0);
      });
    });

    panel.querySelector(".submit").addEventListener("click", function () {
      submit(panel);
    });

    // Cmd/Ctrl+Enter submits, the way every serious text field should.
    ta.addEventListener("keydown", function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(panel);
    });
  }

  function submit(panel) {
    if (state.sent) return;

    var ta = panel.querySelector("textarea");
    var body = ta.value.trim();
    var err = panel.querySelector(".err");
    var btn = panel.querySelector(".submit");

    if (body.length < 2) {
      err.textContent = "Please write a little more.";
      err.hidden = false;
      ta.focus();
      return;
    }

    err.hidden = true;
    btn.disabled = true;
    btn.querySelector("span").textContent = "Sending…";
    state.sent = true;

    var emailField = panel.querySelector("input[type=email]");

    fetch(ORIGIN + "/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: PROJECT_KEY,
        body: body,
        type: state.type || "OTHER",
        rating: state.rating,
        email: emailField ? emailField.value.trim() : null,
        pageUrl: location.href.slice(0, 2000),
        referrer: document.referrer ? document.referrer.slice(0, 2000) : null,
        locale: navigator.language,
        metadata: Object.keys(traits).length ? traits : null,
        _hp: panel.querySelector(".hp").value,
        _elapsed: Date.now() - openedAt,
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(function () {
        // The submit bar is a sibling of .body now, so it has to go too.
        // Leaving it would show a live "Send feedback" button underneath a
        // thank-you message.
        var actions = panel.querySelector(".actions");
        if (actions) actions.remove();

        panel.querySelector(".body").outerHTML =
          '<div class="done" role="status" aria-live="polite">' +
          '<div class="tick">' + icon("check", 20) + "</div>" +
          "<p>" + esc(config.successMessage) + "</p>" +
          "</div>";
        setTimeout(closePanel, 1900);
      })
      .catch(function () {
        state.sent = false;
        btn.disabled = false;
        btn.querySelector("span").textContent = "Send feedback";
        err.textContent = "Couldn't send that. Please try again.";
        err.hidden = false;
      });
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    fetch(ORIGIN + "/api/widget/" + encodeURIComponent(PROJECT_KEY))
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (c) {
        if (!c || c.error) return;
        config = c;
        mount(c);
        // Honour anything clicked or called while we were still loading.
        if (pendingOpen) {
          pendingOpen = false;
          openPanel();
        }
      })
      .catch(function () {
        /* A broken widget must never break the host page. */
      });
  }

  // Public API. Queues anything called before boot finishes.
  window.Voicebox = function (cmd, arg) {
    if (cmd === "open") openPanel();
    else if (cmd === "close") closePanel();
    else if (cmd === "identify" && arg && typeof arg === "object") {
      Object.keys(arg).forEach(function (k) {
        traits[k] = arg[k];
      });
    }
  };

  // Listeners first, rendering when the browser is idle. A trigger click that
  // beats the config is remembered, not lost.
  listen();

  if ("requestIdleCallback" in window) {
    requestIdleCallback(boot, { timeout: 2500 });
  } else {
    setTimeout(boot, 900);
  }
})();
