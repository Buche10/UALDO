import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock, Circle, AlertTriangle, Bell, RefreshCw, LogOut, ChevronRight, Plus, X } from "lucide-react";
import { fetchProgress, fetchTasks, fetchNotifications, markNotificationRead, teamsLogout, fetchMeta, createTask } from "../services/teamsClient";
import TaskDetailView from "./TaskDetailView";

export default function TrabajoView({ onLogout }) {
  const [tab, setTab] = useState("tareas"); // "avance" | "tareas" | "notif"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Crear tarea
  const [showForm, setShowForm] = useState(false);
  const [meta, setMeta] = useState({ projects: [], members: [] });
  const [form, setForm] = useState({ title: "", project_id: "", assigned_to_id: "", due_date: "", priority: "medium" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resP, resT, resN, resM] = await Promise.all([
        fetchProgress(),
        fetchTasks(),
        fetchNotifications(),
        fetchMeta(),
      ]);

      if (resP.status === 401 || resT.status === 401) {
        teamsLogout();
        if (onLogout) onLogout();
        return;
      }

      if (resP.ok) setProgress(resP.data);
      // El backend responde { data: [...] }; teamsRequest ya envuelve en .data,
      // así que las tareas están en resT.data.data.
      if (resT.ok) setTasks(resT.data?.data || []);
      if (resM.ok) setMeta({ projects: resM.data?.projects || [], members: resM.data?.members || [] });
      if (resN.ok) {
        setNotifs(resN.data?.data || []);
        setUnread(resN.data?.unread || 0);
      }
      if (!resP.ok && !resT.ok) {
        setError(resP.error || resT.error || "No se pudo cargar la información de Ualdo Teams.");
      }
    } catch (err) {
      setError("Error conectando con Ualdo Teams.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleReadNotif = async (id) => {
    await markNotificationRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleLogout = () => {
    teamsLogout();
    if (onLogout) onLogout();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.project_id) {
      setFormError("El título y el proyecto son obligatorios.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = { title: form.title.trim(), project_id: Number(form.project_id), priority: form.priority };
    if (form.assigned_to_id) payload.assigned_to_id = Number(form.assigned_to_id);
    if (form.due_date) payload.due_date = form.due_date;
    const res = await createTask(payload);
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setForm({ title: "", project_id: "", assigned_to_id: "", due_date: "", priority: "medium" });
      loadAll();
    } else {
      setFormError(res.error || "No se pudo crear la tarea.");
    }
  };

  if (selectedTaskId) {
    return <TaskDetailView taskId={selectedTaskId} onBack={() => setSelectedTaskId(null)} />;
  }

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <div style={S.title}>Trabajo &amp; Tareas</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.iconBtn} onClick={loadAll} title="Recargar">
            <RefreshCw size={16} />
          </button>
          <button style={S.iconBtn} onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div style={S.tabs}>
        <button style={tab === "tareas" ? S.tabActive : S.tab} onClick={() => setTab("tareas")}>
          Tareas ({tasks.length})
        </button>
        <button style={tab === "avance" ? S.tabActive : S.tab} onClick={() => setTab("avance")}>
          Avance
        </button>
        <button style={tab === "notif" ? S.tabActive : S.tab} onClick={() => setTab("notif")}>
          Avisos {unread > 0 && <span style={S.badge}>{unread}</span>}
        </button>
      </div>

      {error && <div style={S.err}>{error}</div>}
      {loading && !progress && <div style={S.muted}>Cargando datos de Ualdo Teams...</div>}

      {/* ---- TAREAS ---- */}
      {tab === "tareas" && (
        <div>
          {!showForm && (
            <button style={S.newBtn} onClick={() => { setShowForm(true); setFormError(null); }}>
              <Plus size={16} /> Nueva tarea
            </button>
          )}

          {showForm && (
            <form onSubmit={handleCreate} style={S.formCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>Nueva tarea</span>
                <button type="button" style={S.iconBtn} onClick={() => setShowForm(false)}><X size={16} /></button>
              </div>
              {formError && <div style={S.err}>{formError}</div>}
              <input
                style={S.input}
                placeholder="Título de la tarea *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select style={S.input} value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">Proyecto *</option>
                {meta.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select style={S.input} value={form.assigned_to_id} onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}>
                <option value="">Responsable (opcional)</option>
                {meta.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" style={{ ...S.input, flex: 1 }} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                <select style={{ ...S.input, flex: 1 }} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Prioridad baja</option>
                  <option value="medium">Prioridad media</option>
                  <option value="high">Prioridad alta</option>
                </select>
              </div>
              <button type="submit" disabled={saving} style={{ ...S.primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? "Guardando..." : "Crear tarea"}
              </button>
            </form>
          )}

          {tasks.length === 0 && !loading && <div style={S.muted}>No hay tareas asignadas todavía.</div>}
          {tasks.map(t => (
            <div
              key={t.id}
              style={S.taskRow}
              onClick={() => setSelectedTaskId(t.id)}
            >
              <div style={{ marginTop: 2 }}>
                {t.status === "done" ? <CheckCircle2 size={18} color="#10b981" />
                  : t.status === "in_progress" ? <Clock size={18} color="#f59e0b" />
                  : <Circle size={18} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, textDecoration: t.status === "done" ? "line-through" : "none", opacity: t.status === "done" ? 0.6 : 1 }}>
                  {t.title}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3, flexWrap: "wrap" }}>
                  {t.project && <span style={{ ...S.chip, background: (t.project_color || "var(--primary)") + "22", color: t.project_color || "var(--accent)" }}>{t.project}</span>}
                  {t.assignee && <span style={S.muted}>{t.assignee}</span>}
                  {t.due_date && <span style={{ ...S.muted, color: t.overdue ? "#f43f5e" : undefined }}>
                    {t.overdue && <AlertTriangle size={11} style={{ verticalAlign: -1 }} />} {t.due_date}
                  </span>}
                </div>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" style={{ alignSelf: "center" }} />
            </div>
          ))}
        </div>
      )}

      {/* ---- AVANCE ---- */}
      {tab === "avance" && progress && (
        <div>
          <div style={S.statRow}>
            <Stat label="Total" value={progress.total} />
            <Stat label="Hechas" value={progress.by_status?.done ?? 0} color="#10b981" />
            <Stat label="En curso" value={progress.by_status?.in_progress ?? 0} color="#f59e0b" />
            <Stat label="Atrasadas" value={progress.overdue ?? 0} color="#f43f5e" />
          </div>
          <ProgressBar pct={progress.pct_done ?? 0} label={`${progress.pct_done ?? 0}% completado`} />

          <div style={S.sectionTitle}>Por proyecto</div>
          {(progress.by_project || []).map((p, i) => (
            <div key={i} style={S.projRow}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  <span style={{ ...S.dot, background: p.color || "var(--accent)" }} /> {p.project}
                </span>
                <span style={S.muted}>{p.done}/{p.total}</span>
              </div>
              <ProgressBar pct={p.pct} color={p.color} small />
            </div>
          ))}

          {(progress.by_person || []).length > 0 && <div style={S.sectionTitle}>Por persona</div>}
          {(progress.by_person || []).map((p, i) => (
            <div key={i} style={S.personRow}>
              <span style={{ fontSize: 13 }}>{p.person}</span>
              <span style={S.muted}>{p.pending} pendientes • {p.done} hechas</span>
            </div>
          ))}
        </div>
      )}

      {/* ---- NOTIFICACIONES ---- */}
      {tab === "notif" && (
        <div>
          {notifs.length === 0 && !loading && <div style={S.muted}>Sin avisos.</div>}
          {notifs.map(n => (
            <div key={n.id} style={{ ...S.notifRow, opacity: n.read ? 0.55 : 1 }} onClick={() => !n.read && handleReadNotif(n.id)}>
              <Bell size={16} color={n.read ? "#94a3b8" : "var(--accent)"} style={{ marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{n.data?.message || n.data?.title || n.type}</div>
                <div style={S.muted}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              {!n.read && <span style={{ ...S.dot, background: "var(--accent)", marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={S.stat}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "var(--text-main)" }}>{value}</div>
      <div style={S.muted}>{label}</div>
    </div>
  );
}

function ProgressBar({ pct, color = "var(--primary-2)", label, small }) {
  return (
    <div style={{ margin: small ? "2px 0" : "10px 0" }}>
      <div style={{ height: small ? 6 : 10, background: "rgba(98, 201, 200, 0.15)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", background: color, borderRadius: 999, transition: "width .3s" }} />
      </div>
      {label && <div style={{ ...S.muted, marginTop: 4 }}>{label}</div>}
    </div>
  );
}

const S = {
  wrap: { padding: 16, maxWidth: 640, margin: "0 auto" },
  muted: { color: "var(--text-muted)", fontSize: 12 },
  err: { background: "rgba(244,63,94,0.12)", color: "var(--error)", padding: "8px 10px", borderRadius: 8, fontSize: 12, margin: "8px 0" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700 },
  iconBtn: { padding: 8, borderRadius: 8, border: "1px solid var(--border-glass)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" },
  tabs: { display: "flex", gap: 6, marginBottom: 14 },
  tab: { flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "rgba(98,201,200,0.08)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" },
  tabActive: { flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  badge: { background: "var(--error)", color: "#fff", borderRadius: 999, fontSize: 10, padding: "1px 6px", marginLeft: 4 },
  statRow: { display: "flex", gap: 8, marginBottom: 8 },
  stat: { flex: 1, background: "var(--bg-card)", borderRadius: 10, padding: "10px 6px", textAlign: "center", border: "1px solid var(--border-glass)" },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", margin: "16px 0 8px", letterSpacing: 0.5 },
  projRow: { background: "var(--bg-card)", borderRadius: 10, padding: 12, marginBottom: 8, border: "1px solid var(--border-glass)" },
  personRow: { display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-card)", borderRadius: 8, marginBottom: 6, border: "1px solid var(--border-glass)" },
  taskRow: { display: "flex", gap: 10, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 10, marginBottom: 8, border: "1px solid var(--border-glass)", cursor: "pointer" },
  notifRow: { display: "flex", gap: 10, padding: "10px 12px", background: "var(--bg-card)", borderRadius: 10, marginBottom: 8, cursor: "pointer", border: "1px solid var(--border-glass)" },
  chip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, fontWeight: 600 },
  dot: { display: "inline-block", width: 8, height: 8, borderRadius: 999, marginRight: 4 },
  newBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed var(--border-glass)", background: "rgba(98,201,200,0.08)", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12 },
  formCard: { display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-card)", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid var(--border-glass)" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.03)", color: "var(--text-main)", fontSize: 13, boxSizing: "border-box" },
  primaryBtn: { width: "100%", padding: "11px", borderRadius: 8, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 2 },
};