# DzTech Store - REST API Backend

**Academic Institution:** ENSTA  
**Academic Module:** WAMD (Web and Mobile Development)  
**Lab Assignment:** TD-TP 3: Build an E-Commerce Backend (REST API with Node.js, Express.js, MongoDB, JWT, OAuth2, and Rate Limiting)  
**Student Name:** Anes Benrahmoune  
**Store Name:** DzTech Store  
**Product Category:** Electronics & Computing Peripherals  

---

## 1. Application Overview

The **DzTech Store Backend** is a modular RESTful API engineered to serve the modern React + Redux e-commerce web application developed in **TD-TP 2**. 

The React client never interfaces directly with MongoDB. Instead, it interacts exclusively over HTTP/JSON with this backend service. The backend provides full CRUD capabilities for electronics inventory, user authentication with salted password hashing, stateless session management via JSON Web Tokens (JWT), hybrid OAuth 2.0 / OpenID Connect token verification with Google/OIDC providers, and rate limiting to safeguard the system against brute-force and Denial-of-Service (DoS) attacks.

```
+-----------------------------------+        HTTP / JSON         +-------------------------------------+
|      React + Redux Frontend       | <=======================> |       DzTech Express API            |
|       (TD-TP 2 - Port 5173)       |     (CORS Enabled)         |            (Port 3000)              |
+-----------------------------------+                            +-------------------------------------+
                                                                           |                 |
                                                                           v                 v
                                                                   +---------------+ +-----------------+
                                                                   |  MongoDB /    | |  Google OAuth2  |
                                                                   |  Mongoose DB  | |  JWKS Provider  |
                                                                   +---------------+ +-----------------+
```

---

## 2. Technologies Used

- **Runtime:** Node.js (v24.x LTS / v20.x+)
- **Framework:** Express.js 5
- **Database & ODM:** MongoDB Community Server / MongoDB Atlas, Mongoose ODM
- **Cryptography & Security:** `bcryptjs` (password hashing, 10 salt rounds)
- **Token Management:** `jsonwebtoken` (signing & local verification)
- **OAuth 2.0 & OIDC:** `google-auth-library` and `jose` (JWKS remote verification)
- **Rate Limiting:** `express-rate-limit` (RFC-compliant `RateLimit-*` headers)
- **Validation:** `express-validator` (declarative input validation and sanitization)
- **Cross-Origin Resource Sharing:** `cors` (configured for Vite React client)
- **Environment Management:** `dotenv`
- **Development Tooling:** `nodemon` (hot reloading), `mongodb-memory-server` (zero-config in-memory testing)

---

## 3. Project Structure

```
backend/
├── docs/
│   └── test-results.md                     # Summary of observed status codes from 27 tests
├── postman/
│   └── ecommerce-api.postman_collection.json # Exported Postman collection v2.1.0
├── screenshots/
│   └── CHECKLIST.md                        # Checklist of screenshots required for submission
├── src/
│   ├── config/
│   │   └── db.js                           # Mongoose connection & in-memory fallback
│   ├── controllers/
│   │   ├── authController.js               # Registration, login, profile me
│   │   └── productController.js            # Full CRUD logic for products
│   ├── middleware/
│   │   ├── authMiddleware.js               # Hybrid authentication (JWT & OAuth2 OIDC)
│   │   ├── errorHandler.js                 # Standardized JSON error response handler
│   │   ├── rateLimiters.js                 # General API & login rate limiters
│   │   └── validate.js                     # express-validator result formatter
│   ├── models/
│   │   ├── Product.js                      # Mongoose product schema & validation
│   │   └── User.js                         # Mongoose user schema & password comparisons
│   ├── routes/
│   │   ├── authRoutes.js                   # Auth routing & input validation chains
│   │   └── productRoutes.js                # Product routing & route protection
│   ├── seed/
│   │   └── seedProducts.js                 # 10 realistic DzTech electronic products
│   ├── app.js                              # Express app setup, CORS, parsers & error flow
│   └── server.js                           # Server entrypoint with graceful shutdown
├── test/
│   ├── run-all-tests.js                    # Automated end-to-end integration test suite
│   ├── test-oauth.js                       # Auth middleware unit tests
│   └── test-rate-limit.js                  # Automated rate limit demonstration script
├── .env.example                            # Template for environment configuration
├── .gitignore                              # Git exclusion rules (keeps .env and node_modules untracked)
├── package.json                            # Scripts, dependencies, and metadata
└── README.md                               # Project documentation
```

---

## 4. Database Models (Mongoose)

### 4.1 Product Model (`src/models/Product.js`)
Represents an item in the DzTech Store catalog.

