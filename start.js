#!/usr/bin/env node

// Deployment startup script for Agricultural Asset Tokenization Platform
console.log('🚀 Starting Agricultural Asset Tokenization Platform for deployment...');

const { spawn } = require('child_process');
const path = require('path');

// Function to start a process and return a promise
function startProcess(command, args, name) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Starting ${name}...`);
    const process = spawn(command, args, {
      stdio: 'pipe',
      cwd: __dirname
    });
    
    process.stdout.on('data', (data) => {
      console.log(`[${name}] ${data.toString().trim()}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`[${name}] ${data.toString().trim()}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${name} failed with code ${code}`);
        reject(new Error(`${name} failed`));
      }
    });
    
    // For long-running processes, resolve immediately
    if (name === 'Web Server') {
      setTimeout(() => resolve(), 2000);  // Give it 2 seconds to start
    }
  });
}

async function deployPlatform() {
  try {
    // Step 1: Start Hardhat node in background
    console.log('\n🔗 Step 1: Starting blockchain node...');
    const hardhatProcess = spawn('npx', [
      'hardhat', 'node', 
      '--hostname', '0.0.0.0', 
      '--port', '8545'
    ], {
      stdio: 'pipe',
      detached: true
    });
    
    // Give Hardhat time to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Blockchain node started');
    
    // Step 2: Deploy contracts
    console.log('\n📋 Step 2: Deploying smart contracts...');
    await startProcess('npx', [
      'hardhat', 'run', 
      'scripts/deploy-and-setup.ts', 
      '--network', 'localhost'
    ], 'Contract Deployment');
    
    // Step 3: Start web server
    console.log('\n🌐 Step 3: Starting web interface...');
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit'
    });
    
    console.log('\n🎉 Agricultural Asset Tokenization Platform is now running!');
    console.log('📱 Web interface available on port 5000');
    console.log('🔗 Blockchain node running on port 8545');
    console.log('🎯 Ready for stakeholder demonstrations');
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      console.log('Shutting down platform...');
      hardhatProcess.kill();
      serverProcess.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start platform:', error.message);
    process.exit(1);
  }
}

// Start the platform
deployPlatform();