import apiModule from './server.cjs';

const server = apiModule.server || apiModule.default?.server || apiModule.default || apiModule;

export default function handler(req, res) {
  return server.emit('request', req, res);
}
