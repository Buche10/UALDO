import React from 'react';
import { PackagePlus, ClipboardList, Search, CheckCircle2, ShoppingCart } from 'lucide-react';

const SUGGESTIONS_BY_ROLE = {
  staff: [
    { label: 'Reportar faltantes', prompt: 'Quiero reportar lo que falta en el local', icon: PackagePlus },
    { label: 'Mis pedidos', prompt: 'Muéstrame mis pedidos recientes', icon: ClipboardList },
    { label: 'Buscar un insumo', prompt: 'Buscar existencias de un insumo', icon: Search }
  ],
  owner: [
    { label: 'Pedidos por aprobar', prompt: '¿Hay pedidos pendientes por aprobar?', icon: CheckCircle2 },
    { label: 'Qué hay que comprar', prompt: '¿Qué hay que comprar?', icon: ShoppingCart },
    { label: 'Pedir insumos', prompt: 'Quiero pedir insumos para el restaurante', icon: PackagePlus }
  ]
};

const DEFAULT_SUGGESTIONS = [
  { label: 'Reportar faltantes', prompt: 'Quiero reportar lo que falta en el local', icon: PackagePlus },
  { label: 'Mis pedidos', prompt: 'Muéstrame mis pedidos recientes', icon: ClipboardList }
];

export default function SuggestionChips({ role, onSelectChip, disabled = false }) {
  const suggestions = SUGGESTIONS_BY_ROLE[role] || DEFAULT_SUGGESTIONS;

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
