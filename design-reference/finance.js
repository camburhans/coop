/* ============================================================
   C.O.O.P. — FINANCE MODULE
   Reporting (telemetry) + Ledger (accounts & transactions).
   Vanilla JS, persisted to localStorage ("coop.finance.v1").
   Balances are manual — no feeds, no sync.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var KEY = "coop.finance.v1";
  var MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  var TYPES = [["cash", "Cash"], ["checking", "Checking"], ["savings", "Savings"], ["investment", "Investment"], ["credit", "Credit"], ["loan", "Loan"], ["asset", "Asset"]];
  var TYPE_LBL = { cash: "CASH", checking: "CHECKING", savings: "SAVINGS", investment: "INVESTMENT", credit: "CREDIT", loan: "LOAN", asset: "ASSET" };
  var PERIOD_LBL = { month: "THIS MONTH", quarter: "THIS QUARTER", ytd: "YEAR TO DATE" };

  var IC = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a1.98 1.98 0 0 0-2.8-2.8L5 17.2 4 20Z"></path><path d="M13.7 6.8l3.5 3.5"></path></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"></path><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7"></path><path d="M6.2 7l.9 12.1a1.2 1.2 0 0 0 1.2 1.1h7.4a1.2 1.2 0 0 0 1.2-1.1L18.8 7"></path></svg>'
  };

  /* ---------- helpers ---------- */
  function pad2(n) { return String(n).padStart(2, "0"); }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function uid() { return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtDate(iso) {
    var p = String(iso || "").split("-");
    var m = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
    if (isNaN(m) || isNaN(d) || m < 0 || m > 11) return "—";
    return MON[m] + " " + d;
  }
  function money(n, dec) {
    var d = dec == null ? 2 : dec;
    return "$" + Math.abs(+n || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function signedTx(t) { return t.flow === "in" ? +t.amount : -t.amount; }
  function acctById(id) { return state.accounts.filter(function (a) { return a.id === id; })[0]; }
  function txById(id) { return state.transactions.filter(function (t) { return t.id === id; })[0]; }

  /* ---------- seed (single household: checking, savings, brokerage, card) ---------- */
  function seed() {
    var Y = new Date().getFullYear();
    var accounts = [
      { id: "a1", name: "Everyday Checking", type: "checking", balance: 6421.18, liability: false },
      { id: "a2", name: "High-Yield Savings", type: "savings", balance: 28750.00, liability: false },
      { id: "a3", name: "Brokerage", type: "investment", balance: 47310.44, liability: false },
      { id: "a4", name: "Rewards Card", type: "credit", balance: 1284.52, liability: true }
    ];
    var tx = []; var n = 0;
    function T(m, d, desc, cat, acct, amt, flow) {
      tx.push({ id: "s" + (++n), date: Y + "-" + pad2(m) + "-" + pad2(d), description: desc, category: cat, accountId: acct, amount: amt, flow: flow || "out" });
    }
    var groceriesA = [142.60, 131.80, 156.40, 148.90, 137.20, 151.70, 144.30];
    var groceriesB = [138.20, 145.50, 129.80, 152.10, 141.00, 133.60, 149.40];
    var groceriesC = [153.40, 147.90, 161.20, 139.70, 155.80, 143.10, 150.60];
    var utilities  = [128.40, 119.70, 112.30, 104.90, 98.60, 116.20, 124.80];
    var dining     = [96.40, 88.20, 104.70, 92.50, 110.30, 84.90, 97.60];
    var transport  = [86.00, 74.00, 92.00, 81.00, 68.00, 88.00, 79.00];
    var leisure    = [64.00, 0, 89.00, 45.00, 72.00, 58.00, 0];
    var health     = [0, 85.00, 0, 60.00, 0, 110.00, 0];
    var dividends  = { 1: 182.40, 4: 197.60, 7: 210.30 };
    for (var m = 1; m <= 7; m++) {
      T(m, 1, "Payroll — Meridian Labs", "SALARY", "a1", 6850.00, "in");
      T(m, 1, "Rent — Beacon Lofts", "RENT", "a1", 2150.00);
      T(m, 3, "Market run", "GROCERIES", "a1", groceriesA[m - 1]);
      T(m, 5, "Power & water", "UTILITIES", "a1", utilities[m - 1]);
      T(m, 6, "Transit pass", "TRANSPORT", "a1", transport[m - 1]);
      T(m, 8, "Dinner out", "DINING", "a4", dining[m - 1]);
      T(m, 9, "Streaming & tools", "SUBSCRIPTIONS", "a4", 43.97);
      if (dividends[m]) T(m, 10, "Dividend — index fund", "DIVIDENDS", "a3", dividends[m], "in");
      T(m, 10, "Grocery restock", "GROCERIES", "a1", groceriesB[m - 1]);
      T(m, 12, "Auto insurance", "INSURANCE", "a1", 164.50);
      if (leisure[m - 1]) T(m, 18, "Weekend outing", "LEISURE", "a4", leisure[m - 1]);
      if (health[m - 1]) T(m, 22, "Clinic copay", "HEALTH", "a1", health[m - 1]);
      T(m, 24, "Groceries", "GROCERIES", "a1", groceriesC[m - 1]);
      T(m, 27, "Coffee & lunches", "DINING", "a4", 71.25);
    }
    var today = todayISO();
    tx = tx.filter(function (t) { return t.date <= today; });
    return { accounts: accounts, transactions: tx };
  }

  /* ---------- state (with unreadable-data error state) ---------- */
  var dataWarning = false;
  var state = null;
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) { dataWarning = true; state = null; }
  if (!state || !Array.isArray(state.accounts) || !Array.isArray(state.transactions)) {
    if (state) dataWarning = true;
    state = seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var period = "month";   // month | quarter | ytd
  var txFilter = null;    // null = all, accountId, or "none" (unlinked)

  function periodStart() {
    var d = new Date(), y = d.getFullYear();
    if (period === "month") return y + "-" + pad2(d.getMonth() + 1) + "-01";
    if (period === "quarter") return y + "-" + pad2(Math.floor(d.getMonth() / 3) * 3 + 1) + "-01";
    return y + "-01-01";
  }
  function inPeriod(t) { return String(t.date || "") >= periodStart(); }
  function byDateAsc(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }
  function byDateDesc(a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; }

  /* ============================================================
     REPORTING
     ============================================================ */
  function renderSpark(periodTx, startVal, periodNet) {
    var line = $("#finSparkLine"), fill = $("#finSparkFill"), dot = $("#finSparkDot");
    if (!line) return;
    var byDate = {}, dates = [];
    periodTx.forEach(function (t) {
      var d = t.date;
      if (byDate[d] == null) { byDate[d] = 0; dates.push(d); }
      byDate[d] += signedTx(t);
    });
    dates.sort();
    var vals = [startVal], run = startVal;
    dates.forEach(function (d) { run += byDate[d]; vals.push(run); });
    if (vals.length === 1) vals.push(startVal);
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max - min < 1) max = min + 1;
    var W = 318, TOP = 8, BOT = 56;
    var pts = vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * W;
      var y = BOT - ((v - min) / (max - min)) * (BOT - TOP);
      return [x.toFixed(1), y.toFixed(1)];
    });
    var d = pts.map(function (p, i) { return (i ? "L" : "M") + p[0] + " " + p[1]; }).join(" ");
    line.setAttribute("d", d);
    fill.setAttribute("d", d + " L318 70 L0 70 Z");
    var last = pts[pts.length - 1];
    dot.setAttribute("cx", last[0]);
    dot.setAttribute("cy", last[1]);
    dot.setAttribute("fill", periodNet >= 0 ? "var(--good)" : "var(--alert)");
  }

  function txRow(t, withActions) {
    var a = t.accountId ? acctById(t.accountId) : null;
    var out = t.flow !== "in";
    return '<div class="ftx-row' + (withActions ? ' has-actions" data-id="' + t.id : "") + '">' +
      '<span class="ftx-date">' + fmtDate(t.date) + '</span>' +
      '<div class="ftx-body">' +
        '<span class="ftx-desc">' + esc(t.description) + '</span>' +
        '<div class="ftx-meta">' +
          '<span class="fcat-chip">' + esc(t.category || "GENERAL") + '</span>' +
          '<span class="ftx-acct">' + (a ? esc(a.name.toUpperCase()) : "UNLINKED") + '</span>' +
        '</div>' +
      '</div>' +
      '<span class="ftx-amt ' + (out ? "out" : "in") + '">' + (out ? "\u2212" : "+") + money(t.amount) + '</span>' +
      (withActions
        ? '<div class="row-actions">' +
            '<button class="icon-btn" data-edit title="Edit">' + IC.edit + '</button>' +
            '<button class="icon-btn" data-del title="Delete">' + IC.del + '</button>' +
          '</div>'
        : "") +
      '</div>';
  }

  function renderReporting() {
    var accounts = state.accounts, txs = state.transactions;
    var lbl = PERIOD_LBL[period];

    var assets = 0, liabs = 0;
    accounts.forEach(function (a) { var b = +a.balance || 0; if (a.liability) liabs += b; else assets += b; });
    var net = assets - liabs;

    var asOf = $("#finAsOf");
    if (asOf) asOf.textContent = "AS OF " + fmtDate(todayISO()) + " \u00B7 " + accounts.length + (accounts.length === 1 ? " ACCOUNT" : " ACCOUNTS");
    var netEl = $("#finNet");
    if (netEl) netEl.textContent = (net < 0 ? "\u2212" : "") + money(net, 0);

    var pt = txs.filter(inPeriod).slice().sort(byDateAsc);
    var inc = 0, out = 0;
    pt.forEach(function (t) { if (t.flow === "in") inc += +t.amount || 0; else out += +t.amount || 0; });
    var pnet = inc - out;

    var delta = $("#finDelta");
    if (delta) {
      if (!accounts.length) { delta.textContent = "NO ACCOUNTS ON LEDGER"; delta.className = "fin-delta tone-neutral"; }
      else if (!pt.length) { delta.textContent = "NO ACTIVITY \u00B7 " + lbl; delta.className = "fin-delta tone-neutral"; }
      else {
        delta.textContent = (pnet >= 0 ? "\u25B2 +" : "\u25BC \u2212") + money(pnet) + " \u00B7 " + lbl;
        delta.className = "fin-delta " + (pnet >= 0 ? "tone-good" : "tone-alert");
      }
    }

    renderSpark(pt, net - pnet, pnet);

    /* cash flow */
    var cashMeta = $("#finCashMeta"); if (cashMeta) cashMeta.textContent = lbl;
    var cash = $("#finCashBody");
    if (cash) {
      if (!pt.length) {
        cash.innerHTML = '<div class="prod-empty"><h4>No activity yet</h4><p>Nothing recorded for this period &mdash; the ledger is quiet.</p></div>';
      } else {
        var total = inc + out || 1;
        cash.innerHTML =
          '<div class="flow-figs">' +
            '<div class="flow-fig"><b>INCOME</b><strong class="tone-good">' + money(inc) + '</strong></div>' +
            '<div class="flow-fig"><b>SPEND</b><strong class="tone-alert">' + money(out) + '</strong></div>' +
          '</div>' +
          '<div class="flow-bar"><span class="fb-in" style="width:' + (inc / total * 100).toFixed(1) + '%"></span><span class="fb-out" style="width:' + (out / total * 100).toFixed(1) + '%"></span></div>' +
          '<div class="flow-net"><span>NET \u00B7 ' + lbl + '</span><em class="' + (pnet >= 0 ? "tone-good" : "tone-alert") + '">' + (pnet >= 0 ? "+" : "\u2212") + money(pnet) + '</em></div>';
      }
      cash.className = "";
    }

    /* spend by category */
    var catMeta = $("#finCatMeta");
    var cats = $("#finCatList");
    if (cats) {
      var map = {};
      pt.forEach(function (t) { if (t.flow === "in") return; var k = t.category || "GENERAL"; map[k] = (map[k] || 0) + (+t.amount || 0); });
      var rows = Object.keys(map).map(function (k) { return [k, map[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
      if (catMeta) catMeta.textContent = rows.length ? rows.length + " CATEGORIES \u00B7 " + lbl : lbl;
      if (!rows.length) {
        cats.innerHTML = '<div class="prod-empty"><h4>No spend recorded</h4><p>No outflows this period &mdash; nothing to break down.</p></div>';
      } else {
        var mx = rows[0][1];
        cats.innerHTML = '<div class="fcat-list">' + rows.map(function (r) {
          var pct = Math.max(4, r[1] / mx * 100);
          return '<div class="fcat-row"><span class="fcat-name">' + esc(r[0]) + '</span><div class="fcat-track"><div class="fcat-fill" style="width:' + pct.toFixed(1) + '%"></div></div><span class="fcat-amt">' + money(r[1]) + '</span></div>';
        }).join("") + '</div>';
      }
      cats.className = "";
    }

    /* accounts: assets vs liabilities */
    var am = $("#finAcctMeta"); if (am) am.textContent = "ASSETS " + money(assets, 0) + " \u00B7 LIABILITIES " + money(liabs, 0);
    var ar = $("#finAcctReport");
    if (ar) {
      if (!accounts.length) {
        ar.innerHTML = '<div class="prod-empty"><h4>No accounts on ledger</h4><p>Add your first account in the LEDGER tab.</p></div>';
      } else {
        function repRow(a) {
          return '<div class="frep-row"><span class="facct-name">' + esc(a.name) + '</span><span class="facct-type">' + (TYPE_LBL[a.type] || "ASSET") + '</span><span class="facct-bal' + (a.liability ? " liab" : "") + '">' + (a.liability ? "\u2212" : "") + money(a.balance) + '</span></div>';
        }
        var as = accounts.filter(function (a) { return !a.liability; });
        var li = accounts.filter(function (a) { return a.liability; });
        ar.innerHTML =
          '<div class="sublabel">ASSETS</div>' +
          (as.length ? as.map(repRow).join("") : '<div class="facct-none">NONE RECORDED</div>') +
          '<div class="sublabel">LIABILITIES</div>' +
          (li.length ? li.map(repRow).join("") : '<div class="facct-none">NONE RECORDED</div>') +
          '<div class="facct-net"><span>NET POSITION</span><em class="' + (net >= 0 ? "tone-good" : "tone-alert") + '">' + (net < 0 ? "\u2212" : "") + money(net) + '</em></div>';
      }
      ar.className = "";
    }

    /* recent transactions */
    var latest = txs.slice().sort(byDateDesc).slice(0, 8);
    var rm = $("#finRecentMeta"); if (rm) rm.textContent = latest.length ? "LATEST " + latest.length : "NONE";
    var rl = $("#finRecentList");
    if (rl) {
      rl.innerHTML = latest.length
        ? '<div class="ftx-list">' + latest.map(function (t) { return txRow(t, false); }).join("") + '</div>'
        : '<div class="prod-empty"><h4>No transactions yet</h4><p>Record your first entry in the LEDGER tab.</p></div>';
      rl.className = "";
    }
  }

  /* ============================================================
     LEDGER
     ============================================================ */
  var TX_CAP = 30;

  function renderLedger() {
    var warn = $("#finWarn"); if (warn) warn.hidden = !dataWarning;

    /* accounts */
    var ac = $("#finAcctCount"); if (ac) ac.textContent = state.accounts.length + " ON LEDGER";
    var al = $("#finAcctList");
    if (al) {
      if (!state.accounts.length) {
        al.innerHTML = '<div class="prod-empty"><h4>No accounts yet</h4><p>Every balance here is entered by hand &mdash; add your first account.</p></div>';
      } else {
        al.innerHTML = state.accounts.map(function (a) {
          return '<div class="facct-row" data-id="' + a.id + '">' +
            '<div class="facct-main">' +
              '<span class="facct-name">' + esc(a.name) + '</span>' +
              '<div class="facct-sub"><span class="facct-type">' + (TYPE_LBL[a.type] || "ASSET") + '</span>' + (a.liability ? '<em class="liab-tag">LIABILITY</em>' : "") + '</div>' +
            '</div>' +
            '<span class="facct-bal' + (a.liability ? " liab" : "") + '">' + (a.liability ? "\u2212" : "") + money(a.balance) + '</span>' +
            '<div class="row-actions">' +
              '<button class="icon-btn" data-edit title="Edit">' + IC.edit + '</button>' +
              '<button class="icon-btn" data-del title="Delete">' + IC.del + '</button>' +
            '</div>' +
          '</div>';
        }).join("");
      }
      al.className = "facct-list";
    }

    /* transaction filter chips (by account) */
    var fc = $("#finTxFilter");
    if (fc) {
      var chips = '<button class="tf-chip' + (txFilter === null ? " active" : "") + '" data-filter="__all">ALL <b>' + state.transactions.length + '</b></button>';
      state.accounts.forEach(function (a) {
        var n = state.transactions.filter(function (t) { return t.accountId === a.id; }).length;
        chips += '<button class="tf-chip' + (txFilter === a.id ? " active" : "") + '" data-filter="' + a.id + '">' + esc(a.name.toUpperCase()) + ' <b>' + n + '</b></button>';
      });
      var unlinked = state.transactions.filter(function (t) { return !t.accountId; }).length;
      if (unlinked) chips += '<button class="tf-chip' + (txFilter === "none" ? " active" : "") + '" data-filter="none">UNLINKED <b>' + unlinked + '</b></button>';
      fc.innerHTML = chips;
    }

    /* transactions */
    var list = state.transactions.filter(function (t) {
      if (txFilter === null) return true;
      if (txFilter === "none") return !t.accountId;
      return t.accountId === txFilter;
    }).sort(byDateDesc);

    var tc = $("#finTxCount"); if (tc) tc.textContent = state.transactions.length + " ENTRIES";
    var tl = $("#finTxList");
    if (tl) {
      if (!list.length) {
        tl.innerHTML = '<div class="prod-empty"><h4>Nothing in this view</h4><p>' +
          (txFilter === null ? "Record your first transaction to start the ledger." : "No entries for this account yet.") + '</p></div>';
      } else {
        var shown = list.slice(0, TX_CAP);
        tl.innerHTML = '<div class="ftx-list">' + shown.map(function (t) { return txRow(t, true); }).join("") + '</div>' +
          (list.length > TX_CAP ? '<div class="fin-cap-note">SHOWING LATEST ' + TX_CAP + ' OF ' + list.length + ' \u2014 FILTER BY ACCOUNT TO NARROW</div>' : "");
      }
      tl.className = "";
    }

    /* C.O.O.P.'s stewardship note */
    var note = $("#finNote span:last-child");
    if (note) {
      if (!state.transactions.length) {
        note.textContent = "An empty ledger tells no story \u2014 record the first entry and I\u2019ll keep the account.";
      } else {
        var newest = state.transactions.slice().sort(byDateDesc)[0];
        note.textContent = "Ledger current through " + fmtDate(newest.date) + ". Balances here are manual \u2014 faithful entries are quiet stewardship, and I\u2019ll keep the watch.";
      }
    }
  }

  function renderAll() { renderReporting(); renderLedger(); }

  /* ---------- mutations ---------- */
  function deleteAccount(id) {
    state.accounts = state.accounts.filter(function (a) { return a.id !== id; });
    state.transactions.forEach(function (t) { if (t.accountId === id) t.accountId = null; });
    if (txFilter === id) txFilter = null;
    save(); renderAll();
  }
  function deleteTx(id) {
    state.transactions = state.transactions.filter(function (t) { return t.id !== id; });
    save(); renderAll();
  }

  /* two-click delete confirm (same pattern as productivity) */
  function armDelete(btn, fn) {
    if (btn.__armed) { clearTimeout(btn.__t); fn(); return; }
    btn.__armed = true; btn.classList.add("confirming"); btn.title = "Click again to delete";
    btn.__t = setTimeout(function () { btn.__armed = false; btn.classList.remove("confirming"); btn.title = "Delete"; }, 2600);
  }

  /* ============================================================
     MODAL (inherits productivity modal shell + segmented control)
     ============================================================ */
  var modalType = null, editId = null, modalLocked = false;

  function seg(group, opts, val, wrap) {
    return '<div class="seg' + (wrap ? " seg-wrap" : "") + '" data-group="' + group + '">' + opts.map(function (o) {
      return '<button type="button" class="seg-btn' + (o[0] === val ? " active" : "") + '" data-val="' + o[0] + '">' + o[1] + '</button>';
    }).join("") + '</div>';
  }
  function wireSeg(root) {
    $$(".seg", root).forEach(function (g) {
      g.addEventListener("click", function (e) {
        var b = e.target.closest(".seg-btn"); if (!b) return;
        $$(".seg-btn", g).forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
      });
    });
  }
  function segVal(group) {
    var b = $('#fmBody .seg[data-group="' + group + '"] .seg-btn.active');
    return b ? b.getAttribute("data-val") : null;
  }
  function markErr(el) { el.classList.add("pm-err"); el.addEventListener("input", function h() { el.classList.remove("pm-err"); el.removeEventListener("input", h); }); el.focus(); }

  function openModal(type, id) {
    modalType = type; editId = id || null; modalLocked = false;
    var isEdit = !!id;
    var item = isEdit ? (type === "account" ? acctById(id) : txById(id)) : null;
    $("#fmTitle").textContent = (isEdit ? "Edit " : "New ") + (type === "account" ? "Account" : "Transaction");
    var body = $("#fmBody");

    if (type === "account") {
      var ty = item ? item.type : "checking";
      var role = item ? (item.liability ? "liability" : "asset") : "asset";
      body.innerHTML =
        '<label class="pm-label">Account name</label>' +
        '<input class="pm-input" id="fmName" placeholder="e.g. Everyday Checking" value="' + (item ? esc(item.name) : "") + '">' +
        '<label class="pm-label">Type</label>' +
        seg("atype", TYPES, ty, true) +
        '<label class="pm-label">Balance <span class="opt">entered manually</span></label>' +
        '<input type="number" class="pm-input" id="fmBalance" step="0.01" min="0" placeholder="0.00" value="' + (item ? item.balance : "") + '">' +
        '<label class="pm-label">Role</label>' +
        seg("arole", [["asset", "Asset"], ["liability", "Liability"]], role);
      wireSeg(body);
      /* choosing CREDIT / LOAN defaults the role to liability */
      var tg = $('#fmBody .seg[data-group="atype"]');
      if (tg) tg.addEventListener("click", function (e) {
        var b = e.target.closest(".seg-btn"); if (!b) return;
        var liab = b.getAttribute("data-val") === "credit" || b.getAttribute("data-val") === "loan";
        $$('#fmBody .seg[data-group="arole"] .seg-btn').forEach(function (x) {
          x.classList.toggle("active", (x.getAttribute("data-val") === "liability") === liab);
        });
      });
    } else {
      if (!state.accounts.length) {
        body.innerHTML = '<div class="prod-empty"><h4>No accounts yet</h4><p>Transactions need a home &mdash; add an account first.</p></div>';
        modalLocked = true;
      } else {
        var aid = item ? item.accountId : (txFilter && txFilter !== "none" ? txFilter : state.accounts[0].id);
        var opts = state.accounts.map(function (a) {
          return '<option value="' + a.id + '"' + (aid === a.id ? " selected" : "") + '>' + esc(a.name) + '</option>';
        }).join("");
        var catSet = {};
        state.transactions.forEach(function (t) { if (t.category) catSet[t.category] = 1; });
        var datalist = '<datalist id="finCatOptions">' + Object.keys(catSet).sort().map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join("") + '</datalist>';
        body.innerHTML =
          '<label class="pm-label">Account</label>' +
          '<select class="pm-input pm-select" id="fmAccount">' + opts + '</select>' +
          '<label class="pm-label">Direction</label>' +
          seg("flow", [["out", "Outflow"], ["in", "Inflow"]], item ? item.flow : "out") +
          '<label class="pm-label">Amount</label>' +
          '<input type="number" class="pm-input" id="fmAmount" step="0.01" min="0" placeholder="0.00" value="' + (item ? item.amount : "") + '">' +
          '<label class="pm-label">Category</label>' +
          '<input class="pm-input" id="fmCategory" list="finCatOptions" placeholder="e.g. GROCERIES" value="' + (item ? esc(item.category) : "") + '">' + datalist +
          '<label class="pm-label">Description</label>' +
          '<input class="pm-input" id="fmDesc" placeholder="e.g. Market run" value="' + (item ? esc(item.description) : "") + '">' +
          '<label class="pm-label">Date</label>' +
          '<input type="date" class="pm-input" id="fmDate" value="' + (item && item.date ? item.date : todayISO()) + '">';
        wireSeg(body);
      }
    }

    var m = $("#finModal"); m.hidden = false;
    requestAnimationFrame(function () { m.classList.add("show"); });
    var f = body.querySelector("input, select");
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function closeModal() {
    var m = $("#finModal");
    m.classList.remove("show");
    setTimeout(function () { m.hidden = true; }, 250);
    modalType = null; editId = null; modalLocked = false;
  }

  function saveModal() {
    if (modalLocked) { closeModal(); return; }
    if (modalType === "account") {
      var nameEl = $("#fmName"), balEl = $("#fmBalance");
      var name = (nameEl.value || "").trim();
      if (!name) { markErr(nameEl); return; }
      var bal = parseFloat(balEl.value);
      if (balEl.value !== "" && (isNaN(bal) || bal < 0)) { markErr(balEl); return; }
      if (isNaN(bal)) bal = 0;
      var type = segVal("atype") || "checking";
      var liability = segVal("arole") === "liability";
      if (editId) {
        var a = acctById(editId);
        if (a) { a.name = name; a.type = type; a.balance = bal; a.liability = liability; }
      } else {
        state.accounts.push({ id: uid(), name: name, type: type, balance: bal, liability: liability });
      }
    } else if (modalType === "tx") {
      var amtEl = $("#fmAmount"), descEl = $("#fmDesc"), dateEl = $("#fmDate");
      var amt = parseFloat(amtEl.value);
      if (isNaN(amt) || amt <= 0) { markErr(amtEl); return; }
      var desc = (descEl.value || "").trim();
      if (!desc) { markErr(descEl); return; }
      var accountId = $("#fmAccount").value || null;
      var flow = segVal("flow") || "out";
      var cat = ($("#fmCategory").value || "").trim().toUpperCase() || "GENERAL";
      var date = dateEl.value || todayISO();
      if (editId) {
        var t = txById(editId);
        if (t) { t.accountId = accountId; t.flow = flow; t.amount = amt; t.category = cat; t.description = desc; t.date = date; }
      } else {
        state.transactions.push({ id: uid(), accountId: accountId, flow: flow, amount: amt, category: cat, description: desc, date: date });
      }
    }
    save(); closeModal(); renderAll();
  }

  /* ============================================================
     TABS (keyboard-reachable)
     ============================================================ */
  function setTab(tabId, focus) {
    $$(".fin-tab").forEach(function (t) {
      var on = t.id === tabId;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var pane = document.getElementById(t.getAttribute("aria-controls"));
      if (pane) pane.hidden = !on;
    });
    if (focus) { var el = document.getElementById(tabId); if (el) el.focus(); }
  }

  /* ============================================================
     WIRING
     ============================================================ */
  function init() {
    var tabs = $(".fin-tabs");
    if (tabs) {
      tabs.addEventListener("click", function (e) {
        var t = e.target.closest(".fin-tab"); if (!t) return;
        setTab(t.id);
      });
      tabs.addEventListener("keydown", function (e) {
        var order = $$(".fin-tab", tabs);
        var i = order.indexOf(document.activeElement);
        if (i < 0) return;
        var j = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % order.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + order.length) % order.length;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = order.length - 1;
        if (j == null) return;
        e.preventDefault();
        setTab(order[j].id, true);
      });
    }

    var periods = $("#finPeriods");
    if (periods) periods.addEventListener("click", function (e) {
      var chip = e.target.closest(".tf-chip"); if (!chip) return;
      period = chip.getAttribute("data-period");
      $$(".tf-chip", periods).forEach(function (c) { c.classList.toggle("active", c === chip); });
      renderReporting();
    });

    var al = $("#finAcctList");
    if (al) al.addEventListener("click", function (e) {
      var row = e.target.closest(".facct-row[data-id]"); if (!row) return;
      var id = row.getAttribute("data-id");
      if (e.target.closest("[data-edit]")) { openModal("account", id); return; }
      var del = e.target.closest("[data-del]");
      if (del) armDelete(del, function () { deleteAccount(id); });
    });

    var tl = $("#finTxList");
    if (tl) tl.addEventListener("click", function (e) {
      var row = e.target.closest(".ftx-row[data-id]"); if (!row) return;
      var id = row.getAttribute("data-id");
      if (e.target.closest("[data-edit]")) { openModal("tx", id); return; }
      var del = e.target.closest("[data-del]");
      if (del) armDelete(del, function () { deleteTx(id); });
    });

    var fc = $("#finTxFilter");
    if (fc) fc.addEventListener("click", function (e) {
      var chip = e.target.closest(".tf-chip"); if (!chip) return;
      var f = chip.getAttribute("data-filter");
      txFilter = f === "__all" ? null : f;
      renderLedger();
    });

    var aa = $("#finAddAccount"); if (aa) aa.addEventListener("click", function () { openModal("account"); });
    var at = $("#finAddTx"); if (at) at.addEventListener("click", function () { openModal("tx"); });

    var fs = $("#fmSave"); if (fs) fs.addEventListener("click", saveModal);
    $$("#finModal [data-close]").forEach(function (b) { b.addEventListener("click", closeModal); });

    document.addEventListener("keydown", function (e) {
      var m = $("#finModal");
      if (!m || m.hidden) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Enter" && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) { e.preventDefault(); saveModal(); }
    });

    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
