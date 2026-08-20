import { Router, Request, Response, Application } from 'express';

interface ExpressLayer {
  handle: any;
  name: string;
  params?: any;
  path?: string;
  keys: any[];
  regexp: RegExp;
  route?: {
    path: string;
    stack: ExpressLayer[];
    methods: { [method: string]: boolean };
  };
}

interface Endpoint {
    path: string;
    methods: string[];
    middlewares: string[];
}

const getEndpoints = (app: Application): Endpoint[] => {
    const endpoints: Endpoint[] = [];
    const router = (app as any)._router;
  
    if (!router || !router.stack) {
      console.log("DEBUG: Router or router stack not available on the app object.");
      return endpoints;
    }
  
    const parseStack = (stack: ExpressLayer[], prefix: string = '') => {
        stack.forEach((layer: ExpressLayer) => {
            
            if (layer.route) {
                // It's a direct route on the current router
                const path = prefix + layer.route.path;
                const methods = Object.keys(layer.route.methods).filter(method => layer.route?.methods[method]).map(method => method.toUpperCase());
                endpoints.push({
                    path,
                    methods,
                    middlewares: layer.route.stack.map(l => l.handle.name || 'anonymous')
                });
            } else if (layer.name === 'router' && layer.handle.stack) {
                // It's a sub-router, recurse into its stack
                const newPrefix = prefix + (extractPathFromRegexp(layer.regexp) || '');
                parseStack(layer.handle.stack, newPrefix);
            }
        });
    }

    const extractPathFromRegexp = (regexp: RegExp) => {
        if (!regexp) return '';
        
        // This is a simplified parser for the regex express uses for router paths.
        // It aims to remove regex complexities to get a clean path prefix.
        const path = regexp.source
            .replace(/\\\//g, '/') // Unescape slashes
            .replace(/^\^/, '')      // Remove start anchor
            .replace(/\/\?\(\?=/g, '') // Remove trailing slash lookahead
            .replace(/\$$/, '');     // Remove end anchor

        // For a router mounted at '/', the regex is `^\/?(?=\/|$)` which becomes `/`
        if (path === '/') return '';
        
        // For routers like `app.use('/api', router)`, the regex is `^\\/api\\/?(?=\\/|$)`
        // which becomes `/api`. We want to keep this prefix.
        return path.replace(/\/$/, ''); // remove trailing slash
    }

    parseStack(router.stack);
    return endpoints;
};

const createRoutesRouter = (app: Application): Router => {
  const routesRouter = Router();

  routesRouter.get('/', async (req: Request, res: Response) => {
    const rawEndpoints = getEndpoints(app);

    // --- DEBUGGING: Log raw endpoints and router stack ---
    console.log('--- Manual Endpoint Lister Debug ---');
    console.log('Raw Endpoints Found:', JSON.stringify(rawEndpoints, null, 2));

    // Filter out the dashboard endpoint itself
    const filteredEndpoints = rawEndpoints.filter(ep => ep.path !== '/routes');
    
    // Now, we also need to filter out the '/' route from the root router if it exists
    const finalEndpoints = filteredEndpoints.filter(ep => ep.path !== '/');

    // Calculate the true total number of routes (path + method combinations)
    const totalRoutes = finalEndpoints.reduce((acc, ep) => acc + ep.methods.length, 0);

    // Generate a modern, highly readable HTML page on the fly
    const htmlDashboard = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Route Directory</title>
      <style>
        :root {
          --bg-main: #0f172a;
          --bg-card: #1e293b;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --get-color: #10b981;
          --post-color: #3b82f6;
          --put-color: #f59e0b;
          --delete-color: #ef4444;
          --patch-color: #a855f7;
        }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background-color: var(--bg-main);
          color: var(--text-main);
          margin: 0;
          padding: 2rem;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #334155;
          padding-bottom: 1rem;
        }
        h1 { margin: 0; font-size: 1.75rem; color: #f1f5f9; }
        p { color: var(--text-muted); margin: 0.5rem 0 0 0; font-size: 0.95rem; }
        .badge-count {
          background: #334155;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.85rem;
        }
        .route-card {
          background-color: var(--bg-card);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #334155;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .route-card:hover {
          transform: translateX(4px);
          border-color: #475569;
        }
        .method-badge {
          font-family: monospace;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          min-width: 65px;
          text-align: center;
          text-transform: uppercase;
        }
        .GET { background: rgba(16, 185, 129, 0.15); color: var(--get-color); border: 1px solid rgba(16, 185, 129, 0.3); }
        .POST { background: rgba(59, 130, 246, 0.15); color: var(--post-color); border: 1px solid rgba(59, 130, 246, 0.3); }
        .PUT { background: rgba(245, 158, 11, 0.15); color: var(--put-color); border: 1px solid rgba(245, 158, 11, 0.3); }
        .DELETE { background: rgba(239, 68, 68, 0.15); color: var(--delete-color); border: 1px solid rgba(239, 68, 68, 0.3); }
        .PATCH { background: rgba(168, 85, 247, 0.15); color: var(--patch-color); border: 1px solid rgba(168, 85, 247, 0.3); }
        .path-text {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 1rem;
          color: #e2e8f0;
          flex-grow: 1;
          word-break: break-all;
        }
        .middleware-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: #334155;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          white-space: nowrap;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Backend API Directory <span class="badge-count">${totalRoutes} total</span></h1>
          <p>Production environment active routes. Automatically mapped using application reflection.</p>
        </header>
        
        <main>
          ${finalEndpoints.sort((a, b) => a.path.localeCompare(b.path)).map(endpoint => 
            endpoint.methods.map(method => `
              <div class="route-card">
                <span class="method-badge ${method}">${method}</span>
                <span class="path-text">${endpoint.path}</span>
                ${endpoint.middlewares.length > 2 ? `<span class="middleware-tag">${endpoint.middlewares.length - 1} middleware</span>` : ''}
              </div>
            `).join('')
          ).join('')}
        </main>
      </div>
    </body>
    </html>
  `;

    // Send down the visually complete web document
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlDashboard);
  });

  return routesRouter;
};

export default createRoutesRouter;
