/**
 * OAuth 2.0 & JWT Hybrid Verification Test
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * Student: Anes Benrahmoune
 * 
 * Verifies that the authMiddleware correctly:
 * 1. Accepts a valid local JWT
 * 2. Rejects corrupted or signature-tampered tokens
 * 3. Correctly parses and passes token to OAuth2/OIDC verifier
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { authMiddleware, verifyOAuthToken } = require('../src/middleware/authMiddleware');

const runOAuthTests = async () => {
  console.log('====================================================');
  console.log(' Starting DzTech Store Auth Middleware Unit Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  };

  // Test 1: Reject request with missing Authorization header
  {
    const req = { headers: {} };
    let statusSent = null;
    let bodySent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return {
          json: (body) => {
            bodySent = body;
          }
        };
      }
    };
    const next = () => {};

    await authMiddleware(req, res, next);
    assert(statusSent === 401 && bodySent?.status === 401, 'Rejects missing Authorization header with HTTP 401');
  }

  // Test 2: Reject request with non-Bearer Authorization header
  {
    const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
    let statusSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return { json: () => {} };
      }
    };
    await authMiddleware(req, res, () => {});
    assert(statusSent === 401, 'Rejects Basic auth with HTTP 401');
  }

  // Test 3: Accept valid local JWT
  {
    const validSecret = process.env.JWT_SECRET || 'dztech_super_secret_jwt_key_2026_wamd_ensta';
    const sampleToken = jwt.sign(
      { userId: '65f12345678901234567890a', email: 'anes.oauth@ensta.dz' },
      validSecret,
      { expiresIn: '1h' }
    );

    const req = { headers: { authorization: `Bearer ${sampleToken}` } };
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    const res = {};

    await authMiddleware(req, res, next);
    assert(nextCalled === true && req.user?.email === 'anes.oauth@ensta.dz', 'Successfully authenticates valid local JWT');
  }

  // Test 4: Reject token signed with invalid secret (and not a valid OAuth token)
  {
    const invalidToken = jwt.sign(
      { userId: '65f12345678901234567890a', email: 'hacker@ensta.dz' },
      'wrong_untrusted_secret_key',
      { expiresIn: '1h' }
    );

    const req = { headers: { authorization: `Bearer ${invalidToken}` } };
    let statusSent = null;
    const res = {
      status: (code) => {
        statusSent = code;
        return { json: () => {} };
      }
    };
    await authMiddleware(req, res, () => {});
    assert(statusSent === 401, 'Rejects token with untrusted signature with HTTP 401');
  }

  // Test 5: Verify OAuth verifier handles malformed token gracefully
  {
    const result = await verifyOAuthToken('malformed-token-xyz');
    assert(result === null, 'verifyOAuthToken returns null on invalid token without crashing');
  }

  console.log('\n====================================================');
  console.log(` Auth Middleware Tests: ${passed}/${passed + failed} PASSED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  }
};

runOAuthTests();

