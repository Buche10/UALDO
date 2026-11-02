import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  MAX_IMAGE_ATTACHMENT_BYTES,
  MAX_PDF_ATTACHMENT_BYTES,
  MAX_XML_ATTACHMENT_BYTES,
  sendMessage,
  uploadChatAttachment,
  validateChatAttachment,
} from '../assistantClient';

const fileOf = (name, type, size) => {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('assistantClient adjuntos del chat (Brief 42p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateChatAttachment', () => {
    it('acepta XML, imagen y PDF dentro de los límites', () => {
      expect(validateChatAttachment(fileOf('factura.xml', 'text/xml', 10)).kind).toBe('xml');
      expect(validateChatAttachment(fileOf('foto.jpg', 'image/jpeg', 10)).kind).toBe('image');
      expect(validateChatAttachment(fileOf('factura.pdf', 'application/pdf', 10)).kind).toBe('pdf');
    });

    it('rechaza XML de más de 1 MB sin tocar la red', async () => {
      const file = fileOf('factura.xml', 'text/xml', MAX_XML_ATTACHMENT_BYTES + 1);
      const uploadSpy = vi.spyOn(apiClient, 'uploadFile');
      const result = await uploadChatAttachment(file);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('1 MB');
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('rechaza imágenes de más de 8 MB y PDF de más de 10 MB sin tocar la red', async () => {
      const uploadSpy = vi.spyOn(apiClient, 'uploadFile');
      const image = await uploadChatAttachment(fileOf('foto.jpg', 'image/jpeg', MAX_IMAGE_ATTACHMENT_BYTES + 1));
      const pdf = await uploadChatAttachment(fileOf('factura.pdf', 'application/pdf', MAX_PDF_ATTACHMENT_BYTES + 1));
      expect(image.error).toContain('8 MB');
      expect(pdf.error).toContain('10 MB');
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('rechaza tipos que no son imagen, PDF o XML', async () => {
      const uploadSpy = vi.spyOn(apiClient, 'uploadFile');
      const result = await uploadChatAttachment(fileOf('notas.txt', 'text/plain', 10));
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Solo se aceptan');
      expect(uploadSpy).not.toHaveBeenCalled();
    });
  });

  describe('uploadChatAttachment', () => {
    it('sube al endpoint de adjuntos y devuelve la forma del motor', async () => {
      const file = fileOf('factura.xml', 'text/xml', 45021);
      const uploadSpy = vi.spyOn(apiClient, 'uploadFile').mockResolvedValue({
        ok: true,
        status: 201,
        data: { id: 14, kind: 'xml', original_name: 'factura-001.xml', size_bytes: 45021 },
      });

      const result = await uploadChatAttachment(file);
      expect(uploadSpy).toHaveBeenCalledWith('/assistant/attachments', file, 'file', { timeout: 60000 });
      expect(result.ok).toBe(true);
      expect(result.attachment).toEqual({
        id: 14,
        kind: 'xml',
        original_name: 'factura-001.xml',
        size_bytes: 45021,
      });
    });

    it('desenvuelve el sobre data y conserva el error de red', async () => {
      vi.spyOn(apiClient, 'uploadFile').mockResolvedValueOnce({
        ok: true,
        status: 201,
        data: { data: { id: 9, kind: 'pdf', original_name: 'factura.pdf', size_bytes: 100 } },
      });
      const wrapped = await uploadChatAttachment(fileOf('factura.pdf', 'application/pdf', 100));
      expect(wrapped.attachment.id).toBe(9);

      vi.spyOn(apiClient, 'uploadFile').mockResolvedValueOnce({
        ok: false,
        status: 0,
        isNetworkError: true,
      });
      const offline = await uploadChatAttachment(fileOf('factura.pdf', 'application/pdf', 100));
      expect(offline.ok).toBe(false);
      expect(offline.error).toContain('No hay conexión');
    });
  });

  describe('sendMessage con adjuntos, tarjetas y respuestas rápidas', () => {
    it('envía attachment_ids y devuelve cards y quick_replies', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: {
          reply: 'Estos son tus pedidos.',
          pending_actions: [],
          cards: [{ type: 'list', title: 'Pedidos por aprobar', items: [] }],
          quick_replies: ['Aprobar todos', 'Ver el detalle'],
        },
      });

      const res = await sendMessage('Revisa', [14, 15]);
      expect(requestSpy).toHaveBeenCalledWith('/assistant/chat', {
        method: 'POST',
        body: { message: 'Revisa', attachment_ids: [14, 15] },
        timeout: 30000,
      });
      expect(res.cards).toHaveLength(1);
      expect(res.quickReplies).toEqual(['Aprobar todos', 'Ver el detalle']);
    });

    it('permite mensaje vacío cuando hay adjuntos y mantiene compatibilidad sin cards', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValue({
        ok: true,
        status: 200,
        data: { reply: 'Recibido.', pending_actions: [] },
      });
      const res = await sendMessage('', [7]);
      expect(res.ok).toBe(true);
      expect(res.cards).toEqual([]);
      expect(res.quickReplies).toEqual([]);
    });

    it('rechaza más de tres adjuntos y mensajes demasiado largos', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request');
      const tooMany = await sendMessage('Hola', [1, 2, 3, 4]);
      const tooLong = await sendMessage('a'.repeat(1001), [1]);
      expect(tooMany.ok).toBe(false);
      expect(tooMany.message).toContain('3 archivos');
      expect(tooLong.ok).toBe(false);
      expect(tooLong.message).toContain('1000 caracteres');
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });
});
