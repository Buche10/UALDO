import React, { useState, useEffect } from 'react';
import { PackagePlus, ClipboardList, Search, CheckCircle2, ShoppingCart, ArrowDownRight } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';

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

  useEffect(() => {
    if (propHasOpen !== undefined) return undefined;
    if (!canDeclareWithdrawal) return undefined;
    let mounted = true;
    listWithdrawals({ status: 'open' })
      .then((res) => {
        if (!mounted) return;
        const list = res.ok ? (res.data?.data || res.data || []) : [];
        if (Array.isArray(list) && list.length > 0) {
          setInternalHasOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [canDeclareWithdrawal, propHasOpen]);

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

  return (
    <div className="assistant-chips-container" role="toolbar" aria-label="Sugerencias rápidas">
      {suggestions.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            disabled={disabled}
            onClick={() => onSelectChip(item.prompt)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
