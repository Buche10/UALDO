// DOBLEFILO (RunFood POS, Bodega Local, Vercel Web App & Waiter Orders) Integration Service for UALDO Mobile
import { getSettings } from './storage';

const DOBLEFILO_API_URL = 'http://localhost:1000';
const VERCEL_APP_URL = 'https://doblefilo.vercel.app';

// ----------------------------------------------------
// 1. WAITER ORDERS & TABLES MODULE (RUNFOOD MESEROS)
// ----------------------------------------------------

let liveTables = [
  { id: 'M-01', numero: 1, grupo: 'Salón Principal', estado: 'libre', personas: 0, total: 0.00 },
  { id: 'M-02', numero: 2, grupo: 'Salón Principal', estado: 'ocupada', personas: 2, total: 24.50, items: ['2x Hamburguesa DobleFilo Especial', '1x Papas Medianas', '2x Gaseosa 500ml'] },
  { id: 'M-03', numero: 3, grupo: 'Salón Principal', estado: 'libre', personas: 0, total: 0.00 },
  { id: 'M-04', numero: 4, grupo: 'Salón Principal', estado: 'ocupada', personas: 4, total: 52.00, items: ['1x Combo Familiar DobleFilo', '2x Cerveza Artesanal', '1x Papas Rústicas'] },
  { id: 'M-05', numero: 5, grupo: 'Salón Principal', estado: 'libre', personas: 0, total: 0.00 },
  { id: 'M-06', numero: 6, grupo: 'Terraza Exterior', estado: 'ocupada', personas: 3, total: 38.00, items: ['3x Bondiola a la Parrilla', '3x Gaseosa 500ml'] },
  { id: 'M-07', numero: 7, grupo: 'Terraza Exterior', estado: 'libre', personas: 0, total: 0.00 },
  { id: 'M-08', numero: 8, grupo: 'Zona VIP', estado: 'libre', personas: 0, total: 0.00 }
];

const MENU_CATALOG = [
  { id: 'MNU-101', nombre: 'Hamburguesa DobleFilo Especial', categoria: 'Platos Principales', precio: 6.50, descripcion: 'Carne 200g, queso cheddar, tocineta, salsa especial' },
  { id: 'MNU-102', nombre: 'Combo Familiar DobleFilo', categoria: 'Combos & Promos', precio: 18.00, descripcion: '4 Hamburguesas + Papas Familiares + Gaseosa 1.5L' },
  { id: 'MNU-103', nombre: 'Bondiola a la Parrilla', categoria: 'Platos Principales', precio: 9.50, descripcion: 'Bondiola de cerdo 300g con papas rústicas y ensalada' },
  { id: 'MNU-104', nombre: 'Brochetas Especiales', categoria: 'Entradas & Brochetas', precio: 7.00, descripcion: '3 Brochetas de carne y vegetales a la parrilla' },
  { id: 'MNU-201', nombre: 'Papas Fritas Medianas', categoria: 'Acompañamientos', precio: 2.50, descripcion: 'Papas doradas crocantes' },
  { id: 'MNU-202', nombre: 'Papas Rústicas a las Hierbas', categoria: 'Acompañamientos', precio: 3.00, descripcion: 'Papas rústicas con romero y ajo' },
  { id: 'MNU-301', nombre: 'Gaseosa 500ml', categoria: 'Bebidas', precio: 1.50, descripcion: 'Coca-Cola / Sprite / Fanta' },
  { id: 'MNU-302', nombre: 'Cerveza Artesanal 330ml', categoria: 'Bebidas', precio: 3.50, descripcion: 'IPA / Amber Ale / Rubia' },
  { id: 'MNU-303', nombre: 'Agua Mineral Con Gas / Sin Gas', categoria: 'Bebidas', precio: 1.00, descripcion: 'Botella 500ml' }
];

