import React from 'react';
import { Building2, ShieldAlert, ArrowLeft, MessageCircle } from 'lucide-react';
import DobleFiloCard from './DobleFiloCard';
import ModuleGrid from './modules/ModuleGrid';
import EcosystemModules from './ecosystem/EcosystemModules';
import TeamsAccessCard from './TeamsAccessCard';
import { getModuleBySubView } from './modules/moduleRegistry';
import { getUser } from '../services/auth';
import { canAny } from '../services/permissions';

export default function EcosystemView({
  subView = 'overview',
  onSubViewChange,
  negociosParams = null,
  onParamsConsumed,
  onSendChatPrompt,
  teamsAvailable = false,
  onOpenTeams,
}) {
  const currentSubTab = subView;
  const user = getUser();

  const handleSubTabChange = (newSubTab) => {
    if (typeof newSubTab === 'object' && newSubTab !== null) {
      if (newSubTab.subView && onSubViewChange) {
        onSubViewChange(newSubTab.subView, newSubTab.params);
      }
      return;
    }
    if (onSubViewChange) {
      onSubViewChange(newSubTab);
    }
  };

  const moduleDef = getModuleBySubView(currentSubTab);
  const isRestricted = Boolean(moduleDef && !canAny(user, moduleDef.permissions));

  let content;
  if (currentSubTab === 'overview') {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color="var(--accent)" aria-hidden="true" />
            <span>Más herramientas</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Todo esto también lo puedes pedir en el chat.
          </p>
          {onSendChatPrompt && (
            <button
              type="button"
              onClick={onSendChatPrompt}
              style={{
                marginTop: '8px',
                padding: '8px 14px',
                borderRadius: '9999px',
                border: '1px solid var(--border-glass)',
                background: 'var(--chip-bg)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <MessageCircle size={14} aria-hidden="true" />
              <span>Pedir en el chat</span>
            </button>
          )}
        </div>

        <DobleFiloCard onNavigateToInventory={() => handleSubTabChange('inventory')} />

        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>
            Módulos disponibles
          </h3>
          <ModuleGrid user={user} onSelectModule={handleSubTabChange} />
        </div>

        {teamsAvailable && <TeamsAccessCard onOpen={onOpenTeams} />}
      </div>
    );
  } else if (isRestricted) {
    content = (
      <div
        className="glass-card"
        style={{
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <ShieldAlert size={32} color="var(--warning)" aria-hidden="true" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>
          Acceso restringido
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Esta sección le corresponde a {moduleDef?.roleRequiredLabel || 'otro cargo'}.
        </p>
        <button
          type="button"
          onClick={() => handleSubTabChange('overview')}
          className="btn-secondary"
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            border: '1px solid var(--border-glass)',
            background: 'var(--chip-bg)',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          Volver a módulos
        </button>
      </div>
    );
  } else {
    content = (
      <EcosystemModules
        currentSubTab={currentSubTab}
        user={user}
        negociosParams={negociosParams}
        onParamsConsumed={onParamsConsumed}
        onNavigate={handleSubTabChange}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {currentSubTab !== 'overview' && !isRestricted && (
        <button
          type="button"
          onClick={() => handleSubTabChange('overview')}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Volver a módulos</span>
        </button>
      )}

      {content}
    </div>
  );
}
