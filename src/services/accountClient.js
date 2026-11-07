import { request } from './apiClient';

const LETTER_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const NUMBER_PATTERN = /\d/;

const invalid = (error) => ({ ok: false, status: 400, error });

/**
 * Cambia la contraseña del usuario autenticado.
 * Valida localmente las reglas visibles antes de llamar al motor.
 *
 * @param {{ currentPassword: string, password: string, passwordConfirmation: string }} payload
 * @returns {Promise<{ ok: boolean, status: number, data?: object, error?: string }>}
 */
export async function changePassword({
  currentPassword,
  password,
  passwordConfirmation,
} = {}) {
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return invalid('Escribe tu contraseña actual.');
  }

  if (typeof password !== 'string' || password.length < 8) {
    return invalid('La nueva contraseña debe tener al menos 8 caracteres.');
  }

  if (!LETTER_PATTERN.test(password) || !NUMBER_PATTERN.test(password)) {
    return invalid('La nueva contraseña debe incluir letras y números.');
  }

  if (password !== passwordConfirmation) {
    return invalid('Las contraseñas nuevas no coinciden.');
  }

  return request('/me/password', {
    method: 'PUT',
    body: {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
}
