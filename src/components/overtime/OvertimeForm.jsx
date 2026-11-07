import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { can, ABILITIES, userArea } from '../../services/permissions';
import {
  createOvertime,
  voidOvertime,
  listOvertimeWorkers,
  getTodayDateString,
  getMinOvertimeDateString,
} from '../../services/overtimeClient';
import { generateClientUuid } from '../../hooks/useMovementSubmit';
import OvertimeConflictBanner from './OvertimeConflictBanner';
import VoidOvertimeModal from './VoidOvertimeModal';

export default function OvertimeForm({ user, onRegistered }) {
  const initialArea = userArea(user) || 'kitchen';
  const canChooseArea = can(user, ABILITIES.OVERTIME_REPORT) || !userArea(user);

  const [area, setArea] = useState(initialArea);
  const [workerMode, setWorkerMode] = useState('team');
  const [workers, setWorkers] = useState([]);
  const [workerUserId, setWorkerUserId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [workDate, setWorkDate] = useState(getTodayDateString());
  const [hours, setHours] = useState('1');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [conflictData, setConflictData] = useState(null);
  const [voidingConflict, setVoidingConflict] = useState(null);

  const clientUuidRef = useRef(generateClientUuid());
  const renewUuid = () => { clientUuidRef.current = generateClientUuid(); };

  const loadWorkers = useCallback(async (selectedArea) => {
    const res = await listOvertimeWorkers(selectedArea);
    if (res.ok && Array.isArray(res.data)) {
      setWorkers(res.data);
    }
  }, []);

  useEffect(() => {
    loadWorkers(area);
  }, [area, loadWorkers]);

  const isWorkerSelected = workerMode === 'team' ? Boolean(workerUserId) : workerName.trim().length >= 2;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!isWorkerSelected) return;
    setError(null);
    setSuccess(null);
    setConflictData(null);
    setSubmitting(true);

    const payload = {
      area,
      work_date: workDate,
      hours: Number(String(hours).replace(',', '.')),
      note: note.trim(),
    };
    if (workerMode === 'team') payload.worker_user_id = workerUserId;
    else payload.worker_name = workerName.trim();

    const res = await createOvertime(payload, clientUuidRef.current);
    setSubmitting(false);

    if (res.ok) {
      setSuccess('Quedó pendiente de aprobación del dueño.');
      setNote('');
      renewUuid();
      onRegistered?.(res.data);
    } else if (res.status === 409) {
      setConflictData(res.data?.data || res.data || {});
    } else {
      setError(res.error || 'No se pudo registrar las horas extra.');
    }
  };

  const handleConfirmVoid = async (reason) => {
    if (!voidingConflict?.id) return;
    setSubmitting(true);
    setError(null);

    const voidRes = await voidOvertime(voidingConflict.id, reason);
    if (!voidRes.ok) {
      setSubmitting(false);
      setError(voidRes.error || 'No se pudo anular el registro anterior.');
      return;
    }

    setVoidingConflict(null);
    setConflictData(null);

    const payload = {
      area,
      work_date: workDate,
      hours: Number(String(hours).replace(',', '.')),
      note: note.trim(),
    };
    if (workerMode === 'team') payload.worker_user_id = workerUserId;
    else payload.worker_name = workerName.trim();

    const res = await createOvertime(payload, clientUuidRef.current);
    setSubmitting(false);

    if (res.ok) {
      setSuccess('Registro anulado y nuevas horas guardadas correctamente. Quedó pendiente de aprobación del dueño.');
      setNote('');
      renewUuid();
      onRegistered?.(res.data);
    } else {
      setError('Se anuló el registro anterior, pero no se pudo guardar el nuevo. Vuelve a registrar las horas.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {conflictData && (
          <OvertimeConflictBanner conflictData={conflictData} onVoidAndRetry={(conf) => setVoidingConflict(conf)} onDismiss={() => setConflictData(null)} submitting={submitting} />
        )}
        {error && <div role="alert" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '13px' }}>{error}</div>}
        {success && <div role="status" style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--success-soft)', border: '1px solid var(--border-success)', color: 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> {success}</div>}

        {canChooseArea && (
          <div>
            <label htmlFor="overtime-area-select" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Área</label>
            <select id="overtime-area-select" value={area} onChange={(e) => { setArea(e.target.value); renewUuid(); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
              <option value="kitchen">Cocina</option>
              <option value="lounge">Salón</option>
            </select>
          </div>
        )}

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label htmlFor="overtime-worker-select" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trabajador</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => { setWorkerMode('team'); renewUuid(); }} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: 'none', background: workerMode === 'team' ? 'var(--primary)' : 'var(--chip-bg)', color: workerMode === 'team' ? 'var(--on-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Del equipo</button>
              <button type="button" onClick={() => { setWorkerMode('other'); renewUuid(); }} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', border: 'none', background: workerMode === 'other' ? 'var(--primary)' : 'var(--chip-bg)', color: workerMode === 'other' ? 'var(--on-primary)' : 'var(--text-muted)', cursor: 'pointer' }}>Otra persona</button>
            </div>
          </div>
          {workerMode === 'team' ? (
            <select id="overtime-worker-select" value={workerUserId} onChange={(e) => { setWorkerUserId(e.target.value); renewUuid(); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
              <option value="">Elige a la persona</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="Nombre completo (2 a 80 caracteres)" value={workerName} onChange={(e) => { setWorkerName(e.target.value); renewUuid(); }} maxLength={80} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
          )}
        </div>

        <div>
          <label htmlFor="overtime-date-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Fecha de trabajo</label>
          <input id="overtime-date-input" type="date" value={workDate} min={getMinOvertimeDateString()} max={getTodayDateString()} onChange={(e) => { setWorkDate(e.target.value); renewUuid(); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
        </div>

        <div>
          <label htmlFor="overtime-hours-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Horas trabajadas (pasos de 0,25)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {[1, 2, 3].map((val) => (
              <button key={val} type="button" onClick={() => setHours(String(val))} style={{ flex: 1, padding: '8px', borderRadius: '6px', background: String(hours) === String(val) ? 'var(--primary)' : 'var(--chip-bg)', border: '1px solid var(--border-glass)', color: String(hours) === String(val) ? 'var(--on-primary)' : 'var(--text-main)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>{val} h</button>
            ))}
          </div>
          <input id="overtime-hours-input" type="number" step="0.25" min="0.25" max="12" value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)' }} />
        </div>

        <div>
          <label htmlFor="overtime-note-input" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Observación (opcional)</label>
          <textarea id="overtime-note-input" rows={2} maxLength={300} placeholder="Motivo o detalle del turno extra..." value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', resize: 'none' }} />
        </div>

        <button type="submit" disabled={submitting || !isWorkerSelected} style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary)', border: '1px solid var(--border-glow)', color: 'var(--on-primary)', fontWeight: 600, cursor: (submitting || !isWorkerSelected) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} />
          {submitting ? 'Guardando...' : 'Registrar horas extra'}
        </button>
      </form>

      {voidingConflict && (
        <VoidOvertimeModal entry={voidingConflict} onConfirm={handleConfirmVoid} onCancel={() => setVoidingConflict(null)} submitting={submitting} />
      )}
    </>
  );
}
