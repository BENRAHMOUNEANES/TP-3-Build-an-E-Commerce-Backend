# DzTech Store Backend - Test Results Summary

**Academic Lab:** ENSTA • Module WAMD (Web and Mobile Development)  
**TD-TP 3:** Build an E-Commerce Backend: REST API with Node.js, Express.js, MongoDB, JWT, OAuth2, and Rate Limiting  
**Student Name:** Anes Benrahmoune  
**Date:** November 2026  
**Environment:** Node.js v24.13.0, Express v5.3.0, Mongoose v9.12.0, Windows 11  

---

## 1. Executive Summary

All 27 automated end-to-end integration and security test cases completed with **100% PASS** rate.
- **Total Tests Executed:** 27
- **Passed:** 27
- **Failed:** 0
- **Overall Result:** PASSED

---

## 2. Detailed Test Cases & Status Codes Observed

### Group A: Health & Application Lifecycle
| # | Test Scenario | HTTP Method & Route | Expected Status | Observed Status | Result | Notes |
|---|---|---|:---:|:---:|:---:|---|
| 01 | Health Check Status | `GET /api/health` | `200 OK` | `200 OK` | PASS | API operational, returns uptime and timestamp |
| 02 | API Welcome / Discovery | `GET /` | `200 OK` | `200 OK` | PASS | Returns endpoint discovery index |
| 03 | Global 404 Fallback | `GET /api/non-existent-route` | `404 Not Found` | `404 Not Found` | PASS | Consistent error JSON format returned |

### Group B: Authentication & User Management
| # | Test Scenario | HTTP Method & Route | Expected Status | Observed Status | Result | Notes |
|---|---|---|:---:|:---:|:---:|---|
| 04 | Register New User | `POST /api/auth/register` | `201 Created` | `201 Created` | PASS | Bcrypt password hash generated, password excluded |
| 05 | Register Duplicate Email | `POST /api/auth/register` | `409 Conflict` | `409 Conflict` | PASS | Prevents duplicate user accounts |
| 06 | Register Validation Error | `POST /api/auth/register` | `400 Bad Request` | `400 Bad Request` | PASS | Validates empty name, short password, invalid email |
| 07 | Login Valid Credentials | `POST /api/auth/login` | `200 OK` | `200 OK` | PASS | Signs JWT token with 1h expiry; user object returned |
| 08 | Login Wrong Password | `POST /api/auth/login` | `401 Unauthorized` | `401 Unauthorized` | PASS | Generic message: "Invalid email or password" |
| 09 | Login Unknown Email | `POST /api/auth/login` | `401 Unauthorized` | `401 Unauthorized` | PASS | Generic message: "Invalid email or password" |
| 10 | Authenticated Profile Me | `GET /api/auth/me` | `200 OK` | `200 OK` | PASS | Reads `Authorization: Bearer <JWT>` header |

### Group C: Products Catalog (Public Endpoints)
| # | Test Scenario | HTTP Method & Route | Expected Status | Observed Status | Result | Notes |
|---|---|---|:---:|:---:|:---:|---|
| 11 | List All Products | `GET /api/products` | `200 OK` | `200 OK` | PASS | Returns array of 10 seeded DzTech electronics |
| 12 | Filter by Category | `GET /api/products?category=Ordinateurs` | `200 OK` | `200 OK` | PASS | Matches MacBook, Dell XPS, etc. |
| 13 | Single Product by ID | `GET /api/products/:id` | `200 OK` | `200 OK` | PASS | Returns complete product document |
| 14 | Single Product Malformed ID | `GET /api/products/invalid-id-12345` | `400 Bad Request` | `400 Bad Request` | PASS | Rejects non-hex ObjectId format |
| 15 | Single Product Not Found | `GET /api/products/660e1f72b5368a2f8c5b9999`| `404 Not Found` | `404 Not Found` | PASS | Returns 404 with standard error body |

### Group D: Protected Operations (JWT / OAuth2 Authorization)
| # | Test Scenario | HTTP Method & Route | Expected Status | Observed Status | Result | Notes |
|---|---|---|:---:|:---:|:---:|---|
| 16 | Create Product Without Token | `POST /api/products` | `401 Unauthorized` | `401 Unauthorized` | PASS | Blocked by `authMiddleware` |
| 17 | Create Product with Forged Token | `POST /api/products` | `401 Unauthorized` | `401 Unauthorized` | PASS | Rejected: invalid JWT signature |
| 18 | Create Product Validation Error | `POST /api/products` | `400 Bad Request` | `400 Bad Request` | PASS | Catches negative price or empty name |
| 19 | Create Product Valid Payload | `POST /api/products` | `201 Created` | `201 Created` | PASS | Created and returned new document with `_id` |
| 20 | Update Product Valid | `PUT /api/products/:id` | `200 OK` | `200 OK` | PASS | Updates price and stock; returns modified document |
| 21 | Update Product Malformed ID | `PUT /api/products/bad-id-xyz` | `400 Bad Request` | `400 Bad Request` | PASS | Rejects invalid ObjectId format |
| 22 | Update Product Not Found | `PUT /api/products/660e1f72b5368a2f8c5b9999`| `404 Not Found` | `404 Not Found` | PASS | Returns 404 when ID does not exist |
| 23 | Delete Product Without Token | `DELETE /api/products/:id` | `401 Unauthorized` | `401 Unauthorized` | PASS | Requires Bearer token |
| 24 | Delete Product Valid Token | `DELETE /api/products/:id` | `200 OK` | `200 OK` | PASS | Removes document from database |
| 25 | Delete Already Deleted Product | `DELETE /api/products/:id` | `404 Not Found` | `404 Not Found` | PASS | Idempotency / Not Found handling |

### Group E: Rate Limiting (DoS & Brute-Force Prevention)
| # | Test Scenario | HTTP Method & Route | Expected Status | Observed Status | Result | Notes |
|---|---|---|:---:|:---:|:---:|---|
| 26 | Login Limiter Trigger (Attempt 6) | `POST /api/auth/login` | `429 Too Many Requests` | `429 Too Many Requests` | PASS | Blocked on 6th attempt; headers `RateLimit-*` verified |
| 27 | General API Limiter (Request 101) | `GET /api/products` | `429 Too Many Requests` | `429 Too Many Requests` | PASS | Blocked on 101st request within 15min window |

---

## 3. Rate Limit Headers Verification Sample

When requesting `POST /api/auth/login`:
```http
HTTP/1.1 401 Unauthorized
RateLimit-Limit: 5
RateLimit-Remaining: 4
RateLimit-Reset: 900
```
On attempt 6:
```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 899
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "status": 429,
  "message": "Too many login attempts from this IP, please try again after 15 minutes."
}
```

---

## 4. Standard Error Format Verification

All negative tests produce JSON matching this contract:
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
Stack traces are never exposed in responses.
