import React from 'react';
import { Search } from 'lucide-react';

export default function CountSheetSearchBar({ search, onSearchChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <label
        htmlFor="sheet-search-input"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        Buscar insumo
      </label>
      <Search
        size={16}
        color="var(--text-muted)"
        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
      />
      <input
        id="sheet-search-input"
        type="text"
        placeholder="Buscar insumo por nombre o código..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="glass-input"
        style={{
          width: '100%',
          padding: '10px 10px 10px 36px',
          borderRadius: '10px',
          border: '1px solid var(--border-glass)',
          background: 'var(--bg-dark)',
          color: 'var(--text-main)',
          fontSize: '13px',
        }}
      />
    </div>
  );
}
