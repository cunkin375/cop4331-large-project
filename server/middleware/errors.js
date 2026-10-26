// Errors with an explicit status are safe to show to the client.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Express 4 does not catch rejected promises from async handlers.
export const asyncHandler = handler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export function notFound(_req, res) {
  res.status(404).json({ error: 'Endpoint not found' });
}

export function errorHandler(error, _req, res, _next) {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }
  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || {})[0];
    const field = key === 'usernameKey' ? 'username' : key || 'value';
    return res.status(409).json({ error: `That ${field} is already taken` });
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error('API request failed:', error.name);
  res.status(500).json({ error: 'Unable to complete request' });
}
