import React from 'react';
import { FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { attachmentKindLabel, shortAttachmentName } from './attachmentUi';

const ICONS = {
  xml: FileText,
  pdf: FileText,
  image: ImageIcon,
};

export default function PendingAttachmentChips({ attachments = [], onRemove, disabled = false }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <div className="pending-attachments" aria-label="Adjuntos pendientes">
      {attachments.map((attachment, index) => {
        const Icon = ICONS[attachment?.kind] || File;
        const name = attachment?.original_name || 'Archivo';
        return (
          <div className="pending-attachment" key={`${attachment?.id || index}-${name}`}>
            <Icon size={14} aria-hidden="true" />
            <span className="pending-attachment-name" title={name}>
              {shortAttachmentName(name)}
            </span>
            <span className="pending-attachment-kind">{attachmentKindLabel(attachment?.kind)}</span>
            <button
              type="button"
              className="pending-attachment-remove"
              onClick={() => onRemove?.(attachment)}
              disabled={disabled}
              aria-label={`Quitar ${name}`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
