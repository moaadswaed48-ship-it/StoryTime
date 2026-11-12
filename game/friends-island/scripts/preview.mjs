// preview.mjs: serves a folder the way Patch's game host does (headers copied from ..\..\..\..\patch-guide.ts,
// GAME_HOST_HEADERS). The guide's version serves the current folder on 8080; this one also takes arguments:
//   node scripts/preview.mjs [folder=dist] [port=8080]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);
const types = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.wasm': 'application/wasm',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg',
	'.wav': 'audio/wav',
	'.woff2': 'font/woff2',
	'.glb': 'model/gltf-binary',
	'.ktx2': 'image/ktx2',
	'.md': 'text/markdown; charset=utf-8',
};
const headers = {
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob:",
		"style-src 'self' 'unsafe-inline' blob:",
		"img-src 'self' data: blob:",
		"media-src 'self' data: blob:",
		"font-src 'self' data:",
		"connect-src 'self' data: blob:",
		"worker-src 'self' blob:",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join('; '),
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Embedder-Policy': 'require-corp',
	'Cross-Origin-Resource-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), midi=(), display-capture=()',
	'Referrer-Policy': 'no-referrer',
	'X-Content-Type-Options': 'nosniff',
};
createServer(async (req, res) => {
	let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
	if (path === '' || path.endsWith('/') || path.endsWith('\\')) path += 'index.html';
	const file = join(root, path);
	try {
		if (!file.startsWith(root)) throw new Error('outside');
		if ((await stat(file)).isDirectory()) throw new Error('folder');
		res.writeHead(200, { ...headers, 'Content-Type': types[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
		res.end(await readFile(file));
	} catch {
		res.writeHead(404, headers).end('Not found');
	}
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
