import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Mic, Send } from 'lucide-react';
import AttachmentMenu from './AttachmentMenu';
import PendingAttachmentChips from './PendingAttachmentChips';
import { useChatAttachments } from './useChatAttachments';
import InvoiceBarcodeScanner from '../inventory/purchases/InvoiceBarcodeScanner';
import { isValidSriAccessKey } from '../../services/purchaseDocumentsClient';
import { ensureCameraAccess } from '../../services/cameraPermission';

const INVALID_KEY_MESSAGE = 'La clave de acceso no es válida. Revisa los 49 dígitos.';

export default function ChatComposer({ inputText, setInputText, loading, onSend }) {
  const {
    pendingAttachments,
    uploading,
    attachmentError,
    setAttachmentError,
    addFiles,
    removeAttachment,
    clearAttachments,
  } = useChatAttachments();
  const [isRecording, setIsRecording] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const recognitionRef = useRef(null);
  const isSpeechSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSpeechSupported) return undefined;
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-EC';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript).slice(0, 1000));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        // El reconocimiento puede no estar activo; no hay nada que liberar.
      }
    };
  }, [isSpeechSupported, setInputText]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (textOverride) => {
    if (loading || uploading) return;
    const text = textOverride !== undefined ? textOverride : inputText;
    const attachments = pendingAttachments;
    if (!String(text || '').trim() && attachments.length === 0) return;
    await onSend(text, attachments);
    if (attachments.length > 0) clearAttachments();
  };

  const handleBeforeCamera = async () => {
    setScannerError(null);
    const access = await ensureCameraAccess();
    if (!access.ok) {
      setAttachmentError(access.message);
      return false;
    }
    setAttachmentError(null);
    return true;
  };

  const openScanner = async () => {
    const allowed = await handleBeforeCamera();
    if (allowed) setScannerOpen(true);
  };

  const handleDetected = async (accessKey) => {
    setScannerOpen(false);
    if (!isValidSriAccessKey(accessKey)) {
      setScannerError(INVALID_KEY_MESSAGE);
      return;
    }
    setScannerError(null);
    await onSend(`Carga la factura con la clave ${accessKey}`, []);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const visibleError = attachmentError || scannerError;

  return (
    <div className="assistant-input-container">
      <PendingAttachmentChips
        attachments={pendingAttachments}
        onRemove={removeAttachment}
        disabled={loading}
      />

      {visibleError && (
        <div className="assistant-inline-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{visibleError}</span>
        </div>
      )}

      {scannerOpen && (
        <InvoiceBarcodeScanner
          onDetected={handleDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}

      {inputText.length >= 900 && (
        <div className="input-char-counter">
          {1000 - inputText.length} caracteres restantes
        </div>
      )}

      {uploading && <div className="attachment-uploading">Subiendo archivo...</div>}

      <div className="input-row">
        <AttachmentMenu
          disabled={loading || uploading}
          onFilesSelected={addFiles}
          onBeforeCamera={handleBeforeCamera}
          onScan={openScanner}
        />

        <textarea
          className="assistant-textarea"
          rows={1}
          maxLength={1000}
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje al asistente..."
          disabled={loading}
          aria-label="Mensaje para el asistente"
        />

        {isSpeechSupported && (
          <button
            type="button"
            className={`assistant-icon-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            aria-label={isRecording ? 'Detener grabación de voz' : 'Grabar mensaje de voz'}
            disabled={loading}
          >
            <Mic size={20} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          className="assistant-send-btn"
          onClick={() => handleSubmit()}
          disabled={(!inputText.trim() && pendingAttachments.length === 0) || loading || uploading}
          aria-label="Enviar mensaje"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
