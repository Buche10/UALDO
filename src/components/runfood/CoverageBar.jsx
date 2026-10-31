import React from 'react';
import { formatUsd } from '../../services/money';

/**
 * Barra de desglose porcentual de cobertura (Brief 24p-fix).
 */
export default function CoverageBar({
  label,
  pctRaw,
  amountFormatted,
  colorVar
}) {
  const pctNum = Number(pctRaw || 0);
  const clampedPct = Math.min(100, Math.max(0, pctNum));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: colorVar, fontWeight: 700 }}>
          {pctRaw}% ({formatUsd(amountFormatted)})
        </span>
      </div>
      <div
        style={{
          height: 8,
          width: '100%',
          borderRadius: 9999,
          background: 'var(--track-bg)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clampedPct}%`,
            borderRadius: 9999,
            background: colorVar
          }}
        />
      </div>
    </div>
  );
}
