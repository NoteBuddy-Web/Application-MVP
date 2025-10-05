#!/usr/bin/env node

// Setup script for OpenAI API key
const fs = require('fs');
const path = require('path');

console.log('🔧 NoteBuddy OpenAI Setup');
console.log('========================\n');

console.log('To enable real transcription and summaries:');
console.log('1. Get your OpenAI API key from: https://platform.openai.com/api-keys');
console.log('2. Choose one of these methods:\n');

console.log('Method 1 - Environment Variable (Recommended):');
console.log('export OPENAI_API_KEY="your_actual_api_key_here"');
console.log('node server.js\n');

console.log('Method 2 - Update Configuration File:');
console.log('Edit pages/openai-config.js and replace "sk-your-actual-openai-api-key-here" with your key\n');

console.log('Method 3 - Set for this session:');
console.log('OPENAI_API_KEY="your_key" node server.js\n');

console.log('Current status:');
const configPath = path.join(__dirname, 'openai-config.js');
if (fs.existsSync(configPath)) {
    const config = require('./openai-config.js');
    if (config.OPENAI_API_KEY && config.OPENAI_API_KEY !== 'sk-your-actual-openai-api-key-here') {
        console.log('✅ API key is configured in openai-config.js');
    } else {
        console.log('❌ API key not configured in openai-config.js');
    }
} else {
    console.log('❌ Configuration file not found');
}

if (process.env.OPENAI_API_KEY) {
    console.log('✅ API key is set as environment variable');
} else {
    console.log('❌ API key not set as environment variable');
}

console.log('\nAfter setting your API key, restart the server to enable real transcription!');
