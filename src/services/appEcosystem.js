// UALDO Local Ecosystem & Apps Orchestrator
import { 
  getDoblefiloTables,
  getDoblefiloMenu,
  fetchVercelInventory,
  updateVercelStock,
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
    id: 'doblefilo_vercel_bodega',
    name: 'DobleFilo Vercel Web App (239 Productos)',
    category: 'Inventario & Bodega Web',
    description: 'Sincronización de existencias desde https://doblefilo.vercel.app/dashboard',
    status: 'online',
    icon: 'Globe',
    endpoint: 'https://doblefilo.vercel.app/dashboard/inventory',
    tools: [
      {
        name: 'doblefilo_vercel_get_inventory',
        description: 'Consulta existencias en DobleFilo Vercel App',
        parameters: { query: 'string', location: 'bodega|cocina|salon|all' }
      },
      {
        name: 'doblefilo_vercel_update_stock',
        description: 'Actualiza existencias en Vercel App',
        parameters: { productId: 'string', productName: 'string', cantidad: 'number', ubicacion: 'bodega|cocina|salon', tipo: 'entrada|salida|transferencia' }
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

export const registerApp = (newApp) => {
  const apps = getRegisteredApps();
  const updated = [...apps, { ...newApp, id: `custom_${Date.now()}`, status: 'online' }];
  saveRegisteredApps(updated);
  return updated;
};

// Tool Execution Dispatcher
export const executeLocalTool = async (toolName, params = {}) => {
  // Waiter Orders Handlers (Read-only TODO: migrar a motor)
  if (toolName === 'doblefilo_get_tables') {
    return await getDoblefiloTables();
  }

  if (toolName === 'doblefilo_get_menu') {
    return await getDoblefiloMenu();
  }

  // Vercel Web App Handlers
  if (toolName === 'doblefilo_vercel_get_inventory') {
    return await fetchVercelInventory(params);
  }

  if (toolName === 'doblefilo_vercel_update_stock') {
    return await updateVercelStock(params);
  }

  // DOBLEFILO Local Handlers
  if (toolName === 'doblefilo_get_inventory') {
    return await getDoblefiloInventory(params.query || '');
  }

  if (toolName === 'doblefilo_update_stock') {
    return await updateDoblefiloStock(params);
  }

  if (toolName === 'doblefilo_get_daily_summary') {
    return await getDoblefiloDailySummary();
  }

  if (toolName === 'doblefilo_execute_cash_close') {
    return await executeDoblefiloCashClose(params);
  }

  if (toolName === 'doblefilo_execute_detailed_cash_close') {
    return await executeDoblefiloDetailedCashClose(params);
  }

  switch (toolName) {
    case 'get_system_status':
      return {
        success: true,
        data: {
          cpu_usage: '15%',
          ram_used: '7.1 GB / 16 GB',
          waiter_orders_status: 'Online',
          vercel_app_status: 'Online',
          doblefilo_status: 'Online'
        }
      };

    default:
      return {
        success: false,
        error: `Herramienta local "${toolName}" no reconocida.`
      };
  }
};
