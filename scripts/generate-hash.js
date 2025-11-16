const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'Admin@123';

bcrypt.hash(password, 10).then(hash => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  process.exit(0);
}).catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});

