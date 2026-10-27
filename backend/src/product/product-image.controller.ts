import { Controller } from '@nestjs/common';

/**
 * Image uploading is handled exclusively through GraphQL via the uploadProductImage mutation.
 * REST upload endpoints have been decommissioned per architectural requirements.
 */
@Controller('products')
export class ProductImageController {}
