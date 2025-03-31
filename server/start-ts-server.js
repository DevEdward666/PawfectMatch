// Start TypeScript server with npm script
const path = require('path');
const { spawn } = require('child_process');

console.log('Starting TypeScript server...');

const serverProcess = spawn(
  'npm', 
  ['run', 'server:ts'], 
  { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || 5001
    }
  }
);

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Caught interrupt signal, shutting down gracefully...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});