| Field | Type | Required | Constraints / Default | Description |
|---|---|:---:|---|---|
| `name` | `String` | Yes | Max 150 chars, trimmed | Display title of the product |
| `description` | `String` | No | Default: `""`, trimmed | In-depth product specifications |
| `price` | `Number` | Yes | Min: `0` | Unit price in USD / DZD |
| `category` | `String` | No | Default: `'Electronics'`, trimmed | Catalog category (Ordinateurs, Audio, etc.) |
| `imageUrl` | `String` | No | Unsplash placeholder fallback | Web URL to product thumbnail |
| `stock` | `Number` | No | Default: `0`, Min: `0` | Available stock in warehouse |
| `createdAt` | `Date` | Auto | Managed by Mongoose | Timestamp of creation |
| `updatedAt` | `Date` | Auto | Managed by Mongoose | Timestamp of last update |

> [!NOTE]
> The schema includes a JSON transform that aliases `image` to `imageUrl` so that the React frontend from TD-TP 2 works out of the box without changing component prop names.

### 4.2 User Model (`src/models/User.js`)
Represents customer and admin accounts.

| Field | Type | Required | Constraints / Default | Description |
|---|---|:---:|---|---|
| `name` | `String` | Yes | Min: 2 chars, Max: 100, trimmed | User full name |
| `email` | `String` | Yes | Unique, lowercase, trimmed, Regex-validated | User login email |
| `passwordHash` | `String` | Yes | Bcrypt hash | 60-character bcrypt hash |
| `createdAt` | `Date` | Auto | Managed by Mongoose | Account creation date |
| `updatedAt` | `Date` | Auto | Managed by Mongoose | Account last modified date |

> [!IMPORTANT]
> Plain-text passwords are never stored. The `toJSON` schema transform unconditionally strips `passwordHash` and `__v` so sensitive credentials are never returned in HTTP responses.

---

## 5. API Endpoints Table

| Method | Endpoint | Access Level | Purpose | Expected Status Codes |
|---|---|---|---|---|
| `GET` | `/api/health` | **Public** | Health & server status | `200` |
| `GET` | `/` | **Public** | Welcome & endpoint directory | `200` |
| `POST` | `/api/auth/register` | **Public** | Register user (hashed password) | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | **Public** (Rate Limited) | Authenticate user & issue JWT | `200`, `400`, `401`, `429` |
| `GET` | `/api/auth/me` | **JWT or OAuth2** | Fetch currently authenticated user | `200`, `401` |
| `GET` | `/api/products` | **Public** | List all products (with category search) | `200` |
| `GET` | `/api/products/:id` | **Public** | Retrieve single product details | `200`, `400`, `404` |
| `POST` | `/api/products` | **JWT or OAuth2** | Add new product to catalog | `201`, `400`, `401` |
| `PUT` | `/api/products/:id` | **JWT or OAuth2** | Update product price, stock, details | `200`, `400`, `401`, `404` |
| `DELETE` | `/api/products/:id` | **JWT or OAuth2** | Delete product from catalog | `200`, `400`, `401`, `404` |

---

## 6. JWT Authentication Mechanism

### 6.1 Token Issuance & Anatomy
1. When a client performs a successful `POST /api/auth/login`, the server generates a cryptographically signed JSON Web Token using the HMAC-SHA256 algorithm with `JWT_SECRET`.
2. **Payload:**
   ```json
   {
     "userId": "660e1f72b5368a2f8c5b1234",
     "email": "anes.student@ensta.dz",
     "iat": 1731150000,
     "exp": 1731153600
   }
   ```
3. The expiration is dictated by `JWT_EXPIRES_IN` (e.g. `1h`).

### 6.2 Authentication Flow Diagram
```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client / Postman
    participant Server as Express Server
    participant DB as MongoDB

    Client->>Server: POST /api/auth/login { email, password }
    Server->>DB: User.findOne({ email })
    DB-->>Server: User record with passwordHash
    Server->>Server: bcrypt.compare(password, user.passwordHash)
    alt Invalid Credentials
        Server-->>Client: 401 Unauthorized { "message": "Invalid email or password" }
    else Valid Credentials
        Server->>Server: jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
        Server-->>Client: 200 OK { token: "eyJhbGciOi...", user: { ... } }
    end

    Note over Client,Server: Subsequent Protected Requests (e.g. POST /api/products)

    Client->>Server: POST /api/products + Header "Authorization: Bearer <JWT>"
    Server->>Server: authMiddleware: jwt.verify(token, JWT_SECRET)
    alt Token Missing or Invalid
        Server-->>Client: 401 Unauthorized { "message": "Access denied..." }
    else Token Valid
        Server->>Server: Attach decoded user to req.user
        Server->>DB: Product.create(...)
        DB-->>Server: Saved Product Document
        Server-->>Client: 201 Created { success: true, data: newProduct }
    end
```

