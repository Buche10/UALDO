export const KIND_LABELS = {
  xml: 'XML',
  pdf: 'PDF',
  image: 'Imagen',
};

export const attachmentKindLabel = (kind) => KIND_LABELS[kind] || 'Archivo';

export const shortAttachmentName = (name, maxLength = 28) => {
  const clean = String(name || 'Archivo').trim() || 'Archivo';
  if (clean.length <= maxLength) return clean;
  const head = clean.slice(0, Math.max(8, maxLength - 10));
  const tail = clean.slice(-7);
  return `${head}...${tail}`;
};
