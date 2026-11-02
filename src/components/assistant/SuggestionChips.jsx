import React, { useState, useEffect } from 'react';
import {
  PackagePlus,
  ClipboardList,
  Search,
  CheckCircle2,
  ShoppingCart,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  Calculator,
  Tags,
} from 'lucide-react';
import { can, canAny, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';
import { countMyPendingWithdrawals } from '../withdrawals/withdrawalHelpers';
import { useLotItems } from '../../hooks/useLotItems';

const DECIDER_SUGGESTIONS = [
  { label: 'Pedidos por aprobar', prompt: '¿Hay pedidos pendientes por aprobar?', icon: CheckCircle2 },
  { label: 'Qué hay que comprar', prompt: '¿Qué hay que comprar?', icon: ShoppingCart },
  { label: 'Pedir insumos', prompt: 'Quiero pedir insumos para el restaurante', icon: PackagePlus },
];

const STAFF_SUGGESTIONS = [
  { label: 'Reportar faltantes', prompt: 'Quiero reportar lo que falta en el local', icon: PackagePlus },
  { label: 'Mis pedidos', prompt: 'Muéstrame mis pedidos recientes', icon: ClipboardList },
  { label: 'Buscar un insumo', prompt: 'Buscar existencias de un insumo', icon: Search },
];

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
  const userId = user?.id;

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
  const baseSuggestions = hasDecide ? DECIDER_SUGGESTIONS : STAFF_SUGGESTIONS;
  const suggestions = [...baseSuggestions];

  if (canDeclareWithdrawal) {
    suggestions.push({
      label: 'Voy a la bodega',
      prompt: 'Voy a retirar de la bodega',
      icon: ArrowDownRight,
    });
    if (hasOpenWithdrawals) {
      suggestions.push({
        label: 'Cerrar mi retiro',
        prompt: 'Cerrar mi retiro',
        icon: CheckCircle2,
      });
    }
  }

  if (canRegisterOvertime) {
    suggestions.push({
      label: 'Registrar horas extra',
      prompt: 'Quiero registrar horas extra',
      icon: Clock,
    });
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

  suggestions.push({
    label: 'Reportar un problema',
    prompt: 'Quiero reportar un problema',
    icon: AlertTriangle,
  });

  return (
    <div className="assistant-chips-container" role="toolbar" aria-label="Sugerencias rápidas">
      {suggestions.map((sug) => {
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
