import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import { sendMessage, approveAction, cancelAction } from '../assistantClient';

describe('assistantClient service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendMessage', () => {
    it('validates empty or whitespace messages', async () => {
      const res = await sendMessage('   ');
      expect(res.ok).toBe(false);
      expect(res.message).toBe('El mensaje no puede estar vacío.');
    });

    it('rejects messages longer than 1000 characters', async () => {
      const longText = 'a'.repeat(1001);
      const res = await sendMessage(longText);
      expect(res.ok).toBe(false);
      expect(res.message).toContain('1000 caracteres');
    });

    it('handles successful message response', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          reply: 'Hola, tengo una accion pendiente.',
          pending_actions: [
            { token: 'tok_123', action: 'create_order', summary: 'Crear pedido de carne', expires_at: '2026-10-05T13:00:00Z' }
          ]
        }
      });

      const res = await sendMessage('Hola');
      expect(res.ok).toBe(true);
      expect(res.reply).toBe('Hola, tengo una accion pendiente.');
      expect(res.pendingActions).toHaveLength(1);
      expect(res.pendingActions[0].token).toBe('tok_123');
    });

    it('handles 429 rate limit error', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 429,
        error: 'Too Many Attempts'
      });

      const res = await sendMessage('Hola');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(429);
      expect(res.message).toContain('Demasiados mensajes');
    });

    it('handles 409 conflict error', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 409,
        error: 'Conflicto de estado'
      });

      const res = await sendMessage('Hola');
      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.message).toBe('Conflicto de estado');
    });

    it('handles network error cleanly', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 0,
        isNetworkError: true,
        error: 'Connection dropped'
      });

      const res = await sendMessage('Hola');
      expect(res.ok).toBe(false);
      expect(res.message).toContain('No hay conexión con Ualdo');
    });

    it('handles generic non-ok error cleanly', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Internal Server Error'
      });

      const res = await sendMessage('Hola');
      expect(res.ok).toBe(false);
      expect(res.message).toBe('Internal Server Error');
    });
  });

  describe('approveAction', () => {
    it('approves action with token successfully', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          success: true,
          message: 'Aprobado',
          result: 'Pedido #12 creado: carne molida 5 kg.'
        }
      });

      const res = await approveAction('tok_123');
      expect(res.ok).toBe(true);
      expect(res.result).toBe('Pedido #12 creado: carne molida 5 kg.');
    });

    it('handles 409 conflict on approve', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 409,
        data: { message: 'El pedido ya fue modificado.' }
      });

      const res = await approveAction('tok_123');
      expect(res.ok).toBe(false);
      expect(res.message).toBe('El pedido ya fue modificado.');
    });

    it('handles expired or invalid token on approve', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 400,
        error: 'El token expiró o ya fue procesado.'
      });

      const res = await approveAction('tok_expired');
      expect(res.ok).toBe(false);
      expect(res.message).toBe('El token expiró o ya fue procesado.');
    });

    it('handles network error on approve', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 0,
        isNetworkError: true
      });

      const res = await approveAction('tok_123');
      expect(res.ok).toBe(false);
      expect(res.message).toContain('No hay conexión con Ualdo');
    });
  });

  describe('cancelAction', () => {
    it('cancels action successfully', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          success: true,
          message: 'Accion cancelada.'
        }
      });

      const res = await cancelAction('tok_123');
      expect(res.ok).toBe(true);
      expect(res.message).toBe('Accion cancelada.');
    });

    it('handles failure on cancel', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 400,
        data: { message: 'No se pudo cancelar la accion.' }
      });

      const res = await cancelAction('tok_123');
      expect(res.ok).toBe(false);
      expect(res.message).toBe('No se pudo cancelar la accion.');
    });

    it('handles network error on cancel', async () => {
      vi.spyOn(apiClient, 'request').mockResolvedValueOnce({
        ok: false,
        status: 0,
        isNetworkError: true
      });

      const res = await cancelAction('tok_123');
      expect(res.ok).toBe(false);
      expect(res.message).toContain('No hay conexión con Ualdo');
    });
  });
});
