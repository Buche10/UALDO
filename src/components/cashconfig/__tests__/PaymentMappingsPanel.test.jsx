import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentMappingsPanel from '../PaymentMappingsPanel';
import * as cashConfigClient from '../../../services/cashConfigClient';

const ARQUEO = { monto: 150.5, business_date: '2026-10-06', captured_at: '2026-10-06T23:59:00Z' };

const efectivo = {
  id: 1,
  runfood_forma_pago_id: 2,
  descripcion_runfood: 'EFECTIVO CAJA',
  es_efectivo: true,
  es_tarjeta: false,
  bucket: 'efectivo',
  suggested_bucket: null,
  suggested_note: null,
  confirmado: true,
  confirmed_at: '2026-10-01 10:00:00',
  ultimo_arqueo: ARQUEO
};

const transferenciaConSugerencia = {
  id: 2,
  runfood_forma_pago_id: 119,
  descripcion_runfood: 'TRANSFERENCIA',
  es_efectivo: false,
  es_tarjeta: false,
  bucket: 'sin_mapear',
  suggested_bucket: 'de_una',
  suggested_note: 'Parece transferencia De Una',
  confirmado: false,
  confirmed_at: null,
  ultimo_arqueo: { monto: 45, business_date: '2026-10-06' }
};

const impuestoXss = {
  id: 3,
  runfood_forma_pago_id: 332,
  descripcion_runfood: '<script>alert(1)</script>',
  es_efectivo: false,
  es_tarjeta: true,
  bucket: 'sin_mapear',
  suggested_bucket: null,
  suggested_note: null,
  confirmado: false,
  confirmed_at: null,
  ultimo_arqueo: null
};

const tarjeta = {
  id: 4,
  runfood_forma_pago_id: 105,
  descripcion_runfood: 'TARJETA DE CREDITO/DEBITO',
  es_efectivo: false,
  es_tarjeta: true,
  bucket: 'credito',
  suggested_bucket: null,
  suggested_note: null,
  confirmado: true,
  confirmed_at: '2026-10-01 10:00:00',
  ultimo_arqueo: { monto: 905, business_date: '2026-11-01' }
};

function mockLista(data) {
  return vi.spyOn(cashConfigClient, 'listPaymentMappings').mockResolvedValue({ ok: true, status: 200, data: { data } });
}

describe('PaymentMappingsPanel component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('muestra el aviso de formas con cobros sin asignar y las pone primero', async () => {
    mockLista([efectivo, transferenciaConSugerencia, impuestoXss]);

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Falta asignar 1 forma\(s\) con cobros/)).toBeInTheDocument();
    });

    const etiquetas = screen.getAllByText(/^(Falta asignar|Efectivo)$/);
    expect(etiquetas[0]).toHaveTextContent('Falta asignar');
    expect(screen.getByText(/Último cobro: USD 150,50 \(2026-10-06\)/)).toBeInTheDocument();
    expect(screen.queryByText(/cubeta|Libro diario/i)).toBeNull();
  });

  it('sin formas pendientes dice que todo está listo', async () => {
    mockLista([efectivo, tarjeta]);

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Todo listo: todas las formas con cobros tienen su casilla.')).toBeInTheDocument();
    });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('pliega las otras formas, las despliega con un clic y las marca Sin uso con XSS como texto', async () => {
    mockLista([efectivo, impuestoXss]);

    const { container } = render(<PaymentMappingsPanel />);

    const boton = await screen.findByRole('button', { name: 'Otras formas de RunFood (1)' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/muchas son códigos de impuestos del SRI/)).toBeInTheDocument();
    expect(screen.queryByText(/<script>alert\(1\)<\/script>/)).toBeNull();

    fireEvent.click(boton);

    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByText('Sin uso')).toBeInTheDocument();
    expect(screen.queryByText('Sin asignar')).toBeNull();
    expect(screen.queryByText('Sin movimientos recientes')).toBeNull();
    expect(window.localStorage.getItem('ualdo:pagos:otras-abierto')).toBe('1');
  });

  it('la forma de tarjeta asignada a crédito explica que RunFood junta crédito y débito', async () => {
    mockLista([tarjeta]);

    render(<PaymentMappingsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/RunFood junta crédito y débito en esta forma/)).toBeInTheDocument();
    });
  });

  it('permite aceptar sugerencia y actualiza la fila', async () => {
    mockLista([efectivo, transferenciaConSugerencia]);

    const acceptSpy = vi.spyOn(cashConfigClient, 'acceptSuggestion').mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...transferenciaConSugerencia, bucket: 'de_una', confirmado: true, confirmed_at: '2026-10-07 10:00:00' }
    });

    render(<PaymentMappingsPanel />);

    fireEvent.click(await screen.findByText('Aceptar sugerencia'));

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledWith(2);
      expect(screen.getByText(/Guardado\. Los días abiertos se vuelven a evaluar/i)).toBeInTheDocument();
    });
  });

  it('pide confirmacion especial si se selecciona "ignorar"', async () => {
    mockLista([transferenciaConSugerencia]);

    const assignSpy = vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...transferenciaConSugerencia, bucket: 'ignorar', confirmado: true }
    });

    render(<PaymentMappingsPanel />);

    fireEvent.click(await screen.findByText('Cambiar'));

    expect(screen.getByText('Elegir casilla')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('¿En qué casilla del cierre va?'), { target: { value: 'ignorar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(screen.getByText('Ignorar esta forma')).toBeInTheDocument();
      expect(screen.getByText('Esta forma de pago no se sumará en ningún cierre.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar ignorar' }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(2, 'ignorar');
      expect(screen.getByText(/Guardado\. Los días abiertos se vuelven a evaluar/i)).toBeInTheDocument();
    });
  });

  it('pide confirmacion si la forma ya estaba confirmada al cambiar la casilla', async () => {
    mockLista([efectivo]);

    const assignSpy = vi.spyOn(cashConfigClient, 'assignBucket').mockResolvedValue({
      ok: true,
      status: 200,
      data: { ...efectivo, bucket: 'pichincha', confirmado: true }
    });

    render(<PaymentMappingsPanel />);

    fireEvent.click(await screen.findByText('Cambiar'));
    fireEvent.change(screen.getByLabelText('¿En qué casilla del cierre va?'), { target: { value: 'pichincha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(screen.getByText('Cambiar la casilla de una forma ya confirmada afecta a los días abiertos.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(1, 'pichincha');
    });
  });
});
