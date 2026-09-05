process.env.ENJAZ_VERCEL = '1';
import { server } from '../services/api/src/index.js';

export default function handler(req, res) {
  return server.emit('request', req, res);
}
