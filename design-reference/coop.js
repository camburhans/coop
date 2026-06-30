/* C.O.O.P. — live behavior layer */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var commander = "Cameron";

  /* ---------- clock + greeting (C.O.O.P.'s voice) ---------- */
  var DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // weather is a mock feed — held stable across the day so the line never flickers
  var WEATHER = "72° Sunny";
  function pad(n) { return String(n).padStart(2, "0"); }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  // contextual second clause — stable across the day so it never flickers
  var CLAUSES = [
    "Here's how you're doing.",
    "Systems are stable.",
    "Three things need your attention today.",
    "Your morning is protected.",
    "Everything's where it should be."
  ];
  var clause = CLAUSES[new Date().getDate() % CLAUSES.length];

  function tick() {
    var d = new Date();
    var railClock = $("#railClock");
    if (railClock) railClock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());

    var line = pad(d.getHours()) + ":" + pad(d.getMinutes()) + " LOCAL";
    var dateline = $("#barDate");
    if (dateline) dateline.textContent = line;

    var context = $("#barContext");
    if (context) {
      context.textContent = DAYS_FULL[d.getDay()] + ", " + MONTHS_FULL[d.getMonth()] + " " + d.getDate();
    }

    var h = d.getHours();
    var g = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Late shift";
    var greet = $("#greeting");
    if (greet) greet.innerHTML = g + ", " + esc(commander) + '. <span class="voice-soft">' + clause + "</span>";
  }
  setInterval(tick, 1000);
  tick();

  /* ---------- particle field ---------- */
  var field = $("#particles");
  if (field && !reduce) {
    var colors = ["var(--gold)", "var(--gold-hi)", "var(--gold)", "var(--indigo)"];
    for (var i = 0; i < 26; i++) {
      var s = document.createElement("span");
      s.style.setProperty("--x", (Math.random() * 100).toFixed(2) + "%");
      s.style.setProperty("--size", (1.5 + Math.random() * 1.8).toFixed(1) + "px");
      s.style.setProperty("--dur", (34 + Math.random() * 34).toFixed(0) + "s");
      s.style.setProperty("--delay", (-Math.random() * 60).toFixed(1) + "s");
      s.style.setProperty("--o", (0.12 + Math.random() * 0.3).toFixed(2));
      s.style.setProperty("--c", colors[i % colors.length]);
      field.appendChild(s);
    }
  }

  /* ---------- view switching ---------- */
  var standbyData = {
    productivity: ["PRODUCTIVITY MODULE", "Productivity", "Task flow, focus blocks & habit telemetry."],
    finance: ["FINANCE MODULE", "Finance", "Deep portfolio analytics & cash-flow control."],
    knowledge: ["KNOWLEDGE MODULE", "Knowledge", "Memory vault, reading queue & study engine."],
    ai: ["A.I. CORE", "A.I. Core", "Cognition engine, routines & directives."]
  };

  function setView(v) {
    $$("[data-view]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-view") === v);
    });
    var dash = v === "dashboard";
    $("#view-dashboard").hidden = !dash;
    $("#view-standby").hidden = dash;
    if (!dash && standbyData[v]) {
      $("#standbyLabel").textContent = standbyData[v][0];
      $("#standbyName").textContent = standbyData[v][1];
      $("#standbySub").textContent = standbyData[v][2];
    }
  }

  $$("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () { setView(b.getAttribute("data-view")); });
  });

  /* ---------- command palette ---------- */
  var input = $("#cmdInput");

  window.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (input) { input.focus(); input.select(); }
    }
  });

  var GENERIC = [
    "Acknowledged, Cameron. Queued for processing — I'll report back shortly.",
    "On it. I'll have a summary ready before your 09:30 standup.",
    "Noted and filed to today's log. Anything else?",
    "Working. Cross-referencing your calendar and priorities now."
  ];
  var gi = 0;

  var MORNING_BRIEFING = "Here's your morning, Cameron. Net worth holds at $1,284,910 — up $8,240 this month, with brokerage ahead 1.2% today. Your 07:00 deep-work block is protected; I've held notifications until 08:30. One scheduling conflict around the 15:00 review resolved overnight, and prep is now blocked at 14:15. Three priorities need you before noon — start with the strategy memo while your energy is high.";

  function answerFor(q) {
    q = (q || "").toLowerCase();
    if (/catch|brief|update|recap|how.*(do|going)|status|morning/.test(q))
      return MORNING_BRIEFING;
    if (/financ|money|worth|market|portfolio|brokerage|spend|invest/.test(q))
      return "Finances are healthy — brokerage is up 1.2% today and net worth is +$8,240 this month. Nothing needs action; the rebalance can wait for the weekend.";
    if (/attention|priorit|need|todo|task|focus|important/.test(q))
      return "Three things: finish the strategy memo draft (high), prep the Q-review agenda before 15:00, then reply to M. Reyes when you have a moment.";
    if (/today|calendar|schedule|next|meeting|agenda/.test(q))
      return "Five events today. Your 07:00 deep-work block is live now; the next hard stop is the 15:00 quarterly review. I've held 14:15 for prep.";
    if (/verse|memor|proverb|scripture|recall/.test(q))
      return "You're on Proverbs 3:5–6 — day 12 of 30, 40% through the plan. I'll cue you to run it at noon.";
    return GENERIC[gi++ % GENERIC.length];
  }

  var typeTimer = null, hideTimer = null;

  function respond(msg) {
    var toast = $("#coopToast");
    var txt = $("#toastText");
    if (!toast || !txt) return;
    clearInterval(typeTimer);
    clearTimeout(hideTimer);
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add("show"); });

    function dismiss() {
      toast.classList.remove("show");
      setTimeout(function () { toast.hidden = true; }, 400);
    }

    if (reduce) {
      txt.textContent = msg;
      hideTimer = setTimeout(dismiss, 6500);
      return;
    }
    var n = 0;
    txt.textContent = "";
    typeTimer = setInterval(function () {
      n++;
      txt.textContent = msg.slice(0, n);
      if (n >= msg.length) {
        clearInterval(typeTimer);
        hideTimer = setTimeout(dismiss, Math.max(4200, msg.length * 38));
      }
    }, 15);
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && input.value.trim()) {
        respond(answerFor(input.value));
        input.value = "";
        input.blur();
      }
    });
  }

  $$(".qprompt").forEach(function (b) {
    b.addEventListener("click", function () { respond(answerFor(b.getAttribute("data-q"))); });
  });

  /* ---------- tweaks bridge ---------- */
  window.addEventListener("coop:tweaks", function (e) {
    var t = e.detail || {};
    commander = (t.commander || "Cameron").trim() || "Cameron";
    tick();
  });
})();
