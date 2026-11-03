import React from 'react';
import { Settings, User, LogOut, Building, ShieldCheck } from 'lucide-react';
import { getUser, logout, isAuthenticated } from '../services/auth';
import { can, ABILITIES } from '../services/permissions';
import TeamSection from './settings/TeamSection';
import DailyCloseSettingsForm from './inventory/dailyClose/DailyCloseSettingsForm';
import WithdrawalSettingsForm from './withdrawals/WithdrawalSettingsForm';
import PurchasingSettingsForm from './settings/PurchasingSettingsForm';
import LotSettingsForm from './settings/LotSettingsForm';
import ReservationSettingsForm from './settings/ReservationSettingsForm';
import NotificationPreferencesSection from './settings/NotificationPreferencesSection';
import AdvancedSettingsSection from './settings/AdvancedSettingsSection';
import SettingsAboutSection from './settings/SettingsAboutSection';

export default function SettingsView({ settings, onSaveSettings, onClearAllData }) {
  const currentUser = getUser();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Settings size={22} color="var(--accent)" />
        <h2 className="section-title" style={{ margin: 0 }}>Ajustes del Sistema</h2>
      </div>

      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,115,127,0.2)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>{currentUser?.name || 'Usuario Ualdo'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentUser?.email || 'admin@ualdo.app'}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="glass-card-interactive"
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(244,63,94,0.1)', color: 'var(--error)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <Building size={14} color="var(--accent)" />
            <span>{currentUser?.business_name || 'Negocio Principal'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--success)" />
            <span>{currentUser?.role_title || currentUser?.role || 'Administrador'}</span>
          </div>
        </div>
      </div>

      <NotificationPreferencesSection authenticated={authenticated} />

      {can(currentUser, ABILITIES.TEAM_MANAGE) && <TeamSection />}
      {can(currentUser, ABILITIES.SETTINGS_MANAGE) && <DailyCloseSettingsForm />}
      {can(currentUser, ABILITIES.SETTINGS_MANAGE) && <WithdrawalSettingsForm />}
      {can(currentUser, ABILITIES.SETTINGS_MANAGE) && <PurchasingSettingsForm />}
      {can(currentUser, ABILITIES.SETTINGS_MANAGE) && <LotSettingsForm />}
      {can(currentUser, ABILITIES.SETTINGS_MANAGE) && <ReservationSettingsForm />}

      <SettingsAboutSection googleSheetsWebhookUrl={settings?.googleSheetsWebhookUrl} />

      <AdvancedSettingsSection
        settings={settings}
        onSaveSettings={onSaveSettings}
        onClearAllData={onClearAllData}
      />
    </div>
  );
}
