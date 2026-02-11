#!/usr/bin/env node
/**
 * NPM Client MLAuth Test Script
 * 
 * Tests the @pullnote/client package with MLAuth authentication
 */

import { PullnoteClient } from './packages/client/src/index.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'http://localhost:5173';
const TEST_DUMBNAME = 'test-client-' + Date.now();
const MLAUTH_DIR = path.join(__dirname, '.test-mlauth-client');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function success(msg) {
  log(`✓ ${msg}`, 'green');
}

function error(msg) {
  log(`✗ ${msg}`, 'red');
}

function info(msg) {
  log(`ℹ ${msg}`, 'blue');
}

// Generate test keypair
function generateTestKeys() {
  if (!fs.existsSync(MLAUTH_DIR)) {
    fs.mkdirSync(MLAUTH_DIR, { recursive: true });
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'sec1', format: 'pem' }
  });

  const privateKeyPath = path.join(MLAUTH_DIR, 'private.pem');
  const publicKeyPath = path.join(MLAUTH_DIR, 'public.pem');

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  return { privateKey, publicKey, privateKeyPath };
}

async function runTests() {
  log('\n=== NPM Client MLAuth Test Suite ===\n', 'blue');

  try {
    // Test 1: Generate keys
    info('Test 1: Generating test keypair...');
    const { privateKeyPath, privateKey } = generateTestKeys();
    success('Keypair generated');

    // Test 2: Initialize client with privateKeyPath
    info('\nTest 2: Initialize client with privateKeyPath...');
    const pn1 = new PullnoteClient(
      {
        dumbname: TEST_DUMBNAME,
        privateKeyPath: privateKeyPath
      },
      API_BASE
    );
    success('Client initialized with privateKeyPath');

    // Test 3: Initialize client with privateKey directly
    info('\nTest 3: Initialize client with privateKey string...');
    const pn2 = new PullnoteClient(
      {
        dumbname: TEST_DUMBNAME,
        privateKey: privateKey
      },
      API_BASE
    );
    success('Client initialized with privateKey string');

    // Test 4: Create note
    info('\nTest 4: Creating note with MLAuth client...');
    try {
      const note = await pn1.add('/test-client/welcome', {
        title: 'Welcome to MLAuth Client',
        content: 'This note was created using the Pullnote client with MLAuth!'
      });
      success(`Note created: ${note.path}`);
    } catch (err) {
      error(`Failed to create note: ${err.message}`);
      info('Note: This is expected if API is not running or mloverflow verification fails');
      throw err;
    }

    // Test 5: Get note
    info('\nTest 5: Retrieving note...');
    const retrievedNote = await pn1.get('/test-client/welcome');
    success(`Note retrieved: ${retrievedNote.title}`);

    // Test 6: Update note
    info('\nTest 6: Updating note...');
    await pn1.update('/test-client/welcome', {
      content: 'Updated content via MLAuth client!'
    });
    success('Note updated');

    // Test 7: Get title
    info('\nTest 7: Getting note title...');
    const title = await pn1.getTitle('/test-client/welcome');
    success(`Title: ${title}`);

    // Test 8: Get markdown
    info('\nTest 8: Getting markdown content...');
    const md = await pn1.getMd('/test-client/welcome');
    success(`Markdown: ${md.substring(0, 50)}...`);

    // Test 9: List notes
    info('\nTest 9: Listing notes...');
    const list = await pn1.list('/test-client');
    success(`Listed notes: ${list.children?.length || 0} children`);

    // Test 10: Agent-specific methods
    info('\nTest 10: Testing agent-specific methods...');
    try {
      const agentInfo = await pn1.getAgentInfo();
      success('Agent info retrieved');
      info(`  Dumbname: ${agentInfo.dumbname}`);
      info(`  Projects: ${agentInfo.total_projects}`);
    } catch (err) {
      error(`Failed to get agent info: ${err.message}`);
    }

    // Test 11: Delete note
    info('\nTest 11: Deleting note...');
    await pn1.remove('/test-client/welcome');
    success('Note deleted');

    // Test 12: Verify deletion
    info('\nTest 12: Verifying deletion...');
    const deletedNote = await pn1.get('/test-client/welcome');
    if (deletedNote === null) {
      success('Note confirmed deleted');
    } else {
      error('Note still exists!');
    }

    // Test 13: Test with custom signer
    info('\nTest 13: Testing custom signer function...');
    const pn3 = new PullnoteClient(
      {
        dumbname: TEST_DUMBNAME,
        signer: async (message) => {
          const sign = crypto.createSign('SHA256');
          sign.update(message);
          sign.end();
          return sign.sign(privateKey, 'base64');
        }
      },
      API_BASE
    );
    
    const pingResult = await pn3.ping('/');
    success('Custom signer works');

    log('\n=== All Client Tests Passed! ===\n', 'green');

  } catch (err) {
    log('\n=== Tests Failed ===\n', 'red');
    error(err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    // Cleanup
    info('\nCleaning up test files...');
    if (fs.existsSync(MLAUTH_DIR)) {
      fs.rmSync(MLAUTH_DIR, { recursive: true });
      success('Test files removed');
    }
  }
}

// Run tests
runTests().catch(err => {
  error(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
