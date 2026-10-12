import type { Plugin } from 'vite'

export function contentSecurityPolicy(development: boolean): Plugin {
  const inline = development ? " 'unsafe-inline'" : ''
  const connections = [
    'https://*.api.green-api.com',
    'https://api.green-api.com',
  ]

  if (development) {
    connections.push("'self'", 'ws://localhost:*', 'ws://127.0.0.1:*')
  }

  const policy = [
    "default-src 'self'",
    `script-src 'self'${inline}`,
    `style-src 'self'${inline}`,
    `connect-src ${connections.join(' ')}`,
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')

  return {
    name: 'content-security-policy',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const meta = /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/

        return {
          html: html.replace(meta, ''),
          tags: [{
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: policy,
            },
            injectTo: 'head-prepend',
          }],
        }
      },
    },
  }
}
