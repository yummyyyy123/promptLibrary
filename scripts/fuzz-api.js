#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const ENDPOINTS = [
    '/api/admin/submissions',
    '/api/admin/prompts',
    '/api/admin/auth/email-otp'
];

const FUZZ_PAYLOADS = [
    null,
    undefined,
    "",
    "A".repeat(10000), // Buffer overflow attempt
    { "$gt": "" },    // NoSQL injection
    12345,            // Type mismatch
    true,
    "\x00",           // Null byte injection
    "../../etc/passwd" // Path traversal
];

async function fuzz() {
    console.log(`🚀 Starting API Fuzzer on ${BASE_URL}...`);

    for (const endpoint of ENDPOINTS) {
        console.log(`\n🔍 Fuzzing endpoint: ${endpoint}`);

        for (const payload of FUZZ_PAYLOADS) {
            try {
                const response = await axios.post(`${BASE_URL}${endpoint}`, {
                    data: payload
                }, {
                    timeout: 5000,
                    validateStatus: false
                });

                if (response.status === 500) {
                    console.error(`❌ CRITICAL: 500 Internal Server Error with payload: ${JSON.stringify(payload)}`);
                } else {
                    console.log(`✅ ${response.status} - Payload: ${typeof payload === 'string' ? (payload.length > 20 ? payload.substring(0, 20) + '...' : payload) : 'non-string'}`);
                }
            } catch (error) {
                console.warn(`⚠️ Request failed: ${error.message}`);
            }
        }
    }
}

// Only run if APP_URL is set or explicitly called
if (process.env.APP_URL) {
    fuzz();
} else {
    console.log("Skipping dynamic fuzzing - APP_URL not set.");
}
