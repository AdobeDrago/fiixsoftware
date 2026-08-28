const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const pages = require('../config/pages.js');
const viewports = require('../config/viewports.js');
const { DEFAULT_EDS_ORIGIN, resolveEdsOrigin } = require('../config/environment.js');

const projectRoot = path.resolve(__dirname, '../../..');
const launcherRoot = __dirname;
const reportRoot = path.join(projectRoot, 'comparison-report');
const port = Number(process.env.COMPARISON_UI_PORT || 3456);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.gif': 'image/gif',
};

let runState = {
  status: 'idle',
  startedAt: null,
  finishedAt: null,
  exitCode: null,
  logs: [],
  pageCount: 0,
  error: null,
};

let activeProcess = null;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new TypeError('Request body too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new TypeError('Invalid JSON body'));
      }
    });
    request.on('error', reject);
  });
}

function appendLog(line) {
  const trimmed = line.replace(/\r/g, '').trimEnd();
  if (!trimmed) return;
  runState.logs.push(trimmed);
  if (runState.logs.length > 500) {
    runState.logs = runState.logs.slice(-500);
  }
}

function resetRunState(pageCount) {
  runState = {
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    logs: [],
    pageCount,
    error: null,
  };
}

function finishRun(exitCode, error = null) {
  runState.status = exitCode === 0 ? 'complete' : 'error';
  runState.finishedAt = new Date().toISOString();
  runState.exitCode = exitCode;
  runState.error = error;
  activeProcess = null;
}

function validateRunRequest(body) {
  const slugs = Array.isArray(body.slugs) ? body.slugs.map(String) : [];
  if (!slugs.length) {
    throw new TypeError('Select at least one page to compare');
  }

  const edsOrigin = body.edsOrigin ? resolveEdsOrigin(String(body.edsOrigin)) : resolveEdsOrigin();
  const viewport = String(body.viewport || 'desktop');
  if (!viewports[viewport]) {
    throw new TypeError(`Unknown viewport "${viewport}"`);
  }

  const workers = body.workers === undefined ? 2 : Number(body.workers);
  if (!Number.isInteger(workers) || workers < 1 || workers > 4) {
    throw new TypeError('Workers must be an integer between 1 and 4');
  }

  const knownSlugs = new Set(pages.map(({ slug }) => slug));
  const unknown = slugs.filter((slug) => !knownSlugs.has(slug));
  if (unknown.length) {
    throw new TypeError(`Unknown page slugs: ${unknown.join(', ')}`);
  }

  return {
    slugs,
    edsOrigin,
    viewport,
    workers,
  };
}

function getReportState() {
  return {
    currentReportReady: fs.existsSync(path.join(reportRoot, 'index.html')),
  };
}

function startComparison({
  slugs, edsOrigin, viewport, workers,
}) {
  if (activeProcess) {
    throw new TypeError('A comparison is already running');
  }

  resetRunState(slugs.length);
  appendLog(`Starting comparison for ${slugs.length} page(s)...`);

  const env = {
    ...process.env,
    COMPARISON_SLUGS: slugs.join(','),
    MIGRATION_EDS_ORIGIN: edsOrigin,
    COMPARISON_VIEWPORT: viewport,
    COMPARISON_WORKERS: String(workers),
  };

  activeProcess = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['playwright', 'test', '--config=playwright.comparison.config.js'],
    {
      cwd: projectRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  activeProcess.stdout.on('data', (chunk) => {
    chunk.toString('utf8').split('\n').forEach(appendLog);
  });
  activeProcess.stderr.on('data', (chunk) => {
    chunk.toString('utf8').split('\n').forEach(appendLog);
  });
  activeProcess.on('error', (error) => {
    appendLog(error.message);
    finishRun(1, error.message);
  });
  activeProcess.on('close', (code) => {
    appendLog(code === 0 ? 'Comparison finished successfully.' : `Comparison exited with code ${code}.`);
    finishRun(code ?? 1, code === 0 ? null : 'Comparison run failed');
  });
}

function serveFile(response, filePath, statusCode = 200) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  const extension = path.extname(filePath);
  response.writeHead(statusCode, { 'Content-Type': mimeTypes[extension] || 'application/octet-stream' });
  response.end(fs.readFileSync(filePath));
}

function serveLauncherAsset(response, requestPath) {
  const relativePath = requestPath === '/' ? '/index.html' : requestPath;
  if (relativePath === '/index.html' && runState.status !== 'running') {
    runState.status = 'idle';
    runState.error = null;
  }
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(launcherRoot, safePath);
  if (!filePath.startsWith(launcherRoot)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }
  serveFile(response, filePath);
}

function serveReportAsset(response, requestPath) {
  const relativePath = requestPath.replace(/^\/report\/?/, '') || 'index.html';
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(reportRoot, safePath);
  if (!filePath.startsWith(reportRoot)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }
  serveFile(response, filePath);
}

function getPagesPayload() {
  return pages.map(({
    name, slug, pageType, tags,
  }) => ({
    name,
    slug,
    pageType,
    tags,
  }));
}

function getConfigPayload() {
  return {
    defaultEdsOrigin: DEFAULT_EDS_ORIGIN,
    viewports: Object.keys(viewports),
    pageCount: pages.length,
    ...getReportState(),
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  const { pathname } = url;

  try {
    if (request.method === 'GET' && pathname === '/api/pages') {
      sendJson(response, 200, { pages: getPagesPayload() });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/config') {
      sendJson(response, 200, getConfigPayload());
      return;
    }

    if (request.method === 'GET' && pathname === '/api/status') {
      sendJson(response, 200, {
        ...runState,
        ...getReportState(),
      });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/reset') {
      if (runState.status !== 'running') {
        runState.status = 'idle';
        runState.error = null;
      }
      sendJson(response, 200, { status: runState.status });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/run') {
      const body = await readJsonBody(request);
      const options = validateRunRequest(body);
      startComparison(options);
      sendJson(response, 202, {
        message: 'Comparison started',
        pageCount: options.slugs.length,
      });
      return;
    }

    if (request.method === 'GET' && pathname.startsWith('/report')) {
      serveReportAsset(response, pathname);
      return;
    }

    if (request.method === 'GET') {
      serveLauncherAsset(response, pathname);
      return;
    }

    sendJson(response, 405, { error: 'Method not allowed' });
  } catch (error) {
    sendJson(response, 400, { error: error.message });
  }
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, { error: error.message });
  });
});

function printPortBusyHelp() {
  process.stderr.write(`\nPort ${port} is already in use by another process.\n`);
  process.stderr.write('Try COMPARISON_UI_PORT=<port> npm run comparison:ui\n\n');
}

function checkExistingLauncher() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/config`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const config = JSON.parse(data);
          resolve(Boolean(config.defaultEdsOrigin && Array.isArray(config.viewports)));
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

server.on('error', async (error) => {
  if (error.code !== 'EADDRINUSE') {
    throw error;
  }

  const isLauncher = await checkExistingLauncher();
  if (isLauncher) {
    process.stdout.write('\nComparison launcher is already running\n');
    process.stdout.write(`Open http://127.0.0.1:${port} in your browser\n\n`);
    process.exit(0);
    return;
  }

  printPortBusyHelp();
  process.exit(1);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write('\nComparison launcher ready\n');
  process.stdout.write(`Open http://127.0.0.1:${port} in your browser\n\n`);
});
