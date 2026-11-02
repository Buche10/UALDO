import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CashDeclarationView from '../CashDeclarationView';
import CashDeclarationForm from '../CashDeclarationForm';
import * as apiClient from '../../../../services/apiClient';
import * as cashCloseClient from '../../../../services/cashCloseClient';
import { ABILITIES } from '../../../../services/permissions';

describe('CashDeclarationView & CashDeclarationForm (Brief 35p)', () => {
  const mockBorradorDeclaration = {
    fecha: '2026-11-02',
    estado: 'borrador',
    head_declaration: true,
    recount_count: 0,
    declared_by: null,
    medios: [
      { medio: 'efectivo', etiqueta: 'Efectivo', esperado: 185.0, declarado: null, diferencia: null },
      { medio: 'credito', etiqueta: 'Tarjeta de crédito', esperado: 486.37, declarado: null, diferencia: null },
    ],
  };

  const mockCerradoDeclaration = {
    fecha: '2026-11-02',
    estado: 'cerrado',
    head_declaration: true,
    recount_count: 0,
    declared_by: 'Carlos',
    medios: [
      { medio: 'efectivo', etiqueta: 'Efectivo', esperado: 185.0, declarado: 185.0, diferencia: 0 },
      { medio: 'credito', etiqueta: 'Tarjeta de crédito', esperado: 486.37, declarado: 486.37, diferencia: 0 },
    ],
    // Claves sensibles del motor que el jefe NUNCA debe ver
    tarjeta_neto: 450.25,
    gastos_del_libro: 120.0,
    comisiones: 36.12,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Acceso y permisos', () => {
    it('bloquea a usuarios sin cash.register', () => {
      vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
        id: 30,
        capabilities: { abilities: [ABILITIES.SUPPLY_REQUEST] },
      });

      render(<CashDeclarationView />);
      expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
      expect(screen.getByText(/Esta sección le corresponde al jefe de salón/i)).toBeInTheDocument();
    });

    it('permite acceso al usuario con cash.register y carga la declaración de hoy', async () => {
      vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
        id: 15,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });

      const getSpy = vi.spyOn(cashCloseClient, 'getDeclaration').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: mockBorradorDeclaration },
      });

      render(<CashDeclarationView />);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('hoy');
        expect(screen.getByText('Mi cierre de caja')).toBeInTheDocument();
        expect(screen.getByText('Por declarar')).toBeInTheDocument();
      });
    });
  });

  describe('Selector de fecha y vistas cerrada / revisión', () => {
    it('alterna entre Hoy y Ayer consultando getDeclaration', async () => {
      vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
        id: 15,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });

      const getSpy = vi.spyOn(cashCloseClient, 'getDeclaration').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: mockBorradorDeclaration },
      });

      render(<CashDeclarationView />);

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('hoy');
      });

      fireEvent.click(screen.getByRole('button', { name: 'Ayer' }));

      await waitFor(() => {
        expect(getSpy).toHaveBeenCalledWith('ayer');
      });
    });

    it('muestra el estado cerrado con Declarado por y oculta netos, gastos y comisiones', async () => {
      vi.spyOn(apiClient, 'getStoredUser').mockReturnValue({
        id: 15,
        capabilities: { abilities: [ABILITIES.CASH_REGISTER] },
      });

      vi.spyOn(cashCloseClient, 'getDeclaration').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: mockCerradoDeclaration },
      });

      render(<CashDeclarationView />);

      await waitFor(() => {
        expect(screen.getByText('Cerrado')).toBeInTheDocument();
        expect(screen.getByText('Carlos')).toBeInTheDocument();
        expect(screen.getByText('Resumen declarado')).toBeInTheDocument();
      });

      // Verificación estricta de privacidad: nunca se renderizan gastos, comisiones ni netos
      expect(screen.queryByText(/450\.25/)).not.toBeInTheDocument();
      expect(screen.queryByText(/120\.0/)).not.toBeInTheDocument();
      expect(screen.queryByText(/36\.12/)).not.toBeInTheDocument();
      expect(screen.queryByText(/comision/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/gastos/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/neto/i)).not.toBeInTheDocument();
    });
  });

  describe('CashDeclarationForm - Cálculo en vivo y Flujo de recuento', () => {
    it('calcula la diferencia por medio y total en vivo', () => {
      render(
        <CashDeclarationForm
          declaration={mockBorradorDeclaration}
          fecha="hoy"
          onSuccess={vi.fn()}
        />
      );

      const cashInput = screen.getByLabelText(/Efectivo contado/i);
      const cardInput = screen.getByLabelText(/Tarjeta de crédito/i);

      // Efectivo esperado: 185.00. Ingresar 190.00 -> Dif +5.00
      fireEvent.change(cashInput, { target: { value: '190.00' } });
      expect(screen.getByText('Dif: USD 5,00')).toBeInTheDocument();

      // Tarjeta esperada: 486.37. Ingresar 480.37 -> Dif -6.00
      fireEvent.change(cardInput, { target: { value: '480.37' } });
      expect(screen.getByText('Dif: USD -6,00')).toBeInTheDocument();

      // Total: +5.00 + -6.00 = -1.00
      expect(screen.getByText('USD -1,00')).toBeInTheDocument();
    });

    it('flujo feliz: cuadra y se cierra con mensaje Cierre enviado. Cuadró.', async () => {
      const onSuccess = vi.fn();
      const submitSpy = vi.spyOn(cashCloseClient, 'submitDeclaration').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { estado: 'cerrado' } },
      });

      render(
        <CashDeclarationForm
          declaration={mockBorradorDeclaration}
          fecha="hoy"
          onSuccess={onSuccess}
        />
      );

      fireEvent.change(screen.getByLabelText(/Efectivo contado/i), { target: { value: '185.00' } });
      fireEvent.change(screen.getByLabelText(/Tarjeta de crédito/i), { target: { value: '486.37' } });

      fireEvent.click(screen.getByRole('button', { name: 'Enviar cierre' }));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith('hoy', {
          efectivo_contado: '185.00',
          medios: [{ medio: 'credito', monto: '486.37' }],
        });
        expect(onSuccess).toHaveBeenCalledWith('Cierre enviado. Cuadró.');
      });
    });

    it('primera diferencia: 409 recount muestra aviso destacado y botón Enviar recuento manteniendo campos', async () => {
      const submitSpy = vi.spyOn(cashCloseClient, 'submitDeclaration').mockResolvedValue({
        ok: false,
        status: 409,
        isRecount: true,
        recount: true,
        message: 'Hay una diferencia de USD 10.00 en efectivo. Vuelve a contar antes de seguir.',
        medio: 'efectivo',
        diferencia: 1000,
      });

      render(
        <CashDeclarationForm
          declaration={mockBorradorDeclaration}
          fecha="hoy"
          onSuccess={vi.fn()}
        />
      );

      fireEvent.change(screen.getByLabelText(/Efectivo contado/i), { target: { value: '175.00' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar cierre' }));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Hay una diferencia de USD 10.00 en efectivo. Vuelve a contar antes de seguir/i)).toBeInTheDocument();
      });

      // Los campos se mantienen intactos
      expect(screen.getByLabelText(/Efectivo contado/i).value).toBe('175.00');

      // Botón pasa a Enviar recuento
      expect(screen.getByRole('button', { name: 'Enviar recuento' })).toBeInTheDocument();
    });

    it('sigue la diferencia tras recuento: exige causa y explicación, enviando a revisión', async () => {
      const onSuccess = vi.fn();
      const submitSpy = vi.spyOn(cashCloseClient, 'submitDeclaration').mockResolvedValue({
        ok: true,
        status: 200,
        data: { data: { estado: 'revision' } },
      });

      const declarationConRecuento = {
        ...mockBorradorDeclaration,
        recount_count: 1,
      };

      render(
        <CashDeclarationForm
          declaration={declarationConRecuento}
          fecha="hoy"
          onSuccess={onSuccess}
        />
      );

      // Como recount_count ya era >= 1, muestra el selector de causa
      expect(screen.getByText('El cierre quedará en revisión de administración')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Efectivo contado/i), { target: { value: '175.00' } });
      const selectCause = screen.getByLabelText(/Causa de la diferencia/i);
      const explanationInput = screen.getByLabelText(/Explicación/i);

      // Si elige 'otro' sin explicación, valida requerimiento
      fireEvent.change(selectCause, { target: { value: 'otro' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar con justificación' }));
      expect(screen.getByText('La explicación es obligatoria para esta causa.')).toBeInTheDocument();

      // Completar explicación válida
      fireEvent.change(explanationInput, { target: { value: 'Cliente salió sin pagar la cuenta 14.' } });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar con justificación' }));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith('hoy', {
          efectivo_contado: '175.00',
          medios: [{ medio: 'credito', monto: '0.00' }],
          difference_cause: 'otro',
          difference_explanation: 'Cliente salió sin pagar la cuenta 14.',
        });
        expect(onSuccess).toHaveBeenCalledWith('Cierre en revisión.');
      });
    });
  });
});
