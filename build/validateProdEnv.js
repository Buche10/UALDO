/**
 * Valida que las variables de entorno obligatorias para produccion esten definidas
 * y apunten a endpoints seguros HTTPS.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {true}
 * @throws {Error} si alguna variable falta o no usa HTTPS.
 */
export function validateProdEnv(env = {}) {
  const apiUrl = env.VITE_API_BASE_URL ? String(env.VITE_API_BASE_URL).trim() : '';
  if (!apiUrl) {
    throw new Error('Falta la variable de entorno obligatoria VITE_API_BASE_URL para producción.');
  }
  if (!apiUrl.startsWith('https://')) {
    throw new Error('La variable VITE_API_BASE_URL debe comenzar con https:// en producción.');
  }

  const teamsUrl = env.VITE_TEAMS_API_URL ? String(env.VITE_TEAMS_API_URL).trim() : '';
  if (!teamsUrl) {
    throw new Error('Falta la variable de entorno obligatoria VITE_TEAMS_API_URL para producción.');
  }
  if (!teamsUrl.startsWith('https://')) {
    throw new Error('La variable VITE_TEAMS_API_URL debe comenzar con https:// en producción.');
  }

  return true;
}
