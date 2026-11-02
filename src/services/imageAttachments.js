export const MAX_IMAGE_DIMENSION = 2000;
export const JPEG_QUALITY = 0.85;

export const isImageFile = (file) => {
  const type = String(file?.type || '').toLowerCase();
  return type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp';
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  const cleanup = () => URL.revokeObjectURL(url);
  image.onload = () => {
    cleanup();
    resolve(image);
  };
  image.onerror = () => {
    cleanup();
    reject(new Error('No se pudo leer la imagen.'));
  };
  image.src = url;
});

const canvasToFile = (canvas, fileName) => new Promise((resolve) => {
  if (typeof canvas.toBlob !== 'function') {
    resolve(null);
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) {
      resolve(null);
      return;
    }
    const baseName = String(fileName || 'imagen').replace(/\.[^.]+$/, '');
    resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
  }, 'image/jpeg', JPEG_QUALITY);
});

/**
 * Reduce una imagen a MAX_IMAGE_DIMENSION por su lado mayor usando canvas.
 * Solo devuelve un archivo nuevo cuando hace falta; si no, conserva el original.
 */
export async function resizeImageFile(file) {
  if (!file || !isImageFile(file)) return file;

  let image;
  try {
    image = await loadImage(file);
  } catch {
    return file;
  }

  const width = Number(image.naturalWidth || image.width || 0);
  const height = Number(image.naturalHeight || image.height || 0);
  const largest = Math.max(width, height);
  if (!largest || largest <= MAX_IMAGE_DIMENSION) return file;

  const scale = MAX_IMAGE_DIMENSION / largest;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext?.('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const resized = await canvasToFile(canvas, file.name);
  return resized || file;
}
