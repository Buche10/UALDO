import React, { useState, useEffect } from 'react';
import ModuleCard from './ModuleCard';
import { getVisibleModules } from './moduleRegistry';
import { can, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';
import { pendingOvertimeCount } from '../../services/overtimeClient';
import { useReservationsTodayCount } from '../../hooks/useReservations';
import { countMyPendingWithdrawals } from '../withdrawals/withdrawalHelpers';
import { useLotItems } from '../../hooks/useLotItems';

/**
 * Cuadrícula de módulos de Ualdo Negocios filtrada según los permisos del usuario.
 */
export default function ModuleGrid({ user, onSelectModule, badges = {} }) {
  const visibleModules = getVisibleModules(user);
  const [openWithdrawalsCount, setOpenWithdrawalsCount] = useState(badges.withdrawals || 0);
  const [pendingOvertime, setPendingOvertime] = useState(badges.overtime || 0);
  const hasLotModule = visibleModules.some((module) => module.requiresLotItems);
  const { hasLotItems, loading: lotsLoading } = useLotItems({ enabled: hasLotModule });
  const displayedModules = visibleModules.filter((module) => (
    !module.requiresLotItems || (!lotsLoading && hasLotItems)
  ));

  const userId = user?.id;
  const canDeclare = can(user, ABILITIES.WITHDRAWALS_DECLARE);
  const canSeeReservations = can(user, ABILITIES.RESERVATIONS_VIEW);
  const canApproveOvertime = can(user, ABILITIES.OVERTIME_APPROVE);
  const todayReservations = useReservationsTodayCount(canSeeReservations);

  useEffect(() => {
    if (badges.withdrawals !== undefined) {
      setOpenWithdrawalsCount(badges.withdrawals);
      return;
    }
    if (!canDeclare || !userId) return;

    let mounted = true;
    listWithdrawals()
      .then((res) => {
        if (!mounted || !res.ok) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setOpenWithdrawalsCount(countMyPendingWithdrawals(list, userId));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [userId, canDeclare, badges.withdrawals]);

  useEffect(() => {
    if (badges.overtime !== undefined) {
      setPendingOvertime(badges.overtime);
      return;
    }
    if (!canApproveOvertime) return;

    let mounted = true;
    pendingOvertimeCount()
      .then((res) => {
        if (!mounted || !res.ok) return;
        const count = res.data?.count ?? res.count ?? 0;
        setPendingOvertime(count);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [canApproveOvertime, badges.overtime]);

  if (displayedModules.length === 0) {
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
      {displayedModules.map((module) => {
        let badgeValue = null;
        if (module.id === 'withdrawals') {
          badgeValue = openWithdrawalsCount;
        } else if (module.id === 'reservations') {
          badgeValue = todayReservations;
        } else if (module.id === 'overtime') {
          badgeValue = pendingOvertime;
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
