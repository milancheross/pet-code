/**
 * Client-side image utilities.
 *
 * NOTE: Actual compression for storage happens server-side via sharp
 * (/api/upload-pet-photo, /api/admin/products upload_image).
 * This helper is used only for admin upload pre-processing (reduces
 * base64 payload size before sending) and client-side previews.
 */

export async function convertToWebP(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<{ file: File; originalSize: number; newSize: number }> {
  const { maxWidth = 1000, maxHeight = 1000, quality = 0.82 } = options
  return new Promise((resolve, reject) => {
    const originalSize = file.size
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Konverzija nije uspela')); return }
          const newFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.webp'),
            { type: 'image/webp' }
          )
          resolve({ file: newFile, originalSize, newSize: blob.size })
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => reject(new Error('Učitavanje slike nije uspelo'))
    img.src = url
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
