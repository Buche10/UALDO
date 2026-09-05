import React from 'react';
import { MessageSquare, LayoutGrid, Network, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'chat', label: 'Chat IA', icon: MessageSquare },
    { id: 'ecosystem', label: 'Apps Locales', icon: LayoutGrid },
    { id: 'network', label: 'Nodos & Red', icon: Network },
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
