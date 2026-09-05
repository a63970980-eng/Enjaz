import apiModule from './server.cjs';

const server = apiModule.server || apiModule.default?.server || apiModule.default || apiModule;

export default function handler(req, res) {
  const incoming = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const forwardedPath = incoming.searchParams.get('__enjaz_path');
  if (forwardedPath) {
    incoming.searchParams.delete('__enjaz_path');
    req.url = `${forwardedPath}${incoming.search ? `?${incoming.searchParams.toString()}` : ''}`;
  }
  return server.emit('request', req, res);
}
