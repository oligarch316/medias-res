import type { Session } from 'electron';

// TODO: F*#%ing devtools need unsafe bs???
const cspConfig = {
    'default-src': [ `'none'` ],
    'script-src': [ `'self'`, `'unsafe-eval'` ],
    'style-src': [ `'self'`, `'unsafe-inline'` ],
    'img-src': [ `'self' blob:` ],
}

const cspHeader = Object.entries(cspConfig).map(([k, vs]) => `${k} ${vs.join(' ')}`).join('; ');

export function setupCsp (session: Session) {
    session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [ cspHeader ],
            },
        });
    });
}
