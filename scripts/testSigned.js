import https from 'https';
import http from 'http';
import fs from 'fs';

const output = [];
function log(...args) { output.push(args.join(' ')); }

// Test the proxy endpoint directly
function testUrl(label, url) {
    return new Promise((resolve) => {
        log('--- Testing ' + label + ' ---');
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, (res) => {
            log('Status: ' + res.statusCode);
            log('Content-Type: ' + (res.headers['content-type'] || 'none'));
            log('Content-Length: ' + (res.headers['content-length'] || 'none'));
            log('Content-Disposition: ' + (res.headers['content-disposition'] || 'none'));

            let data = Buffer.alloc(0);
            res.on('data', (chunk) => {
                data = Buffer.concat([data, chunk]);
            });
            res.on('end', () => {
                log('Total bytes received: ' + data.length);
                log('First 30 bytes: ' + data.slice(0, 30).toString('utf-8'));
                log('Is PDF? ' + data.slice(0, 5).toString('utf-8').startsWith('%PDF'));
                resolve();
            });
        }).on('error', (err) => {
            log('Error: ' + err.message);
            resolve();
        });
    });
}

// Test the backend proxy endpoint
await testUrl('PROXY_ENDPOINT', 'http://127.0.0.1:5000/api/manifestos/view/f74881bf-c5ba-4c00-847e-4ef23aeb7925');

fs.writeFileSync('scripts/proxy_test.txt', output.join('\n'), 'utf-8');
process.exit(0);
