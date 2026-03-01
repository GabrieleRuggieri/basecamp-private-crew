/**
 * Utility per ridimensionare e comprimere immagini prima dell'upload.
 * Usato in Moments per evitare foto 4K pesanti.
 * Max 1920px sul lato più lungo, JPEG quality 0.85.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

export async function resizeImageForUpload(file: File): Promise<File> {
  const img = await createImageBitmap(file);
  let { width, height } = img;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    img.close();
    return file;
  }
  ctx.drawImage(img, 0, 0, width, height);
  img.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
  });

  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, '.jpg');
  return new File([blob], name, { type: 'image/jpeg' });
}
