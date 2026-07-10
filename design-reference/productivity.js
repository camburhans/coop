/* ============================================================
   C.O.O.P. — PRODUCTIVITY MODULE
   Projects + Tasks, linked, persisted. Vanilla JS.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var KEY = "coop.productivity.v1";
  var MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var commander = "Cameron";

  var IC = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a1.98 1.98 0 0 0-2.8-2.8L5 17.2 4 20Z"></path><path d="M13.7 6.8l3.5 3.5"></path></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"></path><path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7"></path><path d="M6.2 7l.9 12.1a1.2 1.2 0 0 0 1.2 1.1h7.4a1.2 1.2 0 0 0 1.2-1.1L18.8 7"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 6.5"></polyline></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h11a4.5 4.5 0 0 1 0 9H8"></path><polyline points="7 5 3.5 9 7 13"></polyline></svg>'
  };

  /* ---------- data ---------- */
  function seed() {
    return {
      projects: [
        { id: "p1", name: "COOP", status: "active", due: "2026-07-15" },
        { id: "p2", name: "AI Agents", status: "done", due: null }
      ],
      tasks: [
        { id: "t1", title: "Ship the command center dashboard", projectId: "p1", priority: "high", status: "todo", due: "2026-07-12" },
        { id: "t2", title: "Wire the voice command parser", projectId: "p1", priority: "medium", status: "todo", due: "2026-07-14" },
        { id: "t3", title: "Draft Sprint 3 scope", projectId: null, priority: "medium", status: "todo", due: "2026-07-31" },
        { id: "t4", title: "Design agent memory schema", projectId: "p2", priority: "low", status: "done", due: null }
      ]
    };
  }

  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
  if (!state || !Array.isArray(state.projects) || !Array.isArray(state.tasks)) state = seed();

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  var filter = null; // null = all, projectId, or "none"

  /* ---------- helpers ---------- */
  function uid() { return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function todayISO() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function isOverdue(iso) { return !!iso && iso < todayISO(); }
  function fmtDue(iso) {
    if (!iso) return null;
    var p = iso.split("-"); var m = parseInt(p[1], 10) - 1; var day = parseInt(p[2], 10);
    if (isNaN(m) || isNaN(day) || m < 0 || m > 11) return null;
    return MON[m] + " " + day;
  }
  function projById(id) { return state.projects.filter(function (p) { return p.id === id; })[0]; }
  function taskById(id) { return state.tasks.filter(function (t) { return t.id === id; })[0]; }
  function taskStats(pid) {
    var l = state.tasks.filter(function (t) { return t.projectId === pid; });
    return { total: l.length, done: l.filter(function (t) { return t.status === "done"; }).length };
  }

  /* ---------- render: projects ---------- */
  function renderProjects() {
    var pc = $("#projCount"); if (pc) pc.textContent = state.projects.length + " TOTAL";
    var wrap = $("#projList"); if (!wrap) return;
    wrap.innerHTML = "";
    if (!state.projects.length) {
      wrap.innerHTML = '<div class="prod-empty"><h4>No projects yet</h4><p>Group related work &mdash; create your first project.</p></div>';
      return;
    }
    state.projects.forEach(function (p) {
      var s = taskStats(p.id);
      var pct = s.total ? Math.round(s.done / s.total * 100) : 0;
      var due = fmtDue(p.due);
      var over = isOverdue(p.due) && p.status !== "done";
      var lbl = p.status === "active" ? "ACTIVE" : p.status === "done" ? "DONE" : "PLANNED";
      var el = document.createElement("div");
      el.className = "proj-card" + (filter === p.id ? " sel" : "");
      el.setAttribute("data-status", p.status);
      el.setAttribute("data-id", p.id);
      el.innerHTML =
        '<div class="proj-title-row">' +
          '<h3 class="proj-name">' + esc(p.name) + '</h3>' +
          '<div class="row-actions">' +
            '<button class="icon-btn" data-edit title="Edit">' + IC.edit + '</button>' +
            '<button class="icon-btn" data-del title="Delete">' + IC.del + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="proj-meta-row">' +
          '<span class="pstatus ' + p.status + '">' + lbl + '</span>' +
          '<span class="proj-meta">' + s.total + (s.total === 1 ? " TASK" : " TASKS") + '</span>' +
          (due ? '<span class="proj-meta' + (over ? " overdue" : "") + '">&middot; DUE ' + due + '</span>' : '') +
        '</div>' +
        '<div class="proj-prog"><div class="proj-prog-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="proj-prog-lbl">' + s.done + ' / ' + s.total + ' DONE &middot; ' + pct + '%</span>';
      wrap.appendChild(el);
    });
  }

  /* ---------- render: tasks ---------- */
  function renderTasks() {
    var fc = $("#taskFilter");
    if (fc) {
      var chips = '<button class="tf-chip' + (filter === null ? " active" : "") + '" data-filter="__all">ALL <b>' + state.tasks.length + '</b></button>';
      state.projects.forEach(function (p) {
        var n = state.tasks.filter(function (t) { return t.projectId === p.id; }).length;
        chips += '<button class="tf-chip' + (filter === p.id ? " active" : "") + '" data-filter="' + p.id + '">' + esc(p.name.toUpperCase()) + ' <b>' + n + '</b></button>';
      });
      var noneN = state.tasks.filter(function (t) { return !t.projectId; }).length;
      chips += '<button class="tf-chip' + (filter === "none" ? " active" : "") + '" data-filter="none">NO PROJECT <b>' + noneN + '</b></button>';
      fc.innerHTML = chips;
    }

    var list = state.tasks.filter(function (t) {
      if (filter === null) return true;
      if (filter === "none") return !t.projectId;
      return t.projectId === filter;
    });
    var rank = { high: 0, medium: 1, low: 2 };
    list = list.slice().sort(function (a, b) {
      if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
      return rank[a.priority] - rank[b.priority];
    });

    var open = state.tasks.filter(function (t) { return t.status !== "done"; }).length;
    var tc = $("#taskCount"); if (tc) tc.textContent = open + " OPEN";

    var wrap = $("#taskList"); if (!wrap) return;
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.innerHTML = '<div class="prod-empty"><h4>No tasks here</h4><p>' +
        (filter === null ? "Add your first task to get moving." : "Nothing in this view yet.") + '</p></div>';
    } else {
      list.forEach(function (t, i) {
        var p = t.projectId ? projById(t.projectId) : null;
        var done = t.status === "done";
        var due = fmtDue(t.due);
        var over = isOverdue(t.due) && !done;
        var row = document.createElement("div");
        row.className = "task-row" + (done ? " done" : "");
        row.setAttribute("data-id", t.id);
        var chip = p
          ? '<span class="proj-chip" data-status="' + p.status + '">' + esc(p.name) + '</span>'
          : '<span class="proj-chip none">NO PROJECT</span>';
        row.innerHTML =
          '<span class="task-num">' + String(i + 1).padStart(2, "0") + '</span>' +
          '<span class="task-accent" data-prio="' + t.priority + '"></span>' +
          '<div class="task-body">' +
            '<span class="task-title">' + esc(t.title) + '</span>' +
            '<div class="task-meta">' + chip + '<span>' + (done ? "DONE" : "TO DO") + '</span></div>' +
          '</div>' +
          '<div class="task-actions">' +
            '<span class="prio ' + t.priority + '">' + t.priority.toUpperCase() + '</span>' +
            (due ? '<span class="task-due' + (over ? " overdue" : "") + '">DUE ' + due + '</span>' : '') +
            '<button class="complete-btn' + (done ? " is-done" : "") + '" data-complete>' + (done ? IC.undo + "REOPEN" : IC.check + "COMPLETE") + '</button>' +
            '<div class="row-actions">' +
              '<button class="icon-btn" data-edit title="Edit">' + IC.edit + '</button>' +
              '<button class="icon-btn" data-del title="Delete">' + IC.del + '</button>' +
            '</div>' +
          '</div>';
        wrap.appendChild(row);
      });
    }

    var note = $("#taskNote span:last-child");
    if (note) {
      var high = state.tasks.filter(function (t) { return t.status !== "done" && t.priority === "high"; }).length;
      var msg;
      if (state.tasks.length === 0) msg = "No tasks yet \u2014 add one and I'll keep it in view.";
      else if (open === 0) msg = "Every task is complete. Beautifully done, " + commander + ".";
      else if (high > 0) msg = high + " high-priority " + (high === 1 ? "task needs" : "tasks need") + " you first \u2014 clear those before the rest.";
      else msg = open + " open " + (open === 1 ? "task" : "tasks") + ", nothing urgent. Steady as she goes.";
      note.textContent = msg;
    }
  }

  function renderAll() { renderProjects(); renderTasks(); }

  /* ---------- mutations ---------- */
  function setFilter(f) { filter = f; renderAll(); }
  function deleteProject(id) {
    state.projects = state.projects.filter(function (p) { return p.id !== id; });
    state.tasks.forEach(function (t) { if (t.projectId === id) t.projectId = null; });
    if (filter === id) filter = null;
    save(); renderAll();
  }
  function deleteTask(id) { state.tasks = state.tasks.filter(function (t) { return t.id !== id; }); save(); renderAll(); }
  function toggleTask(id) {
    var t = taskById(id); if (!t) return;
    t.status = t.status === "done" ? "todo" : "done";
    save(); renderAll();
  }

  /* two-click delete confirm */
  function armDelete(btn, fn) {
    if (btn.__armed) { clearTimeout(btn.__t); fn(); return; }
    btn.__armed = true; btn.classList.add("confirming"); btn.title = "Click again to delete";
    btn.__t = setTimeout(function () { btn.__armed = false; btn.classList.remove("confirming"); btn.title = "Delete"; }, 2600);
  }

  /* ---------- modal ---------- */
  var modalType = null, editId = null;

  function seg(group, opts, val) {
    return '<div class="seg" data-group="' + group + '">' + opts.map(function (o) {
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
    var b = $('#pmBody .seg[data-group="' + group + '"] .seg-btn.active');
    return b ? b.getAttribute("data-val") : null;
  }

  function openModal(type, id) {
    modalType = type; editId = id || null;
    var isEdit = !!id;
    var item = isEdit ? (type === "project" ? projById(id) : taskById(id)) : null;

    $("#pmTitle").textContent = (isEdit ? "Edit " : "New ") + (type === "project" ? "Project" : "Task");
    var body = $("#pmBody");

    if (type === "project") {
      var st = item ? item.status : "active";
      body.innerHTML =
        '<label class="pm-label">Project name</label>' +
        '<input class="pm-input" id="pmName" placeholder="e.g. Q3 Roadmap" value="' + (item ? esc(item.name) : "") + '">' +
        '<label class="pm-label">Status</label>' +
        seg("status", [["active", "Active"], ["planned", "Planned"], ["done", "Done"]], st) +
        '<label class="pm-label">Due date <span class="opt">optional</span></label>' +
        '<input type="date" class="pm-input" id="pmDue" value="' + (item && item.due ? item.due : "") + '">';
    } else {
      var pr = item ? item.priority : "medium";
      var ts = item ? item.status : "todo";
      var pid = item ? item.projectId : (typeof filter === "string" && filter !== "none" ? filter : null);
      var opts = '<option value="">No project</option>' + state.projects.map(function (p) {
        return '<option value="' + p.id + '"' + (pid === p.id ? " selected" : "") + '>' + esc(p.name) + '</option>';
      }).join("");
      body.innerHTML =
        '<label class="pm-label">Task</label>' +
        '<input class="pm-input" id="pmTaskTitle" placeholder="What needs doing?" value="' + (item ? esc(item.title) : "") + '">' +
        '<label class="pm-label">Linked project</label>' +
        '<select class="pm-input pm-select" id="pmProject">' + opts + '</select>' +
        '<label class="pm-label">Priority</label>' +
        seg("priority", [["high", "High"], ["medium", "Medium"], ["low", "Low"]], pr) +
        '<label class="pm-label">Status</label>' +
        seg("tstatus", [["todo", "To do"], ["done", "Done"]], ts) +
        '<label class="pm-label">Due date <span class="opt">optional</span></label>' +
        '<input type="date" class="pm-input" id="pmDue" value="' + (item && item.due ? item.due : "") + '">';
    }

    wireSeg(body);
    var m = $("#prodModal"); m.hidden = false;
    requestAnimationFrame(function () { m.classList.add("show"); });
    var f = body.querySelector("input, select");
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function closeModal() {
    var m = $("#prodModal");
    m.classList.remove("show");
    setTimeout(function () { m.hidden = true; }, 250);
    modalType = null; editId = null;
  }

  function saveModal() {
    if (modalType === "project") {
      var name = ($("#pmName").value || "").trim();
      if (!name) { $("#pmName").focus(); return; }
      var status = segVal("status") || "active";
      var due = $("#pmDue").value || null;
      if (editId) { var p = projById(editId); if (p) { p.name = name; p.status = status; p.due = due; } }
      else { state.projects.push({ id: uid(), name: name, status: status, due: due }); }
    } else if (modalType === "task") {
      var title = ($("#pmTaskTitle").value || "").trim();
      if (!title) { $("#pmTaskTitle").focus(); return; }
      var projectId = $("#pmProject").value || null;
      var priority = segVal("priority") || "medium";
      var tstatus = segVal("tstatus") || "todo";
      var tdue = $("#pmDue").value || null;
      if (editId) { var t = taskById(editId); if (t) { t.title = title; t.projectId = projectId; t.priority = priority; t.status = tstatus; t.due = tdue; } }
      else { state.tasks.push({ id: uid(), title: title, projectId: projectId, priority: priority, status: tstatus, due: tdue }); }
    }
    save(); closeModal(); renderAll();
  }

  /* ---------- wire events ---------- */
  function init() {
    var projList = $("#projList");
    if (projList) projList.addEventListener("click", function (e) {
      var card = e.target.closest(".proj-card"); if (!card) return;
      var id = card.getAttribute("data-id");
      if (e.target.closest("[data-edit]")) { e.stopPropagation(); openModal("project", id); return; }
      var del = e.target.closest("[data-del]");
      if (del) { e.stopPropagation(); armDelete(del, function () { deleteProject(id); }); return; }
      setFilter(filter === id ? null : id);
    });

    var taskList = $("#taskList");
    if (taskList) taskList.addEventListener("click", function (e) {
      var row = e.target.closest(".task-row"); if (!row) return;
      var id = row.getAttribute("data-id");
      if (e.target.closest("[data-complete]")) { toggleTask(id); return; }
      if (e.target.closest("[data-edit]")) { openModal("task", id); return; }
      var del = e.target.closest("[data-del]");
      if (del) { armDelete(del, function () { deleteTask(id); }); return; }
    });

    var tf = $("#taskFilter");
    if (tf) tf.addEventListener("click", function (e) {
      var chip = e.target.closest(".tf-chip"); if (!chip) return;
      var f = chip.getAttribute("data-filter");
      setFilter(f === "__all" ? null : f);
    });

    var ap = $("#addProject"); if (ap) ap.addEventListener("click", function () { openModal("project"); });
    var at = $("#addTask"); if (at) at.addEventListener("click", function () { openModal("task"); });

    var ps = $("#pmSave"); if (ps) ps.addEventListener("click", saveModal);
    $$("#prodModal [data-close]").forEach(function (b) { b.addEventListener("click", closeModal); });

    document.addEventListener("keydown", function (e) {
      var m = $("#prodModal");
      if (!m || m.hidden) return;
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Enter" && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT")) { e.preventDefault(); saveModal(); }
    });

    window.addEventListener("coop:tweaks", function (e) {
      if (e.detail && e.detail.commander) { commander = e.detail.commander; renderTasks(); }
    });

    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
