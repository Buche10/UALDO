import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentMappingsPanel from '../PaymentMappingsPanel';
import * as cashConfigClient from '../../../services/cashConfigClient';

describe('PaymentMappingsPanel component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMappings = [
    {
      id: 1,
      runfood_forma_pago_id: 101,
      descripcion_runfood: 'EFECTIVO CAJA',
      es_efectivo: true,
      es_tarjeta: false,
      bucket: 'efectivo',
      suggested_bucket: null,
      suggested_note: null,
      confirmado: true,
      confirmed_at: '2026-10-01 10:00:00',
      ultimo_arqueo: {
        monto: 150.5,
        business_date: '2026-10-06',
        captured_at: '2026-10-06T23:59:00Z'
      }
    },
    {
      id: 2,
      runfood_forma_pago_id: 102,
      descripcion_runfood: 'NUEVA FORMA DESC',
      es_efectivo: false,
      es_tarjeta: false,
      bucket: 'sin_mapear',
      suggested_bucket: 'de_una',
      suggested_note: 'Parece transferencia De Una',
      confirmado: false,
      confirmed_at: null,
      ultimo_arqueo: null
    },
    {
      id: 3,
      runfood_forma_pago_id: 105,
      descripcion_runfood: '<script>alert(1)</script>',
      es_efectivo: false,
      es_tarjeta: true,
      bucket: 'sin_mapear',
      suggested_bucket: null,
      suggested_note: null,
      confirmado: false,
      confirmed_at: null,
      ultimo_arqueo: null
    }
  ];

  it('ordena las formas sin asignar primero y renderiza XSS como texto plano', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: mockMappings }
    });

    const { container } = render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/NUEVA FORMA DESC/i)).toBeInTheDocument();
    });

    const items = screen.getAllByText(/Sin asignar|Efectivo/);
    // El primer badge de estado debe ser "Sin asignar"
    expect(items[0]).toHaveTextContent('Sin asignar');

    // Comprobar que script no se inyectó en DOM
    expect(screen.getByText(/<script>alert\(1\)<\/script>/i)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();

    // Muestra "Sin movimientos recientes" en los que no tienen arqueo
    const sinMovs = screen.getAllByText('Sin movimientos recientes');
    expect(sinMovs.length).toBeGreaterThanOrEqual(1);

    // Muestra monto y fecha del ultimo arqueo
    expect(screen.getByText(/USD 150,50/i)).toBeInTheDocument();
    expect(screen.getByText(/2026-10-06/i)).toBeInTheDocument();
  });

  it('permite aceptar sugerencia y actualiza la fila', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: mockMappings }
    });

    const acceptSpy = vi.spyOn(cashConfigClient, 'acceptSuggestion').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ...mockMappings[1],
        bucket: 'de_una',
        confirmado: true,
        confirmed_at: '2026-10-07 10:00:00'
      }
    });

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Aceptar sugerencia')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Aceptar sugerencia'));

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith(2);
      expect(screen.getByText(/Guardado\. Los días abiertos se vuelven a evaluar/i)).toBeInTheDocument();
    });
  });

  it('pide confirmacion especial si se selecciona "ignorar"', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockMappings[1]] } // sin confirmar, sin_mapear
    });

    const assignSpy = vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ...mockMappings[1],
        bucket: 'ignorar',
        confirmado: true
      }
    });

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Cambiar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cambiar'));

    // Cambiar selector a ignorar
    const select = screen.getByLabelText(/Selecciona cubeta de destino/i);
    fireEvent.change(select, { target: { value: 'ignorar' } });

    // Clic en Guardar
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    // Debe saltar confirmacion de Ignorar
    await waitFor(() => {
      expect(screen.getByText('Esta forma de pago no se sumará en ningún cierre.')).toBeInTheDocument();
    });

    // Confirmar
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar ignorar' }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(2, 'ignorar');
      expect(screen.getByText(/Guardado\. Los días abiertos se vuelven a evaluar/i)).toBeInTheDocument();
    });
  });

  it('pide confirmacion si la forma ya estaba confirmada al cambiar la cubeta', async () => {
    vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({
      ok: true,
      status: 200,
      data: { data: [mockMappings[0]] } // confirmado: true, bucket: efectivo
    });

    const assignSpy = vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ...mockMappings[0],
        bucket: 'pichincha',
        confirmado: true
      }
    });

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Cambiar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cambiar'));

    const select = screen.getByLabelText(/Selecciona cubeta de destino/i);
    fireEvent.change(select, { target: { value: 'pichincha' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    // Debe advertir que cambiar forma confirmada afecta dias abiertos
    await waitFor(() => {
      expect(screen.getByText('Cambiar la cubeta de una forma ya confirmada afecta a los días abiertos.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(1, 'pichincha');
    });
  });
});
