# Production Deployment & Security Architecture Guide

This guide documents the production deployment, domain/DNS architecture, environment configurations, and security protocols for running separate Admin and Customer websites sharing a single backend.

---

## 1. Domain & URL Architecture

| Component | Production URL | Localhost Development URL |
|---|---|---|
| **Admin Website** | `https://admin.example.com` | `http://localhost:4001` or `http://admin.localhost:4001` |
| **Customer Website** | `https://www.example.com` | `http://localhost:4000` or `http://customer.localhost:4000` |
| **Shared Backend GraphQL API** | `https://api.example.com/graphql` | `http://localhost:8000/graphql` |

---

## 2. DNS Configuration

In your DNS provider (e.g. Cloudflare, Route53, GoDaddy), create the following records:

```dns
Type  Name   Target / Value                      TTL
A     admin  <IP_ADDRESS_OF_ADMIN_SERVER>        Auto
A     www    <IP_ADDRESS_OF_CUSTOMER_SERVER>     Auto
A     api    <IP_ADDRESS_OF_BACKEND_SERVER>      Auto
CNAME @      www.example.com                     Auto (Apex domain redirect)
```

---

## 3. Environment Variables Configuration

### A. Backend (`backend/.env`)
```bash
# Server Port & Environment
PORT=8000
NODE_ENV=production

# PostgreSQL Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_strong_postgres_password
DB_NAME=ecommerce

# Cryptographic Secret for RFC 7519 JWT Signing (HMAC-SHA256)
JWT_SECRET=generate_a_64_character_random_string_here

# Frontend Application Domain Origins
ADMIN_URL=https://admin.example.com
CUSTOMER_URL=https://www.example.com

# Allowed CORS Origins (Comma-separated)
CORS_ORIGINS=https://admin.example.com,https://www.example.com
```

### B. Customer Frontend (`frontend/.env.production.customer`)
```bash
VITE_APP_MODE=customer
VITE_CUSTOMER_URL=https://www.example.com
VITE_ADMIN_URL=https://admin.example.com
VITE_GRAPHQL_URL=https://api.example.com/graphql
VITE_API_BASE_URL=https://api.example.com
```

### C. Admin Frontend (`frontend/.env.production.admin`)
```bash
VITE_APP_MODE=admin
VITE_CUSTOMER_URL=https://www.example.com
VITE_ADMIN_URL=https://admin.example.com
VITE_GRAPHQL_URL=https://api.example.com/graphql
VITE_API_BASE_URL=https://api.example.com
```

---

## 4. Production Web Server & Reverse Proxy (Nginx Configuration)

### A. Shared API Gateway (`api.example.com`)
```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # File uploads limit (images up to 10MB)
    client_max_body_size 10M;

    location /uploads/ {
        alias /var/www/ecommerce/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### B. Customer Website (`www.example.com`)
```nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    root /var/www/ecommerce/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### C. Admin Website (`admin.example.com`)
```nginx
server {
    listen 443 ssl http2;
    server_name admin.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    root /var/www/ecommerce/frontend/dist;
    index admin.html index.html;

    location / {
        try_files $uri $uri/ /admin.html /index.html;
    }
}
```

---

## 5. Security & Authorization Architecture

1. **Defense in Depth**: Separate URLs provide UI isolation, but **the backend enforces permissions on every single mutation and query**.
2. **Cryptographic Role Guards**:
   - Every administrative mutation (`addproduct`, `updateProduct`, `deleteproduct`, `uploadProductImage`, `allOrders`, `updateOrderStatus`) requires a valid Bearer token signed with `JWT_SECRET` and containing `role === 'ADMIN'`.
   - Any GraphQL request issued without this role returns HTTP 403 / GraphQL error:
     `Access denied. Requires one of the following roles: [ADMIN]`.
3. **Public Registration Constraint**:
   - The `register` GraphQL mutation strictly forces `role = UserRole.USER`. The frontend cannot pass or elevate to `ADMIN`.
4. **Isolated Customer Data**:
   - `myOrders` extracts the user ID directly from the cryptographically verified JWT payload, preventing customers from viewing another user's order history.
5. **CORS Restrictions**:
   - `backend/src/main.ts` restricts origins to the exact list of configured domains (`https://admin.example.com` and `https://www.example.com`). Arbitrary origins are rejected by CORS.
