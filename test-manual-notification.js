#!/usr/bin/env node

/**
 * Manually create a test notification to verify email sending works
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.split('.supabase.co')[0].split('https://')[1];

console.log('\n📧 Manual Test Notification Creator\n');
console.log('Step 1: Get your user ID from the app');
console.log('  - Go to http://localhost:5173');
console.log('  - Sign in');
console.log('  - Open browser DevTools > Application > LocalStorage');
console.log('  - Find "sb-" key and paste it here\n');

// For now, let's create a test POST request to create a notification
// But we need the user ID first

console.log('To manually test email sending, we need a real notification in the database.');
console.log('\nQuick test: Trigger Edge Function with sample data\n');

// Since there are no notifications, let's add a debug endpoint
// that we can use to trigger the function with test data

const functionUrl = new URL(`${SUPABASE_URL}/functions/v1/scheduleReminder`);

const requestBody = JSON.stringify({});

const request = https.request(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Function invoked');
    console.log('Response:', JSON.parse(data));
    console.log('\nNext Steps:');
    console.log('1. Go to the app and create a task with a reminder');
    console.log('2. OR manually insert a notification via Supabase dashboard');
    console.log('3. Then run this test again to verify email is sent');
  });
});

request.on('error', console.error);
request.write(requestBody);
request.end();
