import { GRAPHQL_URL, getStoredToken } from './graphql';

export interface ImageUploadResult {
  url: string;
  originalFilename: string;
  sizeBytes: number;
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates an image file before upload.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format "${file.type || 'unknown'}". Only JPEG, PNG, and WebP are supported.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a product image to Cloudinary via the backend GraphQL multipart mutation.
 * Returns the Cloudinary HTTPS URL.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  const operations = JSON.stringify({
    query: `
      mutation UploadProductImage($file: Upload!) {
        uploadProductImage(file: $file)
      }
    `,
    variables: { file: null },
  });

  const map = JSON.stringify({ '0': ['variables.file'] });
  formData.append('operations', operations);
  formData.append('map', map);
  formData.append('0', file);

  const token = getStoredToken();
  const headers: Record<string, string> = {
    'apollo-require-preflight': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.errors?.length) {
      const errorDetail =
        result.errors?.[0]?.message ||
        `Image upload failed with status HTTP ${response.status}`;
      throw new Error(errorDetail);
    }

    const secureUrl = result.data?.uploadProductImage;
    if (!secureUrl || typeof secureUrl !== 'string') {
      throw new Error('Server returned an empty or invalid image URL.');
    }

    return secureUrl;
  } catch (err: any) {
    const message = err?.message || 'Network error during image upload to Cloudinary';
    throw new Error(message);
  }
}
