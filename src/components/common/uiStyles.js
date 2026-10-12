/**
 * Estilos compartidos de formularios y tarjetas (Briefs 20p y 22p). Solo
 * variables de src/styles/main.css.
 */
export const styles = {
  card: { padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)', fontSize: '13px' },
  fieldError: { fontSize: '11px', color: 'var(--error)', marginTop: '4px', display: 'block' },
  back: { alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px 0' },
  secondary: { padding: '10px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'var(--surface-strong)', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' },
  errorBox: { padding: '10px', borderRadius: '8px', background: 'var(--error-soft)', color: 'var(--error)', fontSize: '12px', border: '1px solid var(--border-error)' },
  muted: { textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' },
};
