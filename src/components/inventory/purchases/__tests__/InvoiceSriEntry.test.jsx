import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvoiceSriEntry from '../InvoiceSriEntry';
import * as purchaseDocumentsClient from '../../../../services/purchaseDocumentsClient';

const VALID_KEY = '1501202601179001234500110010020001234561234567818';

async function flushAsync() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('InvoiceSriEntry (Brief 34ap)', () => {
  const onDocument = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    onDocument.mockReset();
  });

  afterEach(() => {
    delete window.BarcodeDetector;
    vi.useRealTimers();
  });

  it('muestra el conteo, el error en vivo y envía la clave limpia', async () => {
    const submit = vi.spyOn(purchaseDocumentsClient, 'submitAccessKey').mockResolvedValue({ ok: true, data: { id: 12 }, duplicate: false });
    render(<InvoiceSriEntry onDocument={onDocument} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clave de acceso' }));
    const input = screen.getByLabelText('Clave de acceso');
    fireEvent.change(input, { target: { value: '1'.repeat(48) } });
    expect(screen.getByText('48 de 49')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Consultar factura' })).toBeDisabled();

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(screen.getByText('La clave solo admite números, espacios y guiones.')).toBeInTheDocument();

    const spaced = `${VALID_KEY.slice(0, 20)} ${VALID_KEY.slice(20)}`;
    fireEvent.change(input, { target: { value: spaced } });
    fireEvent.click(screen.getByRole('button', { name: 'Consultar factura' }));

    await waitFor(() => expect(submit).toHaveBeenCalledWith(VALID_KEY));
    expect(onDocument).toHaveBeenCalledWith({ id: 12 }, false);
  });

  it('sube un XML y avisa cuando es duplicado', async () => {
    const upload = vi.spyOn(purchaseDocumentsClient, 'uploadInvoiceXml').mockResolvedValue({ ok: true, data: { id: 20 }, duplicate: true });
    render(<InvoiceSriEntry onDocument={onDocument} />);

    const file = new File(['<factura/>'], 'factura.xml', { type: 'text/xml' });
    fireEvent.change(screen.getByLabelText('Archivo XML de la factura'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar XML' }));

    await waitFor(() => expect(upload).toHaveBeenCalledWith(file));
    expect(onDocument).toHaveBeenCalledWith({ id: 20 }, true);
  });

  it('no muestra el escáner si el navegador no tiene BarcodeDetector', async () => {
    render(<InvoiceSriEntry onDocument={onDocument} />);
    await flushAsync();
    fireEvent.click(screen.getByRole('button', { name: 'Clave de acceso' }));
    expect(screen.queryByRole('button', { name: /Escanear código de barras/ })).not.toBeInTheDocument();
  });

  it('con BarcodeDetector simulado llena la clave y libera la cámara', async () => {
    vi.useFakeTimers();
    const stop = vi.fn();
    navigator.mediaDevices = { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) };
    window.BarcodeDetector = class {
      static getSupportedFormats() { return Promise.resolve(['code_128']); }
      detect() { return Promise.resolve([{ rawValue: VALID_KEY }]); }
    };

    render(<InvoiceSriEntry onDocument={onDocument} />);
    await flushAsync();
    fireEvent.click(screen.getByRole('button', { name: 'Clave de acceso' }));
    const scan = screen.getByRole('button', { name: /Escanear código de barras/ });

    fireEvent.click(scan);
    await flushAsync();
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });

    expect(screen.getByLabelText('Clave de acceso')).toHaveValue(VALID_KEY);
    expect(stop).toHaveBeenCalled();
    expect(screen.queryByText('Escaneando el código de barras')).not.toBeInTheDocument();
  });
});
