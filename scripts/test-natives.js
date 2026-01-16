#!/usr/bin/env node

/**
 * Native Module Test Suite
 * 
 * This script tests the manually downloaded native modules to ensure
 * they work correctly in the standalone context environment.
 */

const path = require('path');
const fs = require('fs');

// Set standalone mode for testing
process.env.STANDALONE_CONTEXT = 'true';

// Load our native configuration
const nativeConfig = require('./native-config');

console.log('Native Module Test Suite');
console.log('=' .repeat(50));

/**
 * Test LanceDB functionality
 */
async function testLanceDB() {
  console.log('\nTesting LanceDB...');
  
  try {
    // Run preflight check first
    const preflightPassed = nativeConfig.preflightCheck();
    if (!preflightPassed) {
      throw new Error('Preflight check failed');
    }

    // Try to load LanceDB
    const lancedb = require('lancedb');
  console.log('LanceDB module loaded successfully');
    
    // Test basic functionality
    const uri = path.join(__dirname, '..', 'test_db');
    const db = await lancedb.connect(uri);
  console.log('LanceDB connection established');
    
    // Create a simple table
    const data = [
      { id: 1, name: 'test', vector: [1, 2, 3] },
      { id: 2, name: 'test2', vector: [4, 5, 6] }
    ];
    
    const table = await db.createTable('test_table', data, { mode: 'overwrite' });
  console.log('LanceDB table created');
    
    // Query the table
    const results = await table.search([1, 2, 3]).limit(1).toArray();
  console.log(`LanceDB query returned ${results.length} results`);
    
    // Cleanup
    if (fs.existsSync(uri)) {
      fs.rmSync(uri, { recursive: true, force: true });
    }
    
    return true;
  } catch (error) {
    console.error('LanceDB test failed:', error.message);
    return false;
  }
}

/**
 * Test SQLite3 functionality
 */
async function testSQLite3() {
  console.log('\nTesting SQLite3...');
  
  try {
    // Test TryGhost SQLite3 first
    let sqlite3;
    try {
      sqlite3 = require('sqlite3');
      console.log('SQLite3 (TryGhost) module loaded');
    } catch (error) {
      console.log('SQLite3 (TryGhost) not available, trying better-sqlite3...');
      
      try {
        const Database = require('better-sqlite3');
  console.log('Better SQLite3 module loaded');
        
        // Test better-sqlite3
        const db = new Database(':memory:');
        db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
        db.exec("INSERT INTO test (name) VALUES ('test')");
        
        const stmt = db.prepare('SELECT * FROM test');
        const results = stmt.all();
        
  console.log(`Better SQLite3 query returned ${results.length} results`);
        db.close();
        
        return true;
      } catch (error) {
        console.error('Better SQLite3 test failed:', error.message);
        return false;
      }
    }
    
    // Test regular sqlite3 if loaded
    if (sqlite3) {
      return new Promise((resolve) => {
        const db = new sqlite3.Database(':memory:');
        
        db.serialize(() => {
          db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
          db.run("INSERT INTO test (name) VALUES ('test')");
          
          db.all('SELECT * FROM test', (err, rows) => {
            if (err) {
              console.error('SQLite3 query failed:', err.message);
              resolve(false);
            } else {
              console.log(`SQLite3 query returned ${rows.length} results`);
              resolve(true);
            }
            
            db.close();
          });
        });
      });
    }
    
  } catch (error) {
    console.error('SQLite3 test failed:', error.message);
    return false;
  }
}

/**
 * Test ONNX Runtime functionality
 */
async function testONNXRuntime() {
  console.log('\nTesting ONNX Runtime...');
  
  try {
    const ort = require('onnxruntime-node');
  console.log('ONNX Runtime module loaded successfully');
    
    // Test basic functionality
    const providers = ort.InferenceSession.getAvailableProviders();
  console.log(`Available ONNX providers: ${providers.join(', ')}`);
    
    // Test tensor creation
    const tensor = new ort.Tensor('float32', [1, 2, 3, 4], [2, 2]);
  console.log(`Created tensor with shape: [${tensor.dims.join(', ')}]`);
    
    return true;
  } catch (error) {
    console.error('ONNX Runtime test failed:', error.message);
    return false;
  }
}

/**
 * Test your local context provider
 */
async function testLocalContextProvider() {
  console.log('\nTesting Local Context Provider...');
  
  try {
    const { LocalContextProvider } = require('../src/providers/local-context.provider');
    const provider = new LocalContextProvider();
    
    // Test initialization
    await provider.init();
  console.log('Local Context Provider initialized');
    
    return true;
  } catch (error) {
    console.error('Local Context Provider test failed:', error.message);
    
    // Check if it's the specific LanceDB error we're trying to fix
    if (error.message.includes('@lancedb/lancedb-win32-x64-msvc')) {
      console.log('This is the exact error we\'re trying to fix with manual downloads');
    }
    
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const tests = [
    { name: 'LanceDB', fn: testLanceDB },
    { name: 'SQLite3', fn: testSQLite3 },
    { name: 'ONNX Runtime', fn: testONNXRuntime },
    { name: 'Local Context Provider', fn: testLocalContextProvider }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      results[test.name] = await test.fn();
    } catch (error) {
      console.error(`💥 Test ${test.name} crashed:`, error.message);
      results[test.name] = false;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('Test Results Summary:');
  console.log('-' .repeat(25));
  
  let passCount = 0;
  let totalCount = 0;
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`  ${status} ${name}`);
    
    if (passed) passCount++;
    totalCount++;
  });
  
  console.log('-' .repeat(25));
  console.log(`Overall: ${passCount}/${totalCount} tests passed`);
  
  if (passCount === totalCount) {
    console.log('All tests passed! Your standalone context is ready to deploy.');
  } else {
  console.log('Some tests failed. You may need to run the manual download script:');
    console.log('   node scripts/manual-download.js');
  }
  
  return passCount === totalCount;
}

// Check if native modules are available
if (!fs.existsSync(nativeConfig.nativesDir)) {
  console.log('Natives directory not found. Running manual download first...');
  console.log('   node scripts/manual-download.js');
  process.exit(1);
}

// Run tests if called directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
