import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InvoiceFilePreview from '../InvoiceFilePreview';
import * as purchaseDocumentsClient from '../../../../services/purchaseDocumentsClient';

describe('InvoiceFilePreview (Brief 34bp)', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:http://localhost/fake-url'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('no renderiza nada si no es imagen ni PDF', () => {
    const { container } = render(<InvoiceFilePreview documentId={10} source="sri_access_key" mime="text/xml" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra la imagen usando URL.createObjectURL y la libera al desmontar', async () => {
    const fakeBlob = new Blob(['img-bytes'], { type: 'image/jpeg' });
    vi.spyOn(purchaseDocumentsClient, 'invoiceFileBlob').mockResolvedValue(fakeBlob);
    URL.createObjectURL.mockReturnValue('blob:http://localhost/fake-image');

    const { unmount } = render(<InvoiceFilePreview documentId={15} source="image" mime="image/jpeg" />);

    await waitFor(() => expect(screen.getByAltText('Foto del recibo')).toBeInTheDocument());
    const img = screen.getByAltText('Foto del recibo');
    expect(img).toHaveAttribute('src', 'blob:http://localhost/fake-image');
    expect(URL.createObjectURL).toHaveBeenCalledWith(fakeBlob);

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/fake-image');
  });

  it('muestra el botón Ver PDF y abre el documento en una nueva pestaña', async () => {
    const fakeBlob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    vi.spyOn(purchaseDocumentsClient, 'invoiceFileBlob').mockResolvedValue(fakeBlob);
    URL.createObjectURL.mockReturnValue('blob:http://localhost/fake-pdf');
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<InvoiceFilePreview documentId={20} source="pdf" mime="application/pdf" />);

    const button = screen.getByRole('button', { name: 'Ver PDF' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    await waitFor(() => expect(openSpy).toHaveBeenCalledWith('blob:http://localhost/fake-pdf', '_blank'));
  });
});
