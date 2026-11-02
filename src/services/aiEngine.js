import { request } from './apiClient';
import { sendMessage } from './assistantClient';

export const ENGINE_HEALTH_PATH = '/health';

/**
 * Consulta la salud del motor Ualdo (GET /api/v1/health, sin token).
 * Distingue tres estados: ok, issues (respondió con problemas) y offline.
 *
 * @returns {Promise<{status: 'ok'|'issues'|'offline', latency: number, version?: string, error?: string}>}
 */
export const checkMotorHealth = async () => {
  const startTime = Date.now();
  const res = await request(ENGINE_HEALTH_PATH);
  const latency = Date.now() - startTime;

  if (!res.ok) {
    if (res.isNetworkError || res.status === 0) {
      return { status: 'offline', latency: 0, error: res.error || 'Sin conexión con el motor.' };
    }
    const detail = res.data?.status || res.error || `Error ${res.status}`;
    return { status: 'issues', latency, error: `El motor respondió con problemas (${detail}).` };
  }

  if (res.data?.status === 'ok') {
    return { status: 'ok', latency, version: res.data.version };
  }

  return {
    status: 'issues',
    latency,
    error: 'El motor respondió sin estado correcto.',
  };
};

export const checkNodeStatus = async (ip, port, provider = 'motor') => {
  const startTime = Date.now();
  try {
    if (provider === 'motor') {
      const health = await checkMotorHealth();
      if (health.status === 'ok') {
        return {
          online: true,
          latency: health.latency,
          models: [health.version ? `Motor Ualdo ${health.version}` : 'Motor Ualdo'],
        };
      }
      return {
        online: false,
        latency: 0,
        models: [],
        error: health.error || 'Sin conexión con el motor.',
      };
    }

    let url = '';
    if (provider === 'ollama') {
      url = `http://${ip}:${port}/api/tags`;
    } else if (provider === 'lmstudio') {
      url = `http://${ip}:${port}/v1/models`;
    } else {
      return { online: true, latency: 5, models: ['ualdo-motor'] };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      let models = [];
      if (provider === 'ollama' && data.models) {
        models = data.models.map(m => m.name);
      } else if (provider === 'lmstudio' && data.data) {
        models = data.data.map(m => m.id);
      }
      return { online: true, latency, models: models.length ? models : ['default-local-model'] };
    }
    return { online: false, latency: 0, models: [] };
  } catch (e) {
    return { online: false, latency: 0, models: [], error: e.message };
  }
};

export const sendChatMessage = async ({ messages }) => {
  const lastUserMessageObj = messages[messages.length - 1];
  const lastUserText = lastUserMessageObj?.content || '';

  const res = await sendMessage(lastUserText);
  if (!res.ok) {
    throw new Error(res.message || 'Error al comunicarse con el motor.');
  }

  return {
    content: res.reply,
    pendingActions: res.pendingActions
  };
};
