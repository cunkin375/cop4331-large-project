// Prints a JWT for local API testing.
// Usage: node --env-file=.env server/dev/devToken.js <userId> [username]
import { signToken } from '../middleware/auth.js';

if (process.env.NODE_ENV === 'production') {
  console.error('devToken.js is for development only and will not run in production.');
  process.exit(1);
}

const [userId, username = 'dev'] = process.argv.slice(2);
if (!/^[a-f\d]{24}$/i.test(userId || '')) {
  console.error('Usage: node --env-file=.env server/dev/devToken.js <24-character userId> [username]');
  process.exit(1);
}

try {
  console.log(signToken({ _id: userId, username }));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
