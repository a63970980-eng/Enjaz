export function readJsonBody(req, { limitBytes = 1_000_000 } = {}) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let chunks = [];
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      chunks = [];
      reject(error);
    };

    req.on('data', (chunk) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > limitBytes) {
        fail(Object.assign(new Error('Request body too large'), { status: 413 }));
        return;
      }
      chunks.push(buffer);
    });

    req.on('end', () => {
      if (settled) return;
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        const parsed = raw ? JSON.parse(raw) : {};
        settled = true;
        resolve(parsed);
      } catch {
        fail(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });

    req.on('error', fail);
  });
}
