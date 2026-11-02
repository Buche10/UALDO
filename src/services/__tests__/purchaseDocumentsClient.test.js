import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  accessKeyError,
  buildConfirmLines,
  confirmInvoice,
  getInvoiceDocument,
  isValidSriAccessKey,
  listInvoiceDocuments,
  normalizeAccessKey,
  submitAccessKey,
  uploadInvoiceXml,
} from '../purchaseDocumentsClient';

const VALID_KEY = '1501202601179001234500110010020001234561234567818';

function keyWithVerifier(base) {
  let sum = 0;
  let weight = 2;
  for (let index = 47; index >= 0; index -= 1) {
    sum += Number(base[index]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  let digit = 11 - (sum % 11);
  if (digit === 11) digit = 0;
  if (digit === 10) digit = 1;
  return `${base}${digit}`;
}

describe('purchaseDocumentsClient (Brief 34ap)', () => {
  let requestSpy;
  let uploadSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    requestSpy = vi.spyOn(apiClient, 'request').mockResolvedValue({ ok: true, data: { data: { id: 12 } } });
    uploadSpy = vi.spyOn(apiClient, 'uploadFile').mockResolvedValue({ ok: true, status: 202, data: { data: { id: 12 }, duplicate: false } });
  });

  describe('uploadInvoiceXml', () => {
    it('rechaza archivos que no son XML, MIME inválido o más de 1 MB sin llamar a la red', async () => {
      const pdf = await uploadInvoiceXml({ name: 'factura.pdf', type: 'application/pdf', size: 10 });
      expect(pdf.status).toBe(422);
      const fakeXml = await uploadInvoiceXml({ name: 'factura.xml', type: 'text/plain', size: 10 });
      expect(fakeXml.status).toBe(422);
      const big = await uploadInvoiceXml({ name: 'factura.xml', type: 'text/xml', size: 1024 * 1024 + 1 });
      expect(big.status).toBe(422);
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('sube un XML válido y conserva el aviso de duplicado', async () => {
      const file = { name: 'factura.XML', type: 'application/xml', size: 900 };
      const res = await uploadInvoiceXml(file);
      expect(uploadSpy).toHaveBeenCalledWith('/purchase-documents', file);
      expect(res.data.id).toBe(12);
      expect(res.duplicate).toBe(false);
    });
  });

  describe('clave de acceso', () => {
    it('normaliza espacios y guiones', () => {
      expect(normalizeAccessKey(` ${VALID_KEY.slice(0, 20)} - ${VALID_KEY.slice(20)} `)).toBe(VALID_KEY);
      expect(isValidSriAccessKey(VALID_KEY)).toBe(true);
    });

    it('rechaza 48 dígitos, letras y verificador incorrecto sin llamar a la red', async () => {
      expect((await submitAccessKey('1'.repeat(48))).status).toBe(422);
      expect((await submitAccessKey('a'.repeat(49))).status).toBe(422);
      const wrong = `${VALID_KEY.slice(0, 48)}${VALID_KEY[48] === '9' ? '8' : '9'}`;
      expect((await submitAccessKey(wrong)).status).toBe(422);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('rechaza una clave que no es de factura', async () => {
      const otherType = `${VALID_KEY.slice(0, 8)}02${VALID_KEY.slice(10, 48)}`;
      const key = keyWithVerifier(otherType);
      expect(accessKeyError(key)).toBe('Esa clave no corresponde a una factura.');
      expect((await submitAccessKey(key)).status).toBe(422);
      expect(requestSpy).not.toHaveBeenCalled();
    });

    it('envía la clave limpia cuando es válida', async () => {
      const spaced = `${VALID_KEY.slice(0, 14)} ${VALID_KEY.slice(14, 28)}-${VALID_KEY.slice(28)}`;
      const res = await submitAccessKey(spaced);
      expect(requestSpy).toHaveBeenCalledWith('/purchase-documents/access-key', {
        method: 'POST',
        body: { access_key: VALID_KEY },
      });
      expect(res.data.id).toBe(12);
    });
  });

  describe('consulta y confirmación', () => {
    it('desenvuelve la consulta y la lista con su meta', async () => {
      requestSpy.mockResolvedValueOnce({ ok: true, data: { data: { id: 5, status: 'queued' } } });
      const one = await getInvoiceDocument(5);
      expect(one.data).toEqual({ id: 5, status: 'queued' });

      requestSpy.mockResolvedValueOnce({ ok: true, data: { data: [{ id: 5 }], meta: { current_page: 1, last_page: 2 } } });
      const list = await listInvoiceDocuments({ status: 'extracted', page: 2 });
      expect(requestSpy).toHaveBeenLastCalledWith('/purchase-documents?status=extracted&page=2');
      expect(list.data).toEqual([{ id: 5 }]);
      expect(list.meta.last_page).toBe(2);
    });

    it('envía source_index solo en las líneas de la factura y conserva la compra', async () => {
      requestSpy.mockResolvedValueOnce({ ok: true, data: { data: { id: 12 }, purchase: { id: 9, status: 'draft' } } });
      const res = await confirmInvoice(12, {
        supplier_id: 3,
        lines: [
          { source_index: 1, item_id: 8, quantity: '3', line_total: '30.00' },
          { item_id: 7, quantity: '5,000', line_total: '100.00', unit_factor: '12' },
          { source_index: 0, is_other: true, free_text_name: 'Fundas', note: 'No está en el catálogo', quantity: '2', line_total: '10.00' },
        ],
      });

      expect(requestSpy).toHaveBeenCalledWith('/purchase-documents/12/confirm', {
        method: 'POST',
        body: {
          supplier_id: 3,
          lines: [
            { quantity: '3', line_total: '30.00', source_index: 1, item_id: 8 },
            { quantity: '5.000', line_total: '100.00', unit_factor: '12', item_id: 7 },
            { quantity: '2', line_total: '10.00', source_index: 0, is_other: true, free_text_name: 'Fundas', note: 'No está en el catálogo', unit: 'unidad' },
          ],
        },
      });
      expect(res.purchase).toEqual({ id: 9, status: 'draft' });
    });

    it('valida proveedor, líneas y datos obligatorios antes de la red', async () => {
      expect((await confirmInvoice(12, { supplier_id: null, lines: [] })).status).toBe(422);
      expect((await confirmInvoice(12, { supplier_id: 3, lines: [] })).status).toBe(422);
      expect(buildConfirmLines([{ item_id: 3, quantity: '0', line_total: '1' }]).error).toBeDefined();
      expect(buildConfirmLines([{ is_other: true, source_index: 0, quantity: '1', line_total: '1' }]).error).toContain('nombre');
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });
});

describe('uploadFile', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('usa FormData, mantiene el token y no fija Content-Type', async () => {
    localStorage.setItem('ualdo_token', 'token-prueba');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: { id: 12 } }),
    });

    const file = new File(['<xml/>'], 'factura.xml', { type: 'text/xml' });
    const res = await apiClient.uploadFile('/purchase-documents', file);

    expect(res.ok).toBe(true);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/purchase-documents');
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('file')).toBe(file);
    expect(options.headers.Authorization).toBe('Bearer token-prueba');
    expect(options.headers['Content-Type']).toBeUndefined();
  });
});
