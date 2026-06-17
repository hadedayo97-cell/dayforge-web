#!/usr/bin/env node

/**
 * Test email notification flow end-to-end
 * Usage: node test-email-flow.js
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
const RESEND_API_KEY = env.RESEND_API_KEY;
const SENDER_EMAIL = env.SENDER_EMAIL;

console.log('\n📋 Email Flow Test Diagnostics\n');
console.log('────────────────────────────────────────');

// 1. Check environment variables
console.log('\n✅ Environment Variables:');
console.log(`  VITE_SUPABASE_URL: ${SUPABASE_URL ? '✓' : '❌ Missing'}`);
console.log(`  VITE_SUPABASE_ANON_KEY: ${SUPABASE_KEY ? '✓' : '❌ Missing'}`);
console.log(`  RESEND_API_KEY: ${RESEND_API_KEY ? '✓' : '❌ Missing'}`);
console.log(`  SENDER_EMAIL: ${SENDER_EMAIL ? '✓ ' + SENDER_EMAIL : '❌ Missing'}`);

if (!SUPABASE_URL || !SUPABASE_KEY || !RESEND_API_KEY) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
}

// 2. Test Edge Function invocation
console.log('\n🔧 Testing Edge Function:');

const functionUrl = new URL('https://bqirtdlfjqikmovlwqyx.supabase.co/functions/v1/scheduleReminder');

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
    console.log(`  Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const result = JSON.parse(data);
        console.log(`  ✓ Function executed successfully`);
        console.log(`  Response: ${JSON.stringify(result, null, 2)}`);
      } catch (e) {
        console.log(`  Response: ${data}`);
      }
    } else {
      console.log(`  ❌ Error: ${data}`);
    }
    
    console.log('\n✅ Diagnostic complete');
  });
});

request.on('error', (error) => {
  console.log(`  ❌ Connection error: ${error.message}`);
  console.log('\nMake sure:');
  console.log('  1. You have internet connection');
  console.log('  2. The Edge Function URL is correct');
  console.log('  3. The Supabase project is accessible');
});

request.write(JSON.stringify({}));
request.end();
