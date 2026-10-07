// UALDO Local Ecosystem & Apps Orchestrator
import { 
  getDoblefiloTables,
  getDoblefiloMenu,
  getDoblefiloInventory, 
  updateDoblefiloStock, 
  getDoblefiloDailySummary, 
  executeDoblefiloCashClose,
  executeDoblefiloDetailedCashClose
} from './doblefiloEngine';

const INITIAL_APPS = [
  {
    id: 'doblefilo_waiter_orders',
    name: 'RunFood - Visualización de Mesas y Menú',
    category: 'Restaurante / Meseros',
    description: 'Consulta de estado de mesas y catálogo de productos.',
    status: 'online',
    icon: 'Utensils',
    endpoint: 'http://localhost:1000/app/pedido',
    tools: [
      {
        name: 'doblefilo_get_tables',
        description: 'Obtiene el estado de las mesas en RunFood',
        parameters: {}
      },
      {
        name: 'doblefilo_get_menu',
        description: 'Obtiene el menú de platos y precios de RunFood',
        parameters: {}
      }
    ]
  },
  {
    id: 'doblefilo_pos',
    name: 'DOBLEFILO - Cierre de Caja & Ventas',
    category: 'Punto de Venta / POS',
    description: 'Resumen diario de ventas y cierre de turno.',
    status: 'online',
    icon: 'Zap',
    endpoint: 'http://localhost:1000/app/cierreCaja',
    tools: [
      {
        name: 'doblefilo_get_daily_summary',
        description: 'Obtiene el resumen de ventas del día en DOBLEFILO',
        parameters: {}
      },
      {
        name: 'doblefilo_execute_cash_close',
        description: 'Procesa el Cierre de Caja en DOBLEFILO',
        parameters: { declaradoEfectivo: 'number', observacion: 'string' }
      }
    ]
  }
];

const LOCAL_STORAGE_APPS_KEY = 'ualdo_registered_apps';

export const getRegisteredApps = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(INITIAL_APPS));
      return INITIAL_APPS;
    }
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_APPS;
  }
};

export const saveRegisteredApps = (apps) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(apps));
  } catch (e) {
    // ignore
  }
};

export const registerApp = (app) => {
  const current = getRegisteredApps();
  const exists = current.find(a => a.id === app.id);
  let updated;
  if (exists) {
    updated = current.map(a => a.id === app.id ? { ...a, ...app } : a);
  } else {
    updated = [...current, { ...app, id: app.id || `app_${Date.now()}` }];
  }
  saveRegisteredApps(updated);
  return updated;
};

export const executeLocalTool = async (toolName, params = {}) => {
  switch (toolName) {
    case 'doblefilo_get_tables':
      return await getDoblefiloTables();
    case 'doblefilo_get_menu':
      return await getDoblefiloMenu();
    case 'doblefilo_get_inventory':
      return await getDoblefiloInventory();
    case 'doblefilo_update_stock':
      return await updateDoblefiloStock(params);
    case 'doblefilo_get_daily_summary':
      return await getDoblefiloDailySummary();
    case 'doblefilo_execute_cash_close':
      return await executeDoblefiloCashClose(params);
    default:
      return { success: false, error: `Herramienta local no encontrada: ${toolName}` };
  }
};
