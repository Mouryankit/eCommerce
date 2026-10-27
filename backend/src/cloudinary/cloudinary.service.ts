import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';
import { Readable, Transform } from 'node:stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly isConfigured: boolean;

  constructor() {
    const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    let apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    let apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (cloudinaryUrl && !cloudinaryUrl.includes('your_')) {
      try {
        const parsed = new URL(cloudinaryUrl);
        apiKey = apiKey || decodeURIComponent(parsed.username);
        apiSecret = apiSecret || decodeURIComponent(parsed.password);
        cloudName = cloudName || parsed.hostname;
      } catch (err: any) {
        this.logger.warn(`Failed to parse CLOUDINARY_URL: ${err.message}`);
      }
    }

    if (
      cloudName &&
      apiKey &&
      apiSecret &&
      !cloudName.startsWith('your_') &&
      !apiKey.startsWith('your_')
    ) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log(`Cloudinary initialized successfully for cloud: ${cloudName}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'Cloudinary credentials are not configured in backend/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
      );
    }
  }

  /**
   * Returns whether Cloudinary credentials have been provided.
   */
  hasCredentials(): boolean {
    return this.isConfigured;
  }

  /**
   * Uploads an image stream directly to Cloudinary.
   * Enforces a 5 MB maximum file size and applies automatic WebP/AVIF format optimization.
   */
  async uploadImageStream(
    fileStream: Readable,
    options?: {
      folder?: string;
      maxSizeBytes?: number;
    },
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'Cloudinary credentials are missing or invalid in backend/.env. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const folder =
      options?.folder ||
      process.env.CLOUDINARY_FOLDER?.trim() ||
      'ecommerce_products';
    const maxSizeBytes = options?.maxSizeBytes ?? 5 * 1024 * 1024; // 5 MB

    return new Promise<string>((resolve, reject) => {
      let totalBytes = 0;
      let limitExceeded = false;

      // Size counting transform stream to enforce 5 MB limit
      const sizeWatcher = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          totalBytes += chunk.length;
          if (totalBytes > maxSizeBytes) {
            limitExceeded = true;
            return callback(
              new BadRequestException(
                `Image exceeds maximum allowed size of ${Math.round(
                  maxSizeBytes / (1024 * 1024),
                )} MB.`,
              ),
            );
          }
          callback(null, chunk);
        },
      });

      const cloudinaryUpload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (limitExceeded) {
            return; // Already rejected via sizeWatcher
          }

          if (error || !result) {
            const message = error?.message || 'Cloudinary upload failed';
            this.logger.error(`Cloudinary upload failed: ${message}`);
            return reject(
              new BadRequestException(`Cloudinary image upload error: ${message}`),
            );
          }

          this.logger.log(`Image uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      sizeWatcher.on('error', (err) => {
        cloudinaryUpload.destroy();
        reject(err);
      });

      fileStream.on('error', (err) => {
        sizeWatcher.destroy();
        cloudinaryUpload.destroy();
        reject(new BadRequestException(`Stream error during image upload: ${err.message}`));
      });

      fileStream.pipe(sizeWatcher).pipe(cloudinaryUpload);
    });
  }

  /**
   * Extracts the Cloudinary public_id from a Cloudinary image URL.
   * Returns null if the URL is not a Cloudinary image URL.
   */
  extractPublicId(imageUrl: string): string | null {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    if (!imageUrl.includes('res.cloudinary.com')) return null;

    try {
      const url = new URL(imageUrl);
      const pathname = url.pathname;
      const uploadIndex = pathname.indexOf('/upload/');
      if (uploadIndex === -1) return null;

      const rest = pathname.slice(uploadIndex + '/upload/'.length);
      const segments = rest.split('/');

      const contentSegments: string[] = [];
      let passedVersionOrTransforms = false;

      for (const segment of segments) {
        if (!passedVersionOrTransforms) {
          // Skip version tag: e.g. v1793086113
          if (/^v\d+$/.test(segment)) {
            passedVersionOrTransforms = true;
            continue;
          }
          // Skip transformation segment: e.g. f_auto,q_auto or w_500,c_fill
          if (segment.includes(',') || /^[a-z]_[a-z0-9_-]+/i.test(segment)) {
            continue;
          }
          passedVersionOrTransforms = true;
        }
        contentSegments.push(segment);
      }

      if (contentSegments.length === 0) return null;

      const fullPublicIdWithExt = contentSegments.join('/');
      const lastDotIndex = fullPublicIdWithExt.lastIndexOf('.');
      return lastDotIndex !== -1
        ? fullPublicIdWithExt.slice(0, lastDotIndex)
        : fullPublicIdWithExt;
    } catch {
      return null;
    }
  }

  /**
   * Deletes an image from Cloudinary using its public_id or full URL.
   * Invalidates CDN caches to prevent stale reads.
   */
  async deleteImage(imageUrlOrPublicId: string): Promise<boolean> {
    if (!this.isConfigured || !imageUrlOrPublicId) {
      return false;
    }

    const publicId = imageUrlOrPublicId.includes('res.cloudinary.com')
      ? this.extractPublicId(imageUrlOrPublicId)
      : imageUrlOrPublicId;

    if (!publicId) {
      return false;
    }

    try {
      const res = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        invalidate: true,
      });
      const ok = res.result === 'ok' || res.result === 'not found';
      if (ok) {
        this.logger.log(`Successfully deleted image from Cloudinary: ${publicId}`);
      } else {
        this.logger.warn(`Cloudinary destroy returned: ${res.result} for ${publicId}`);
      }
      return ok;
    } catch (err: any) {
      this.logger.error(`Failed to delete image from Cloudinary (${publicId}): ${err?.message}`);
      return false;
    }
  }
}
