const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

loadEnv();
const appTokens = fs.readFileSync('./tokens').toString().split(/\s*\n\s*/gm);
let ratelimits = [];

http.createServer((req, res) => {
	const phraseMatch = /\/\?([^=]+=[^&]+&)*phrase=([^&]+)(&[^=]+=[^&]+)*$/i.exec(req.url);
	if (!phraseMatch) {
		res.setHeader('Content-Type', 'application/json');
		res.writeHead(400);
		res.end(`{"error":"Bad request"}`);
		return;
	}
	const phrase = decodeURIComponent(phraseMatch[2]);
	const authMachHeader = /^bearer (.+)$/i.exec(req.headers.authorization);
	const authMatchToken = /\/\?([^=]+=[^&]+&)*token=([^&]+)(&[^=]+=[^&]+)*$/i.exec(req.url);
	const token = authMachHeader ? authMachHeader[1] : (authMatchToken ? authMatchToken[2] : null);
	const ip = getIp(req);
	if ((token && !appTokens.includes(token)) || (!token && ratelimits.includes(ip)) || (!token && parseInt(process.env.RATELIMIT, 10) === -1)) {
		res.setHeader('Content-Type', 'application/json');
		res.writeHead(401);
		res.end(`{"error":"Unauthorized"}`);
		return;
	}
	if (!token && phrase.length > process.env.TEXTLIMIT) {
		res.setHeader('Content-Type', 'application/json');
		res.writeHead(401);
		res.end(`{"error":"Too long text"}`);
		return;
	}
	ratelimits.push(ip);
	setTimeout(() => ratelimits = ratelimits.filter(r => r !== ip), parseInt(process.env.RATELIMIT, 10));
	res.setHeader('Content-Type', 'audio/wav');
	res.setHeader('Content-Disposition', 'attachment; filename="audio.wav"');
	res.writeHead(200);
	const fileName = './' + Date.now() + '.wav';
	const cmd = exec(`pico2wave -l fr-FR -w ${fileName} "${phrase.replace('"', '\\"')}"`);
	cmd.stdout.on('end', () => {
		const stream = fs.createReadStream(fileName);
		stream.pipe(res);
		stream.on('close', () => {
			res.end();
			fs.unlink(fileName, () => {});
		});	
	})
}).listen(process.env.PORT, () => console.log('Server running on port ' + process.env.PORT + '.'));

function loadEnv() {
	const file = fs.readFileSync('./.env').toString();
	const regex = /^(.+)=(.*)$/gm;
	let match;
	while (match = regex.exec(file.toString())) {
		process.env[match[1]] = match[2];
	}
}
function getIp(req) {
	return req.headers['x-forwarded-for']
		|| req.connection.remoteAddress
		|| req.socket.remoteAddress
		|| (req.connection.socket ? req.connection.socket.remoteAddress : null);
}