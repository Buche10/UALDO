import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssistantChat from '../AssistantChat';
import * as assistantClient from '../../../services/assistantClient';

describe('AssistantChat component', () => {
  const staffUser = { id: 1, name: 'Pedro Gomez', role: 'staff' };
  const ownerUser = { id: 2, name: 'Ana Lopez', role: 'owner' };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem('ualdo_privacy_ack_1_v1', 'true');
    localStorage.setItem('ualdo_privacy_ack_2_v1', 'true');
  });

  it('shows staff suggestion chips for staff role and triggers send on click', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      reply: 'Abriendo pedidos de insumos...',
      pendingActions: []
    });

    render(<AssistantChat user={staffUser} />);

    const chip = screen.getByText('Pedir insumos');
    expect(chip).toBeInTheDocument();
    fireEvent.click(chip);

    await waitFor(() => {
      expect(screen.getByText('Quiero pedir insumos para el restaurante')).toBeInTheDocument();
      expect(screen.getByText('Abriendo pedidos de insumos...')).toBeInTheDocument();
    });
  });

  it('shows owner suggestion chips for owner role', () => {
    render(<AssistantChat user={ownerUser} />);

    expect(screen.getByText('Pedidos por aprobar')).toBeInTheDocument();
    expect(screen.getByText('Lista de compras')).toBeInTheDocument();
    expect(screen.getByText('Pedir insumos')).toBeInTheDocument();
  });

  it('shows character counter when text reaches 900 or more characters', () => {
    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);

    fireEvent.change(input, { target: { value: 'a'.repeat(899) } });
    expect(screen.queryByText(/caracteres restantes/i)).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'a'.repeat(950) } });
    expect(screen.getByText('50 caracteres restantes')).toBeInTheDocument();
  });

  it('sends message and renders plain text response without dangerouslySetInnerHTML', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      reply: 'Respuesta del servidor para el restaurante.',
      pendingActions: []
    });

    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);
    const sendBtn = screen.getByLabelText('Enviar mensaje');

    fireEvent.change(input, { target: { value: 'Necesito aceite' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Necesito aceite')).toBeInTheDocument();
      expect(screen.getByText('Respuesta del servidor para el restaurante.')).toBeInTheDocument();
    });
  });

  it('sends message when pressing Enter key without Shift', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      reply: 'Listo, registrado.',
      pendingActions: []
    });

    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);

    fireEvent.change(input, { target: { value: 'Mensaje con enter' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText('Mensaje con enter')).toBeInTheDocument();
      expect(screen.getByText('Listo, registrado.')).toBeInTheDocument();
    });
  });

  it('displays error banner with retry button on assistant failure', async () => {
    vi.spyOn(assistantClient, 'sendMessage')
      .mockResolvedValueOnce({
        ok: false,
        message: 'Error al contactar al servidor.'
      })
      .mockResolvedValueOnce({
        ok: true,
        reply: 'Ahora sí funcionó.',
        pendingActions: []
      });

    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);
    const sendBtn = screen.getByLabelText('Enviar mensaje');

    fireEvent.change(input, { target: { value: 'Pregunta fallida' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Error al contactar al servidor.')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reintentar'));

    await waitFor(() => {
      expect(screen.getByText('Ahora sí funcionó.')).toBeInTheDocument();
    });
  });

  it('handles approve and cancel actions directly inside the chat flow', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      reply: 'Confirmar el siguiente pedido:',
      pendingActions: [
        {
          token: 'action_tok_1',
          action: 'create_order',
          summary: 'Crear pedido de 5kg pollo',
          expires_at: new Date(Date.now() + 600000).toISOString(),
          status: 'pending'
        }
      ]
    });
    vi.spyOn(assistantClient, 'approveAction').mockResolvedValueOnce({
      ok: true,
      result: 'Pedido #99 creado exitosamente.'
    });

    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);
    fireEvent.change(input, { target: { value: 'Pedir 5kg de pollo' } });
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    await waitFor(() => {
      expect(screen.getByText('Crear pedido de 5kg pollo')).toBeInTheDocument();
      expect(screen.getByText('Aprobar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aprobar'));

    await waitFor(() => {
      expect(screen.getByText('Pedido #99 creado exitosamente.')).toBeInTheDocument();
      expect(screen.getByText('Hecho')).toBeInTheDocument();
    });
  });

  it('handles cancel action inside the chat flow', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      reply: 'Confirmar el siguiente pedido:',
      pendingActions: [
        {
          token: 'action_tok_2',
          action: 'create_order',
          summary: 'Crear pedido de papas',
          expires_at: new Date(Date.now() + 600000).toISOString(),
          status: 'pending'
        }
      ]
    });
    vi.spyOn(assistantClient, 'cancelAction').mockResolvedValueOnce({
      ok: true,
      message: 'Acción descartada.'
    });

    render(<AssistantChat user={staffUser} />);
    const input = screen.getByPlaceholderText(/Escribe un mensaje al asistente/i);
    fireEvent.change(input, { target: { value: 'Pedir papas' } });
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    await waitFor(() => {
      expect(screen.getByText('Crear pedido de papas')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancelar'));

    await waitFor(() => {
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });
  });

  it('displays privacy notice on first visit and dismisses when clicked', () => {
    localStorage.removeItem('ualdo_privacy_ack_1_v1');
    render(<AssistantChat user={staffUser} />);

    expect(screen.getByText(/Aviso de Privacidad/i)).toBeInTheDocument();
    const btn = screen.getByText('Entendido');
    fireEvent.click(btn);

    expect(localStorage.getItem('ualdo_privacy_ack_1_v1')).toBe('true');
    expect(screen.queryByText(/Aviso de Privacidad/i)).not.toBeInTheDocument();
  });

  it('restores cached messages and marks pending actions as non-actionable', () => {
    const cached = [
      {
        id: 'msg_old',
        role: 'assistant',
        content: 'Pedido anterior pendiente',
        timestamp: Date.now(),
        pendingActions: [
          { token: 'old_tok', summary: 'Acción antigua', status: 'pending' }
        ]
      }
    ];
    localStorage.setItem('ualdo_chat_1', JSON.stringify(cached));

    render(<AssistantChat user={staffUser} />);

    expect(screen.getByText('Pedido anterior pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });
});
