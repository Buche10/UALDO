import { teamsRequest } from './teamsClient';

/**
 * Service client for Mobile Inventory endpoints (NexoTeams API).
 * All requests use Sanctum Bearer authentication automatically via teamsRequest.
 */

export const fetchInventory = async () => {
  return teamsRequest('/mobile/inventory');
};

export const createInventoryItem = async (itemData) => {
  return teamsRequest('/mobile/inventory', {
    method: 'POST',
    body: itemData,
  });
};

export const addInventoryMovement = async (itemId, movementData) => {
  return teamsRequest(`/mobile/inventory/${itemId}/movement`, {
    method: 'POST',
    body: movementData,
  });
};

export const fetchInventoryAlerts = async () => {
  return teamsRequest('/mobile/inventory/alerts');
};
