import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OpenTablesView, { REFRESH_INTERVAL_MS } from '../OpenTablesView';
import * as openTablesClient from '../../../services/openTablesClient';

const baseMesa = {
  pedido_id: 123456,
  mesa: '4',
  grupo: 'SALON',
  etiqueta: 'Mesa 4 (SALON)',
  pax: 4,
  mesero: 'Juan',
  abierta_desde: '2026-11-09T20:05:00-05:00',
  minutos_abierta: 95,
  de_dia_anterior: false,
  precuenta: true,
  total: '45.60',
  facturado: '0.00',
  pendiente: '45.60',
};

const responseWithAmounts = (overrides = {}) => ({
  ok: true,
  status: 200,
  data: {
    capturada_en: '2026-11-09T21:40:12-05:00',
    desactualizado: false,
    minutos_desde_foto: 3,
    mostrar_montos: true,
    resumen: {
      mesas: 1,
      total: '45.60',
      pendiente: '45.60',
      con_precuenta: 1,
      mas_antigua_desde: '2026-11-09T20:05:00-05:00',
    },
    mesas: [baseMesa],
    ...overrides,
  },
});

const responseWithoutAmounts = () => ({
  ok: true,
  status: 200,
  data: {
    capturada_en: '2026-11-09T21:40:12-05:00',
    desactualizado: false,
    minutos_desde_foto: 3,
    mostrar_montos: false,
    resumen: {
      mesas: 1,
      con_precuenta: 1,
      mas_antigua_desde: '2026-11-09T20:05:00-05:00',
    },
    mesas: [
      {
        pedido_id: 123456,
        mesa: '4',
        etiqueta: 'Mesa 4 (SALON)',
        pax: 4,
        mesero: 'Juan',
        abierta_desde: '2026-11-09T20:05:00-05:00',
        minutos_abierta: 95,
        de_dia_anterior: false,
        precuenta: true,
      },
    ],
  },
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function setVisibility(value) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => value,
  });
}

describe('OpenTablesView (Brief 47p)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-09T22:00:00-05:00'));
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setVisibility('visible');
  });

  it('pinta las mesas y los montos cuando el motor los envía', async () => {
    vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(responseWithAmounts());

    render(<OpenTablesView />);
    await flush();

    expect(screen.getByRole('heading', { level: 2, name: /Mesas abiertas/ })).toBeInTheDocument();
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
    expect(screen.getByText('Desde 20:05 (1 h 55 min)')).toBeInTheDocument();
    expect(screen.getByText('Precuenta')).toBeInTheDocument();
    expect(screen.getByText('Mesas abiertas: 1')).toBeInTheDocument();
    expect(screen.getByText('Con precuenta: 1')).toBeInTheDocument();
    expect(screen.getByText('La más antigua desde 20:05')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar: USD 45,60')).toBeInTheDocument();
    expect(screen.getByText('Por cobrar USD 45,60')).toBeInTheDocument();
    expect(screen.getByText(/Lectura de las 21:40/)).toBeInTheDocument();
  });

  it('no pinta ninguna cifra de dinero cuando mostrar_montos es falso', async () => {
    vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(responseWithoutAmounts());

    render(<OpenTablesView />);
    await flush();

    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
    expect(screen.queryByText(/USD/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Por cobrar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cobrado en parte/)).not.toBeInTheDocument();
  });

  it('muestra el estado vacío con la hora de lectura', async () => {
    vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(
      responseWithAmounts({
        resumen: { mesas: 0, total: '0.00', pendiente: '0.00', con_precuenta: 0 },
        mesas: [],
      })
    );

    render(<OpenTablesView />);
    await flush();

    expect(screen.getByText('No hay mesas abiertas en RunFood.')).toBeInTheDocument();
    expect(screen.getByText('Lectura de las 21:40.')).toBeInTheDocument();
  });

  it('muestra el error y permite reintentar', async () => {
    const spy = vi.spyOn(openTablesClient, 'getOpenTables')
      .mockResolvedValueOnce({ ok: false, status: 500, error: 'Error al leer mesas' })
      .mockResolvedValueOnce(responseWithAmounts());

    render(<OpenTablesView />);
    await flush();

    expect(screen.getByRole('alert')).toHaveTextContent('Error al leer mesas');

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await flush();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
  });

  it('muestra el aviso de lectura vieja y el de datos ausentes', async () => {
    vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(
      responseWithAmounts({ desactualizado: true })
    );

    const { unmount } = render(<OpenTablesView />);
    await flush();

    expect(screen.getByText(/el local no ha enviado mesas desde entonces/)).toBeInTheDocument();
    unmount();

    openTablesClient.getOpenTables.mockResolvedValue(
      responseWithAmounts({ capturada_en: null, desactualizado: false, mesas: [], resumen: { mesas: 0 } })
    );

    render(<OpenTablesView />);
    await flush();

    expect(screen.getAllByText('Todavía no llegan datos de mesas desde el local.').length).toBeGreaterThan(0);
  });

  it('refresca cada 30 segundos y limpia el intervalo al desmontar', async () => {
    const spy = vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(responseWithAmounts());

    const { unmount } = render(<OpenTablesView />);
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS - 1);
    });
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    await flush();
    expect(spy).toHaveBeenCalledTimes(2);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('no refresca con la vista oculta y refresca al volver a primer plano', async () => {
    const spy = vi.spyOn(openTablesClient, 'getOpenTables').mockResolvedValue(responseWithAmounts());

    setVisibility('hidden');
    render(<OpenTablesView />);
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS * 2);
    });
    expect(spy).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await flush();
    expect(spy).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    });
    await flush();
    expect(spy).toHaveBeenCalledTimes(3);

    setVisibility('hidden');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('un refresco silencioso no muestra el estado de carga y actualiza la lectura', async () => {
    let resolveSecond;
    vi.spyOn(openTablesClient, 'getOpenTables')
      .mockResolvedValueOnce(responseWithAmounts())
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecond = resolve;
      }));

    render(<OpenTablesView />);
    await flush();
    expect(screen.getByText(/Lectura de las 21:40/)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_INTERVAL_MS);
    });

    expect(screen.queryByText('Cargando mesas abiertas...')).not.toBeInTheDocument();
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();

    await act(async () => {
      resolveSecond(responseWithAmounts({ capturada_en: '2026-11-09T21:41:12-05:00' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText(/Lectura de las 21:41/)).toBeInTheDocument();
    expect(screen.getByText('Mesa 4 (SALON)')).toBeInTheDocument();
  });

  it('ignora un refresco manual mientras hay una petición en curso', async () => {
    let resolveSecond;
    const spy = vi.spyOn(openTablesClient, 'getOpenTables')
      .mockResolvedValueOnce(responseWithAmounts())
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecond = resolve;
      }));

    render(<OpenTablesView />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    fireEvent.click(screen.getByRole('button', { name: /Actualizar/ }));

    expect(spy).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolveSecond(responseWithAmounts());
      await Promise.resolve();
      await Promise.resolve();
    });
  });
});
