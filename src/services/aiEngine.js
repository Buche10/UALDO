import { request } from './apiClient';
import { checkRunfoodConnection } from './doblefiloEngine';
import { sendMessage } from './assistantClient';

export const checkNodeStatus = async (ip, port, provider = 'motor') => {
  const startTime = Date.now();
  try {
    if (provider === 'motor') {
      const rf = await checkRunfoodConnection();
      if (rf.online) {
        return {
          online: true,
          latency: rf.latency,
          models: [`RunFood POS (${rf.url})`],
          businessName: 'DOBLE FILO - PRINCIPAL'
        };
      }
      return {
        online: false,
        latency: 0,
        models: [],
        error: rf.error || 'RunFood no responde en ' + rf.url
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
