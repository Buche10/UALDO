import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as apiClient from '../apiClient';
import {
  accessKeyError,
  buildConfirmLines,
  confirmInvoice,
  getInvoiceDocument,
  invoiceFileBlob,
  isValidSriAccessKey,
  listInvoiceDocuments,
  normalizeAccessKey,
  submitAccessKey,
  uploadInvoiceFile,
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

describe('purchaseDocumentsClient (Brief 34ap / 34bp)', () => {
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

  describe('uploadInvoiceFile', () => {
    it('rechaza archivos que no son imagen ni PDF o más de 10 MB sin llamar a la red', async () => {
      const txt = await uploadInvoiceFile({ name: 'recibo.txt', type: 'text/plain', size: 10 });
      expect(txt.status).toBe(422);
      expect(txt.error).toContain('JPG, PNG o WEBP');
      const big = await uploadInvoiceFile({ name: 'recibo.jpg', type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 });
      expect(big.status).toBe(422);
      expect(big.error).toContain('10 MB');
      expect(uploadSpy).not.toHaveBeenCalled();
    });

    it('sube una imagen válida y desenvuelve la respuesta', async () => {
      const file = { name: 'recibo.jpg', type: 'image/jpeg', size: 2000 };
      const res = await uploadInvoiceFile(file);
      expect(uploadSpy).toHaveBeenCalledWith('/purchase-documents', file);
      expect(res.data.id).toBe(12);
      expect(res.duplicate).toBe(false);
    });

    it('sube un PDF válido', async () => {
      const file = { name: 'recibo.pdf', type: 'application/pdf', size: 50000 };
      const res = await uploadInvoiceFile(file);
      expect(uploadSpy).toHaveBeenCalledWith('/purchase-documents', file);
      expect(res.data.id).toBe(12);
    });
  });

  describe('invoiceFileBlob', () => {
    it('devuelve null si el id es inválido', async () => {
      expect(await invoiceFileBlob(null)).toBeNull();
      expect(await invoiceFileBlob('abc')).toBeNull();
    });

    it('descarga el blob pasando Bearer token y base url', async () => {
      vi.spyOn(apiClient, 'getApiBaseUrl').mockReturnValue('http://ualbusiness.test/api/v1');
      vi.spyOn(apiClient, 'getAuthToken').mockReturnValue('token-123');
      const fakeBlob = new Blob(['contenido'], { type: 'image/jpeg' });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(fakeBlob),
      });

      const result = await invoiceFileBlob(12);
      expect(fetchSpy).toHaveBeenCalledWith('http://ualbusiness.test/api/v1/purchase-documents/12/file', {
        headers: { Authorization: 'Bearer token-123' },
      });
      expect(result).toBe(fakeBlob);
    });

    it('devuelve null si la respuesta de red falla', async () => {
      vi.spyOn(apiClient, 'getApiBaseUrl').mockReturnValue('http://ualbusiness.test/api/v1');
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403 });
      expect(await invoiceFileBlob(12)).toBeNull();
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
      expect(list.data).toEqual([{ id: 5 }]);
      expect(list.meta).toEqual({ current_page: 1, last_page: 2 });
      expect(requestSpy).toHaveBeenCalledWith('/purchase-documents?status=extracted&page=2');
    });

    it('confirma validando insumos y líneas', async () => {
      expect((await confirmInvoice(null)).status).toBe(400);
      expect((await confirmInvoice(5, { supplier_id: null })).status).toBe(422);
      expect((await confirmInvoice(5, { supplier_id: 3, lines: [] })).status).toBe(422);

      const res = await confirmInvoice(5, {
        supplier_id: 3,
        lines: [{ item_id: 10, quantity: '2.000', line_total: '20.00', source_index: 0 }],
      });
      expect(requestSpy).toHaveBeenCalledWith('/purchase-documents/5/confirm', {
        method: 'POST',
        body: {
          supplier_id: 3,
          lines: [{ item_id: 10, quantity: '2.000', line_total: '20.00', source_index: 0 }],
        },
      });
      expect(res.data.id).toBe(12);
    });
  });

  describe('buildConfirmLines', () => {
    it('rechaza líneas vacías, cantidades o totales inválidos', () => {
      expect(buildConfirmLines([]).error).toBe('Agrega al menos una línea.');
      expect(buildConfirmLines([{ quantity: '0', line_total: '10' }]).error).toContain('cantidad');
      expect(buildConfirmLines([{ quantity: '1', line_total: 'abc' }]).error).toContain('total');
      expect(buildConfirmLines([{ quantity: '1', line_total: '10', source_index: -1 }]).error).toContain('factura');
      expect(buildConfirmLines([{ quantity: '1', line_total: '10', unit_factor: '0' }]).error).toContain('factor');
      expect(buildConfirmLines([{ quantity: '1', line_total: '10', item_id: null }]).error).toContain('insumo');
      expect(buildConfirmLines([{ quantity: '1', line_total: '10', is_other: true, free_text_name: '' }]).error).toContain('nombre');
      expect(buildConfirmLines([{ quantity: '1', line_total: '10', is_other: true, free_text_name: 'Hielo', note: '' }]).error).toContain('motivo');
    });

    it('arma líneas válidas con insumo y como otra compra', () => {
      const built = buildConfirmLines([
        { quantity: '1.5', line_total: '12.50', item_id: 4, source_index: 0, unit_factor: '1.0' },
        { quantity: '2', line_total: '5.00', is_other: true, free_text_name: 'Carbón', note: 'De paso', unit: 'bolsa' },
      ]);
      expect(built.error).toBeNull();
      expect(built.lines).toEqual([
        { quantity: '1.5', line_total: '12.50', item_id: 4, source_index: 0, unit_factor: '1.0' },
        { quantity: '2', line_total: '5.00', is_other: true, free_text_name: 'Carbón', note: 'De paso', unit: 'bolsa' },
      ]);
    });
  });
});
