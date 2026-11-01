import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyCloseCard from '../DailyCloseCard';

describe('DailyCloseCard component (Brief 31p / 31p_fix)', () => {
  const baseItem = {
    location: 'kitchen',
    location_label: 'Cocina',
    count_id: 15,
    status: 'pending',
    differences_count: 0,
    unexplained_count: 0,
  };

  it('en estado pending con canCount muestra Empezar conteo', () => {
    const onStartCount = vi.fn();
    render(
      <DailyCloseCard
        item={baseItem}
        canCount={true}
        onStartCount={onStartCount}
      />
    );

    expect(screen.getByText('Cocina')).toBeInTheDocument();
    expect(screen.getByText('Sin empezar')).toBeInTheDocument();

    const startBtn = screen.getByRole('button', { name: /Empezar conteo/i });
    fireEvent.click(startBtn);
    expect(onStartCount).toHaveBeenCalledWith('kitchen');
  });

  it('en estado draft muestra Continuar conteo y quién contó', () => {
    const onOpenCount = vi.fn();
    render(
      <DailyCloseCard
        item={{ ...baseItem, status: 'draft', counted_by: 'Carlos Dueño' }}
        canCount={true}
        onOpenCount={onOpenCount}
      />
    );

    expect(screen.getByText('Contando')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();

    const contBtn = screen.getByRole('button', { name: /Continuar conteo/i });
    fireEvent.click(contBtn);
    expect(onOpenCount).toHaveBeenCalledWith(15);
  });

  it('en estado submitted muestra diferencias pendientes y Revisar/Ver diferencias según canValidate', () => {
    const onOpenDifferences = vi.fn();
    const { rerender } = render(
      <DailyCloseCard
        item={{ ...baseItem, status: 'submitted', differences_count: 3, unexplained_count: 2 }}
        canValidate={true}
        onOpenDifferences={onOpenDifferences}
      />
    );

    expect(screen.getByText('Enviado: 2 diferencias por explicar')).toBeInTheDocument();
    const reviewBtn = screen.getByRole('button', { name: /Revisar diferencias/i });
    fireEvent.click(reviewBtn);
    expect(onOpenDifferences).toHaveBeenCalledWith(15);

    // Sin permiso de validar ve Ver diferencias
    rerender(
      <DailyCloseCard
        item={{ ...baseItem, status: 'submitted', differences_count: 3, unexplained_count: 2 }}
        canValidate={false}
        onOpenDifferences={onOpenDifferences}
      />
    );
    expect(screen.getByRole('button', { name: /Ver diferencias/i })).toBeInTheDocument();
  });

  it('en estado validated muestra Ver detalle y badge de auto-validación si aplica', () => {
    render(
      <DailyCloseCard
        item={{
          ...baseItem,
          status: 'validated',
          validated_by: 'Ana Jefa',
          self_validated: true,
          difference_value_cents: 1250,
        }}
        canSeeCosts={true}
      />
    );

    expect(screen.getByText('Validado')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Validado por quien contó')).toBeInTheDocument();
    expect(screen.getByText(/Valor diferencias:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver detalle/i })).toBeInTheDocument();
  });

  describe('Cierre escalado (Requerimiento 1)', () => {
    it('escalado sin enviar y con canAdjust ve Completar conteo', () => {
      const onOpenCount = vi.fn();
      render(
        <DailyCloseCard
          item={{ ...baseItem, status: 'escalated', submitted_at: null, differences_count: 0 }}
          canAdjust={true}
          onOpenCount={onOpenCount}
        />
      );

      expect(screen.getByText('Escalado')).toBeInTheDocument();
      const completeBtn = screen.getByRole('button', { name: /Completar conteo/i });
      fireEvent.click(completeBtn);
      expect(onOpenCount).toHaveBeenCalledWith(15);
    });

    it('escalado sin enviar y sin canAdjust ve etiqueta Escalado a administración sin botones', () => {
      render(
        <DailyCloseCard
          item={{ ...baseItem, status: 'escalated', submitted_at: null, differences_count: 0 }}
          canAdjust={false}
        />
      );

      expect(screen.getByText('Escalado a administración')).toBeInTheDocument();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('escalado y enviado ve Ver o Revisar diferencias según canValidate', () => {
      const onOpenDifferences = vi.fn();
      render(
        <DailyCloseCard
          item={{ ...baseItem, status: 'escalated', submitted_at: '2026-11-01T12:00:00Z', differences_count: 2 }}
          canValidate={true}
          onOpenDifferences={onOpenDifferences}
        />
      );

      const diffBtn = screen.getByRole('button', { name: /Revisar diferencias/i });
      fireEvent.click(diffBtn);
      expect(onOpenDifferences).toHaveBeenCalledWith(15);
    });
  });
});
