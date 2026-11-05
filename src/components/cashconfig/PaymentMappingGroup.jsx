import React, { useId, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'ualdo:pagos:otras-abierto';

function leerAbierto() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function guardarAbierto(abierto) {
  try {
    window.localStorage.setItem(STORAGE_KEY, abierto ? '1' : '0');
  } catch {
    // Sin almacenamiento (modo privado o bloqueado): el grupo vuelve plegado.
  }
}

/**
 * Grupo plegable "Otras formas de RunFood" (Brief 43p). Empieza plegado y
 * recuerda en localStorage si el dueño lo dejó abierto.
 *
 * @param {{ title: string, description: string, children: React.ReactNode }} props
 */
export default function PaymentMappingGroup({ title, description, children }) {
  const [abierto, setAbierto] = useState(leerAbierto);
  const contenidoId = useId();

  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    guardarAbierto(siguiente);
  };

  const Icono = abierto ? ChevronDown : ChevronRight;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        aria-controls={contenidoId}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: 0, border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left' }}
      >
        <Icono size={16} aria-hidden="true" />
        {title}
      </button>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{description}</p>
      <div id={contenidoId} hidden={!abierto} style={{ display: abierto ? 'flex' : 'none', flexDirection: 'column', gap: '10px' }}>
        {abierto && children}
      </div>
    </section>
  );
}
