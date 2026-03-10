const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
const fs = require('fs');
fs.writeFileSync('hash_output.txt', hash);
console.log('Done');
