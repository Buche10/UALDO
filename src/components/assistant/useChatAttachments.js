import { useCallback, useState } from 'react';
import { MAX_CHAT_ATTACHMENTS, uploadChatAttachment } from '../../services/assistantClient';
import { resizeImageFile } from '../../services/imageAttachments';

export function useChatAttachments() {
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [attachmentError, setAttachmentError] = useState(null);

  const addFiles = useCallback(async (files) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    setAttachmentError(null);
    const room = MAX_CHAT_ATTACHMENTS - pendingAttachments.length;
    if (room <= 0) {
      setAttachmentError('Puedes adjuntar hasta 3 archivos.');
      return;
    }
    if (list.length > room) {
      setAttachmentError('Puedes adjuntar hasta 3 archivos.');
    }

    setUploading(true);
    const uploaded = [];
    for (const file of list.slice(0, room)) {
      try {
        const prepared = await resizeImageFile(file);
        const result = await uploadChatAttachment(prepared);
        if (result.ok) {
          uploaded.push(result.attachment);
        } else {
          setAttachmentError(result.error || 'No se pudo subir el archivo.');
        }
      } catch {
        setAttachmentError('No se pudo subir el archivo.');
      }
    }
    if (uploaded.length > 0) {
      setPendingAttachments((current) => [...current, ...uploaded].slice(0, MAX_CHAT_ATTACHMENTS));
    }
    setUploading(false);
  }, [pendingAttachments.length]);

  const removeAttachment = useCallback((attachment) => {
    setPendingAttachments((current) => current.filter((item) => item.id !== attachment?.id));
  }, []);

  const clearAttachments = useCallback(() => {
    setPendingAttachments([]);
    setAttachmentError(null);
  }, []);

  return {
    pendingAttachments,
    uploading,
    attachmentError,
    setAttachmentError,
    addFiles,
    removeAttachment,
    clearAttachments,
  };
}
