import React, { useRef, useState } from 'react';
import { Camera, FolderOpen, Paperclip, ScanLine } from 'lucide-react';

const CAMERA_ACCEPT = 'image/*';
const FILE_ACCEPT = 'image/*,application/pdf,.xml,text/xml,application/xml';

export default function AttachmentMenu({ disabled = false, onFilesSelected, onBeforeCamera, onScan }) {
  const [open, setOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length > 0) onFilesSelected?.(files);
  };

  const handleCamera = async () => {
    setOpen(false);
    const allowed = onBeforeCamera ? await onBeforeCamera() : true;
    if (allowed) cameraInputRef.current?.click();
  };

  const handleFile = () => {
    setOpen(false);
    fileInputRef.current?.click();
  };

  const handleScan = () => {
    setOpen(false);
    onScan?.();
  };

  return (
    <div className="attachment-menu-wrap">
      <button
        type="button"
        className="assistant-icon-btn"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        aria-label="Adjuntar archivo"
        aria-expanded={open}
      >
        <Paperclip size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className="attachment-menu" role="menu" aria-label="Opciones para adjuntar">
          <button type="button" role="menuitem" onClick={handleCamera} disabled={disabled}>
            <Camera size={16} aria-hidden="true" />
            <span>Tomar foto</span>
          </button>
          <button type="button" role="menuitem" onClick={handleFile} disabled={disabled}>
            <FolderOpen size={16} aria-hidden="true" />
            <span>Foto o archivo</span>
          </button>
          <button type="button" role="menuitem" onClick={handleScan} disabled={disabled}>
            <ScanLine size={16} aria-hidden="true" />
            <span>Escanear clave del SRI</span>
          </button>
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept={CAMERA_ACCEPT}
        capture="environment"
        onChange={handleFiles}
        className="visually-hidden-input"
        aria-label="Tomar foto"
        tabIndex={-1}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        onChange={handleFiles}
        className="visually-hidden-input"
        aria-label="Foto o archivo"
        tabIndex={-1}
      />
    </div>
  );
}