---

## 7. OAuth 2.0 & OpenID Connect (OIDC) Verification

In addition to local JWTs, all protected endpoints accept tokens issued by external OAuth 2.0 Identity Providers (default: **Google Identity Services**; Auth0 compatible).

### 7.1 Hybrid Auth Middleware Architecture
The middleware (`src/middleware/authMiddleware.js`) applies a dual-verification strategy:
1. **Local Verification:** Attempts to verify the token with `jsonwebtoken.verify(token, JWT_SECRET)`.
2. **Provider Verification (OIDC):** If local verification fails, the middleware executes:
   - **Google Auth Library:** Verifies the Google ID token via `OAuth2Client.verifyIdToken({ idToken, audience: OAUTH_CLIENT_ID })`.
   - **JWKS Verification via `jose`:** Dynamically downloads public key sets from the provider's JWKS URI (`https://www.googleapis.com/oauth2/v3/certs`), validates token signatures, and verifies the `iss` (issuer) and `aud` (audience).
3. If both verification attempts fail, HTTP `401 Unauthorized` is returned in the uniform error format.

### 7.2 Manual Setup Guide: Google Cloud Console Credentials
Follow these exact steps to register your OAuth 2.0 credentials:

> [!IMPORTANT]
> **Manual Steps to Perform in Google Cloud Console:**
> 1. Open the [Google Cloud Console](https://console.cloud.google.com/).
> 2. Create a new project (e.g., `DzTech-Store-Backend`).
> 3. Navigate to **APIs & Services** > **OAuth consent screen**:
>    - Select User Type: **External**, then click **Create**.
>    - App name: `DzTech Store`.
>    - User support email & Developer contact: enter your email.
>    - Scopes: add `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
>    - Test Users: add your Google account as a test user. Save and continue.
> 4. Navigate to **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth client ID**:
>    - Application type: **Web application**.
>    - Name: `DzTech Store Postman Client`.
>    - Authorized Redirect URIs: add `https://oauth.pstmn.io/v1/callback`.
>    - Click **Create**.
> 5. Copy the generated **Client ID** and **Client Secret**.
> 6. Update your backend `.env` file:
>    ```env
>    OAUTH_ISSUER=https://accounts.google.com
>    OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
>    OAUTH_CLIENT_SECRET=your-client-secret
>    OAUTH_JWKS_URI=https://www.googleapis.com/oauth2/v3/certs
>    ```

### 7.3 Testing with Postman (Authorization Code with PKCE)
1. Open Postman and select the request: **06 - OAuth 2.0 > Protected Endpoint with OAuth2 Access/ID Token**.
2. Go to the **Authorization** tab:
   - **Type:** `OAuth 2.0`
   - **Add authorization data to:** `Request Headers`
   - **Header Prefix:** `Bearer`
   - **Grant Type:** `Authorization Code (With PKCE)`
   - **Callback URL:** `https://oauth.pstmn.io/v1/callback` (check *Authorize using browser*)
   - **Auth URL:** `https://accounts.google.com/o/oauth2/v2/auth`
   - **Access Token URL:** `https://oauth2.googleapis.com/token`
   - **Client ID:** `{{oauth_client_id}}`
   - **Client Secret:** `{{oauth_client_secret}}`
   - **Code Challenge Method:** `S256`
   - **Scope:** `openid email profile`
3. Click the orange **Get New Access Token** button.
4. Complete the Google login and consent in the browser window that appears.
5. In Postman, click **Use Token**.
6. Send the `POST /api/products` request: the server validates the Google token against Google's JWKS and returns `201 Created`!

---

## 8. Rate Limiting (express-rate-limit)

To defend against automated dictionary attacks and resource exhaustion, two layers of rate limiters are enforced via `express-rate-limit`:

1. **General API Limiter (`/api`):**
   - **Window:** 15 minutes (`15 * 60 * 1000` ms)
   - **Threshold:** Max 100 requests per IP address.
2. **Login Limiter (`POST /api/auth/login`):**
   - **Window:** 15 minutes
   - **Threshold:** Max 5 login attempts per IP address.

### Standard Response Headers
On every request, the server returns RFC-standard rate-limiting headers:
```http
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 900
```

### Response on Limit Exceeded (HTTP 429)
When a client exceeds the permitted threshold, HTTP 429 is immediately returned:
```json
{
  "success": false,
  "status": 429,
  "message": "Too many login attempts from this IP, please try again after 15 minutes."
}
```

### Automated Demonstration Script
You can trigger and verify the 429 status codes in real-time by running:
```bash
npm run test:ratelimit
```
This script sends 6 rapid requests to `POST /api/auth/login` (request 6 triggers 429), followed by a burst across `GET /api/products` to prove both limiters operate accurately.

---

## 9. Error Handling & Standard JSON Schema

All endpoints follow a uniform, predictable JSON envelope for both successes and errors.

### Success Response Contract
```json
{
  "success": true,
  "status": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response Contract
```json
{
  "success": false,
  "status": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a valid number greater than or equal to 0"
    }
  ]
}
```

### HTTP Status Code Reference
| Code | Meaning | Example Trigger |
|:---:|---|---|
| `200` | OK | Successful product list, single product lookup, login, update, delete |
| `201` | Created | User registration, product creation |
| `400` | Bad Request | Validation errors, empty fields, malformed MongoDB ObjectId |
| `401` | Unauthorized | Missing token, invalid/expired JWT, wrong login credentials |
| `404` | Not Found | Non-existent product ID, unknown route endpoint |
| `409` | Conflict | Registration with an email address that is already registered |
| `429` | Too Many Requests | Rate limit ceiling reached (5 on login, 100 on API) |
| `500` | Internal Server Error | Unexpected server exceptions (stack traces suppressed) |

---

## 10. Installation & Setup Instructions

### 10.1 Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ or v24 recommended)
- **MongoDB:** Local MongoDB Community Server (`mongod`) OR a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.
  *(Note: An embedded in-memory MongoDB instance automatically boots up if no local mongod is detected, guaranteeing zero-friction testing!)*

### 10.2 Installation Steps
1. Navigate into the `backend/` directory:
   ```bash
   cd "backend"
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```

### 10.3 Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Open `.env` and verify the values:
```env
PORT=3000
NODE_ENV=development

