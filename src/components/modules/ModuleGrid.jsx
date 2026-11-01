import React from 'react';
import ModuleCard from './ModuleCard';
import { getVisibleModules } from './moduleRegistry';

/**
 * Cuadrícula de módulos de Ualdo Negocios filtrada según los permisos del usuario.
 */
export default function ModuleGrid({ user, onSelectModule }) {
  const visibleModules = getVisibleModules(user);

  if (visibleModules.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        No tienes módulos disponibles para tu cargo actual.
      </div>
    );
  }

  return (
    <div
      className="modules-grid"
      role="region"
      aria-label="Módulos del negocio"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
      }}
    >
      {visibleModules.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          onClick={() => onSelectModule(module.subView)}
        />
      ))}
    </div>
  );
}
