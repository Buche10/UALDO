import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CashCloseDetail from '../CashCloseDetail';
import * as cashCloseClient from '../../../services/cashCloseClient';
import * as cashMovementsClient from '../../../services/cashMovementsClient';

describe('CashCloseDetail component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cashMovementsClient, 'listMovements').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [], meta: { current_page: 1, last_page: 1 }, totals: { gastos_diarios: 0 } }
    });
  });

  it('no calcula nada en el cliente y muestra la diferencia de efectivo exacta del servidor', async () => {
    const mockCierre = {
      fecha: '2026-10-05',
      status: 'revision',
      efectivo_declarado: 200.0,
      efectivo_esperado: 100.0,
      // La resta daria +100.0, pero el servidor devuelve -12.4
      diferencia_efectivo: -12.4,
      ventas_del_dia: 671.37,
      tarjeta_neto: null,
      valor_en_cuentas: null,
      discrepancias: [
        { tipo: 'sin_conteo_efectivo', motivo: 'Falta conteo' }
      ]
    };

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockCierre] }
    });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('USD -12,40')).toBeInTheDocument();
    });
  });

  it('muestra "Pendiente" cuando tarjeta_neto y valor_en_cuentas son null, nunca "USD 0,00"', async () => {
    const mockCierre = {
      fecha: '2026-10-05',
      status: 'revision',
      tarjeta_neto: null,
      valor_en_cuentas: null,
      discrepancias: []
    };

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockCierre] }
    });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      // Debe haber al menos dos textos "Pendiente"
      const pendientes = screen.getAllByText('Pendiente');
      expect(pendientes.length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText('USD 0,00')).not.toBeInTheDocument();
    });
  });

  it('renderiza CashCloseReviewForm cuando el cierre esta en revision', async () => {
    const mockCierreRevision = {
      fecha: '2026-10-05',
      status: 'revision',
      discrepancias: []
    };

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockCierreRevision] }
    });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Revisar y Cerrar Día')).toBeInTheDocument();
      expect(screen.queryByText('Cargar netos del banco')).not.toBeInTheDocument();
      expect(screen.queryByText('Reabrir el día')).not.toBeInTheDocument();
    });
  });

  it('renderiza CashCloseClosedActions cuando el cierre esta cerrado', async () => {
    const mockCierreCerrado = {
      fecha: '2026-10-05',
      status: 'cerrado',
      discrepancias: []
    };

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockCierreCerrado] }
    });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByText('Revisar y Cerrar Día')).not.toBeInTheDocument();
      expect(screen.getByText('Cargar netos del banco')).toBeInTheDocument();
      expect(screen.getByText('Reabrir el día')).toBeInTheDocument();
    });
  });

  it('renderiza motivos con HTML malicioso como texto plano sin crear etiquetas img', async () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const mockCierre = {
      fecha: '2026-10-05',
      status: 'revision',
      discrepancias: [
        { tipo: 'desconocido', motivo: malicious }
      ]
    };

    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockCierre] }
    });

    const { container } = render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(malicious)).toBeInTheDocument();
      expect(container.querySelector('img[src="x"]')).toBeNull();
    });
  });

  it('muestra formulario manual si no existe cierre para la fecha', async () => {
    vi.spyOn(cashCloseClient, 'getClose').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [] }
    });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/No existe un cierre registrado para el 2026-10-05/i)).toBeInTheDocument();
      expect(screen.getByText('Cargar Cierre a Mano')).toBeInTheDocument();
    });
  });

  it('muestra mensaje de error si la API de cierre falla y permite recargar', async () => {
    const getSpy = vi.spyOn(cashCloseClient, 'getClose')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error de servidor'
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          data: [{
            fecha: '2026-10-05',
            status: 'cerrado',
            auto_cerrado: true,
            reopened_at: '2026-10-06 10:00',
            forced_reason: 'Motivo forzado de prueba',
            sheets_status: 'sincronizado',
            source: 'runfood',
            snapshot: { captured_at: '2026-10-05T23:50:00Z' },
            observacion: 'Caja sin novedades',
            discrepancias: []
          }]
        }
      });

    render(<CashCloseDetail fecha="2026-10-05" onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Error de servidor')).toBeInTheDocument();
    });

    // Clic en recargar dia
    fireEvent.click(screen.getByLabelText(/Recargar día/i));

    await waitFor(() => {
      expect(screen.getByText(/Cerrado automáticamente/i)).toBeInTheDocument();
      expect(screen.getByText(/Reabierto el 2026-10-06 10:00/i)).toBeInTheDocument();
      expect(screen.getByText(/Forzado: Motivo forzado de prueba/i)).toBeInTheDocument();
      expect(screen.getByText(/Sheets: sincronizado/i)).toBeInTheDocument();
      expect(screen.getByText('Caja sin novedades')).toBeInTheDocument();
    });
  });
});
