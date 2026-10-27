# Aura Commerce — Full-Stack GraphQL eCommerce Platform

A production-grade, full-stack eCommerce application built with **React**, **Vite**, **TypeScript**, **NestJS**, **Apollo GraphQL**, **TypeORM**, **PostgreSQL**, and **Cloudinary**.

Featuring isolated **Customer** and **Admin** frontend interfaces powered by a unified GraphQL API backend.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          PostgreSQL Database           │
                      │  (Users, Products, Orders, Items)      │
                      └───────────────────▲────────────────────┘
                                          │ TypeORM
                      ┌───────────────────┴────────────────────┐
                      │        NestJS GraphQL Backend          │
                      │         (http://localhost:8000)        │
                      └─────────────▲──────────────────────────┘
                                    │ GraphQL & Uploads
                 ┌──────────────────┴──────────────────┐
                 │                                     │
   ┌─────────────┴─────────────┐         ┌─────────────┴─────────────┐
   │    Customer Storefront    │         │      Admin Dashboard      │
   │   (React + Vite, :4000)   │         │   (React + Vite, :4001)   │
   └───────────────────────────┘         └─────────────┬─────────────┘
                                                       │ Direct Uploads
                                         ┌─────────────▼─────────────┐
                                         │       Cloudinary CDN      │
                                         │  (Auto WebP/AVIF Delivery)│
                                         └───────────────────────────┘
```

---

## Features

### 🛍️ Customer Storefront (`http://localhost:4000`)
- **Product Catalog**: Real-time category filtering (Electronics, Apparel, Accessories, Home) with debounced search.
- **Product Details**: Quick-view modal with verified reviews, stock status, and contextual product photography.
- **Cart & Checkout**: Drawer-based slide-out shopping cart with local persistence, quantity selectors, and instant subtotal calculation.
- **Order Management**: Checkout simulation saving orders to PostgreSQL; customer modal to view order history and delivery statuses.
- **Authentication**: Modal-based user registration and login with automatic redirection.

### 🛡️ Admin Portal (`http://localhost:4001`)
- **Role-Based Access Control (RBAC)**: Enforced via NestJS Guards (`@Roles('ADMIN')`) and JWT verification.
- **Inventory & Product CRUD**:
  - Add, edit, and delete products directly from GraphQL.
  - Low-stock and out-of-stock inventory badges.
- **Cloudinary Image Uploading**:
  - Drag-and-drop / file selector with live preview (supports JPEG, PNG, WebP up to 5 MB).
  - Streamed directly to Cloudinary through GraphQL multipart mutation (no temporary server files).
  - **Automatic Cloudinary Cleanup**: Deleting a product (or replacing its image during edit) automatically destroys the asset on Cloudinary.
- **Order Processing**: View customer orders and update fulfillment statuses (*Pending*, *Processing*, *Shipped*, *Delivered*, *Cancelled*).

### ⚙️ Backend API (`http://localhost:8000/graphql`)
- **NestJS + Apollo Server**: Code-first GraphQL schema generation with type-safe resolvers.
- **TypeORM & PostgreSQL**: Relational mapping for `User`, `Product`, and `Order` entities.
- **Security**:
  - Passwords hashed with unique salts using OWASP-compliant `scrypt`.
  - Cryptographic RFC 7519 JWT signing (HMAC-SHA256).
  - Strict CORS origin whitelisting across separate admin and customer domains.
  - GraphQL multipart request validation via `graphql-upload-ts`.

---

## Project Structure

```
eCommerce/
├── backend/                        # NestJS GraphQL Backend
│   ├── src/
│   │   ├── auth/                   # JWT Auth, RolesGuard, CurrentUser decorator
│   │   ├── cloudinary/             # CloudinaryService & CloudinaryModule
│   │   ├── order/                  # Order entity, resolver, and service
│   │   ├── product/                # Product entity, resolver, and service
│   │   ├── user/                   # User entity & role types
│   │   ├── app.module.ts           # Root NestJS module
│   │   └── main.ts                 # Bootstrap, CORS, and GraphQL upload setup
│   ├── test/                       # Unit and integration tests (Vitest)
│   ├── .env.example                # Backend environment variable template
│   └── package.json
├── frontend/                       # React 19 + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/             # Storefront & Admin React components
│   │   ├── context/                # Auth, Cart, Product, and Toast contexts
│   │   ├── services/
│   │   │   ├── graphql.ts          # GraphQL API client
│   │   │   └── imageUploadService.ts # GraphQL multipart Cloudinary upload service
│   │   ├── utils/image.ts          # URL normalization & contextual fallback images
│   │   ├── CustomerApp.tsx         # Customer portal entry point
│   │   └── AdminApp.tsx            # Admin portal entry point
│   ├── vite.customer.config.ts     # Customer Vite build config (port 4000)
│   ├── vite.admin.config.ts        # Admin Vite build config (port 4001)
│   ├── .env.example                # Frontend environment variable template
│   └── package.json
├── DEPLOYMENT.md                   # Production domain, DNS, and server setup guide
├── .gitignore                      # Git ignore rules (protects .env and secrets)
└── package.json                    # Root workspace orchestration scripts
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v14.0 or higher (running locally or cloud-hosted via Supabase/Neon/Railway)
- **Cloudinary Account**: Free tier at [cloudinary.com](https://cloudinary.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/your-ecommerce-repo.git
cd your-ecommerce-repo
```

---

### Step 2: Install Dependencies
Install dependencies for both backend and frontend:

```bash
# Backend dependencies
npm --prefix backend install

# Frontend dependencies
npm --prefix frontend install
```

---

### Step 3: Configure Environment Variables

#### Backend Configuration (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Configure your credentials inside `backend/.env`:

```env
PORT=8000
NODE_ENV=development

# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=ecommerce

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Designated Admin Emails (Comma-separated; automatically granted ADMIN role)
ADMIN_EMAILS=admin@aura.store,admin@example.com

# Separate Frontend URLs
ADMIN_URL=http://localhost:4001
CUSTOMER_URL=http://localhost:4000

# CORS Whitelist (Comma-separated)
CORS_ORIGINS=http://localhost:4000,http://localhost:4001,http://127.0.0.1:4000,http://127.0.0.1:4001

# Cloudinary Credentials (From Cloudinary Console > Product Environment Credentials)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=eCommerce
# Or single URL format:
# CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

#### Frontend Configuration (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

Set the endpoints inside `frontend/.env`:

```env
VITE_CUSTOMER_URL=http://localhost:4000
VITE_ADMIN_URL=http://localhost:4001
VITE_GRAPHQL_URL=http://localhost:8000/graphql
VITE_API_BASE_URL=http://localhost:8000
```

---

### Step 4: Setup the PostgreSQL Database
Create the database in PostgreSQL if it doesn't already exist:

```sql
CREATE DATABASE ecommerce;
```
*(TypeORM is configured with `synchronize: true` for development and will create the schema automatically upon backend boot).*

---

### Step 5: Start the Development Servers

You can run each service in separate terminal windows:

#### 1. Backend Server
```bash
npm --prefix backend run start:dev
```
*API & GraphQL Playground: `http://localhost:8000/graphql`*

#### 2. Customer Frontend
```bash
npm --prefix frontend run dev:customer
```
*Customer Portal: `http://localhost:4000`*

#### 3. Admin Frontend
```bash
npm --prefix frontend run dev:admin
```
*Admin Dashboard: `http://localhost:4001`*

---

## Testing & Quality Assurance

Run backend unit and integration tests (Vitest):
```bash
npm --prefix backend run test
```

Run linter:
```bash
npm --prefix backend run lint
```

Build production bundles:
```bash
# Build both frontend bundles (customer and admin)
npm --prefix frontend run build

# Build backend
npm --prefix backend run build
```

---

## Production Deployment Guide

For full DNS and production hosting architecture, refer to [DEPLOYMENT.md](file:///d:/Flipr/eCommerce/DEPLOYMENT.md).

### 1. Database (PostgreSQL)
- Host on [Supabase](https://supabase.com/), [Neon](https://neon.tech/), or [Railway](https://railway.app/).
- Copy your connection string into production environment variables.

### 2. Backend (Render / Railway / AWS / Docker)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node dist/main`
- Set all production environment variables from `backend/.env.example`.
- Ensure `CORS_ORIGINS` points to your production domains (e.g. `https://www.example.com,https://admin.example.com`).

### 3. Frontend (Vercel / Netlify)
Deploy two separate Vercel/Netlify projects pointing to the same repository:
- **Customer Project**:
  - Root directory: `frontend`
  - Build command: `npm run build:customer`
  - Output directory: `dist`
  - Domain: `https://www.yourdomain.com`
  - Env: `VITE_GRAPHQL_URL=https://api.yourdomain.com/graphql`
- **Admin Project**:
  - Root directory: `frontend`
  - Build command: `npm run build:admin`
  - Output directory: `dist`
  - Domain: `https://admin.yourdomain.com`
  - Env: `VITE_GRAPHQL_URL=https://api.yourdomain.com/graphql`

---

## Security Audit & Checklist

Prior to pushing code to GitHub, verify the following:

- [x] **No Real Secrets Committed**: All `.env` and `.env.local` files are excluded in `.gitignore`.
- [x] **No Upload Files Committed**: Local uploads directory (`uploads/`) is excluded in `.gitignore`.
- [x] **Protected Admin Mutations**: All administrative GraphQL mutations (`uploadProductImage`, `addproduct`, `updateProduct`, `deleteproduct`, `allOrders`) enforce `@UseGuards(GqlAuthGuard, RolesGuard)` and `@Roles('ADMIN')`.
- [x] **Client-Side Asset Protection**: Cloudinary `API_SECRET` remains strictly on the backend; the frontend communicates exclusively via authenticated GraphQL multipart uploads.
- [x] **OWASP Password Security**: Passwords salted and hashed with `scrypt`; passwords never returned in GraphQL queries.
- [x] **Cross-Origin Resource Policy**: Secure CORS headers configured on Express static middleware and Apollo Server.

---

## License

This project is licensed under the MIT License.
