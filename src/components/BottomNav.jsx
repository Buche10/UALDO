import React from 'react';
import { LayoutGrid, Settings, Sparkles } from 'lucide-react';

const TABS = [
  { id: 'ualdo', label: 'Ualdo', icon: Sparkles },
  { id: 'mas', label: 'Más', icon: LayoutGrid },
  { id: 'settings', label: 'Ajustes', icon: Settings },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
