import React from 'react';
import { PackagePlus, ClipboardList, Search, CheckCircle2, ShoppingCart } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';

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

export default function SuggestionChips({ user, role, onSelectChip, disabled = false }) {
  const hasDecide = user
    ? can(user, ABILITIES.SUPPLY_DECIDE)
    : role === 'owner';

  const suggestions = hasDecide ? DECIDER_SUGGESTIONS : STAFF_SUGGESTIONS;

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
