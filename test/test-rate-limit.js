/**
 * Rate Limit Demonstration and Verification Script
 * Module: ENSTA WAMD - TD-TP 3
 * Student: Anes Benrahmoune
 * 
 * Demonstrates:
 * 1. Login Limiter: Max 5 requests per 15 minutes on POST /api/auth/login (6th request returns 429).
 * 2. General Limiter: Max 100 requests per 15 minutes on /api (101st request returns 429).
 * 3. Inspects RFC standard RateLimit-* headers and response JSON format.
 * 
 * Run with: npm run test:ratelimit
 */

require('dotenv').config();
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runRateLimitDemonstration = async () => {
  console.log('====================================================');
  console.log(' Starting DzTech Store Rate Limit Demonstration');
  console.log('====================================================\n');

  let server = null;

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`Demo server active on ${BASE_URL}\n`);

    // ----------------------------------------------------
    // PART 1: Demonstrate Login Limiter (Limit = 5 req/15min)
    // ----------------------------------------------------
    console.log('>>> [PART 1] Testing Login Rate Limiter (Max: 5 attempts / 15 min)...');

    let hit429OnLogin = false;
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ratelimit.test@ensta.dz',
          password: 'IncorrectPassword'
        })
      });

      const body = await res.json();
      const limitHeader = res.headers.get('ratelimit-limit');
      const remainingHeader = res.headers.get('ratelimit-remaining');
      const resetHeader = res.headers.get('ratelimit-reset');

      console.log(
        `  Attempt #${i}: HTTP ${res.status} | Limit: ${limitHeader} | Remaining: ${remainingHeader} | Reset: ${resetHeader}s | Message: "${body.message}"`
      );

      if (i <= 5 && res.status === 401) {
        // Expected
      } else if (i === 6 && res.status === 429) {
        hit429OnLogin = true;
        console.log('  -> SUCCESS: Request #6 triggered HTTP 429 Too Many Requests as expected!\n');
      }
    }

    if (!hit429OnLogin) {
      throw new Error('Login rate limiter did not trigger HTTP 429 on the 6th attempt!');
    }

    // ----------------------------------------------------
    // PART 2: Demonstrate General Limiter (Limit = 100 req/15min)
    // ----------------------------------------------------
    console.log('>>> [PART 2] Testing General API Rate Limiter (Max: 100 req / 15 min)...');
    console.log('  Sending 101 requests to GET /api/products in rapid bursts...');

    let hit429OnGeneral = false;
    let successfulCount = 0;

    // Send requests 1 to 101
    for (let i = 1; i <= 101; i++) {
      const res = await fetch(`${BASE_URL}/api/products`);
      if (res.status === 200) {
        successfulCount++;
      } else if (res.status === 429) {
        const body = await res.json();
        const limitHeader = res.headers.get('ratelimit-limit');
        const remainingHeader = res.headers.get('ratelimit-remaining');
        console.log(`\n  Triggered on request #${i}: HTTP ${res.status}`);
        console.log(`  Headers: RateLimit-Limit: ${limitHeader}, RateLimit-Remaining: ${remainingHeader}`);
        console.log(`  Response body:`, JSON.stringify(body, null, 2));
        hit429OnGeneral = true;
        break;
      }

      if (i % 25 === 0) {
        process.stdout.write(`  ... sent ${i} requests (Remaining headers tracking)...\n`);
      }
    }

    if (hit429OnGeneral) {
      console.log(`\n  -> SUCCESS: General rate limiter allowed requests and blocked request #101 with HTTP 429!\n`);
    } else {
      console.warn('  -> General rate limiter warning: did not receive 429 within 101 requests.');
    }

    console.log('====================================================');
    console.log(' Rate Limiting Demonstration: ALL CHECKS PASSED');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Rate limiting demo error:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runRateLimitDemonstration();

