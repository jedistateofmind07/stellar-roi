#!/usr/bin/env node
// Run this once to inject your Supabase credentials into all files
// Usage: node setup.js

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tlbeilrkfhjevnlvfnxa.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsYmVpbHJrZmhqZXZubHZmbnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTEyMjcsImV4cCI6MjA5MjAyNzIyN30.pD8fkK2Ju31VzA032_M8NZk5ASp4Z-tCdowgohW5-JE';

const files = ['public/bid.html', 'public/app.js'];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/%%SUPABASE_URL%%/g, SUPABASE_URL);
  content = content.replace(/%%SUPABASE_ANON_KEY%%/g, SUPABASE_ANON_KEY);
  fs.writeFileSync(filePath, content);
  console.log(`✓ Injected credentials into ${file}`);
});

console.log('\n✅ Setup complete! Your app is ready.');
