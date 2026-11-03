import React from 'react';
import { Settings } from 'lucide-react';
import { getUser, isAuthenticated } from '../services/auth';
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
import AccountSection from './settings/AccountSection';

export default function SettingsView({ settings, onSaveSettings, onClearAllData }) {
  const currentUser = getUser();
  const authenticated = isAuthenticated();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={20} color="var(--accent)" />
          <span>Ajustes</span>
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Configuración de cuenta, apariencia y preferencias del sistema.
        </p>
      </div>

      <AccountSection />

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
