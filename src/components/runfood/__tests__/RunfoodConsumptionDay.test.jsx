import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RunfoodConsumptionDay from '../RunfoodConsumptionDay';

describe('RunfoodConsumptionDay', () => {
  const baseConsumption = {
    fecha: '2026-10-29',
    estado: 'aplicado',
    run_id: 42,
    applied_at: '2026-10-30T00:35:12.000Z',
    lineas: [
      {
        inventory_item_id: 10,
        nombre: 'Papas Congeladas',
        unidad: 'kg',
        cantidad: '2.000',
        origenes: [
          {
            articulo_runfood_id: 201,
            descripcion: 'Porcion de Papas',
            cantidad_vendida: '10.000',
            cantidad_consumida: '2.000'
          }
        ]
      },
      {
        inventory_item_id: 15,
        nombre: 'Lomo Fino',
        unidad: 'kg',
        cantidad: '8.500',
        origenes: [
          {
            articulo_runfood_id: 101,
            descripcion: 'Lomo a la Plancha',
            cantidad_vendida: '34.000',
            cantidad_consumida: '8.500'
          }
        ]
      }
    ],
    sin_receta: [
      { articulo_runfood_id: 301, descripcion: 'Postre Casero', cantidad: '5.000' }
    ],
    incompletos: [
      { articulo_runfood_id: 302, descripcion: 'Ensalada Cesar', motivo: 'falta_aderezo', faltantes: ['Aderezo Cesar'] }
    ],
    con_opciones: [
      { articulo_runfood_id: 303, descripcion: 'Hamburguesa Especial', cantidad_vendida: '12.000' }
    ],
    stock_negativo: []
  };

  it('permite navegar entre dias con las flechas y cambiar fecha', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onDateChange = vi.fn();

    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={onDateChange}
        onPreviousDay={onPrev}
        onNextDay={onNext}
        consumption={baseConsumption}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Día anterior' }));
    expect(onPrev).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Día siguiente' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    const input = screen.getByLabelText('Fecha de consumo');
    fireEvent.change(input, { target: { value: '2026-10-25' } });
    expect(onDateChange).toHaveBeenCalledWith('2026-10-25');
  });

  it('muestra insumos ordenados de mayor a menor y permite desplegar platos de origen', () => {
    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={baseConsumption}
      />
    );

    // Debe mostrar Lomo Fino (8.500) antes que Papas Congeladas (2.000)
    const items = screen.getAllByText(/Lomo Fino|Papas Congeladas/);
    expect(items[0]).toHaveTextContent('Lomo Fino');
    expect(items[1]).toHaveTextContent('Papas Congeladas');

    // Desplegar origen de Lomo Fino
    const lomoBtn = screen.getByRole('button', { name: /Lomo Fino/i });
    expect(screen.queryByText('Lomo a la Plancha')).not.toBeInTheDocument();

    fireEvent.click(lomoBtn);
    expect(screen.getByText('Lomo a la Plancha')).toBeInTheDocument();
    expect(screen.getByText('(34 vend.)')).toBeInTheDocument();
  });

  it('muestra bloque No se desconto y permite navegar a recetas e ingredientes', () => {
    const onNavRecipes = vi.fn();
    const onNavMappings = vi.fn();

    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={baseConsumption}
        onNavigateToRecipes={onNavRecipes}
        onNavigateToMappings={onNavMappings}
      />
    );

    // Desplegar bloque No se desconto
    const toggleBtn = screen.getByRole('button', { name: /No se descontó/i });
    fireEvent.click(toggleBtn);

    // Articulo sin receta
    expect(screen.getByText(/Postre Casero/)).toBeInTheDocument();
    const createRecipeBtn = screen.getByRole('button', { name: 'Crear receta' });
    fireEvent.click(createRecipeBtn);
    expect(onNavRecipes).toHaveBeenCalledWith('Postre Casero');

    // Articulo incompleto
    expect(screen.getByText(/Ensalada Cesar/)).toBeInTheDocument();
    expect(screen.getByText(/Faltantes: Aderezo Cesar/)).toBeInTheDocument();
    const mapIngredientBtn = screen.getByRole('button', { name: 'Mapear insumo' });
    fireEvent.click(mapIngredientBtn);
    expect(onNavMappings).toHaveBeenCalledWith('Aderezo Cesar');

    // Articulo con opciones
    expect(screen.getByText(/Hamburguesa Especial/)).toBeInTheDocument();
    const viewRecipeBtn = screen.getByRole('button', { name: 'Ver receta' });
    fireEvent.click(viewRecipeBtn);
    expect(onNavRecipes).toHaveBeenCalledWith('Hamburguesa Especial');
  });

  it('muestra aviso de stock negativo y mensaje de ultimo error', () => {
    const consumptionWithWarnings = {
      ...baseConsumption,
      stock_negativo: [{ item_id: 10, nombre: 'Papas Congeladas' }],
      ultimo_error: {
        run_id: 99,
        mensaje: 'Fallo al procesar corrida 99',
        fecha_hora: '2026-10-30T05:00:00Z'
      }
    };

    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={consumptionWithWarnings}
      />
    );

    expect(screen.getByText(/Atención con inventario negativo/i)).toBeInTheDocument();
    expect(screen.getByText(/1 insumo quedó con stock negativo/i)).toBeInTheDocument();

    expect(screen.getByText(/Último error al procesar:/i)).toBeInTheDocument();
    expect(screen.getByText('Fallo al procesar corrida 99')).toBeInTheDocument();
  });

  it('muestra diferentes estados claros del dia (sin_ventas, apagado, antes_de_inicio, fallido)', () => {
    const { rerender } = render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={{ estado: 'sin_ventas', lineas: [] }}
      />
    );
    expect(screen.getByText('Sin ventas cerradas')).toBeInTheDocument();

    rerender(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={{ estado: 'apagado', lineas: [] }}
      />
    );
    expect(screen.getByText('Consumo desactivado')).toBeInTheDocument();

    rerender(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={{ estado: 'antes_de_inicio', lineas: [] }}
      />
    );
    expect(screen.getByText('Anterior a fecha de inicio')).toBeInTheDocument();

    rerender(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={{ estado: 'fallido', lineas: [] }}
      />
    );
    expect(screen.getByText('Falló la aplicación')).toBeInTheDocument();
  });

  it('muestra "Cargando..." en primera carga y no "Consumo desactivado"', () => {
    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={null}
        loading={true}
      />
    );
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('Consumo desactivado')).not.toBeInTheDocument();
  });

  it('con carga fallida (consumption null y error) muestra "No disponible" y no muestra "Consumo desactivado" ni bloques', () => {
    render(
      <RunfoodConsumptionDay
        date="2026-10-29"
        onDateChange={vi.fn()}
        onPreviousDay={vi.fn()}
        onNextDay={vi.fn()}
        consumption={null}
        loading={false}
        error="No se pudo cargar"
      />
    );
    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.queryByText('Consumo desactivado')).not.toBeInTheDocument();
    expect(screen.queryByText('Insumos descontados')).not.toBeInTheDocument();
  });
});
