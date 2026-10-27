import dotenv from 'dotenv';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const envPath = existsSync(resolve(process.cwd(), 'backend', '.env'))
  ? resolve(process.cwd(), 'backend', '.env')
  : resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

import { Module } from '@nestjs/common';
import { GraphQLModule } from "@nestjs/graphql";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppResolver } from "./app.resolver.js";
import { ApolloDriver } from '@nestjs/apollo';
import { ProductModule } from './product/product.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrderModule } from './order/order.module.js';

const srcDir = existsSync(join(process.cwd(), 'backend', 'src'))
  ? join(process.cwd(), 'backend', 'src')
  : join(process.cwd(), 'src');

@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver,
      graphiql: true,
      csrfPrevention: false,
      autoSchemaFile: join(srcDir, 'schema.graphql'),
      definitions: {
        path: join(srcDir, 'graphql.ts'),
      },
      context: ({ req, res }: { req: any; res: any }) => ({ req, res }),
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD ,
      database: process.env.DB_NAME || 'ecommerce',
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
    OrderModule,
    ProductModule,
  ],

  controllers: [],
  providers: [AppResolver],
})
export class AppModule { }
