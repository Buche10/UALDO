import React from 'react';
import { ListChecks, Store, Sparkles, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'trabajo', label: 'Trabajo', icon: ListChecks },
    { id: 'negocios', label: 'Negocios', icon: Store },
    { id: 'asistente', label: 'Asistente', icon: Sparkles },
    { id: 'settings', label: 'Ajustes', icon: Settings }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
