# Screenshots Checklist for Lab Submission

**Academic Lab:** ENSTA • Module WAMD • TD-TP 3  
**Store Name:** DzTech Store  
**Student Name:** Anes Benrahmoune  

This checklist details every screenshot required for the lab submission. You can capture these in Postman and your terminal, then save them into this `/screenshots` directory.

---

## Terminal Screenshots

- [ ] **01_terminal_seed.png**
  - **Action:** Run `npm run seed` in the terminal.
  - **Capture:** Terminal showing database connection, removal of old items, and insertion of the 10 DzTech Store products.

- [ ] **02_terminal_tests_all.png**
  - **Action:** Run `npm test` in the terminal.
  - **Capture:** Terminal displaying all 27 unit and end-to-end integration tests passing with `[PASS]`.

- [ ] **03_terminal_rate_limit.png**
  - **Action:** Run `npm run test:ratelimit` in the terminal.
  - **Capture:** Output showing attempts #1 through #5 decrementing `RateLimit-Remaining`, and attempt #6 returning `HTTP 429 Too Many Requests`.

- [ ] **04_terminal_server_dev.png**
  - **Action:** Run `npm run dev` in the terminal.
  - **Capture:** Nodemon boot message, database connection info, and server banner listening on port 3000.

---

## Postman Request & Response Screenshots

- [ ] **05_postman_collection_overview.png**
  - **Capture:** Postman sidebar showing the imported `DzTech Store E-Commerce REST API` collection with all folders (`01 - Health Check`, `02 - Authentication`, `03 - Products`, etc.).

- [ ] **06_postman_register_201.png**
  - **Request:** `POST /api/auth/register` with valid JSON payload (`name`, `email`, `password`).
  - **Capture:** Status code `201 Created` and response body showing user data without `passwordHash`.

- [ ] **07_postman_register_409.png**
  - **Request:** `POST /api/auth/register` with the same email again.
  - **Capture:** Status code `409 Conflict` and message `"A user with this email address already exists"`.

- [ ] **08_postman_register_400_validation.png**
  - **Request:** `POST /api/auth/register` with empty name or invalid email.
  - **Capture:** Status code `400 Bad Request` and `errors` array.

- [ ] **09_postman_login_200.png**
  - **Request:** `POST /api/auth/login` with valid email and password.
  - **Capture:** Status code `200 OK`, JWT `token` in response body, and Postman Test Results showing token saved to `jwt_token` variable.

- [ ] **10_postman_login_401.png**
  - **Request:** `POST /api/auth/login` with incorrect password.
  - **Capture:** Status code `401 Unauthorized` and generic message `"Invalid email or password"`.

- [ ] **11_postman_get_products_200.png**
  - **Request:** `GET /api/products` (No auth required).
  - **Capture:** Status code `200 OK` and array of seeded products.

- [ ] **12_postman_get_product_by_id_200.png**
  - **Request:** `GET /api/products/{{productId}}`.
  - **Capture:** Status code `200 OK` and single product details.

- [ ] **13_postman_get_product_400_bad_id.png**
  - **Request:** `GET /api/products/invalid-id-xyz`.
  - **Capture:** Status code `400 Bad Request` and message `"Invalid product ID format"`.

- [ ] **14_postman_get_product_404_not_found.png**
  - **Request:** `GET /api/products/660e1f72b5368a2f8c5b9999`.
  - **Capture:** Status code `404 Not Found` and message `"Product not found"`.

- [ ] **15_postman_create_product_401_no_token.png**
  - **Request:** `POST /api/products` with valid payload but without `Authorization` header.
  - **Capture:** Status code `401 Unauthorized` and message `"Access denied. No authorization token provided."`.

- [ ] **16_postman_create_product_201_with_jwt.png**
  - **Request:** `POST /api/products` with `Authorization: Bearer {{jwt_token}}` and valid product JSON.
  - **Capture:** Status code `201 Created` and newly created product with generated `_id`.

- [ ] **17_postman_update_product_200.png**
  - **Request:** `PUT /api/products/{{productId}}` with `Authorization: Bearer {{jwt_token}}` modifying price and stock.
  - **Capture:** Status code `200 OK` and updated product document.

- [ ] **18_postman_delete_product_200.png**
  - **Request:** `DELETE /api/products/{{productId}}` with `Authorization: Bearer {{jwt_token}}`.
  - **Capture:** Status code `200 OK` and deletion confirmation message.

- [ ] **19_postman_rate_limit_429.png**
  - **Request:** Repeated `POST /api/auth/login` on attempt #6.
  - **Capture:** Status code `429 Too Many Requests`, response message, and Response Headers tab showing `RateLimit-Limit: 5` and `RateLimit-Remaining: 0`.

- [ ] **20_postman_oauth2_config.png**
  - **Capture:** Postman "Authorization" tab displaying the OAuth 2.0 configuration with `Grant Type: Authorization Code (With PKCE)`, Auth URL, Token URL, Client ID, and scopes (`openid email profile`).
