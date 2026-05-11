/**
 * Converts a base64 data URL to a File object
 * @param dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param filename - Name for the file
 * @returns File object ready for FormData upload
 */
export function base64ToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const header = arr[0] || '';
  const data = arr[1] || '';
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(data);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
