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
  aiProvider: 'motor', // 'motor' | 'ollama' | 'lmstudio' | 'local_web'
  lmStudioPort: '1234',
  activeModel: 'llama3:latest',
  systemPrompt: 'Eres UALDO AI, el asistente ejecutivo inteligente y gestor central de todo el ecosistema de aplicaciones y servicios locales. Tu objetivo es comunicarte eficientemente con el usuario, procesar solicitudes y ejecutar herramientas o acciones en las apps locales cuando sea necesario.',
  speechEnabled: false,
  hapticsEnabled: true,
  googleSheetsWebhookUrl: ''
};

export const getSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error reading settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings) => {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving settings:', e);
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
            content: '¡Hola! Soy **UALDO**, tu gestor de ecosistema e IA local. Estoy listo para ayudarte y controlar tus aplicaciones locales. ¿Qué deseas hacer hoy?',
            timestamp: Date.now()
          }
        ]
      }
    ];
  } catch (e) {
    console.error('Error reading conversations:', e);
    return [];
  }
};

export const saveConversations = (conversations) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Error saving conversations:', e);
  }
};
