let serverPromise;

async function getServer() {
  if (!serverPromise) {
    process.env.ENJAZ_VERCEL = '1';
    serverPromise = import('../services/api/src/index.js').then(({ server }) => server);
  }
  return serverPromise;
}

module.exports = async function handler(req, res) {
  const server = await getServer();
  return server.emit('request', req, res);
};
