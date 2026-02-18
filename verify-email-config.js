import dotenv from 'dotenv';
import { createWriteStream } from 'fs';
dotenv.config();

const log = createWriteStream('verify-result.txt');
const w = (msg) => { log.write(msg + '\n'); };

w('=== Email Config Verification ===');
w('EMAIL_HOST: ' + (process.env.EMAIL_HOST || 'smtp.gmail.com'));
w('EMAIL_PORT: ' + (process.env.EMAIL_PORT || '465'));
w('EMAIL_USER: ' + (process.env.EMAIL_USER || 'NOT SET'));
w('EMAIL_PASSWORD: ' + (process.env.EMAIL_PASSWORD ? 'SET (hidden)' : 'NOT SET'));

import('./utils/emailService.js').then(async (mod) => {
    w('Module imported OK');
    try {
        const otp = '123456';
        await mod.sendOTPEmail(process.env.EMAIL_USER, otp, 'verification');
        w('SUCCESS: Email sent!');
    } catch (err) {
        w('ERROR: ' + err.message);
        if (err.code) w('  code: ' + err.code);
        if (err.response) w('  SMTP response: ' + err.response);
    }
    log.end();
}).catch(err => {
    w('IMPORT ERROR: ' + err.message);
    log.end();
});
