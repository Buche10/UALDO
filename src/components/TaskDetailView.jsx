import React, { useState, useEffect } from "react";
import {
 ArrowLeft,
 Star,
 Clock,
 CheckCircle2,
 Circle,
 AlertTriangle,
 Send,
 UserCheck,
 ShieldAlert,
 PhoneCall,
 FileText,
 Activity
} from "lucide-react";
import { getTaskLog, addTaskNote, addTaskHandoff } from "../services/teamsClient";

export default function TaskDetailView({ taskId, onBack }) {
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [task, setTask] = useState(null);
 const [pinnedNotes, setPinnedNotes] = useState([]);
 const [timeline, setTimeline] = useState([]);
 const [activeForm, setActiveForm] = useState("note"); // "note" | "handoff"

 // Note form state
 const [noteContent, setNoteContent] = useState("");
 const [noteIsKey, setNoteIsKey] = useState(false);

 // Handoff form state
 const [handoffDone, setHandoffDone] = useState("");
 const [handoffPending, setHandoffPending] = useState("");
 const [handoffAvoid, setHandoffAvoid] = useState("");
 const [handoffContact, setHandoffContact] = useState("");

 const [submitting, setSubmitting] = useState(false);

 const loadData = async () => {
 setLoading(true);
 setError(null);
 const res = await getTaskLog(taskId);
 setLoading(false);
 if (!res.ok) {
 setError(res.error || "No se pudo cargar la bitácora de la tarea.");
 return;
 }
 setTask(res.data.task);
 setPinnedNotes(res.data.pinned_notes || []);
 setTimeline(res.data.timeline || []);
 };

 useEffect(() => {
 if (taskId) {
 loadData();
 }
 }, [taskId]);

 const handleSaveNote = async (e) => {
 e.preventDefault();
 if (!noteContent.trim()) return;
 setSubmitting(true);
 const res = await addTaskNote(taskId, {
 content: noteContent.trim(),
 isKey: noteIsKey,
 });
 setSubmitting(false);
 if (!res.ok) {
 alert(res.error || "Error al guardar la nota.");
 return;
 }
 setNoteContent("");
 setNoteIsKey(false);
 loadData();
 };

 const handleSaveHandoff = async (e) => {
 e.preventDefault();
 if (!handoffDone.trim() || !handoffPending.trim()) {
 alert("Por favor completa al menos 'Qué se hizo' y 'Qué falta por hacer'.");
 return;
 }
 setSubmitting(true);
 const res = await addTaskHandoff(taskId, {
 done: handoffDone.trim(),
 pending: handoffPending.trim(),
 avoid: handoffAvoid.trim(),
 contact: handoffContact.trim(),
 });
 setSubmitting(false);
 if (!res.ok) {
 alert(res.error || "Error al registrar el traspaso.");
 return;
 }
 setHandoffDone("");
 setHandoffPending("");
 setHandoffAvoid("");
 setHandoffContact("");
 loadData();
 };

 if (loading && !task) {
 return (
 <div style={S.wrap}>
 <button style={S.backBtn} onClick={onBack}>
 <ArrowLeft size={16} /> Volver
 </button>
 <div style={S.muted}>Cargando bitácora de la tarea #{taskId}...</div>
 </div>
 );
 }

 if (error && !task) {
 return (
 <div style={S.wrap}>
 <button style={S.backBtn} onClick={onBack}>
 <ArrowLeft size={16} /> Volver
 </button>
 <div style={S.err}>{error}</div>
 </div>
 );
 }

 return (
 <div style={S.wrap}>
 {/* Botón de regreso */}
 <button style={S.backBtn} onClick={onBack}>
 <ArrowLeft size={16} /> Volver a Tareas
 </button>

 {/* Cabecera de la Tarea */}
 {task && (
 <div style={S.headerCard}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
 <h2 style={S.taskTitle}>{task.title}</h2>
 <span style={{
 ...S.statusChip,
 background: task.status === "done" ? "rgba(16,185,129,0.15)" : task.status === "in_progress" ? "rgba(245,158,11,0.15)" : "rgba(148,163,184,0.15)",
 color: task.status === "done" ? "#10b981" : task.status === "in_progress" ? "#f59e0b" : "#94a3b8"
 }}>
 {task.status === "done" ? "Hecho" : task.status === "in_progress" ? "En progreso" : "Por hacer"}
 </span>
 </div>

 <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
 {task.project && (
 <span style={{ ...S.chip, background: (task.project_color || "var(--primary)") + "22", color: task.project_color || "var(--accent)" }}>
 {task.project}
 </span>
 )}
 {task.assignee && (
 <span style={S.muted}>
 <UserCheck size={12} style={{ verticalAlign: -1, marginRight: 2 }} /> {task.assignee}
 </span>
 )}
 {task.due_date && (
 <span style={{ ...S.muted, color: task.overdue ? "#f43f5e" : undefined }}>
 <Clock size={12} style={{ verticalAlign: -1, marginRight: 2 }} /> {task.due_date}
 </span>
 )}
 </div>
 </div>
 )}

 {/* Secciones fijas: NOTAS CLAVE */}
 {pinnedNotes.length > 0 && (
 <div style={S.pinnedSection}>
 <div style={S.sectionTitle}>
 <Star size={14} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 4 }} />
 Notas clave fijadas
 </div>
 {pinnedNotes.map((pn) => (
 <div key={pn.id} style={S.pinnedCard}>
 <div style={S.noteMeta}>
 <strong>{pn.author}</strong>
 <span>{new Date(pn.created_at).toLocaleString()}</span>
 </div>
 <div style={S.noteText}>{pn.content}</div>
 </div>
 ))}
 </div>
 )}

 {/* LÍNEA DE TIEMPO UNIFICADA */}
 <div style={S.sectionTitle}>
 <Activity size={14} style={{ marginRight: 4 }} /> Bitácora &amp; Historial
 </div>

 <div style={{ marginBottom: 20 }}>
 {timeline.length === 0 && <div style={S.muted}>Sin anotaciones en la bitácora todavía.</div>}

 {timeline.map((item, idx) => (
 <div key={item.type + "-" + item.id + "-" + idx} style={S.timelineItem}>
 <div style={S.timelineIcon}>
 {item.type === "activity" ? (
 <Clock size={15} color="#94a3b8" />
 ) : item.kind === "handoff" ? (
 <FileText size={15} color="#6366f1" />
 ) : item.is_key ? (
 <Star size={15} color="#f59e0b" fill="#f59e0b" />
 ) : (
 <FileText size={15} color="var(--accent)" />
 )}
 </div>

 <div style={S.timelineContent}>
 <div style={S.timelineHeader}>
 <span style={{ fontWeight: 600, fontSize: 13 }}>{item.author}</span>
 <span style={S.mutedDate}>{new Date(item.created_at || item.timestamp).toLocaleString()}</span>
 </div>

 {item.type === "activity" ? (
 <div style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
 {item.description}
 </div>
 ) : item.kind === "handoff" ? (
 <div style={S.handoffBox}>
 <div style={S.handoffBadge}> Traspaso de turno</div>
 {item.meta?.done && (
 <div style={S.handoffField}>
 <span style={{ color: "#10b981", fontWeight: 600 }}> Qué se hizo:</span> {item.meta.done}
 </div>
 )}
 {item.meta?.pending && (
 <div style={S.handoffField}>
 <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Qué falta:</span> {item.meta.pending}
 </div>
 )}
 {item.meta?.avoid && (
 <div style={S.handoffField}>
 <span style={{ color: "#f43f5e", fontWeight: 600 }}> Qué NO hacer:</span> {item.meta.avoid}
 </div>
 )}
 {item.meta?.contact && (
 <div style={S.handoffField}>
 <span style={{ color: "#6366f1", fontWeight: 600 }}> Contacto:</span> {item.meta.contact}
 </div>
 )}
 </div>
 ) : (
 <div style={{ fontSize: 13, whiteSpace: "pre-wrap", marginTop: 2 }}>
 {item.is_key && <span style={{ color: "#f59e0b", marginRight: 4 }}></span>}
 {item.content}
 </div>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* FORMULARIO DE REGISTRO EN BITÁCORA */}
 <div style={S.actionCard}>
 <div style={S.formTabs}>
 <button
 style={activeForm === "note" ? S.formTabActive : S.formTab}
 onClick={() => setActiveForm("note")}
 >
 Nota libre
 </button>
 <button
 style={activeForm === "handoff" ? S.formTabActive : S.formTab}
 onClick={() => setActiveForm("handoff")}
 >
 Traspaso guiado
 </button>
 </div>

 {activeForm === "note" && (
 <form onSubmit={handleSaveNote}>
 <textarea
 style={S.textarea}
 placeholder="Escribe un avance, novedad o detalle relevante de la tarea..."
 value={noteContent}
 onChange={(e) => setNoteContent(e.target.value)}
 rows={3}
 required
 />
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
 <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "var(--text-main)" }}>
 <input
 type="checkbox"
 checked={noteIsKey}
 onChange={(e) => setNoteIsKey(e.target.checked)}
 />
 Marcar como nota clave
 </label>

 <button style={S.btnSubmit} disabled={submitting}>
 <Send size={14} style={{ marginRight: 4 }} /> {submitting ? "Guardando..." : "Anotar"}
 </button>
 </div>
 </form>
 )}

 {activeForm === "handoff" && (
 <form onSubmit={handleSaveHandoff} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 <div>
 <label style={S.fieldLabel}> ¿Qué se logró / avanzó?</label>
 <textarea
 style={S.textarea}
 placeholder="Detalla lo que dejaste completo..."
 value={handoffDone}
 onChange={(e) => setHandoffDone(e.target.value)}
 rows={2}
 required
 />
 </div>

 <div>
 <label style={S.fieldLabel}>⏳ ¿Qué pendiente queda para el siguiente?</label>
 <textarea
 style={S.textarea}
 placeholder="Paso siguiente o tarea pendiente..."
 value={handoffPending}
 onChange={(e) => setHandoffPending(e.target.value)}
 rows={2}
 required
 />
 </div>

 <div>
 <label style={S.fieldLabel}> ¿Qué NO hacer / Advertencias clave?</label>
 <input
 type="text"
 style={S.input}
 placeholder="Ej: No reiniciar el servicio sin avisar al cliente..."
 value={handoffAvoid}
 onChange={(e) => setHandoffAvoid(e.target.value)}
 />
 </div>

 <div>
 <label style={S.fieldLabel}> Persona de contacto / Responsable del relevo</label>
 <input
 type="text"
 style={S.input}
 placeholder="Nombre o teléfono del encargado..."
 value={handoffContact}
 onChange={(e) => setHandoffContact(e.target.value)}
 />
 </div>

 <button style={S.btnSubmitFull} disabled={submitting}>
 Registrar Traspaso de Turno
 </button>
 </form>
 )}
 </div>
 </div>
 );
}

