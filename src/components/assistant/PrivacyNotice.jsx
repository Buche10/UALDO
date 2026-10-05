import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const PRIVACY_TEXT = 'Aviso de Privacidad: Este chat utiliza inteligencia artificial (DeepSeek y OpenAI) para ayudarte con pedidos de insumos e inventario del restaurante. Solo compartimos tu primer nombre y los datos de tus pedidos. Nunca compartas datos personales, telefonos, correos ni datos de clientes por este medio.';

export default function PrivacyNotice({ userId, onAcknowledge }) {
  const storageKey = `ualdo_privacy_ack_${userId || 'anonymous'}_v1`;
  const [acknowledged, setAcknowledged] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch (e) {
      return false;
    }
  });

  if (acknowledged) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch (e) {}
    setAcknowledged(true);
    if (onAcknowledge) {
      onAcknowledge();
    }
  };

  return (
    <div className="assistant-privacy-banner" role="region" aria-label="Aviso de Privacidad">
      <div className="assistant-privacy-content">
        <ShieldAlert size={20} className="assistant-privacy-icon" aria-hidden="true" />
        <p className="assistant-privacy-text">{PRIVACY_TEXT}</p>
      </div>
      <button
        type="button"
        className="assistant-privacy-btn"
        onClick={handleDismiss}
        aria-label="Aceptar aviso de privacidad"
      >
        Entendido
      </button>
    </div>
  );
}
