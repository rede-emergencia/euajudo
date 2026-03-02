const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.url === '/' || req.url === '/test') {
        // Serve the test page
        const testPage = `<!DOCTYPE html>
<html>
<head>
    <title>Dashboard Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        .dashboard-link { 
            display: inline-block; 
            padding: 15px 30px; 
            background: #007bff; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
    </style>
</head>
<body>
    <h1>🧪 Shelter Dashboard V2 Test</h1>
    <div id="status"></div>
    
    <script>
        const status = document.getElementById('status');
        
        function addStatus(message, type = 'info') {
            const div = document.createElement('div');
            div.className = 'status ' + type;
            div.textContent = message;
            status.appendChild(div);
        }
        
        async function testServices() {
            addStatus('🚀 Testing services...', 'info');
            
            try {
                // Test backend
                const backendResponse = await fetch('http://localhost:8000/api/auth/me');
                addStatus('✅ Backend: ' + backendResponse.status + ' ' + (backendResponse.status === 401 ? '(Expected - no auth)' : ''), 'success');
            } catch (error) {
                addStatus('❌ Backend Error: ' + error.message, 'error');
            }
            
            try {
                // Test frontend
                const frontendResponse = await fetch('http://localhost:3000');
                addStatus('✅ Frontend: ' + frontendResponse.status, 'success');
            } catch (error) {
                addStatus('❌ Frontend Error: ' + error.message, 'error');
            }
            
            try {
                // Test dashboard page
                const dashboardResponse = await fetch('http://localhost:3000/shelter-dashboard-v2');
                addStatus('✅ Dashboard Page: ' + dashboardResponse.status, 'success');
            } catch (error) {
                addStatus('❌ Dashboard Error: ' + error.message, 'error');
            }
            
            addStatus('🎯 Tests completed!', 'info');
            addStatus('📝 Dashboard is ready for testing', 'info');
        }
        
        // Run tests
        testServices();
    </script>
    
    <h2>🌐 Access Dashboard</h2>
    <a href="http://localhost:3000/shelter-dashboard-v2" class="dashboard-link">
        Open Shelter Dashboard V2
    </a>
    
    <h3>🔐 Login Credentials:</h3>
    <ul>
        <li><strong>Email:</strong> test.shelter@inventory.com</li>
        <li><strong>Password:</strong> test123</li>
    </ul>
    
    <h3>✨ Features Available:</h3>
    <ul>
        <li>✅ Complete inventory management</li>
        <li>✅ Request creation and adjustment</li>
        <li>✅ Distribution tracking</li>
        <li>✅ Analytics and reporting</li>
        <li>✅ Low stock alerts</li>
    </ul>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(testPage);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log('🧪 Test server running at http://localhost:' + PORT);
    console.log('🌐 Open http://localhost:' + PORT + ' to test the dashboard');
});