# For Local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/dztech_ecommerce

# For MongoDB Atlas (replace <username> and <password>):
# MONGODB_URI=mongodb+srv://admin:password@cluster0.mongodb.net/dztech_ecommerce?retryWrites=true&w=majority

JWT_SECRET=dztech_super_secret_jwt_key_2026_wamd_ensta
JWT_EXPIRES_IN=1h
CLIENT_ORIGIN=http://localhost:5173

OAUTH_ISSUER=https://accounts.google.com
OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
OAUTH_JWKS_URI=https://www.googleapis.com/oauth2/v3/certs
```

> [!CAUTION]
> `.env` contains local secrets and is excluded from git via `.gitignore`. Never commit or push `.env` to a public repository.

### 10.4 Seeding the Database
Populate the database with 10 electronics matching the DzTech Store catalog:
```bash
npm run seed
```

### 10.5 Running the Server
- **Development mode (with nodemon auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

### 10.6 Running Automated Tests
Run the complete suite of 27 automated integration & auth middleware tests:
```bash
npm test
```
Demonstrate rate limiting (429 triggering):
```bash
npm run test:ratelimit
```

---

## 11. How the TD-TP 2 React Frontend Consumes This API

In TD-TP 2, product data was imported statically from `src/data/products.js`. With this REST API backend running on `http://localhost:3000`:

1. **CORS:** The backend enables CORS for `http://localhost:5173` (the default Vite dev server URL).
2. **Fetching Products:**
   Instead of static imports, the React app uses `fetch` or `axios` inside a Redux `createAsyncThunk`:
   ```javascript
   export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
     const response = await fetch('http://localhost:3000/api/products');
     const json = await response.json();
     return json.data; // Array of product objects with _id, name, price, image, stock
   });
   ```
3. **Data Field Compatibility:**
   The backend JSON transform provides both `imageUrl` and `image` aliases, so React components (`ProductCard.jsx`, `CartItem.jsx`) render images seamlessly without requiring prop renames.
4. **Sending Protected Requests (Admin / Cart Order):**
   ```javascript
   const token = localStorage.getItem('dztech_jwt_token');
   await fetch('http://localhost:3000/api/products', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
     },
     body: JSON.stringify(newProductData)
   });
   ```

---

## 12. Security & University Academic Integrity

- **Credentials Safety:** Passwords are never stored in plaintext and never exposed in JSON responses.
- **Git Hygiene:** `.env` is verified untracked by Git; `.env.example` provides sanitized variable placeholders only.
- **Error Obfuscation:** Database stack traces and sensitive server paths are suppressed from error payloads.
- **Generic Auth Errors:** The login endpoint returns identical `"Invalid email or password"` messages regardless of whether the email or password was incorrect, preventing account enumeration.
