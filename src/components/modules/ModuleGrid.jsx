import React, { useState, useEffect } from 'react';
import ModuleCard from './ModuleCard';
import { getVisibleModules } from './moduleRegistry';
import { can, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';

/**
 * Cuadrícula de módulos de Ualdo Negocios filtrada según los permisos del usuario.
 */
export default function ModuleGrid({ user, onSelectModule, badges = {} }) {
  const visibleModules = getVisibleModules(user);
  const [openWithdrawalsCount, setOpenWithdrawalsCount] = useState(badges.withdrawals || 0);

  useEffect(() => {
    if (badges.withdrawals !== undefined) {
      setOpenWithdrawalsCount(badges.withdrawals);
      return;
    }
    if (!can(user, ABILITIES.WITHDRAWALS_DECLARE)) return;

    let mounted = true;
    listWithdrawals({ status: 'open' })
      .then((res) => {
        if (!mounted || !res.ok) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const myOpen = list.filter(
          (w) => Number(w.user_id || w.user?.id) === Number(user?.id)
        );
        setOpenWithdrawalsCount(myOpen.length);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [user, badges.withdrawals]);

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
      {visibleModules.map((module) => {
        let badgeValue = null;
        if (module.id === 'withdrawals') {
          badgeValue = openWithdrawalsCount;
        }
        const moduleWithBadge = badgeValue ? { ...module, badge: badgeValue } : module;

        return (
          <ModuleCard
            key={module.id}
            module={moduleWithBadge}
            onClick={() => onSelectModule(module.subView)}
          />
        );
      })}
    </div>
  );
}
