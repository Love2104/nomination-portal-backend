import pg from 'pg';
import fs from 'fs';

const { Client } = pg;
const output = [];
function log(...args) { output.push(args.join(' ')); }

const client = new Client({
    host: 'ep-bold-fog-aivuuusb-pooler.c-4.us-east-1.aws.neon.tech',
    port: 5432,
    database: 'neondb',
    user: 'neondb_owner',
    password: 'npg_lgJBp7E1LYen',
    ssl: { rejectUnauthorized: false }
});

try {
    await client.connect();
    log('Connected to DB');

    // First, get columns
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Manifestos'`);
    log('Columns: ' + cols.rows.map(r => r.column_name).join(', '));

    // Get all manifestos
    const res = await client.query('SELECT * FROM "Manifestos"');
    log('Found ' + res.rows.length + ' manifestos');

    for (const m of res.rows) {
        log('');
        log(JSON.stringify(m, null, 2));
    }

    await client.end();
} catch (e) {
    log('Error: ' + e.message);
}

fs.writeFileSync('scripts/db_result.txt', output.join('\n'), 'utf-8');
process.exit(0);