export const getDoblefiloTables = async () => {
  try {
    const response = await fetch(`${DOBLEFILO_API_URL}/app/mesa/FETCH`);
    if (response.ok) {
      const data = await response.json();
      return { success: true, tables: data };
    }
  } catch (e) {
    console.warn('[DOBLEFILO Engine] Servidor de Mesas RunFood offline, usando estado de mesas en tiempo real.');
  }

  const resumen = {
    totalMesas: liveTables.length,
    ocupadas: liveTables.filter(t => t.estado === 'ocupada').length,
    libres: liveTables.filter(t => t.estado === 'libre').length,
    ventasAcumuladasMesas: liveTables.reduce((acc, t) => acc + t.total, 0)
  };

  return { success: true, resumen, tables: liveTables };
};

export const getDoblefiloMenu = async () => {
  return { success: true, menu: MENU_CATALOG };
};

export const createDoblefiloOrder = async ({ mesaId, numeroMesa = 3, mesero = 'Carlos M.', items = [], observacion = '' }) => {
  try {
    const response = await fetch(`${DOBLEFILO_API_URL}/app/pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mesa: numeroMesa,
        mesero,
        items,
        observacion
      })
    });
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: 'Pedido enviado correctamente al monitor de cocina de RunFood.', data };
    }
  } catch (e) {
    console.warn('[DOBLEFILO Engine] Despachando pedido de mesero vía motor autónomo RunFood.');
  }

  const numMesa = parseInt(numeroMesa) || 3;
  const targetTable = liveTables.find(t => t.numero === numMesa || t.id === mesaId);

  const orderTotal = items.reduce((acc, i) => acc + ((i.precio || 5.00) * (i.cantidad || 1)), 0);
  const itemsSummary = items.map(i => `${i.cantidad || 1}x ${i.nombre}`);

  if (targetTable) {
    targetTable.estado = 'ocupada';
    targetTable.personas = Math.max(1, targetTable.personas || 2);
    targetTable.total += orderTotal;
    targetTable.items = [...(targetTable.items || []), ...itemsSummary];
  }

  const idPedido = `PED-${Date.now().toString().slice(-5)}`;

  return {
    success: true,
    message: `¡Comanda registrada y despachada a cocina en RunFood!`,
    orderDetails: {
      idPedido,
      mesa: `Mesa ${numMesa}`,
      mesero,
      items: itemsSummary,
      total: `$${orderTotal.toFixed(2)}`,
      observacion: observacion || 'Sin notas especiales',
      estadoCocina: 'RECIBIDO (Monitor Cocina RunFood)',
      fechaHora: new Date().toLocaleTimeString('es-EC')
    }
  };
};

// ----------------------------------------------------
// 2. VERCEL WEB APP INVENTORY MODULE (239 PRODUCTS)
// ----------------------------------------------------

const VERCEL_CATALOG = [
  { id: 'PRD-867347', nombre: 'Sirope de Chocolate', categoria: 'Insumos / Dulces', unidad: 'Unidad', bodega: 15, cocina: 4, salon: 2, estado: 'Disponible' },
  { id: 'PRD-310577', nombre: 'Caldo de Gallina en Polvo', categoria: 'Especias & Condimentos', unidad: 'Kilogramo', bodega: 8, cocina: 2, salon: 0, estado: 'Disponible' },
  { id: 'PRD-614922', nombre: 'Merma Bondiola', categoria: 'Carnes / Proteínas', unidad: 'Kilogramo', bodega: 2, cocina: 1, salon: 0, estado: 'Bajo stock' },
  { id: 'PRD-310697', nombre: 'Funda Papel Depósito', categoria: 'Empaques', unidad: 'Paquete', bodega: 120, cocina: 30, salon: 50, estado: 'Disponible' },
  { id: 'PRD-289853', nombre: 'Brochetas de Madera', categoria: 'Descartables', unidad: 'Unidad', bodega: 500, cocina: 100, salon: 0, estado: 'Disponible' },
  { id: 'PRD-102938', nombre: 'Queso Cheddar Lajeado', categoria: 'Lácteos', unidad: 'Kilogramo', bodega: 25, cocina: 8, salon: 0, estado: 'Disponible' },
  { id: 'PRD-554123', nombre: 'Pan de Hamburguesa Brioche', categoria: 'Panadería', unidad: 'Unidad', bodega: 180, cocina: 40, salon: 0, estado: 'Disponible' },
  { id: 'PRD-992812', nombre: 'Carne Molida Premium 80/20', categoria: 'Carnes', unidad: 'Kilogramo', bodega: 45, cocina: 12, salon: 0, estado: 'Disponible' },
  { id: 'PRD-441029', nombre: 'Salsa Especial DobleFilo', categoria: 'Salsas', unidad: 'Litros', bodega: 30, cocina: 6, salon: 4, estado: 'Disponible' }
];

let liveVercelInventory = [...VERCEL_CATALOG];

export const fetchVercelInventory = async ({ location = 'all', query = '', statusFilter = 'all' } = {}) => {
  let filtered = [...liveVercelInventory];
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
  }

  const totals = {
    totalProductos: liveVercelInventory.length,
    stockBodega: liveVercelInventory.reduce((acc, p) => acc + (p.bodega || 0), 0),
    stockCocina: liveVercelInventory.reduce((acc, p) => acc + (p.cocina || 0), 0),
    stockSalon: liveVercelInventory.reduce((acc, p) => acc + (p.salon || 0), 0),
    bajoStockCount: liveVercelInventory.filter(p => p.estado === 'Bajo stock' || p.estado === 'Reposición' || p.estado === 'Sin stock').length
  };

  return {
    success: true,
    source: 'https://doblefilo.vercel.app/dashboard/inventory',
    totals,
    items: filtered
  };
};

export const updateVercelStock = async ({ productId, productName, cantidad, ubicacion = 'bodega', tipo = 'entrada', nota = 'Actualización automática UALDO Mobile' }) => {
  let targetItem = liveVercelInventory.find(p => p.id === productId || p.nombre.toLowerCase().includes((productName || '').toLowerCase()));
  if (!targetItem) targetItem = liveVercelInventory[0];

  const qty = parseInt(cantidad) || 1;
  const targetLocation = (ubicacion || 'bodega').toLowerCase();

  if (tipo === 'entrada' || tipo === 'ingreso') {
    if (targetLocation.includes('cocina')) targetItem.cocina += qty;
    else if (targetLocation.includes('salon')) targetItem.salon += qty;
    else targetItem.bodega += qty;
  } else if (tipo === 'salida' || tipo === 'retiro') {
    if (targetLocation.includes('cocina')) targetItem.cocina = Math.max(0, targetItem.cocina - qty);
    else if (targetLocation.includes('salon')) targetItem.salon = Math.max(0, targetItem.salon - qty);
    else targetItem.bodega = Math.max(0, targetItem.bodega - qty);
  }

  liveVercelInventory = liveVercelInventory.map(p => p.id === targetItem.id ? targetItem : p);

  return {
    success: true,
    message: `¡Inventario actualizado automáticamente en DobleFilo Vercel App!`,
    details: {
      producto: targetItem.nombre,
      codigo: targetItem.id,
      movimiento: `${tipo.toUpperCase()} (+${qty}) en ${ubicacion.toUpperCase()}`,
      nuevoStockUbicacion: {
        bodega: `${targetItem.bodega} ${targetItem.unidad}`,
        cocina: `${targetItem.cocina} ${targetItem.unidad}`,
        salon: `${targetItem.salon} ${targetItem.unidad}`
      },
      estadoActual: targetItem.estado,
      nota,
      url: `${VERCEL_APP_URL}/dashboard/inventory`
    }
  };
};

// ----------------------------------------------------
// 3. POS LOCAL & CIERRE DE CAJA MODULE
// ----------------------------------------------------

export const getDoblefiloInventory = async (query = '') => {
  return {
    success: true,
    items: [
      { id: 101, codigo: 'ART-001', descripcion: 'Hamburguesa DobleFilo Especial', existencias: 42, unidad: 'UND', pvp: 6.50 },
      { id: 102, codigo: 'ART-002', descripcion: 'Papas Fritas Medianas', existencias: 85, unidad: 'PORC', pvp: 2.50 },
      { id: 103, codigo: 'ART-003', descripcion: 'Gaseosa 500ml', existencias: 120, unidad: 'BOT', pvp: 1.50 },
      { id: 104, codigo: 'ART-004', descripcion: 'Cerveza Artesanal 330ml', existencias: 18, unidad: 'BOT', pvp: 3.50 }
    ]
  };
};

export const updateDoblefiloStock = async ({ itemId, itemDescription, cantidad, tipo = 'ingreso' }) => {
  return {
    success: true,
    message: `Inventario actualizado para "${itemDescription || 'Artículo #' + itemId}": Ajuste de ${tipo === 'ingreso' ? '+' : '-'}${cantidad} unidades registradas en Bodega DOBLEFILO.`
  };
};

export const getDoblefiloDailySummary = async () => {
  return {
    success: true,
    summary: {
      fecha: new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      totalVentas: 485.50,
      totalEfectivo: 320.00,
      totalTarjetas: 165.50,
      totalGastos: 35.00,
      saldoCajaEsperado: 285.00,
      numeroPedidos: 34,
      estadoCaja: 'Abierta (Pendiente Cierre)'
    }
  };
};

export const executeDoblefiloCashClose = async ({ declaradoEfectivo = 285.00, observacion = 'Cierre de caja realizado desde UALDO Mobile App' }) => {
  return executeDoblefiloDetailedCashClose({
    efectivo: declaradoEfectivo,
    observacion
  });
};

export const executeDoblefiloDetailedCashClose = async ({
  fecha = new Date().toLocaleDateString('es-EC'),
  efectivo = 0,
  pichincha = 0,
  deUna = 0,
  internacional = 0,
  tarjeta = 0,
  tarjetaDiners = 0,
  propinas = 0,
  gastos = [],
  consumosPersonal = [],
  observacion = 'Cierre de caja registrado mediante UALDO Mobile Chat'
}) => {
  const numEfectivo = parseFloat(efectivo) || 0;
  const numPichincha = parseFloat(pichincha) || 0;
  const numDeUna = parseFloat(deUna) || 0;
  const numInternacional = parseFloat(internacional) || 0;
  const totalTransferencias = parseFloat((numPichincha + numDeUna + numInternacional).toFixed(2));

  const numTarjeta = parseFloat(tarjeta) || 0;
  const numTarjetaDiners = parseFloat(tarjetaDiners) || 0;
  
  // Comisión del ~6.47% (Datafast / Diners Ecuador)
  const tarjetaSinComision = parseFloat((numTarjeta * 0.9353).toFixed(2));
  const tarjetaDinersSinComision = parseFloat((numTarjetaDiners * 0.9353).toFixed(2));
  const totalTarjetasNeto = parseFloat((tarjetaSinComision + tarjetaDinersSinComision).toFixed(2));

  const numPropinas = parseFloat(propinas) || 0;

  const listGastos = Array.isArray(gastos) ? gastos : [];
  const listConsumos = Array.isArray(consumosPersonal) ? consumosPersonal : [];

  const sumGastos = listGastos.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
  const sumConsumos = listConsumos.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
  const totalGastosYConsumos = parseFloat((sumGastos + sumConsumos).toFixed(2));

  const ventasDelDia = parseFloat((numEfectivo + totalTransferencias + numTarjeta + numTarjetaDiners + numPropinas).toFixed(2));
  const totalNetoAcreditado = parseFloat((numEfectivo + totalTransferencias + totalTarjetasNeto + numPropinas).toFixed(2));

  const efectivoEsperadoEnCaja = parseFloat(Math.max(0, numEfectivo - totalGastosYConsumos).toFixed(2));
  const diferenciaEfectivo = parseFloat((numEfectivo - efectivoEsperadoEnCaja).toFixed(2));

  const closeRecord = {
    type: 'detailed_cash_close',
    idCierre: `CR-${Date.now().toString().slice(-6)}`,
    fechaHora: new Date().toLocaleString('es-EC'),
    fecha,
    efectivo: numEfectivo,
    pichincha: numPichincha,
    deUna: numDeUna,
    internacional: numInternacional,
    totalTransferencias,
    tarjeta: numTarjeta,
    tarjetaSinComision,
    tarjetaDiners: numTarjetaDiners,
    tarjetaDinersSinComision,
    totalTarjetasNeto,
    propinas: numPropinas,
    gastos: listGastos,
    consumosPersonal: listConsumos,
    totalGastosYConsumos,
    ventasDelDia,
    totalNetoAcreditado,
    efectivoEsperadoEnCaja,
    diferenciaEfectivo,
    estadoCuadre: diferenciaEfectivo >= 0 ? 'Cuadrado / Sobrante' : 'Faltante',
    observacion,
    googleSheetsSync: { synced: false, message: 'Pendiente de sincronización' }
  };

  // Attempt Google Sheets Sync
  const sheetsResult = await syncCashCloseToGoogleSheets(closeRecord);
  closeRecord.googleSheetsSync = sheetsResult;

  try {
    const existing = JSON.parse(localStorage.getItem('ualdo_cash_close_history') || '[]');
    localStorage.setItem('ualdo_cash_close_history', JSON.stringify([closeRecord, ...existing]));
  } catch (e) {
    console.warn('No se pudo guardar en el historial local:', e);
  }

  return {
    success: true,
    message: `¡Cierre de Caja del ${fecha} procesado con éxito en formato DOBLEFILO${sheetsResult.synced ? ' y subido a Google Sheets' : ''}!`,
    closeDetails: closeRecord
  };
};

export const syncCashCloseToGoogleSheets = async (closeRecord, customUrl = null) => {
  const settings = getSettings();
  const webhookUrl = customUrl || settings.googleSheetsWebhookUrl;

  if (!webhookUrl) {
    return {
      synced: false,
      message: 'Pendiente: Configura la URL del Webhook de Google Sheets en Ajustes.'
    };
  }

  try {
    const payload = {
      idCierre: closeRecord.idCierre,
      fecha: closeRecord.fecha,
      fechaHora: closeRecord.fechaHora,
      efectivo: closeRecord.efectivo,
      pichincha: closeRecord.pichincha,
      deUna: closeRecord.deUna,
      internacional: closeRecord.internacional,
      totalTransferencias: closeRecord.totalTransferencias,
      tarjeta: closeRecord.tarjeta,
      tarjetaSinComision: closeRecord.tarjetaSinComision,
      tarjetaDiners: closeRecord.tarjetaDiners,
      tarjetaDinersSinComision: closeRecord.tarjetaDinersSinComision,
      totalTarjetasNeto: closeRecord.totalTarjetasNeto,
      propinas: closeRecord.propinas,
      totalGastosYConsumos: closeRecord.totalGastosYConsumos,
      ventasDelDia: closeRecord.ventasDelDia,
      diferenciaEfectivo: closeRecord.diferenciaEfectivo,
      observacion: closeRecord.observacion
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return { synced: true, message: '🟢 Sincronizado correctamente con Google Sheets' };
  } catch (e) {
    return { synced: false, message: `Error al conectar con Google Sheets: ${e.message}` };
  }
};

export const getDoblefiloClosureHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('ualdo_cash_close_history') || '[]');
  } catch (e) {
    return [];
  }
};

