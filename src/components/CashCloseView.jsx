import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, RefreshCw, Save, Plus, Trash2, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { fetchCashCloseDay, saveCashClose } from "../services/cashCloseClient";
import DobleFiloCashCloseCard from "./DobleFiloCashCloseCard";

// Comisión fija de Diners (~6,39%): factor neto 0,9361. Editable en el formulario.
const DINERS_NET_FACTOR = 0.9361;

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

const n = (v) => (parseFloat(v) || 0);

export default function CashCloseView({ onBack }) {
  const [fecha, setFecha] = useState(yesterday());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [base, setBase] = useState(null);

  // Campos editables
  const [efectivoVentas, setEfectivoVentas] = useState("");
  const [pichincha, setPichincha] = useState("");
  const [deUna, setDeUna] = useState("");
  const [internacional, setInternacional] = useState("");
  const [tarjetaBrutoTotal, setTarjetaBrutoTotal] = useState("");
  const [dinersBruto, setDinersBruto] = useState("");
  const [tarjetaRegularNeto, setTarjetaRegularNeto] = useState("");
  const [dinersNeto, setDinersNeto] = useState("");
  const [propinas, setPropinas] = useState("");
  const [efectivoContado, setEfectivoContado] = useState("");
  const [observacion, setObservacion] = useState("");
  const [gastos, setGastos] = useState([]);
  const [consumos, setConsumos] = useState([]);

  const load = async () => {
    setLoading(true); setError(null); setMsg(null);
    const res = await fetchCashCloseDay(fecha);
    setLoading(false);
    if (!res.ok) { setError(res.error || "No se pudo cargar el día."); return; }
    const b = res.data.base;
    setBase(b);
    const saved = res.data.saved?.detalle;
    if (saved) {
      // Reabrir un cierre ya guardado.
      setEfectivoVentas(saved.efectivoVentas ?? "");
      setPichincha(saved.pichincha ?? ""); setDeUna(saved.deUna ?? ""); setInternacional(saved.internacional ?? "");
      setTarjetaBrutoTotal(saved.tarjetaBrutoTotal ?? "");
      setDinersBruto(saved.tarjetaDiners ?? ""); setDinersNeto(saved.tarjetaDinersSinComision ?? "");
      setTarjetaRegularNeto(saved.tarjetaSinComision ?? "");
      setPropinas(saved.propinas ?? "");
      setEfectivoContado(saved.efectivo ?? "");
      setObservacion(saved.observacion ?? "");
      setGastos(saved.gastos ?? []); setConsumos(saved.consumosPersonal ?? []);
      setMsg("Cierre guardado cargado. Puedes editarlo.");
    } else if (b) {
      // Prellenar con la base de RunFood.
      setEfectivoVentas(b.efectivo); setDeUna(b.transferencia); setPichincha(0); setInternacional(0);
      setTarjetaBrutoTotal(b.tarjeta); setDinersBruto(0); setDinersNeto(0);
      setTarjetaRegularNeto(""); setPropinas(b.propinas); setEfectivoContado("");
      setGastos([]); setConsumos([]);
      setMsg("Prellenado con datos de RunFood. Completa el banco y el efectivo contado.");
    } else {
      setMsg("Sin datos de RunFood para este día. Puedes ingresarlos a mano.");
      setEfectivoVentas(""); setDeUna(""); setPichincha(""); setInternacional("");
      setTarjetaBrutoTotal(""); setDinersBruto(""); setDinersNeto(""); setTarjetaRegularNeto("");
      setPropinas(""); setEfectivoContado(""); setGastos([]); setConsumos([]);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [fecha]);

  // Autocalcular neto de Diners cuando cambia el bruto.
  useEffect(() => {
    if (dinersBruto !== "" && (dinersNeto === "" || dinersNeto === 0)) {
      setDinersNeto((n(dinersBruto) * DINERS_NET_FACTOR).toFixed(2));
    }
    // eslint-disable-next-line
  }, [dinersBruto]);

  const c = useMemo(() => {
    const totalTransferencias = n(pichincha) + n(deUna) + n(internacional);
    const tarjetaRegularBruto = Math.max(0, n(tarjetaBrutoTotal) - n(dinersBruto));
    const totalTarjetasNeto = n(tarjetaRegularNeto) + n(dinersNeto);
    const totalGastos = gastos.reduce((s, g) => s + n(g.monto), 0);
    const totalConsumos = consumos.reduce((s, x) => s + n(x.monto), 0);
    const totalGastosYConsumos = totalGastos + totalConsumos;
    const efectivoEsperado = n(efectivoVentas) - totalGastosYConsumos;
    const diferencia = n(efectivoContado) - efectivoEsperado;
    const ventasDelDia = base?.ventas_total ?? (n(efectivoVentas) + totalTransferencias + n(tarjetaBrutoTotal));
    const estado = Math.abs(diferencia) < 0.005 ? "Cuadrado" : diferencia > 0 ? "Sobrante" : "Faltante";
    const transfObjetivo = base ? n(base.transferencia) : null;
    return {
      totalTransferencias, tarjetaRegularBruto, totalTarjetasNeto,
      totalGastosYConsumos, efectivoEsperado, diferencia, ventasDelDia, estado, transfObjetivo,
    };
  }, [pichincha, deUna, internacional, tarjetaBrutoTotal, dinersBruto, tarjetaRegularNeto, dinersNeto, efectivoVentas, efectivoContado, gastos, consumos, base]);

  const closeDetails = {
    idCierre: `CR-${fecha}`,
    fecha,
    fechaHora: new Date().toLocaleString("es-EC"),
    efectivoVentas: n(efectivoVentas),
    efectivo: n(efectivoContado),
    pichincha: n(pichincha), deUna: n(deUna), internacional: n(internacional),
    totalTransferencias: c.totalTransferencias,
    tarjetaBrutoTotal: n(tarjetaBrutoTotal),
    tarjeta: c.tarjetaRegularBruto, tarjetaSinComision: n(tarjetaRegularNeto),
    tarjetaDiners: n(dinersBruto), tarjetaDinersSinComision: n(dinersNeto),
    totalTarjetasNeto: c.totalTarjetasNeto,
    propinas: n(propinas),
    gastos, consumosPersonal: consumos, totalGastosYConsumos: c.totalGastosYConsumos,
    ventasDelDia: c.ventasDelDia,
    efectivoEsperadoEnCaja: c.efectivoEsperado,
    diferenciaEfectivo: c.diferencia,
    estadoCuadre: c.estado,
    observacion,
  };

  const handleSave = async () => {
    if (efectivoContado === "") { alert("Ingresa el efectivo contado en caja."); return; }
    setSaving(true);
    const res = await saveCashClose({
      fecha,
      detalle: closeDetails,
      ventas_dia: c.ventasDelDia,
      efectivo_esperado: c.efectivoEsperado,
      efectivo_contado: n(efectivoContado),
      observacion,
    });
    setSaving(false);
    if (!res.ok) { alert(res.error || "No se pudo guardar el cierre."); return; }
    setMsg(`Cierre guardado (${res.data.estado_cuadre}, diferencia $${Number(res.data.diferencia).toFixed(2)}).`);
  };

  const addRow = (setter, list, row) => setter([...list, row]);
  const setRow = (setter, list, i, key, val) => setter(list.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
  const delRow = (setter, list, i) => setter(list.filter((_, idx) => idx !== i));

  return (
    <div style={S.wrap}>
      <button style={S.backBtn} onClick={onBack}><ArrowLeft size={16} /> Volver</button>

      <div style={S.headRow}>
        <h2 style={S.title}>Cierre de Caja</h2>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Calendar size={15} color="var(--text-muted)" />
          <input type="date" value={fecha} max={yesterday()} onChange={(e) => setFecha(e.target.value)} style={S.dateInput} />
          <button style={S.iconBtn} onClick={load} title="Recargar"><RefreshCw size={15} className={loading ? "spin" : ""} /></button>
        </div>
      </div>

      {msg && <div style={S.info}>{msg}</div>}
      {error && <div style={S.err}>{error}</div>}
      {loading && <div style={S.muted}>Cargando…</div>}

      {/* Datos de RunFood */}
      <div style={S.card}>
        <div style={S.cardTitle}>Ventas del día (automático de RunFood)</div>
        {Field("Efectivo (ventas)", efectivoVentas, setEfectivoVentas)}
        {Field("Tarjeta total (bruto)", tarjetaBrutoTotal, setTarjetaBrutoTotal)}
        <div style={S.hint}>
          Transferencias en RunFood: <b>${c.transfObjetivo != null ? c.transfObjetivo.toFixed(2) : "—"}</b> — repártelas abajo.
          {c.transfObjetivo != null && Math.abs(c.totalTransferencias - c.transfObjetivo) > 0.005 &&
            <span style={{ color: "#f59e0b" }}> (asignado ${c.totalTransferencias.toFixed(2)})</span>}
        </div>
      </div>

      {/* Transferencias split */}
      <div style={S.card}>
        <div style={S.cardTitle}>Transferencias (banco)</div>
        {Field("Pichincha", pichincha, setPichincha)}
        {Field("De Una", deUna, setDeUna)}
        {Field("Internacional", internacional, setInternacional)}
        <div style={S.total}>Total transferencias: ${c.totalTransferencias.toFixed(2)}</div>
      </div>

      {/* Tarjetas */}
      <div style={S.card}>
        <div style={S.cardTitle}>Tarjetas</div>
        {Field("Diners (bruto)", dinersBruto, setDinersBruto)}
        {Field("Diners neto (auto 6,39%)", dinersNeto, setDinersNeto)}
        <div style={S.hint}>Tarjeta regular (bruto): <b>${c.tarjetaRegularBruto.toFixed(2)}</b></div>
        {Field("Tarjeta regular neto (del banco)", tarjetaRegularNeto, setTarjetaRegularNeto)}
        <div style={S.total}>Total tarjetas neto: ${c.totalTarjetasNeto.toFixed(2)}</div>
      </div>

      {/* Propinas */}
      <div style={S.card}>
        <div style={S.cardTitle}>Propinas</div>
        {Field("Propinas", propinas, setPropinas)}
      </div>

      {/* Gastos */}
      <div style={S.card}>
        <div style={S.cardTitleRow}>
          <span>Gastos del día</span>
          <button style={S.addBtn} onClick={() => addRow(setGastos, gastos, { descripcion: "", monto: "" })}><Plus size={13} /> Agregar</button>
        </div>
        {gastos.map((g, i) => (
          <div key={i} style={S.rowLine}>
            <input style={{ ...S.input, flex: 2 }} placeholder="Descripción" value={g.descripcion} onChange={(e) => setRow(setGastos, gastos, i, "descripcion", e.target.value)} />
            <input style={{ ...S.input, flex: 1 }} type="number" placeholder="$" value={g.monto} onChange={(e) => setRow(setGastos, gastos, i, "monto", e.target.value)} />
            <button style={S.delBtn} onClick={() => delRow(setGastos, gastos, i)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      {/* Consumos de personal */}
      <div style={S.card}>
        <div style={S.cardTitleRow}>
          <span>Consumos / adelantos de personal</span>
          <button style={S.addBtn} onClick={() => addRow(setConsumos, consumos, { nombre: "", monto: "" })}><Plus size={13} /> Agregar</button>
        </div>
        {consumos.map((x, i) => (
          <div key={i} style={S.rowLine}>
            <input style={{ ...S.input, flex: 2 }} placeholder="Empleado" value={x.nombre} onChange={(e) => setRow(setConsumos, consumos, i, "nombre", e.target.value)} />
            <input style={{ ...S.input, flex: 1 }} type="number" placeholder="$" value={x.monto} onChange={(e) => setRow(setConsumos, consumos, i, "monto", e.target.value)} />
            <button style={S.delBtn} onClick={() => delRow(setConsumos, consumos, i)}><Trash2 size={14} /></button>
          </div>
        ))}
        <div style={S.total}>Gastos + consumos: ${c.totalGastosYConsumos.toFixed(2)}</div>
      </div>

      {/* Cuadre */}
      <div style={{ ...S.card, borderColor: c.estado === "Cuadrado" ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)" }}>
        <div style={S.cardTitle}>Cuadre de efectivo</div>
        <div style={S.hint}>Efectivo esperado en caja: <b>${c.efectivoEsperado.toFixed(2)}</b> (ventas efectivo − gastos/consumos)</div>
        {Field("Efectivo contado (físico)", efectivoContado, setEfectivoContado)}
        <div style={{ ...S.diffBox, color: c.estado === "Cuadrado" ? "#10b981" : c.estado === "Sobrante" ? "#3b82f6" : "#f43f5e" }}>
          {c.estado === "Cuadrado" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {c.estado}: ${c.diferencia >= 0 ? "+" : ""}{c.diferencia.toFixed(2)}
        </div>
      </div>

      <textarea style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }} rows={2} placeholder="Observación (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} />

      <button style={S.saveBtn} onClick={handleSave} disabled={saving}>
        <Save size={16} /> {saving ? "Guardando…" : "Guardar cierre"}
      </button>

      {/* Vista previa de la tarjeta oficial */}
      <div style={{ marginTop: 18 }}>
        <div style={S.cardTitle}>Vista previa</div>
        <DobleFiloCashCloseCard closeDetails={closeDetails} />
      </div>
    </div>
  );
}

function Field(label, value, setter) {
  return (
    <div style={S.fieldRow}>
      <label style={S.fieldLabel}>{label}</label>
      <div style={S.moneyWrap}>
        <span style={S.currency}>$</span>
        <input type="number" step="0.01" style={S.moneyInput} value={value} onChange={(e) => setter(e.target.value)} placeholder="0.00" />
      </div>
    </div>
  );
}

const S = {
  wrap: { padding: 16, maxWidth: 640, margin: "0 auto", color: "var(--text-main)" },
  backBtn: { background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 10, padding: 0 },
  headRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  dateInput: { background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", color: "var(--text-main)", borderRadius: 8, padding: "6px 8px", fontSize: 13 },
  iconBtn: { padding: 7, borderRadius: 8, border: "1px solid var(--border-glass)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" },
  info: { background: "rgba(45,155,161,0.12)", color: "var(--accent)", padding: "8px 10px", borderRadius: 8, fontSize: 12, marginBottom: 10 },
  err: { background: "rgba(244,63,94,0.12)", color: "var(--error)", padding: "8px 10px", borderRadius: 8, fontSize: 12, marginBottom: 10 },
  muted: { color: "var(--text-muted)", fontSize: 12, marginBottom: 8 },
  card: { background: "var(--bg-card)", borderRadius: 12, padding: 14, border: "1px solid var(--border-glass)", marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5, marginBottom: 10 },
  cardTitleRow: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: 0.5, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" },
  fieldRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 },
  fieldLabel: { fontSize: 13, color: "var(--text-main)" },
  moneyWrap: { display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-glass)", borderRadius: 8, padding: "0 8px", width: 130 },
  currency: { color: "var(--text-muted)", fontSize: 13 },
  moneyInput: { background: "transparent", border: "none", color: "var(--text-main)", fontSize: 13, padding: "8px 4px", width: "100%", textAlign: "right", outline: "none" },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", fontSize: 13, fontFamily: "inherit" },
  hint: { fontSize: 12, color: "var(--text-muted)", margin: "6px 0" },
  total: { fontSize: 13, fontWeight: 700, color: "var(--accent)", marginTop: 8, textAlign: "right" },
  rowLine: { display: "flex", gap: 6, marginBottom: 6, alignItems: "center" },
  addBtn: { display: "flex", alignItems: "center", gap: 4, background: "rgba(45,155,161,0.15)", color: "var(--accent)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" },
  delBtn: { background: "none", border: "none", color: "#f43f5e", cursor: "pointer", padding: 4 },
  diffBox: { display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 800, marginTop: 10 },
  saveBtn: { width: "100%", padding: 13, borderRadius: 10, border: "none", background: "var(--grad-primary)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
};
