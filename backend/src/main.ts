import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const envPath = existsSync(resolve(process.cwd(), 'backend', '.env'))
  ? resolve(process.cwd(), 'backend', '.env')
  : resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS for separate Admin and Customer frontends
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'https://admin.example.com',
        'https://www.example.com',
        'http://localhost:4000',
        'http://localhost:4001',
        'http://customer.localhost:4000',
        'http://admin.localhost:4001',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
      ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        configuredOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/.*\.localhost:\d+$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'apollo-require-preflight',
      'x-apollo-operation-name',
    ],
  });

  app.use(
    graphqlUploadExpress({
      maxFileSize: 5 * 1024 * 1024, // 5 MB limit
      maxFiles: 1,
    }),
  );

  const port = Number(process.env.PORT) || 8000;
  await app.listen(port);
  console.log(`Backend shared GraphQL API running on http://localhost:${port}/graphql`);
}

await bootstrap();
