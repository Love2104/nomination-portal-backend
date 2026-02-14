import fs from 'fs';
import path from 'path';

try {
    const filePath = path.resolve('test_output.txt');
    console.log('Attempting to write to:', filePath);
    fs.writeFileSync(filePath, 'Hello form Node.js via ES Module');
    console.log('Successfully wrote to file');
} catch (err) {
    console.error('Error writing file:', err);
}
