/**
 * Utilities for secure receipt file and document URL resolution.
 * Ensures media elements (img, iframe, object) and tab links attach
 * authentication tokens to access protected upload routes without 401 errors.
 */

export function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('billbox_token') || localStorage.getItem('token') || '';
}

/**
 * Appends the caller's JWT token to protected upload stream URLs.
 * Preserves data URIs, blob URLs, and URLs that already carry tokens.
 */
export function getAuthenticatedFileUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return '';
  
  // Data URIs and Blob URLs are local and do not require server auth tokens
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    return fileUrl;
  }

  const token = getAuthToken();
  if (!token) return fileUrl;

  // If already tagged with a token, don't duplicate
  if (fileUrl.includes('token=')) {
    return fileUrl;
  }

  // Target any uploads route or API uploads streaming route
  const isProtectedPath = 
    fileUrl.includes('/uploads/') || 
    fileUrl.includes('/api/uploads/') ||
    fileUrl.startsWith('/uploads') ||
    fileUrl.startsWith('/api/uploads');

  if (isProtectedPath) {
    const separator = fileUrl.includes('?') ? '&' : '?';
    return `${fileUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fileUrl;
}

/**
 * Converts a base64 string into an in-memory Blob URL for guaranteed offline
 * or instant local display without network roundtrips.
 */
export function createBlobUrlFromBase64(base64Data, mimeType = 'image/jpeg') {
  if (!base64Data || typeof base64Data !== 'string') return null;
  try {
    const rawData = base64Data.startsWith('data:')
      ? base64Data.split(',')[1]
      : base64Data;
    const binary = atob(rawData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Could not construct blob from base64:', err.message);
    return null;
  }
}
