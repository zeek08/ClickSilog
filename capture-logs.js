// Quick helper to capture device logs via ADB
// Run: node capture-logs.js

const { exec } = require('child_process');

console.log('Capturing React Native logs... Press Ctrl+C to stop.\n');

const proc = exec('adb logcat -s ReactNativeJS Expo ReactNative');

proc.stdout.on('data', (data) => {
  process.stdout.write(data);
});

proc.stderr.on('data', (data) => {
  process.stderr.write(data);
});

proc.on('close', (code) => {
  console.log(`\nLog capture ended with code ${code}`);
});

