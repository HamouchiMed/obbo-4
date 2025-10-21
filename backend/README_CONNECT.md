connect.cjs usage

This project includes `connect.cjs` – a small CommonJS helper to connect to MongoDB with Mongoose.

Usage:

```js
// in a CommonJS script
const { connect, disconnect } = require('./connect.cjs');
(async () => {
  await connect();
  // require models and run tasks
  const User = require('./models/User');
  // ... do work
  await disconnect();
})();
```

Notes:
- `connect.cjs` reads `MONGODB_URI` or `ATLAS_uri` from environment.
- It caches the connection on the global object, which is helpful in serverless environments.
- Make sure `backend/.env` or Vercel env vars are set before running.
