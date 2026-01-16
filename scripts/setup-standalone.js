#!/usr/bin/env node

/**
 * Standalone Context Setup Script
 * 
 * This script automates the complete setup process for standalone context deployment,
 * including native module downloads, configuration, testing, and packaging.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const SCRIPTS_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPTS_DIR);

console.log('Standalone Context Setup Script');
console.log('=' .repeat(50));

/**
 * Execute a command with live output
 */
function executeCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\nRunning: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      cwd: options.cwd || PROJECT_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Command completed successfully`);
        resolve(code);
      } else {
        console.error(`Command failed with exit code ${code}`);
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`Command error:`, error.message);
      reject(error);
    });
  });
}

/**
 * Check if a directory exists and is not empty
 */
function directoryHasContent(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return false;
  }
  
  const files = fs.readdirSync(dirPath);
  return files.length > 0;
}

/**
 * Step 1: Download native modules
 */
async function downloadNativeModules() {
  console.log('\nStep 1: Downloading Native Modules');
  console.log('-' .repeat(30));
  
  const nativesDir = path.join(PROJECT_ROOT, 'natives');
  
  if (directoryHasContent(nativesDir)) {
    console.log('ℹNatives directory already exists with content.');
    
    const answer = await askYesNo('Do you want to re-download? (y/n): ');
    if (!answer) {
      console.log('Skipping native module download');
      return true;
    }
    
    // Clean existing natives
    console.log('Cleaning existing natives directory...');
    fs.rmSync(nativesDir, { recursive: true, force: true });
  }
  
  // Run the manual download script
  await executeCommand('node', ['scripts/manual-download.js']);
  
  // Verify download success
  if (!directoryHasContent(nativesDir)) {
    throw new Error('Native modules download failed - natives directory is empty');
  }
  
  console.log('Native modules downloaded successfully');
  return true;
}

/**
 * Step 2: Test native modules
 */
async function testNativeModules() {
  console.log('\nStep 2: Testing Native Modules');
  console.log('-' .repeat(30));
  
  try {
    await executeCommand('node', ['scripts/test-natives.js']);
  console.log('All native module tests passed');
    return true;
  } catch (error) {
    console.error('Native module tests failed:', error.message);
    
    const answer = await askYesNo('Continue despite test failures? (y/n): ');
    return answer;
  }
}

/**
 * Step 3: Install dependencies
 */
async function installDependencies() {
  console.log('\nStep 3: Installing Dependencies');
  console.log('-' .repeat(30));
  
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'node_modules'))) {
    console.log('Installing npm dependencies...');
    await executeCommand('npm', ['install']);
  } else {
    console.log('ℹDependencies already installed');
  }
  
  console.log('Dependencies ready');
  return true;
}

/**
 * Step 4: Build standalone executable
 */
async function buildStandaloneExecutable() {
  console.log('\nStep 4: Building Standalone Executable');
  console.log('-' .repeat(30));
  
  // Check if PKG is installed
  try {
    execSync('pkg --version', { stdio: 'ignore' });
  } catch (error) {
    console.log('Installing PKG globally...');
    await executeCommand('npm', ['install', '-g', 'pkg']);
  }
  
  // Build the executable
  console.log('Building executable with PKG...');
  await executeCommand('pkg', ['.', '--out-path', 'bin']);
  
  // Verify build output
  const binDir = path.join(PROJECT_ROOT, 'bin');
  if (!directoryHasContent(binDir)) {
    throw new Error('PKG build failed - no output generated');
  }
  
  // Copy natives directory to bin for standalone deployment
  const targetNativesDir = path.join(binDir, 'natives');
  const sourceNativesDir = path.join(PROJECT_ROOT, 'natives');
  
  if (fs.existsSync(sourceNativesDir)) {
    console.log('Copying natives to bin directory...');
    fs.cpSync(sourceNativesDir, targetNativesDir, { recursive: true });
  console.log('Natives copied to deployment directory');
  }
  
  console.log('Standalone executable built successfully');
  return true;
}

/**
 * Step 5: Test the built executable
 */
async function testStandaloneExecutable() {
  console.log('\nStep 5: Testing Standalone Executable');
  console.log('-' .repeat(30));
  
  const binDir = path.join(PROJECT_ROOT, 'bin');
  const executables = fs.readdirSync(binDir).filter(f => 
    f.includes('index') && !f.includes('.') && !f.includes('natives')
  );
  
  if (executables.length === 0) {
    throw new Error('No executable found in bin directory');
  }
  
  const executable = path.join(binDir, executables[0]);
  console.log(`Testing executable: ${executable}`);
  
  try {
    // Test version command
    execSync(`"${executable}" --version`, { 
      stdio: 'pipe',
      cwd: binDir,
      timeout: 10000
    });
    
  console.log('Executable version check passed');
    
    // Test help command
    execSync(`"${executable}" --help`, { 
      stdio: 'pipe',
      cwd: binDir,
      timeout: 10000
    });
    
  console.log('Executable help check passed');
    
    console.log('Standalone executable is working correctly!');
    return true;
  } catch (error) {
    console.error('Executable test failed:', error.message);
    return false;
  }
}

/**
 * Simple yes/no prompt
 */
async function askYesNo(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Main setup process
 */
async function main() {
  const steps = [
    { name: 'Download Native Modules', fn: downloadNativeModules },
    { name: 'Test Native Modules', fn: testNativeModules },
    { name: 'Install Dependencies', fn: installDependencies },
    { name: 'Build Standalone Executable', fn: buildStandaloneExecutable },
    { name: 'Test Standalone Executable', fn: testStandaloneExecutable }
  ];
  
  let completed = 0;
  
  try {
    for (const [index, step] of steps.entries()) {
      console.log(`\nStep ${index + 1}/${steps.length}: ${step.name}`);
      
      const success = await step.fn();
      if (success) {
        completed++;
      } else {
  console.log(`Step ${index + 1} completed with issues`);
        break;
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('Setup Complete!');
    console.log('-' .repeat(20));
  console.log(`Completed: ${completed}/${steps.length} steps`);
    
    if (completed === steps.length) {
      console.log('Your standalone context provider is ready!');
      console.log('\nFiles created:');
      console.log('   • bin/ - Contains your standalone executable');
      console.log('   • natives/ - Contains manually downloaded native modules');
      console.log('To deploy:');
      console.log('   1. Copy the entire bin/ directory to your target machine');
      console.log('   2. Run the executable: ./index-workspace serve');
      console.log('The executable includes all native dependencies and should work');
      console.log('   on any Windows x64 machine without requiring Node.js installation.');
    } else {
  console.log('\nSetup completed with issues. Check the logs above for details.');
    }
    
  } catch (error) {
    console.error('\nSetup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('   • Check your internet connection');
    console.log('   • Ensure you have sufficient disk space');
    console.log('   • Run individual steps manually if needed:');
    console.log('     - node scripts/manual-download.js');
    console.log('     - node scripts/test-natives.js');
    console.log('     - pkg . --out-path bin');
    
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Setup script crashed:', error);
    process.exit(1);
  });
}

module.exports = { main };
