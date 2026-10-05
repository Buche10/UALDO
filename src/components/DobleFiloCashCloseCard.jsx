import React, { useState } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertCircle, DollarSign, CreditCard, Building2, Wallet, Users, Wrench, ShieldCheck, Copy, Check, UploadCloud, RefreshCw } from 'lucide-react';
import { syncCashCloseToGoogleSheets } from '../services/doblefiloEngine';

export default function DobleFiloCashCloseCard({ closeDetails }) {
 const [copied, setCopied] = useState(false);
 const [syncState, setSyncState] = useState(closeDetails?.googleSheetsSync || { synced: false, message: 'No sincronizado' });
 const [isSyncing, setIsSyncing] = useState(false);

 if (!closeDetails) return null;

 const {
 idCierre = 'CR-000000',
 fecha = new Date().toLocaleDateString('es-EC'),
 fechaHora = new Date().toLocaleString('es-EC'),
 efectivo = 0,
 pichincha = 0,
 deUna = 0,
 internacional = 0,
 totalTransferencias = 0,
 tarjeta = 0,
 tarjetaSinComision = 0,
 tarjetaDiners = 0,
 tarjetaDinersSinComision = 0,
 totalTarjetasNeto = 0,
 propinas = 0,
 gastos = [],
 consumosPersonal = [],
 totalGastosYConsumos = 0,
 ventasDelDia = 0,
 totalNetoAcreditado = 0,
 efectivoEsperadoEnCaja = 0,
 diferenciaEfectivo = 0,
 estadoCuadre = 'Cuadrado',
 observacion = ''
 } = closeDetails;

 const isPositive = diferenciaEfectivo >= 0;

 const formatCurrency = (val) => `$${(parseFloat(val) || 0).toFixed(2)}`;

 const handleCopySummary = () => {
 const text = ` CIERRE DE CAJA DOBLEFILO - ${fecha}
----------------------------------
 Efectivo: ${formatCurrency(efectivo)}
 Pichincha: ${formatCurrency(pichincha)}
 De Una: ${formatCurrency(deUna)}
 Internacional: ${formatCurrency(internacional)}
 Total Transferencias: ${formatCurrency(totalTransferencias)}

 Tarjeta General: ${formatCurrency(tarjeta)} (Sin com: ${formatCurrency(tarjetaSinComision)})
 Tarjeta Diners: ${formatCurrency(tarjetaDiners)} (Sin com: ${formatCurrency(tarjetaDinersSinComision)})
 Total Tarjetas Neto: ${formatCurrency(totalTarjetasNeto)}

 Propinas: ${formatCurrency(propinas)}
 Gastos & Consumos: ${formatCurrency(totalGastosYConsumos)}
----------------------------------
 Ventas Totales: ${formatCurrency(ventasDelDia)}
 Balance Efectivo: ${isPositive ? '+' : ''}${formatCurrency(diferenciaEfectivo)} (${estadoCuadre})`;

 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 const handleManualSync = async () => {
 setIsSyncing(true);
 const res = await syncCashCloseToGoogleSheets(closeDetails);
 setSyncState(res);
 setIsSyncing(false);
 };

 return (
 <div className="cash-close-card" style={{
 background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95), rgba(30, 38, 54, 0.95))',
 border: '1px solid rgba(0, 240, 255, 0.25)',
 borderRadius: '16px',
 padding: '16px',
 marginTop: '12px',
 color: 'var(--text-main)',
 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
 fontFamily: 'Inter, system-ui, sans-serif'
 }}>
 {/* Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <FileSpreadsheet color="var(--primary)" size={20} />
 <div>
 <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Cierre Oficial DOBLEFILO</div>
 <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fecha} • {idCierre}</div>
 </div>
 </div>

 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <div style={{
 padding: '4px 10px',
 borderRadius: '20px',
 fontSize: '11px',
 fontWeight: 700,
 background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
 color: isPositive ? '#10b981' : '#ef4444',
 border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
 display: 'flex',
 alignItems: 'center',
 gap: '4px'
 }}>
 {isPositive ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
 {estadoCuadre}
 </div>
 </div>
 </div>

 {/* Google Sheets Sync Banner */}
 <div style={{
 background: syncState.synced ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
 border: `1px solid ${syncState.synced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
 borderRadius: '10px',
 padding: '8px 12px',
 marginBottom: '14px',
 display: 'flex',
 alignItems: 'center',
 justify: 'space-between',
 fontSize: '11px'
 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: syncState.synced ? '#10b981' : '#f59e0b' }}>
 <UploadCloud size={14} />
 <span>{syncState.message || (syncState.synced ? 'Enviado a Google Sheets' : 'Pendiente de sincronizar')}</span>
 </div>

 <button
 onClick={handleManualSync}
 disabled={isSyncing}
 style={{
 background: 'none',
 border: 'none',
 color: 'var(--primary)',
 fontWeight: 700,
 fontSize: '11px',
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '4px'
 }}
 >
 <RefreshCw size={12} className={isSyncing ? 'spin' : ''} />
 {isSyncing ? 'Subiendo...' : 'Sincronizar'}
 </button>
 </div>

 {/* Primary KPI Grid */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
 <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
 <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}> Ventas del Día</div>
 <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)' }}>{formatCurrency(ventasDelDia)}</div>
 </div>
 <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
 <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '2px' }}> Efectivo Físico</div>
 <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>{formatCurrency(efectivo)}</div>
 </div>
 </div>

 {/* Detailed Breakdown Table */}
 <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', padding: '12px', marginBottom: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
 <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
 <Wallet size={14} /> Desglose por Formas de Pago
 </div>

 <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse' }}>
 <tbody>
 {/* Transferencias */}
 <tr style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.06)' }}>
 <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}> Banco Pichincha</td>
 <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(pichincha)}</td>
 </tr>
 <tr style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.06)' }}>
 <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}> De Una</td>
 <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(deUna)}</td>
 </tr>
 {internacional > 0 && (
 <tr style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.06)' }}>
 <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}> Transf. Internacional</td>
 <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(internacional)}</td>
 </tr>
 )}
 <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 240, 255, 0.04)' }}>
 <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--primary)' }}> Total Transferencias</td>
 <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalTransferencias)}</td>
 </tr>

 {/* Tarjetas */}
 <tr style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.06)' }}>
 <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}> Tarjetas General (Bruto / s.Comision)</td>
 <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(tarjeta)} <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>({formatCurrency(tarjetaSinComision)})</span></td>
 </tr>
 {tarjetaDiners > 0 && (
 <tr style={{ borderBottom: '1px dashed rgba(255, 255, 255, 0.06)' }}>
 <td style={{ padding: '4px 0', color: 'var(--text-muted)' }}> Tarjeta Diners (Bruto / s.Comision)</td>
 <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(tarjetaDiners)} <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>({formatCurrency(tarjetaDinersSinComision)})</span></td>
 </tr>
 )}
 <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 240, 255, 0.04)' }}>
 <td style={{ padding: '6px 4px', fontWeight: 700, color: 'var(--primary)' }}> Total Tarjetas (Neto s/Com)</td>
 <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(totalTarjetasNeto)}</td>
 </tr>

 {/* Propinas */}
 <tr>
 <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}> Propinas del Día</td>
 <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>{formatCurrency(propinas)}</td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Gastos & Consumos Section */}
 {(gastos.length > 0 || consumosPersonal.length > 0) && (
 <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', padding: '12px', marginBottom: '14px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
 <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
 <Wrench size={14} /> Gastos Diarios y Vales de Personal ({formatCurrency(totalGastosYConsumos)})
 </div>

 {consumosPersonal.length > 0 && (
 <div style={{ marginBottom: '8px' }}>
 <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '4px' }}> Consumos / Adelantos Personal:</div>
 {consumosPersonal.map((c, idx) => (
 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0', color: 'var(--text-muted)' }}>
 <span>• {c.nombre || 'Empleado'}</span>
 <span style={{ fontWeight: 600 }}>{formatCurrency(c.monto)}</span>
 </div>
 ))}
 </div>
 )}

 {gastos.length > 0 && (
 <div>
 <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-subtle)', marginBottom: '4px' }}> Gastos & Mantenimiento:</div>
 {gastos.map((g, idx) => (
 <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0', color: 'var(--text-muted)' }}>
 <span>• {g.descripcion || 'Gasto varias'} {g.proveedor ? `(${g.proveedor})` : ''}</span>
 <span style={{ fontWeight: 600 }}>{formatCurrency(g.monto)}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Observation */}
 {observacion && (
 <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontStyle: 'italic', marginBottom: '12px' }}>
 Nota: "{observacion}"
 </div>
 )}

 {/* Action Toolbar */}
 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
 <button
 onClick={handleCopySummary}
 style={{
 padding: '6px 12px',
 borderRadius: '8px',
 background: 'rgba(255, 255, 255, 0.06)',
 border: '1px solid var(--border-glass)',
 color: '#fff',
 fontSize: '11.5px',
 fontWeight: 600,
 cursor: 'pointer',
 display: 'flex',
 alignItems: 'center',
 gap: '6px'
 }}
 >
 {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
 {copied ? '¡Copiado!' : 'Copiar Resumen'}
 </button>
 </div>
 </div>
 );
}
