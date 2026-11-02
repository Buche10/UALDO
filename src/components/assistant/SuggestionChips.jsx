import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  ClipboardList,
  CheckCircle2,
  ShoppingCart,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  Calculator,
  Tags,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { can, canAny, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';
import { countMyPendingWithdrawals } from '../withdrawals/withdrawalHelpers';
import { useLotItems } from '../../hooks/useLotItems';

const PROBLEM_SUGGESTION = {
  label: 'Reportar un problema',
  prompt: 'Quiero reportar un problema',
  icon: AlertTriangle,
};

const ROLE_SUGGESTIONS = {
  kitchen: [
    { label: 'Voy a la bodega', prompt: 'Voy a retirar de la bodega', icon: ArrowDownRight },
    { label: 'Registrar porcionado', prompt: 'Quiero registrar el porcionado de hoy', icon: PackagePlus },
    PROBLEM_SUGGESTION,
  ],
  lounge: [
    { label: 'Reservas de hoy', prompt: '¿Qué reservas hay hoy?', icon: CalendarDays },
    PROBLEM_SUGGESTION,
  ],
  warehouse: [
    { label: 'Llegó una compra', prompt: 'Llegó una compra', icon: PackagePlus },
    { label: 'Contar el cierre del día', prompt: 'Quiero contar el cierre del día', icon: ClipboardList },
  ],
  admin: [
    { label: 'Pedidos por aprobar', prompt: '¿Hay pedidos pendientes por aprobar?', icon: CheckCircle2 },
    { label: 'Lista de compras', prompt: 'Muéstrame la lista de compras', icon: ShoppingCart },
    { label: 'Resumen del día', prompt: 'Dame el resumen del día', icon: ClipboardList },
    { label: 'Cargar una factura', prompt: 'Quiero cargar una factura', icon: FileText },
  ],
};

const roleGroup = (role, hasDecide) => {
  const value = String(role || '').toLowerCase();
  if (value.startsWith('kitchen') || value === 'cocina') return ROLE_SUGGESTIONS.kitchen;
  if (value.startsWith('lounge') || value === 'salon' || value === 'salón') return ROLE_SUGGESTIONS.lounge;
  if (['warehouse', 'warehouse_head', 'warehouse_staff', 'bodega', 'bodega_head', 'bodega_staff'].includes(value)) {
    return ROLE_SUGGESTIONS.warehouse;
  }
  if (['owner', 'admin', 'administracion', 'administración'].includes(value) || hasDecide) {
    return ROLE_SUGGESTIONS.admin;
  }
  return [];
};

const withUniqueLabels = (suggestions) => {
  const seen = new Set();
  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.label)) return false;
    seen.add(suggestion.label);
    return true;
  });
};

export default function SuggestionChips({
  user,
  onSelectChip,
  disabled = false,
  hasOpenWithdrawals: propHasOpen,
}) {
  const [internalHasOpen, setInternalHasOpen] = useState(false);
  const hasDecide = user ? can(user, ABILITIES.SUPPLY_DECIDE) : false;
  const canDeclareWithdrawal = user ? can(user, ABILITIES.WITHDRAWALS_DECLARE) : false;
  const canRegisterOvertime = user ? canAny(user, [ABILITIES.OVERTIME_REGISTER_KITCHEN, ABILITIES.OVERTIME_REGISTER_LOUNGE]) : false;
  const canDeclareCashClose = user ? can(user, ABILITIES.CASH_REGISTER) && !can(user, ABILITIES.CASH_REVIEW) : false;
  const canViewInventory = user ? can(user, ABILITIES.INVENTORY_VIEW) : false;
  const { hasLotItems } = useLotItems({ enabled: canViewInventory });
  const canSeeReservations = user ? can(user, ABILITIES.RESERVATIONS_VIEW) : false;
  const userId = user?.id;
  const role = user?.capabilities?.role || user?.role;

  useEffect(() => {
    if (propHasOpen !== undefined) return undefined;
    if (!canDeclareWithdrawal || !userId) return undefined;
    let mounted = true;
    listWithdrawals()
      .then((res) => {
        if (!mounted) return;
        const list = res.ok ? (res.data?.data || res.data || []) : [];
        setInternalHasOpen(countMyPendingWithdrawals(list, userId) > 0);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [canDeclareWithdrawal, userId, propHasOpen]);

  const hasOpenWithdrawals = propHasOpen !== undefined ? propHasOpen : internalHasOpen;
  const suggestions = [...roleGroup(role, hasDecide)];

  if (canDeclareWithdrawal) {
    suggestions.push({
      label: 'Voy a la bodega',
      prompt: 'Voy a retirar de la bodega',
      icon: ArrowDownRight,
    });
    if (hasOpenWithdrawals) {
      suggestions.push({ label: 'Cerrar mi retiro', prompt: 'Cerrar mi retiro', icon: CheckCircle2 });
    }
  }

  if (canRegisterOvertime) {
    suggestions.push({ label: 'Registrar horas extra', prompt: 'Quiero registrar horas extra', icon: Clock });
  }

  if (canDeclareCashClose) {
    suggestions.push({
      label: 'Hacer el cierre de caja',
      prompt: 'Quiero declarar el cierre de caja de hoy',
      icon: Calculator,
    });
  }

  if (hasLotItems) {
    suggestions.push({
      label: '¿Qué lote uso?',
      prompt: '¿Qué lote de carne tengo que usar primero?',
      icon: Tags,
    });
  }

  if (canSeeReservations) {
    suggestions.push({ label: 'Reservas de hoy', prompt: '¿Qué reservas hay hoy?', icon: CalendarDays });
  }

  suggestions.push(PROBLEM_SUGGESTION);

  const visibleSuggestions = withUniqueLabels(suggestions).slice(0, 5);

  return (
    <div className="assistant-chips-container" role="toolbar" aria-label="Sugerencias rápidas">
      {visibleSuggestions.map((sug) => {
        const Icon = sug.icon;
        return (
          <button
            key={sug.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelectChip?.(sug.prompt)}
            className="chip-btn"
          >
            <Icon size={16} aria-hidden="true" />
            <span>{sug.label}</span>
          </button>
        );
      })}
    </div>
  );
}
