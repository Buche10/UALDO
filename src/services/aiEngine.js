import { executeLocalTool } from './appEcosystem';
import { request } from './apiClient';
import { getSettings } from './storage';
import { checkRunfoodConnection } from './doblefiloEngine';

export const checkNodeStatus = async (ip, port, provider = 'motor') => {
  const startTime = Date.now();
  try {
    if (provider === 'motor') {
      // The connection that matters for the pilot is the local RunFood POS. Report it HONESTLY:
      // online only when /check-health actually responds, offline otherwise (no fake success).
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
    return { online: false, latency: 0, models: [], error: e.message };
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
  const lastTextLower = lastUserText.toLowerCase();

  // 0. IMMEDIATE DISPATCH FOR WAITER ORDER ACTIONS (Agrega, Pone, Sirve, Pedido, Pido, Pide, Trae, Dame)
  const isOrderAction = 
    lastTextLower.includes('tomar') || 
    lastTextLower.includes('crear') || 
    lastTextLower.includes('registrar') || 
    lastTextLower.includes('pedió') || 
    lastTextLower.includes('pidió') || 
    lastTextLower.includes('pidio') || 
    lastTextLower.includes('pido') || 
    lastTextLower.includes('pide') || 
    lastTextLower.includes('pideme') || 
    lastTextLower.includes('pedir') || 
    lastTextLower.includes('pedido') ||
    lastTextLower.includes('agrega') ||
    lastTextLower.includes('añade') ||
    lastTextLower.includes('anadir') ||
    lastTextLower.includes('pone') ||
    lastTextLower.includes('pon') ||
    lastTextLower.includes('sirve') ||
    lastTextLower.includes('servir') ||
    lastTextLower.includes('trae') ||
    lastTextLower.includes('traeme') ||
    lastTextLower.includes('dame') ||
    lastTextLower.includes('adiciona') ||
    lastTextLower.includes('orden');

  if (isOrderAction) {
    const mesaMatch = lastTextLower.match(/mesa\s*(\d+)/i) || lastTextLower.match(/(\d+)/);
    const numMesa = mesaMatch ? parseInt(mesaMatch[1]) : 19;

    // Extract the product phrase safely (no destructive letter-stripping): take the text
    // after the action verb and drop the "... a/en la mesa N" tail. The actual product is
    // resolved against RunFood's REAL catalog inside createDoblefiloOrder.
    let itemPhrase = lastUserText
      .replace(/^\s*(por favor\s+)?(agr[eé]gale|agr[eé]game|agrega|a[nñ][aá]de|adiciona|pon(?:le|me|er)?|sirve(?:le|me)?|servir|tr[aá]e(?:me)?|dame|tomar|crear|registrar|pedir|p[ií]d[eo]|orden[ae]?)\b/i, '')
      .replace(/\b(a|en|para|de)\s+(la\s+)?mesa\s*\d+.*$/i, '')
      .replace(/\bmesa\s*\d+.*$/i, '')
      .replace(/^\s*(un|una|unos|unas|el|la|los|las)\s+/i, '')
      .trim();

    // Optional leading quantity ("2 picaditas").
    let cantidad = 1;
    const qtyMatch = itemPhrase.match(/^(\d+)\s+/);
    if (qtyMatch) {
      cantidad = Math.max(1, parseInt(qtyMatch[1]));
      itemPhrase = itemPhrase.replace(/^\d+\s+/, '').trim();
    }
    if (itemPhrase.length < 2) itemPhrase = 'gaseosa';

    const toolExecuted = await executeLocalTool('doblefilo_create_order', {
      numeroMesa: numMesa,
      items: [{ nombre: itemPhrase, cantidad }],
      observacion: 'Pedido agregado a través de UALDO'
    });
    if (onToolCalled) onToolCalled('doblefilo_create_order', {}, toolExecuted);

    if (toolExecuted?.success && toolExecuted.orderDetails) {
      const d = toolExecuted.orderDetails;
      const content = `🍽️ **Comanda registrada en RunFood POS (DOBLE FILO)**\n\n` +
        `- **Mesa**: ${d.mesa}\n` +
        `- **Producto**: ${d.cantidad}x ${d.producto}\n` +
        `- **Precio**: $${Number(d.precio).toFixed(2)}  (Total: ${d.total})\n` +
        `- **Comanda #**: ${d.orderId ?? 's/n'}\n` +
        `- **Estado**: ✅ Guardado en RunFood (${d.source || 'SQL Server'})`;
      return { role: 'assistant', content, toolExecuted };
    }

    // Honest failure — never claim it was added when it wasn't.
    const errMsg = toolExecuted?.error || 'No se pudo registrar la comanda en RunFood.';
    return {
      role: 'assistant',
      content: `⚠️ **No se agregó el pedido a la Mesa ${numMesa}.**\n\n${errMsg}\n\n` +
        `Verifica que RunFood esté encendido y que el producto exista en la carta.`,
      toolExecuted
    };
  }

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
  let simResponse = '';
  let toolExecuted = null;

  // WAITER ORDERS COMMANDS
  if (lastTextLower.includes('pedido') || lastTextLower.includes('mesero') || lastTextLower.includes('comanda') || lastTextLower.includes('mesa') || lastTextLower.includes('mesas')) {
    if (lastTextLower.includes('tengo') || lastTextLower.includes('configurar') || lastTextLower.includes('ajustar') || lastTextLower.includes('son')) {
      const countMatch = lastTextLower.match(/(\d+)\s*mesas/i) || lastTextLower.match(/mesas\s*(\d+)/i);
      if (countMatch) {
        const count = parseInt(countMatch[1]);
        toolExecuted = await executeLocalTool('doblefilo_set_tables_count', { count });
        simResponse = `✅ **Configuración de Mesas Actualizada en RunFood**\n\nSe ha actualizado el total a **${count} mesas** reales para DOBLE FILO.`;
        if (onToolCalled) onToolCalled('doblefilo_set_tables_count', { count }, toolExecuted);
        return { role: 'assistant', content: simResponse, toolExecuted };
      }
    }

    toolExecuted = await executeLocalTool('doblefilo_get_tables');
    const resumen = toolExecuted?.resumen || {};
    const tablesList = toolExecuted?.tables || [];
    const tablesDetailStr = tablesList.slice(0, 10).map(t => `- **Mesa ${t.numero || t.id}**: ${t.estado.toUpperCase()} (${t.personas || 0} pers. - $${(t.total || 0).toFixed(2)})`).join('\n');
    
    simResponse = `🍽️ **Mesas del Restaurante — RunFood (DOBLE FILO)**\n\n` +
      `**Resumen General:**\n` +
      `- Total Mesas: **${resumen.totalMesas || tablesList.length}**\n` +
      `- Ocupadas: **${resumen.ocupadas || 0}** | Libres: **${resumen.libres || 0}**\n` +
      `- Ventas Acumuladas en Mesas: **$${(resumen.ventasAcumuladasMesas || 0).toFixed(2)}**\n\n` +
      `**Detalle:**\n${tablesDetailStr}`;
    if (onToolCalled) onToolCalled('doblefilo_get_tables', {}, toolExecuted);
  } else {
    simResponse = `⚡ **Asistente Local UALDO (RunFood & Ecosistema)**\n\nOperando con integración directa a Run Food (192.168.100.10:1000), inventario de Vercel y Cierre de Caja local.`;
  }

  await new Promise(r => setTimeout(r, 400));

  return {
    role: 'assistant',
    content: simResponse,
    isOfflineFallback: true,
    toolExecuted
  };
};
