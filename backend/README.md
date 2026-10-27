# eCommerce Backend API (NestJS + GraphQL + PostgreSQL)

This is the backend service for the eCommerce application, built using **NestJS**, **GraphQL (Apollo Driver)**, and **TypeORM** connected to a **PostgreSQL** database.

---

## 1. Project File Structure

```text
backend/
├── dist/                          # Compiled TypeScript output
├── src/
│   ├── app.module.ts              # Root module configuring TypeORM & GraphQL Apollo driver
│   ├── app.resolver.ts            # Root resolver ('index' query)
│   ├── app.service.ts             # Root service
│   ├── main.ts                    # Bootstrap entry point (runs on port 8000, enables CORS)
│   ├── schema.graphql             # Auto-generated GraphQL Schema (code-first approach)
│   ├── graphql.ts                 # Auto-generated TypeScript definitions from GraphQL
│   │
│   ├── product/                   # Product Feature Module
│   │   ├── product.module.ts      # Product module declaration
│   │   ├── product.resolver.ts    # GraphQL Query & Mutation resolvers for Products
│   │   ├── product.service.ts     # Business logic & TypeORM database operations
│   │   ├── args/
│   │   │   ├── addProduct.args.ts    # GraphQL input args for creating a product
│   │   │   └── updateProduct.args.ts # GraphQL input args for updating a product
│   │   ├── entity/
│   │   │   └── product.entity.ts  # TypeORM PostgreSQL entity definition
│   │   └── schema/
│   │       └── product.schema.ts  # GraphQL ObjectType definition for Product
│   │
│   └── book/                      # Book Feature Module
│       ├── book.module.ts         # Book module declaration
│       ├── book.resolver.ts       # GraphQL Query & Mutation resolvers for Books
│       ├── book.service.ts        # Business logic & TypeORM database operations
│       ├── args/
│       │   ├── addbook.args.ts       # GraphQL input args for adding a book
│       │   └── updatebook.args.ts    # GraphQL input args for updating a book
│       ├── entity/
│       │   └── book.entity.ts     # TypeORM PostgreSQL entity definition
│       └── schema/
│           └── book.schema.ts     # GraphQL ObjectType definition for Book
│
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript compiler options
└── vitest.config.ts               # Test configuration
```

---

## 2. Database & Server Configuration

* **Server Port:** `8000` (configurable in `src/main.ts`)
* **CORS:** Enabled for frontend integration
* **GraphQL Endpoint:** `http://localhost:8000/graphql`
* **GraphiQL IDE:** Enabled at `http://localhost:8000/graphql`
* **Database:** PostgreSQL
  * Host: `localhost`
  * Port: `5432`
  * Database Name: `ecommerce`
  * ORM: TypeORM with `autoLoadEntities: true` and `synchronize: true`

---

## 3. Data Models & Schemas

### Product
| Field | GraphQL Type | DB Type | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `Int!` | Primary Key (Auto-increment) | Unique identifier |
| `name` | `String!` | `varchar` | Name of the product |
| `description` | `String!` | `varchar` | Product details / description |
| `imageUrl` | `String!` | `varchar` | Image URL |
| `price` | `Float!` | `float` | Price in rupees / currency |
| `quantity` | `Int!` | `int` | Available inventory stock |

### Book
| Field | GraphQL Type | DB Type | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `Int!` | Primary Key (Auto-increment) | Unique identifier |
| `title` | `String!` | `varchar` | Book title |
| `price` | `Int!` | `int` | Book price |

---

## 4. GraphQL Query & Mutation Overview

All operations are executed via `POST http://localhost:8000/graphql`.

### Product Operations

#### 1. Fetch All Products (`getAllProduct`)
```graphql
query GetAllProduct {
  getAllProduct {
    id
    name
    description
    imageUrl
    price
    quantity
  }
}
```
**Response Example:**
```json
{
  "data": {
    "getAllProduct": [
      {
        "id": 1,
        "name": "Wireless Mouse",
        "description": "Ergonomic 2.4G wireless optical mouse",
        "imageUrl": "https://example.com/mouse.jpg",
        "price": 599.0,
        "quantity": 25
      }
    ]
  }
}
```

---

#### 2. Fetch Product By ID (`productById`)
```graphql
query GetProductById($productId: Int!) {
  productById(productId: $productId) {
    id
    name
    description
    imageUrl
    price
    quantity
  }
}
```
**Variables:**
```json
{
  "productId": 1
}
```

---

#### 3. Add a Product (`addproduct`)
```graphql
mutation AddProduct($addProductArgs: AddProductArgs!) {
  addproduct(addProductArgs: $addProductArgs)
}
```
**Variables:**
```json
{
  "addProductArgs": {
    "name": "Mechanical Keyboard",
    "description": "RGB mechanical keyboard with blue switches",
    "imageUrl": "https://example.com/keyboard.jpg",
    "price": 2499.0,
    "quantity": 15
  }
}
```
**Response:**
```json
{
  "data": {
    "addproduct": "Product has been Added successFully"
  }
}
```

---

#### 4. Update an Existing Product (`updateProduct`)
```graphql
mutation UpdateProduct($updateProductArgs: UpdateProductArgs!) {
  updateProduct(updateProductArgs: $updateProductArgs)
}
```
**Variables:**
```json
{
  "updateProductArgs": {
    "id": 1,
    "price": 499.0,
    "quantity": 30
  }
}
```
**Response:**
```json
{
  "data": {
    "updateProduct": "Product has been successFully updated"
  }
}
```

---

#### 5. Delete a Product (`deleteproduct`)
```graphql
mutation DeleteProduct($productId: Int!) {
  deleteproduct(productId: $productId)
}
```
**Variables:**
```json
{
  "productId": 1
}
```
**Response:**
```json
{
  "data": {
    "deleteproduct": "Product has deleted"
  }
}
```

---

### Book Operations

#### 1. Fetch All Books (`getAllBook`)
```graphql
query GetAllBook {
  getAllBook {
    id
    title
    price
  }
}
```

#### 2. Fetch Book By ID (`bookById`)
```graphql
query GetBookById($bookId: Int!) {
  bookById(bookId: $bookId) {
    id
    title
    price
  }
}
```

#### 3. Add a Book (`addBook`)
```graphql
mutation AddBook($addBookArgs: AddBookArgs!) {
  addBook(addBookArgs: $addBookArgs)
}
```
**Variables:**
```json
{
  "addBookArgs": {
    "title": "Clean Code",
    "price": 650
  }
}
```

#### 4. Update a Book (`updateBook`)
```graphql
mutation UpdateBook($updateBookArgs: UpdateBookArgs!) {
  updateBook(updateBookArgs: $updateBookArgs)
}
```
**Variables:**
```json
{
  "updateBookArgs": {
    "id": 1,
    "title": "Clean Code (2nd Edition)",
    "price": 700
  }
}
```

#### 5. Delete a Book (`deleteBook`)
```graphql
mutation DeleteBook($bookId: Int!) {
  deleteBook(bookId: $bookId)
}
```
**Variables:**
```json
{
  "bookId": 1
}
```

---

## 5. Development & Execution Commands

```bash
# Install dependencies
npm install

# Start in development watch mode
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod
```
