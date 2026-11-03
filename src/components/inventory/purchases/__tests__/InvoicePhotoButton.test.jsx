import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvoicePhotoButton from '../InvoicePhotoButton';
import * as purchaseDocumentsClient from '../../../../services/purchaseDocumentsClient';
import * as imageAttachments from '../../../../services/imageAttachments';

describe('InvoicePhotoButton (Brief 34bp)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el texto de ayuda y el input con capture=environment', () => {
    render(<InvoicePhotoButton onDocument={vi.fn()} />);

    expect(screen.getByText('Foto o PDF del recibo')).toBeInTheDocument();
    expect(screen.getByText('Si es factura electrónica, mejor usa la clave de acceso: los datos salen exactos del SRI.')).toBeInTheDocument();

    const input = document.getElementById('invoice-photo-file-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', 'image/*,application/pdf');
    expect(input).toHaveAttribute('capture', 'environment');
  });

  it('reduce la imagen y llama a uploadInvoiceFile y onDocument', async () => {
    const rawImage = new File(['img-data'], 'recibo_grande.jpg', { type: 'image/jpeg' });
    const resizedImage = new File(['resized-data'], 'recibo_grande.jpg', { type: 'image/jpeg' });

    const resizeSpy = vi.spyOn(imageAttachments, 'resizeImageFile').mockResolvedValue(resizedImage);
    const uploadSpy = vi.spyOn(purchaseDocumentsClient, 'uploadInvoiceFile').mockResolvedValue({
      ok: true,
      status: 202,
      data: { id: 45, status: 'queued', source: 'image' },
      duplicate: false,
    });

    const onDocument = vi.fn();
    render(<InvoicePhotoButton onDocument={onDocument} />);

    const input = document.getElementById('invoice-photo-file-input');
    fireEvent.change(input, { target: { files: [rawImage] } });

    await waitFor(() => expect(resizeSpy).toHaveBeenCalledWith(rawImage));
    expect(uploadSpy).toHaveBeenCalledWith(resizedImage);
    expect(onDocument).toHaveBeenCalledWith({ id: 45, status: 'queued', source: 'image' }, false);
  });

  it('sube PDF directamente y maneja errores de subida', async () => {
    const pdfFile = new File(['pdf-data'], 'factura.pdf', { type: 'application/pdf' });
    const resizeSpy = vi.spyOn(imageAttachments, 'resizeImageFile').mockResolvedValue(pdfFile);
    vi.spyOn(purchaseDocumentsClient, 'uploadInvoiceFile').mockResolvedValue({
      ok: false,
      status: 422,
      error: 'El PDF no puede superar 5 páginas.',
    });

    const onDocument = vi.fn();
    render(<InvoicePhotoButton onDocument={onDocument} />);

    const input = document.getElementById('invoice-photo-file-input');
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => expect(screen.getByText('El PDF no puede superar 5 páginas.')).toBeInTheDocument());
    expect(resizeSpy).toHaveBeenCalledWith(pdfFile);
    expect(onDocument).not.toHaveBeenCalled();
  });
});
