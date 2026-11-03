import React from 'react';
import MovementModal from './MovementModal';
import TransferModal from './TransferModal';
import ItemCreateModal from './ItemCreateModal';
import MovementsHistoryModal from './MovementsHistoryModal';

export default function InventoryModals({
  selectedItemForMovement,
  onCloseMovement,
  onMovementRegistered,
  selectedItemForTransfer,
  onCloseTransfer,
  onTransferSuccess,
  showCreateModal,
  onCloseCreate,
  onItemCreated,
  selectedItemForHistory,
  onCloseHistory,
}) {
  return (
    <>
      <MovementModal
        isOpen={Boolean(selectedItemForMovement)}
        item={selectedItemForMovement}
        onClose={onCloseMovement}
        onMovementRegistered={onMovementRegistered}
      />

      <TransferModal
        isOpen={Boolean(selectedItemForTransfer)}
        item={selectedItemForTransfer}
        onClose={onCloseTransfer}
        onTransferSuccess={onTransferSuccess}
      />

      <ItemCreateModal
        isOpen={showCreateModal}
        onClose={onCloseCreate}
        onItemCreated={onItemCreated}
      />

      <MovementsHistoryModal
        isOpen={Boolean(selectedItemForHistory)}
        item={selectedItemForHistory}
        onClose={onCloseHistory}
      />
    </>
  );
}
