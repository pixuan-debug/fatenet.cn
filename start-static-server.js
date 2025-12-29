// Static file server with API proxy
const http = require('http');
const fs = require('fs');
const path = require('path');
const httpProxy = require('http-proxy');

const PORT = 8081;
const ROOT_DIR = path.join(__dirname);
const API_PORT = 3000;

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create proxy server for API requests
const proxy = httpProxy.createProxyServer({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  secure: false
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, {
    'Content-Type': 'application/json'
  });
  res.end(JSON.stringify({
    code: 500,
    message: 'API代理错误',
    error: err.message
  }));
});

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Check if it's an API request
  if (req.url.startsWith('/api/')) {
    // Proxy API requests to the API server
    proxy.web(req, res);
    return;
  }
  
  // Get file path for static files
    let filePath = path.join(ROOT_DIR, req.url === '/' ? '/index.html' : req.url.split('?')[0]);
    
    console.log(`Request URL: ${req.url}`);
    console.log(`Mapped to: ${filePath}`);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`File not found: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        // Get file extension
        const extname = path.extname(filePath);
        // Set content type based on file extension
        const contentType = mimeTypes[extname] || 'application/octet-stream';
        
        console.log(`Serving file: ${filePath} with content-type: ${contentType}`);
        
        // Read and serve file
        fs.readFile(filePath, (err, content) => {
            if (err) {
                console.log(`Error reading file: ${filePath}`, err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        });
    });
});

server.listen(PORT, () => {
  console.log(`Static file server with API proxy started on http://localhost:${PORT}`);
  console.log(`API proxy forwarding to http://localhost:${API_PORT}`);
  console.log(`Root directory: ${ROOT_DIR}`);
  console.log('Press Ctrl+C to stop the server');
  console.log('');
  console.log('Test URLs:');
  console.log(`- Admin page: http://localhost:${PORT}/admin.html`);
  console.log(`- Articles page: http://localhost:${PORT}/articles.html`);
  console.log(`- Article detail page: http://localhost:${PORT}/article-detail.html?id=1&category=basic-theory`);
  console.log(`- Index page: http://localhost:${PORT}/index.html`);
  console.log(`- API Health Check: http://localhost:${PORT}/api/v1/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStopping static file server...');
  proxy.close();
  server.close(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});
