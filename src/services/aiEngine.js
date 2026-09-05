// Universal AI Engine Connector for UALDO Mobile
import { executeLocalTool } from './appEcosystem';
import { request } from './apiClient';

export const checkNodeStatus = async (ip, port, provider = 'motor') => {
  const startTime = Date.now();
  try {
    if (provider === 'motor') {
      const res = await request('/me', { timeout: 4000 });
      const latency = Date.now() - startTime;
      if (res.ok) {
        return {
          online: true,
          latency,
          models: ['UaldoAdminService (DeepSeek/Prism)'],
          businessName: res.data?.user?.business_name
        };
      }
      return { online: false, latency: 0, models: [], error: res.error || 'Motor no disponible' };
    }

    let url = '';
    if (provider === 'ollama') {
      url = `http://${ip}:${port}/api/tags`;
    } else if (provider === 'lmstudio') {
      url = `http://${ip}:${port}/v1/models`;
    } else {
      return { online: true, latency: 5, models: ['ualdo-local-web'] };
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
    return { online: false, latency: 0, error: e.message, models: [] };
  }
};

export const sendChatMessage = async ({
  messages,
  settings,
  onStreamChunk,
  onToolCalled
}) => {
  const { nodeIp, nodePort, lmStudioPort, aiProvider, activeModel, systemPrompt } = settings;
  const lastUserMessageObj = messages[messages.length - 1];
  const lastUserText = lastUserMessageObj?.content || '';

  // 1. Primary: UaldoBusiness Motor API (IA Real + DeepSeek + ApprovalGate)
  if (!aiProvider || aiProvider === 'motor') {
    const apiRes = await request('/admin/chat', {
      method: 'POST',
      body: { message: lastUserText },
      timeout: 25000
    });

    if (apiRes.ok && apiRes.data) {
      return {
        role: 'assistant',
        content: apiRes.data.reply || 'Instrucción procesada.',
        pendingAction: apiRes.data.pending_action || null,
        isRealMotor: true
      };
    }

    console.warn('API Motor UaldoBusiness no disponible o falló:', apiRes.error);
  }

  // 2. Ollama Provider
  if (aiProvider === 'ollama') {
    const endpoint = `http://${nodeIp}:${nodePort}/api/chat`;
    try {
      const payload = {
        model: activeModel || 'llama3:latest',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        stream: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const replyContent = data.message?.content || '';

        const toolMatch = replyContent.match(/\[TOOL:\s*(\w+)\s*(\{.*?\})?\]/);
        let toolResult = null;
        if (toolMatch) {
          const toolName = toolMatch[1];
          let toolParams = {};
          try {
            if (toolMatch[2]) toolParams = JSON.parse(toolMatch[2]);
          } catch (e) {}
          toolResult = await executeLocalTool(toolName, toolParams);
          if (onToolCalled) onToolCalled(toolName, toolParams, toolResult);
        }

        return {
          role: 'assistant',
          content: replyContent.replace(/\[TOOL:\s*\w+\s*(\{.*?\})?\]/g, '').trim() || (toolResult ? `Acción ejecutada: ${toolResult.message || 'OK'}` : replyContent),
          toolExecuted: toolResult
        };
      }
    } catch (e) {
      console.warn('Fallback a Simulación de UALDO por falta de conexión Ollama:', e.message);
    }
  }

  // 3. Intelligent Offline Fallback Dispatcher
  const lastTextLower = lastUserText.toLowerCase();

  let simResponse = '';
  let toolExecuted = null;

  // WAITER ORDERS COMMANDS
  if (lastTextLower.includes('pedido') || lastTextLower.includes('mesero') || lastTextLower.includes('comanda') || lastTextLower.includes('mesa')) {
    if (lastTextLower.includes('tomar') || lastTextLower.includes('crear') || lastTextLower.includes('registrar') || lastTextLower.includes('pedió') || lastTextLower.includes('pidió')) {
      const mesaMatch = lastTextLower.match(/mesa\s*(\d+)/i);
      const numMesa = mesaMatch ? parseInt(mesaMatch[1]) : 3;

      let orderedItems = [
        { nombre: 'Hamburguesa DobleFilo Especial', cantidad: 2, precio: 6.50 },
        { nombre: 'Cerveza Artesanal 330ml', cantidad: 1, precio: 3.50 }
      ];

      toolExecuted = await executeLocalTool('doblefilo_create_order', {
        numeroMesa: numMesa,
        mesero: 'Mesero UALDO Mobile',
        items: orderedItems,
        observacion: 'Modo Offline Fallback'
      });

      simResponse = `🍽️ **[MODO OFFLINE — FALLBACK MOCK] Comanda Registrada**\n\n- **Mesa**: ${numMesa}\n- **Total**: $16.50`;
      if (onToolCalled) onToolCalled('doblefilo_create_order', {}, toolExecuted);
    } else {
      toolExecuted = await executeLocalTool('doblefilo_get_tables');
      simResponse = `🍽️ **[MODO OFFLINE — FALLBACK MOCK] Mesas Restaurante**\n\nMesas disponibles en modo local. Conéctate al Motor UaldoBusiness para ver datos en tiempo real.`;
      if (onToolCalled) onToolCalled('doblefilo_get_tables', {}, toolExecuted);
    }
  } else {
    simResponse = `⚠️ **[MODO OFFLINE — MOTOR SIN CONEXIÓN]**\n\nNo se pudo contactar al motor **UaldoBusiness**. Se activó el simulador local de contingencia.\n\nVerifica tu red o inicia sesión en la pestaña **Red** para reconectar la IA real.`;
  }

  await new Promise(r => setTimeout(r, 400));

  return {
    role: 'assistant',
    content: simResponse,
    isOfflineFallback: true,
    toolExecuted
  };
};
