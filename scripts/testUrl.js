import https from 'https';
import fs from 'fs';

const output = [];
function log(...args) { output.push(args.join(' ')); }

// ACTUAL URL from database
const url = 'https://res.cloudinary.com/dzjiawtzf/raw/upload/v1771049653/iitk-election/manifestos/phase1/1771049662206_P4_184dba4f-c759-4570-9e05-4a754d3c73fe.pdf';

function testUrl(label, url) {
    return new Promise((resolve) => {
        log('--- Testing ' + label + ' ---');
        log('URL: ' + url);

        https.get(url, (res) => {
            log('Status: ' + res.statusCode);
            log('Headers: ' + JSON.stringify(res.headers, null, 2));

            let data = Buffer.alloc(0);
            res.on('data', (chunk) => {
                if (data.length < 200) {
                    data = Buffer.concat([data, chunk]);
                }
            });
            res.on('end', () => {
                const headerStr = data.slice(0, 30).toString('utf-8');
                log('First bytes: ' + headerStr);
                log('Is PDF? ' + headerStr.startsWith('%PDF'));
                resolve();
            });
        }).on('error', (err) => {
            log('Error: ' + err.message);
            resolve();
        });
    });
}

await testUrl('ACTUAL_DB_URL', url);

fs.writeFileSync('scripts/url_test_result.txt', output.join('\n'), 'utf-8');
process.exit(0);
