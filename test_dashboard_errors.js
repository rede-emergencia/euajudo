// Simple test without external dependencies
const http = require('http');
const https = require('https');

function testUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const request = client.get(url, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                resolve({
                    status: response.statusCode,
                    headers: response.headers,
                    content: data.substring(0, 1000) // First 1000 chars
                });
            });
        });
        request.on('error', reject);
        request.setTimeout(5000, () => reject(new Error('Timeout')));
    });
}

async function runTests() {
    console.log('🧪 Starting Dashboard Tests...\n');
    
    try {
        // Test backend
        console.log('1. Testing Backend...');
        const backend = await testUrl('http://localhost:8000/api/auth/me');
        console.log(`   Status: ${backend.status} ${backend.status === 401 ? '(✅ Expected)' : ''}`);
        
        // Test frontend
        console.log('\n2. Testing Frontend...');
        const frontend = await testUrl('http://localhost:3000');
        console.log(`   Status: ${frontend.status} ${frontend.status === 200 ? '(✅ OK)' : ''}`);
        
        // Test dashboard page
        console.log('\n3. Testing Dashboard Page...');
        const dashboard = await testUrl('http://localhost:3000/shelter-dashboard-v2');
        console.log(`   Status: ${dashboard.status} ${dashboard.status === 200 ? '(✅ OK)' : ''}`);
        
        // Check for React error indicators
        if (dashboard.content.includes('error') || dashboard.content.includes('Error')) {
            console.log('   ⚠️  Possible error indicators found in HTML');
        } else {
            console.log('   ✅ No obvious error indicators in HTML');
        }
        
        console.log('\n🎯 Test Results:');
        console.log(`   Backend: ${backend.status === 401 ? '✅' : '❌'}`);
        console.log(`   Frontend: ${frontend.status === 200 ? '✅' : '❌'}`);
        console.log(`   Dashboard: ${dashboard.status === 200 ? '✅' : '❌'}`);
        
        console.log('\n🌐 Access the dashboard at: http://localhost:3000/shelter-dashboard-v2');
        console.log('🔐 Login with: test.shelter@inventory.com / test123');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runTests();
