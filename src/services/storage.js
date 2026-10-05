// UALDO Storage Service for Mobile App State & Ecosystem Config

const STORAGE_KEYS = {
  SETTINGS: 'ualdo_settings',
  CONVERSATIONS: 'ualdo_conversations',
  REGISTERED_APPS: 'ualdo_registered_apps',
  ACTIVE_NODE: 'ualdo_active_node'
};

const DEFAULT_SETTINGS = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://ualbusiness.test/api/v1',
  nodeIp: '192.168.100.10',
  nodePort: '1000',
  aiProvider: 'motor',
  lmStudioPort: '1234',
  activeModel: 'llama3:latest',
  systemPrompt: 'Eres UALDO AI, el asistente ejecutivo inteligente.',
  speechEnabled: false,
  hapticsEnabled: true,
  googleSheetsWebhookUrl: ''
};

export const getSettings = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = rawData ? JSON.parse(rawData) : {};
    const settings = { ...DEFAULT_SETTINGS, ...parsed };

    if (import.meta.env.PROD) {
      const prodUrl = import.meta.env.VITE_API_BASE_URL || '';
      if (!prodUrl.startsWith('https://')) {
        throw new Error('API Base URL must use HTTPS in production');
      }
      settings.apiBaseUrl = prodUrl;
    }

    return settings;
  } catch (e) {
    if (import.meta.env.PROD) {
      throw e;
    }
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  try {
    const current = getSettings();
    const toSave = { ...settings };
    if (import.meta.env.PROD) {
      delete toSave.apiBaseUrl;
    }
    const updated = { ...current, ...toSave };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    if (import.meta.env.PROD) {
      throw e;
    }
    return DEFAULT_SETTINGS;
  }
};

export const getConversations = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [
      {
        id: 'default',
        title: 'Conversación Inicial',
        timestamp: Date.now(),
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: 'Hola, soy UALDO, asistente inteligente del restaurante. ¿En qué te puedo ayudar hoy?',
            timestamp: Date.now()
          }
        ]
      }
    ];
  } catch (e) {
    return [];
  }
};

export const saveConversations = (conversations) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {}
};
