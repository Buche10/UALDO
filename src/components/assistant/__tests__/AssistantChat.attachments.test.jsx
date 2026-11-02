import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AssistantChat from '../AssistantChat';
import * as assistantClient from '../../../services/assistantClient';
import * as cameraPermission from '../../../services/cameraPermission';

const VALID_KEY = '1501202601179001234500110010020001234561234567818';
const user = { id: 1, name: 'Pedro Gomez', role: 'kitchen_staff', capabilities: { role: 'kitchen_staff' } };

const attachment = {
  id: 14,
  kind: 'xml',
  original_name: 'factura-001.xml',
  size_bytes: 45021,
};

const openAttachmentMenu = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Adjuntar archivo' }));
};

const uploadPending = async () => {
  openAttachmentMenu();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Foto o archivo' }));
  const input = screen.getByLabelText('Foto o archivo');
  const file = new File(['<factura />'], 'factura-001.xml', { type: 'text/xml' });
  fireEvent.change(input, { target: { files: [file] } });
  await screen.findByText('factura-001.xml');
};

describe('AssistantChat adjuntos y tarjetas (Brief 42p)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    localStorage.setItem('ualdo_privacy_ack_1_v1', 'true');
  });

  afterEach(() => {
    delete window.BarcodeDetector;
    delete window.navigator.mediaDevices;
  });

  it('abre el menú del clip con las tres opciones', () => {
    render(<AssistantChat user={user} />);
    openAttachmentMenu();

    expect(screen.getByRole('menuitem', { name: 'Tomar foto' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Foto o archivo' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Escanear clave del SRI' })).toBeInTheDocument();
  });

  it('sube un XML, muestra la ficha y envía solo adjunto con el texto de respaldo', async () => {
    vi.spyOn(assistantClient, 'uploadChatAttachment').mockResolvedValue({ ok: true, attachment });
    const sendSpy = vi.spyOn(assistantClient, 'sendMessage').mockResolvedValue({
      ok: true,
      reply: 'Recibí la factura.',
      pendingActions: [],
    });

    render(<AssistantChat user={user} />);
    await uploadPending();

    expect(screen.getByText('XML')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith('Te adjunto un archivo.', [14]);
    });
    expect(await screen.findByText('Recibí la factura.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Adjuntos pendientes')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Adjuntos del mensaje')).toBeInTheDocument();
  });

  it('envía el texto con attachment_ids y muestra el adjunto en el mensaje propio', async () => {
    vi.spyOn(assistantClient, 'uploadChatAttachment').mockResolvedValue({ ok: true, attachment });
    const sendSpy = vi.spyOn(assistantClient, 'sendMessage').mockResolvedValue({
      ok: true,
      reply: 'La reviso.',
      pendingActions: [],
    });

    render(<AssistantChat user={user} />);
    await uploadPending();
    fireEvent.change(screen.getByLabelText('Mensaje para el asistente'), { target: { value: 'Revisa esto' } });
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith('Revisa esto', [14]);
    });
    expect(screen.getByText('Revisa esto')).toBeInTheDocument();
    expect(screen.getAllByText('factura-001.xml').length).toBeGreaterThan(0);
  });

  it('permite quitar una ficha pendiente antes de enviar', async () => {
    vi.spyOn(assistantClient, 'uploadChatAttachment').mockResolvedValue({ ok: true, attachment });

    render(<AssistantChat user={user} />);
    await uploadPending();
    fireEvent.click(screen.getByLabelText('Quitar factura-001.xml'));

    expect(screen.queryByText('factura-001.xml')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });

  it('muestra el error del permiso de cámara si se niega', async () => {
    vi.spyOn(cameraPermission, 'ensureCameraAccess').mockResolvedValue({
      ok: false,
      message: cameraPermission.CAMERA_PERMISSION_DENIED_MESSAGE,
    });

    render(<AssistantChat user={user} />);
    openAttachmentMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tomar foto' }));

    expect(await screen.findByText(cameraPermission.CAMERA_PERMISSION_DENIED_MESSAGE)).toBeInTheDocument();
  });

  it('envía la clave válida leída por el escáner', async () => {
    const stop = vi.fn();
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
    });
    window.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: VALID_KEY }];
      }
    };
    const sendSpy = vi.spyOn(assistantClient, 'sendMessage').mockResolvedValue({
      ok: true,
      reply: 'Cargando la factura.',
      pendingActions: [],
    });

    render(<AssistantChat user={user} />);
    openAttachmentMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Escanear clave del SRI' }));

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith(`Carga la factura con la clave ${VALID_KEY}`, []);
    });
    expect(stop).toHaveBeenCalled();
  });

  it('rechaza una clave inválida del escáner sin enviar mensaje', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    });
    window.BarcodeDetector = class {
      async detect() {
        return [{ rawValue: '123456' }];
      }
    };
    const sendSpy = vi.spyOn(assistantClient, 'sendMessage');

    render(<AssistantChat user={user} />);
    openAttachmentMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Escanear clave del SRI' }));

    expect(await screen.findByText('La clave de acceso no es válida. Revisa los 49 dígitos.')).toBeInTheDocument();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('dibuja list, table y stat junto a la respuesta', async () => {
    vi.spyOn(assistantClient, 'sendMessage').mockResolvedValue({
      ok: true,
      reply: 'Aquí está el resumen.',
      pendingActions: [],
      cards: [
        { type: 'list', title: 'Pedidos por aprobar', items: [{ title: 'Pedido #102', badge: 'Urgente', badge_tone: 'warning' }] },
        { type: 'table', title: 'Insumos bajo mínimo', columns: ['Insumo', 'Stock'], rows: [['Tomate', '1.5 kg']] },
        { type: 'stat', title: 'Resumen del día', items: [{ label: 'Ventas', value: '$100' }] },
        { type: 'chart', title: 'Ignorada' },
      ],
    });

    render(<AssistantChat user={user} />);
    fireEvent.change(screen.getByLabelText('Mensaje para el asistente'), { target: { value: 'Resumen' } });
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    expect(await screen.findByText('Pedidos por aprobar')).toBeInTheDocument();
    expect(screen.getByText('Insumos bajo mínimo')).toBeInTheDocument();
    expect(screen.getByText('Resumen del día')).toBeInTheDocument();
    expect(screen.queryByText('Ignorada')).not.toBeInTheDocument();
  });

  it('las respuestas rápidas envían su texto y desaparecen', async () => {
    const sendSpy = vi.spyOn(assistantClient, 'sendMessage')
      .mockResolvedValueOnce({
        ok: true,
        reply: '¿Qué quieres hacer?',
        pendingActions: [],
        quickReplies: ['Aprobar todos', 'Ver el detalle'],
      })
      .mockResolvedValueOnce({
        ok: true,
        reply: 'Listo.',
        pendingActions: [],
      });

    render(<AssistantChat user={user} />);
    fireEvent.change(screen.getByLabelText('Mensaje para el asistente'), { target: { value: 'Pedidos' } });
    fireEvent.click(screen.getByLabelText('Enviar mensaje'));

    const quickReply = await screen.findByRole('button', { name: 'Aprobar todos' });
    fireEvent.click(quickReply);

    await waitFor(() => {
      expect(sendSpy).toHaveBeenLastCalledWith('Aprobar todos', []);
    });
    expect(screen.queryByRole('button', { name: 'Aprobar todos' })).not.toBeInTheDocument();
    expect(await screen.findByText('Listo.')).toBeInTheDocument();
  });
});
