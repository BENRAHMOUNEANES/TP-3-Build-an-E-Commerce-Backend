/**
 * End-to-End Test Suite for DzTech Store REST API
 * Module: ENSTA WAMD - TD-TP 3
 * Student: Anes Benrahmoune
 * 
 * Verifies all endpoints, status codes, payload structures,
 * authentication protections, and error handling.
 */

require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const Product = require('../src/models/Product');
const User = require('../src/models/User');

const TEST_PORT = 4999;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Test State
let server = null;
let authToken = null;
let createdProductId = null;
const results = [];

const logResult = (testName, expectedStatus, actualStatus, pass, extra = '') => {
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${testName} -> Expected: ${expectedStatus}, Received: ${actualStatus} ${extra}`);
  results.push({ testName, expectedStatus, actualStatus, pass, extra });
};

const runSuite = async () => {
  console.log('====================================================');
  console.log(' Starting DzTech Store REST API Automated Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Database Connection & Initial Seeding
    await connectDB();
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create a base product for testing
    const sampleProduct = await Product.create({
      name: 'MacBook Air M2 Test Edition',
      category: 'Ordinateurs',
      price: 1299.00,
      description: 'Test edition laptop',
      stock: 5,
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8'
    });
    createdProductId = sampleProduct._id.toString();

    // 2. Start Test HTTP Server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`Test server running on ${BASE_URL}\n`);

    // ----------------------------------------------------
    // TEST 1: Health Check
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/health`);
      const body = await res.json();
      const pass = res.status === 200 && body.success === true;
      logResult('GET /api/health (Server health)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 2: Register New User
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anes Benrahmoune',
          email: 'anes.student@ensta.dz',
          password: 'Password123!'
        })
      });
      const body = await res.json();
      const pass = res.status === 201 && body.success === true && body.data?.user?.email === 'anes.student@ensta.dz' && !body.data?.user?.passwordHash;
      logResult('POST /api/auth/register (Valid registration)', 201, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 3: Register with Existing Email (409 Conflict)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Anes',
          email: 'anes.student@ensta.dz',
          password: 'AnotherPassword123!'
        })
      });
      const body = await res.json();
      const pass = res.status === 409 && body.success === false;
      logResult('POST /api/auth/register (Duplicate email conflict)', 409, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 4: Register Invalid Data (400 Bad Request)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: 'not-an-email',
          password: '123' // too short
        })
      });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && Array.isArray(body.errors);
      logResult('POST /api/auth/register (Validation failure)', 400, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 5: Login with Valid Credentials (200 OK + JWT)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anes.student@ensta.dz',
          password: 'Password123!'
        })
      });
      const body = await res.json();
      authToken = body.data?.token;
      const pass = res.status === 200 && body.success === true && !!authToken && !body.data?.user?.passwordHash;
      logResult('POST /api/auth/login (Valid credentials -> receive JWT)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 6: Login with Incorrect Password (401 Unauthorized)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'anes.student@ensta.dz',
          password: 'WrongPassword999'
        })
      });
      const body = await res.json();
      const pass = res.status === 401 && body.success === false && body.message === 'Invalid email or password';
      logResult('POST /api/auth/login (Wrong password -> 401 generic)', 401, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 7: Login with Non-Existent Email (401 Unauthorized)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ghost@nonexistent.com',
          password: 'Password123!'
        })
      });
      const body = await res.json();
      const pass = res.status === 401 && body.success === false && body.message === 'Invalid email or password';
      logResult('POST /api/auth/login (Unknown email -> 401 generic)', 401, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 8: GET /api/products (Public, 200 OK)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products`);
      const body = await res.json();
      const pass = res.status === 200 && body.success === true && Array.isArray(body.data) && body.count >= 1;
      logResult('GET /api/products (Public list products)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 9: GET /api/products/:id (Public, 200 OK)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
      const body = await res.json();
      const pass = res.status === 200 && body.success === true && body.data?._id === createdProductId;
      logResult('GET /api/products/:id (Public single product)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 10: GET /api/products/:id with Invalid ObjectId (400)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/invalid-id-12345`);
      const body = await res.json();
      const pass = res.status === 400 && body.success === false;
      logResult('GET /api/products/:id (Malformed ObjectId -> 400)', 400, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 11: GET /api/products/:id Non-Existent Product (404)
    // ----------------------------------------------------
    {
      const nonExistentId = '660e1f72b5368a2f8c5b9999';
      const res = await fetch(`${BASE_URL}/api/products/${nonExistentId}`);
      const body = await res.json();
      const pass = res.status === 404 && body.success === false;
      logResult('GET /api/products/:id (Non-existent ObjectId -> 404)', 404, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 12: POST /api/products Without Token (401 Unauthorized)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hacker Drone',
          price: 500
        })
      });
      const body = await res.json();
      const pass = res.status === 401 && body.success === false;
      logResult('POST /api/products (Missing JWT token -> 401)', 401, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 13: POST /api/products With Invalid Token (401 Unauthorized)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer totally.fake.and.invalid.jwt.token'
        },
        body: JSON.stringify({
          name: 'Hacker Drone',
          price: 500
        })
      });
      const body = await res.json();
      const pass = res.status === 401 && body.success === false;
      logResult('POST /api/products (Invalid JWT token -> 401)', 401, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 14: POST /api/products With Valid Token but Bad Data (400)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: '', // Empty name
          price: -50 // Negative price
        })
      });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false && Array.isArray(body.errors);
      logResult('POST /api/products (Invalid payload data -> 400)', 400, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 15: POST /api/products With Valid Token (201 Created)
    // ----------------------------------------------------
    let newProductId = null;
    {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: 'Sony WH-1000XM5 Special',
          description: 'Premium noise-cancelling headphones',
          price: 349.99,
          category: 'Audio',
          stock: 12,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'
        })
      });
      const body = await res.json();
      newProductId = body.data?._id;
      const pass = res.status === 201 && body.success === true && !!newProductId;
      logResult('POST /api/products (Valid token + data -> 201 Created)', 201, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 16: PUT /api/products/:id (200 OK)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/${newProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          price: 329.99,
          stock: 20
        })
      });
      const body = await res.json();
      const pass = res.status === 200 && body.success === true && body.data?.price === 329.99 && body.data?.stock === 20;
      logResult('PUT /api/products/:id (Update product with valid token)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 17: PUT /api/products/:id Malformed ID (400)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/bad-id-xyz`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ price: 100 })
      });
      const body = await res.json();
      const pass = res.status === 400 && body.success === false;
      logResult('PUT /api/products/:id (Malformed ID -> 400)', 400, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 18: PUT /api/products/:id Non-existent ID (404)
    // ----------------------------------------------------
    {
      const nonExistentId = '660e1f72b5368a2f8c5b9999';
      const res = await fetch(`${BASE_URL}/api/products/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ price: 100 })
      });
      const body = await res.json();
      const pass = res.status === 404 && body.success === false;
      logResult('PUT /api/products/:id (Non-existent ID -> 404)', 404, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 19: DELETE /api/products/:id Without Token (401)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/${newProductId}`, {
        method: 'DELETE'
      });
      const body = await res.json();
      const pass = res.status === 401 && body.success === false;
      logResult('DELETE /api/products/:id (Without token -> 401)', 401, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 20: DELETE /api/products/:id With Valid Token (200 OK)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/${newProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const body = await res.json();
      const pass = res.status === 200 && body.success === true;
      logResult('DELETE /api/products/:id (With valid token -> 200 OK)', 200, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 21: DELETE /api/products/:id Already Deleted (404)
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/products/${newProductId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const body = await res.json();
      const pass = res.status === 404 && body.success === false;
      logResult('DELETE /api/products/:id (Already deleted -> 404)', 404, res.status, pass);
    }

    // ----------------------------------------------------
    // TEST 22: Unknown Endpoint 404 Handler
    // ----------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/api/non-existent-route`);
      const body = await res.json();
      const pass = res.status === 404 && body.success === false;
      logResult('GET /api/non-existent-route (Global 404 handler)', 404, res.status, pass);
    }

    // Summary calculation
    const passedCount = results.filter((r) => r.pass).length;
    const failedCount = results.length - passedCount;

    console.log('\n====================================================');
    console.log(` Test Suite Completed: ${passedCount}/${results.length} PASSED (${failedCount} failed)`);
    console.log('====================================================\n');

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runSuite();