const S = {
 wrap: { padding: 16, maxWidth: 640, margin: "0 auto", color: "var(--text-main)" },
 backBtn: { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: 0 },
 headerCard: { background: "var(--bg-card)", borderRadius: 12, padding: 16, border: "1px solid var(--border-glass)", marginBottom: 16 },
 taskTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
 statusChip: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 },
 chip: { fontSize: 11, padding: "1px 7px", borderRadius: 999, fontWeight: 600 },
 muted: { color: "var(--text-muted)", fontSize: 12 },
 mutedDate: { color: "var(--text-muted)", fontSize: 11 },
 err: { background: "rgba(244,63,94,0.12)", color: "var(--error)", padding: "10px", borderRadius: 8, fontSize: 13, margin: "12px 0" },
 sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", margin: "16px 0 8px", letterSpacing: 0.5, display: "flex", alignItems: "center" },
 pinnedSection: { marginBottom: 16 },
 pinnedCard: { background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 10, padding: 12, marginBottom: 8 },
 noteMeta: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 },
 noteText: { fontSize: 13, fontWeight: 500 },
 timelineItem: { display: "flex", gap: 10, marginBottom: 12 },
 timelineIcon: { width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
 timelineContent: { flex: 1, background: "var(--bg-card)", borderRadius: 10, padding: "10px 12px", border: "1px solid var(--border-glass)" },
 timelineHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
 handoffBox: { background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 8, padding: 10, marginTop: 4 },
 handoffBadge: { fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6 },
 handoffField: { fontSize: 12, marginBottom: 4, lineHeight: 1.4 },
 actionCard: { background: "var(--bg-card)", borderRadius: 12, padding: 16, border: "1px solid var(--border-glass)", marginTop: 20 },
 formTabs: { display: "flex", gap: 8, marginBottom: 12 },
 formTab: { flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" },
 formTabActive: { flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
 textarea: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.04)", color: "var(--text-main)", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" },
 input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.04)", color: "var(--text-main)", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" },
 fieldLabel: { fontSize: 12, fontWeight: 600, color: "var(--text-main)", marginBottom: 3, display: "block" },
 btnSubmit: { padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center" },
 btnSubmitFull: { width: "100%", padding: "11px", marginTop: 8, borderRadius: 8, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};