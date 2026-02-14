import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/database.js';

async function main() {
    try {
        await sequelize.authenticate();
        console.log('DB connected');

        const [results] = await sequelize.query('SELECT id, "fileUrl", "fileName", phase FROM "Manifestos" LIMIT 5');

        if (results.length === 0) {
            console.log('No manifestos found in DB');
            process.exit(0);
        }

        for (const row of results) {
            console.log('\n=== Manifesto ===');
            console.log('ID:', row.id);
            console.log('URL:', row.fileUrl);
            console.log('File:', row.fileName);
            console.log('Phase:', row.phase);

            // Test the URL
            await new Promise((resolve) => {
                const url = row.fileUrl;
                console.log('\nTesting URL access...');

                https.get(url, (response) => {
                    console.log('Status:', response.statusCode);
                    console.log('Content-Type:', response.headers['content-type']);
                    console.log('Content-Disposition:', response.headers['content-disposition']);
                    console.log('Content-Length:', response.headers['content-length']);

                    if (response.statusCode >= 300 && response.statusCode < 400) {
                        console.log('Redirect Location:', response.headers.location);
                    }

                    response.destroy();
                    resolve();
                }).on('error', (err) => {
                    console.log('Request error:', err.message);
                    resolve();
                });
            });
        }
    } catch (err) {
        console.error('Error:', err.message);
    }

    process.exit(0);
}

main();
