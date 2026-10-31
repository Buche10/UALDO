import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesStaffRanking from '../SalesStaffRanking';
import * as salesClient from '../../../services/salesClient';

describe('SalesStaffRanking (Brief 27p)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el ranking ordenado por total leyendo data.empleados con anulaciones del contrato', async () => {
    vi.spyOn(salesClient, 'getSalesStaff').mockResolvedValueOnce({
      ok: true,
      data: {
        from: '2026-10-01',
        to: '2026-10-07',
        totales: { pedidos: 50, total: '1000.00' },
        empleados: [
          {
            runfood_user_id: 1,
            nombre: 'Juan Mesero',
            total: '200.00',
            pedidos: 10,
            ticket_promedio: '20.00',
            participacion: '20.0',
            mesas: 8,
            propina: '15.00',
            anulados: { pedidos: 1, total: '10.00' }
          },
          {
            runfood_user_id: 2,
            nombre: 'Maria Bartender',
            total: '800.00',
            pedidos: 40,
            ticket_promedio: '20.00',
            participacion: '80.0',
            mesas: 25,
            propina: '60.00',
            anulados: null
          }
        ]
      }
    });

    render(<SalesStaffRanking from="2026-10-01" to="2026-10-07" enabled={true} />);

    await waitFor(() => {
      // Maria tiene mayor venta (800) que Juan (200), debe aparecer primera
      expect(screen.getByText('1. Maria Bartender')).toBeInTheDocument();
      expect(screen.getByText('2. Juan Mesero')).toBeInTheDocument();
      expect(screen.getByText('USD 800,00')).toBeInTheDocument();
      expect(screen.getByText('USD 200,00')).toBeInTheDocument();
      expect(screen.getByText('80% part.')).toBeInTheDocument();
      expect(screen.getByText('20% part.')).toBeInTheDocument();
      expect(screen.getByText('Mesas: 25')).toBeInTheDocument();
      expect(screen.getByText('Propina: USD 60,00')).toBeInTheDocument();
      expect(screen.getByText('Anulaciones: 1 (USD 10,00)')).toBeInTheDocument();
      expect(screen.getByText('Anulaciones: No disponible')).toBeInTheDocument();
    });

    const mariaProgress = screen.getByLabelText('Participación de Maria Bartender');
    expect(mariaProgress).toHaveAttribute('aria-valuenow', '80');
  });

  it('muestra estado vacío cuando no hay datos de personal', async () => {
    vi.spyOn(salesClient, 'getSalesStaff').mockResolvedValueOnce({
      ok: true,
      data: { from: '2026-10-01', to: '2026-10-07', empleados: [] }
    });

    render(<SalesStaffRanking from="2026-10-01" to="2026-10-07" enabled={true} />);

    await waitFor(() => {
      expect(screen.getByText('No hay datos de ventas por personal para este periodo.')).toBeInTheDocument();
    });
  });

  it('muestra error y botón de reintentar si falla la carga', async () => {
    const staffSpy = vi.spyOn(salesClient, 'getSalesStaff')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        error: 'Error interno del servidor'
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { empleados: [] }
      });

    render(<SalesStaffRanking from="2026-10-01" to="2026-10-07" enabled={true} />);

    await waitFor(() => {
      expect(screen.getByText('Error interno del servidor')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(staffSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('abre el modal de Nombres del personal renderizado en document.body con portal', async () => {
    vi.spyOn(salesClient, 'getSalesStaff').mockResolvedValueOnce({
      ok: true,
      data: { empleados: [] }
    });
    vi.spyOn(salesClient, 'listRunfoodStaff').mockResolvedValueOnce({
      ok: true,
      data: { data: [], current_page: 1, last_page: 1 }
    });

    render(<SalesStaffRanking from="2026-10-01" to="2026-10-07" enabled={true} />);

    const aliasesBtn = screen.getByRole('button', { name: /nombres del personal/i });
    fireEvent.click(aliasesBtn);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog.parentElement).toBe(document.body);
      expect(screen.getByText('Asigna un nombre reconocible a cada usuario de RunFood para el ranking y los informes.')).toBeInTheDocument();
    });
  });
});
