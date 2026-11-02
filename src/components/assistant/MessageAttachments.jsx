import React from 'react';
import { FileText, Image as ImageIcon, File } from 'lucide-react';
import { attachmentKindLabel, shortAttachmentName } from './attachmentUi';

const ICONS = {
  xml: FileText,
  pdf: FileText,
  image: ImageIcon,
};

export default function MessageAttachments({ attachments = [] }) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return (
    <div className="message-attachments" aria-label="Adjuntos del mensaje">
      {attachments.map((attachment, index) => {
        const Icon = ICONS[attachment?.kind] || File;
        const name = attachment?.original_name || 'Archivo';
        return (
          <div className="message-attachment" key={`${attachment?.id || index}-${name}`}>
            <Icon size={14} aria-hidden="true" />
            <span title={name}>{shortAttachmentName(name, 34)}</span>
            <span className="message-attachment-kind">{attachmentKindLabel(attachment?.kind)}</span>
          </div>
        );
      })}
    </div>
  );
}
