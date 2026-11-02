import { useState, useEffect } from 'react';
import { sendMessage, approveAction, cancelAction } from '../../services/assistantClient';

const MAX_CACHED_MESSAGES = 50;

export function useAssistantConversation(user) {
  const userId = user?.id || 'default';
  const userRole = user?.role || 'staff';
  const chatStorageKey = `ualdo_chat_${userId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const cached = localStorage.getItem(chatStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.map(msg => ({
          ...msg,
          isHistorical: true,
          pendingActions: Array.isArray(msg.pendingActions)
            ? msg.pendingActions.map(act => ({
                ...act,
                status: act.status && act.status !== 'pending' ? act.status : 'expired'
              }))
            : []
        }));
      }
    } catch (e) {}

    return [
      {
        id: 'msg_welcome',
        role: 'assistant',
        content: `Hola ${user?.name ? user.name.split(' ')[0] : ''}. Soy el asistente del restaurante. ¿En qué puedo ayudarte hoy?`.trim(),
        timestamp: Date.now()
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  useEffect(() => {
    try {
      const sliceToSave = messages.slice(-MAX_CACHED_MESSAGES);
      localStorage.setItem(chatStorageKey, JSON.stringify(sliceToSave));
    } catch (e) {}
  }, [messages, chatStorageKey]);

  const handleSend = async (textToSend, attachmentsToSend = []) => {
    const attachments = Array.isArray(attachmentsToSend)
      ? attachmentsToSend.filter((attachment) => attachment?.id !== undefined)
      : [];
    const rawText = (textToSend !== undefined ? textToSend : inputText).trim();
    const text = rawText || (attachments.length > 0 ? 'Te adjunto un archivo.' : '');
    if (!text || loading) return false;

    setErrorBanner(null);
    setInputText('');

    const userMsg = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const response = await sendMessage(text, attachments.map((attachment) => attachment.id));
    setLoading(false);

    if (response.ok) {
      const assistantMsg = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        pendingActions: response.pendingActions || [],
        cards: response.cards || [],
        quickReplies: response.quickReplies || [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      return true;
    }

    setErrorBanner({
      message: response.message || 'No se pudo conectar con el asistente.',
      failedText: text,
      failedAttachments: attachments,
    });
    return false;
  };

  const handleQuickReply = (messageId, text) => {
    if (!text) return;
    setMessages(prev => prev.map(msg => (
      msg.id === messageId ? { ...msg, quickReplies: [] } : msg
    )));
    return handleSend(text);
  };

  const handleApprove = async (token) => {
    const res = await approveAction(token);
    setMessages(prev => prev.map(msg => {
      if (!Array.isArray(msg.pendingActions)) return msg;
      const updatedActions = msg.pendingActions.map(action => {
        if (action.token === token) {
          return {
            ...action,
            status: res.ok ? 'done' : 'error',
            result: res.result || res.message,
            error: !res.ok ? (res.message || 'Error al aprobar') : null
          };
        }
        return action;
      });
      return { ...msg, pendingActions: updatedActions };
    }));
  };

  const handleCancel = async (token) => {
    const res = await cancelAction(token);
    setMessages(prev => prev.map(msg => {
      if (!Array.isArray(msg.pendingActions)) return msg;
      const updatedActions = msg.pendingActions.map(action => {
        if (action.token === token) {
          return {
            ...action,
            status: res.ok ? 'cancelled' : 'error',
            result: res.ok ? (res.message || 'Acción cancelada') : null,
            error: !res.ok ? (res.message || 'Error al cancelar') : null
          };
        }
        return action;
      });
      return { ...msg, pendingActions: updatedActions };
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    userId,
    userRole,
    messages,
    inputText,
    setInputText,
    loading,
    errorBanner,
    handleSend,
    handleQuickReply,
    handleApprove,
    handleCancel,
    handleKeyDown
  };
}
