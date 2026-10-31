import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SalesView from '../SalesView';
import * as salesClient from '../../../services/salesClient';

describe('SalesView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(salesClient, 'getSalesToday').mockResolvedValue({
      ok: true,
      data: {
        business_date: '2026-10-30',
        minutos_desde_captura: 10,
        totales: { pedidos: 5, total: '100.00' },
        articulos: []
      }
    });
    vi.spyOn(salesClient, 'getSalesSummary').mockResolvedValue({
      ok: true,
      data: {
        totales: { pedidos: 20, total: '500.00' },
        dias: []
      }
    });
    vi.spyOn(salesClient, 'getSalesHours').mockResolvedValue({
      ok: true,
      data: { horas: [] }
    });
    vi.spyOn(salesClient, 'getSalesItems').mockResolvedValue({
      ok: true,
      data: {
        data: [{ id: 1, articulo_id: 1, descripcion: 'Lomo saltado', cantidad: '5.000', total: '50.00' }],
        meta: { current_page: 1, last_page: 1, total: 1 }
      }
    });
  });

  it('renderiza la vista de ventas con sus 4 bloques principales', async () => {
    render(<SalesView />);

    expect(screen.getByRole('heading', { level: 2, name: /ventas/i })).toBeInTheDocument();
    expect(screen.getByText('Lectura analítica de ventas y platos desde RunFood.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Ventas de hoy')).toBeInTheDocument();
      expect(screen.getByText('Resumen del periodo')).toBeInTheDocument();
      expect(screen.getByText('Platos más vendidos')).toBeInTheDocument();
      expect(screen.getByText('Ventas por hora')).toBeInTheDocument();
    });
  });

  it('permite alternar entre presets y muestra selector de fechas al elegir Personalizado', async () => {
    render(<SalesView />);

    const p7d = screen.getByRole('button', { name: 'Últimos 7 días' });
    const p30d = screen.getByRole('button', { name: 'Últimos 30 días' });
    const pCustom = screen.getByRole('button', { name: 'Personalizado' });

    expect(p7d).toHaveAttribute('aria-pressed', 'true');
    expect(p30d).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByLabelText('Desde')).not.toBeInTheDocument();

    fireEvent.click(pCustom);

    await waitFor(() => {
      expect(pCustom).toHaveAttribute('aria-pressed', 'true');
      expect(p7d).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByLabelText('Desde')).toBeInTheDocument();
      expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
    });
  });

  it('permite recargar todos los bloques con el boton de cabecera', async () => {
    render(<SalesView />);

    const refreshBtn = screen.getByRole('button', { name: 'Actualizar datos de ventas' });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(salesClient.getSalesToday).toHaveBeenCalled();
      expect(salesClient.getSalesSummary).toHaveBeenCalled();
    });
  });

  it('permite alternar a la sección Personal y muestra el ranking', async () => {
    vi.spyOn(salesClient, 'getSalesStaff').mockResolvedValueOnce({
      ok: true,
      data: [{ runfood_user_id: 1, nombre: 'Carlos', total: '300.00' }]
    });

    render(<SalesView />);

    const personalTab = screen.getByRole('tab', { name: 'Personal' });
    expect(personalTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(personalTab);

    await waitFor(() => {
      expect(personalTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Ranking del personal')).toBeInTheDocument();
      expect(screen.getByText(/Carlos/)).toBeInTheDocument();
      expect(salesClient.getSalesStaff).toHaveBeenCalled();
    });
  });
});
