import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JPEG_QUALITY, MAX_IMAGE_DIMENSION, resizeImageFile } from '../imageAttachments';

const originalCreateElement = document.createElement.bind(document);

const imageFile = (name = 'foto.jpg', type = 'image/jpeg') => new File(['x'], name, { type });

class FakeImage {
  constructor() {
    this.naturalWidth = 4000;
    this.naturalHeight = 2000;
  }

  set src(value) {
    this._src = value;
    if (this.onload) this.onload();
  }
}

describe('resizeImageFile (Brief 42p)', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:foto'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('deja intactos los archivos que no son imagen', async () => {
    const file = new File(['x'], 'factura.pdf', { type: 'application/pdf' });
    await expect(resizeImageFile(file)).resolves.toBe(file);
  });

  it('no redimensiona una imagen dentro de 2000 px', async () => {
    vi.stubGlobal('Image', class extends FakeImage {
      constructor() {
        super();
        this.naturalWidth = 1200;
        this.naturalHeight = 800;
      }
    });
    const file = imageFile();
    await expect(resizeImageFile(file)).resolves.toBe(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto');
  });

  it('reduce con canvas y calidad 0.85 cuando el lado mayor supera 2000 px', async () => {
    vi.stubGlobal('Image', FakeImage);
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback) => callback(new Blob(['reducida'], { type: 'image/jpeg' })));
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return originalCreateElement(tag);
      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({ drawImage })),
        toBlob,
      };
    });

    const result = await resizeImageFile(imageFile('foto-grande.png', 'image/png'));

    expect(MAX_IMAGE_DIMENSION).toBe(2000);
    expect(JPEG_QUALITY).toBe(0.85);
    expect(drawImage).toHaveBeenCalledWith(expect.any(FakeImage), 0, 0, 2000, 1000);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.85);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('foto-grande.jpg');
    expect(result.type).toBe('image/jpeg');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto');
  });

  it('conserva el original si la imagen no se puede leer o no hay canvas', async () => {
    vi.stubGlobal('Image', class {
      set src(value) {
        this._src = value;
        if (this.onerror) this.onerror();
      }
    });
    const unreadable = imageFile();
    await expect(resizeImageFile(unreadable)).resolves.toBe(unreadable);

    vi.stubGlobal('Image', FakeImage);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag !== 'canvas') return originalCreateElement(tag);
      return { width: 0, height: 0, getContext: () => null };
    });
    const noCanvas = imageFile();
    await expect(resizeImageFile(noCanvas)).resolves.toBe(noCanvas);
  });
});
