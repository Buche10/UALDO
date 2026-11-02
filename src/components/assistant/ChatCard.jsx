import React from 'react';

const KNOWN_TYPES = new Set(['list', 'table', 'stat']);
const BADGE_TONES = new Set(['neutral', 'success', 'warning', 'error']);
const MAX_ITEMS = 20;
const MAX_COLUMNS = 4;
const MAX_STATS = 6;

const asText = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const toneClass = (tone) => (BADGE_TONES.has(tone) ? tone : 'neutral');

function CardList({ card }) {
  const items = Array.isArray(card.items) ? card.items.slice(0, MAX_ITEMS) : [];
  return (
    <section className="chat-card" aria-label={asText(card.title) || 'Lista'}>
      {asText(card.title) && <h4 className="chat-card-title">{asText(card.title)}</h4>}
      <ul className="chat-card-list">
        {items.map((item, index) => {
          const title = asText(item?.title);
          const subtitle = asText(item?.subtitle);
          const badge = asText(item?.badge);
          return (
            <li className="chat-list-item" key={`${title}-${index}`}>
              <div className="chat-list-main">
                {title && <span className="chat-list-title">{title}</span>}
                {subtitle && <span className="chat-list-subtitle">{subtitle}</span>}
              </div>
              {badge && (
                <span className={`chat-badge ${toneClass(item?.badge_tone)}`}>{badge}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CardTable({ card }) {
  const columns = Array.isArray(card.columns) ? card.columns.slice(0, MAX_COLUMNS) : [];
  const rows = Array.isArray(card.rows) ? card.rows.slice(0, MAX_ITEMS) : [];
  if (columns.length === 0) return null;

  return (
    <section className="chat-card" aria-label={asText(card.title) || 'Tabla'}>
      {asText(card.title) && <h4 className="chat-card-title">{asText(card.title)}</h4>}
      <div className="chat-card-table-wrap">
        <table className="chat-card-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={`col-${index}`}>{asText(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {columns.map((column, columnIndex) => (
                  <td key={`cell-${rowIndex}-${columnIndex}`} data-label={asText(column)}>
                    {asText(Array.isArray(row) ? row[columnIndex] : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CardStat({ card }) {
  const items = Array.isArray(card.items) ? card.items.slice(0, MAX_STATS) : [];
  return (
    <section className="chat-card" aria-label={asText(card.title) || 'Resumen'}>
      {asText(card.title) && <h4 className="chat-card-title">{asText(card.title)}</h4>}
      <div className="chat-stat-grid">
        {items.map((item, index) => (
          <div className="chat-stat" key={`${asText(item?.label)}-${index}`}>
            <span className="chat-stat-value">{asText(item?.value)}</span>
            <span className="chat-stat-label">{asText(item?.label)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Dibuja solo los tipos cerrados del Brief 43; cualquier otro tipo se ignora. */
export default function ChatCard({ card }) {
  if (!card || !KNOWN_TYPES.has(card.type)) return null;
  if (card.type === 'list') return <CardList card={card} />;
  if (card.type === 'table') return <CardTable card={card} />;
  return <CardStat card={card} />;
}
