import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import EcosystemView from './EcosystemView';
import TrabajoView from './TrabajoView';
import { isTeamsAuthenticated } from '../services/teamsClient';

export default function MasView({
  registeredApps,
  onUpdateApps,
  subView,
  onSubViewChange,
  negociosParams,
  onParamsConsumed,
  onSendChatPrompt,
}) {
  const [openTeams, setOpenTeams] = useState(false);
  const navigation = negociosParams?.nav;

  useEffect(() => {
    if (navigation !== undefined) setOpenTeams(false);
  }, [navigation]);

  if (openTeams) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setOpenTeams(false)}
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
          <span>Volver a Más</span>
        </button>
        <TrabajoView />
      </div>
    );
  }

  return (
    <EcosystemView
      registeredApps={registeredApps}
      onUpdateApps={onUpdateApps}
      subView={subView}
      onSubViewChange={onSubViewChange}
      negociosParams={negociosParams}
      onParamsConsumed={onParamsConsumed}
      onSendChatPrompt={onSendChatPrompt}
      teamsAvailable={isTeamsAuthenticated()}
      onOpenTeams={() => setOpenTeams(true)}
    />
  );
}
