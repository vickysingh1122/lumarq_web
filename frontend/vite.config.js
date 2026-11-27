import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { notFound, pages, siteUrl } from './src/sitePages.js';

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function documentFor(template, path) {
  const page = pages[path] ?? notFound;
  const url = siteUrl + path;
  const image = siteUrl + '/img/lumarq-hero.webp';
  const metadata = [
    '<title>' + escapeHtml(page.title) + '</title>',
    '<meta name="description" content="' + escapeHtml(page.description) + '" />',
  ];
  if (Object.hasOwn(pages, path)) {
    metadata.push(
      '<link rel="canonical" href="' + url + '" />',
      '<meta property="og:type" content="website" />',
      '<meta property="og:title" content="' + escapeHtml(page.title) + '" />',
      '<meta property="og:description" content="' + escapeHtml(page.description) + '" />',
      '<meta property="og:url" content="' + url + '" />',
      '<meta property="og:image" content="' + image + '" />',
      '<meta name="twitter:card" content="summary_large_image" />',
    );
  } else {
    metadata.push('<meta name="robots" content="noindex" />');
  }
  return template.replace('<!-- page-metadata -->', metadata.join('\n    '));
}

function marketingDocuments() {
  return {
    name: 'lumarq-marketing-documents',
    transformIndexHtml(template, context) {
      if (!context.server) return template;
      const path = new URL(context.originalUrl || '/', siteUrl).pathname.replace(/\/+$/, '') || '/';
      return documentFor(template, path);
    },
    async writeBundle({ dir }) {
      const indexPath = resolve(dir, 'index.html');
      const template = await readFile(indexPath, 'utf8');
      if (!template.includes('<!-- page-metadata -->')) throw new Error('Marketing page metadata marker is missing.');
      const routes = Object.keys(pages);
      await Promise.all([
        ...[...routes, '/404'].map(path => {
          const filename = path === '/' ? indexPath : resolve(dir, path.slice(1) + '.html');
          return writeFile(filename, documentFor(template, path));
        }),
        writeFile(resolve(dir, 'robots.txt'), 'User-agent: *\nDisallow: /admin\nSitemap: ' + siteUrl + '/sitemap.xml\n'),
        writeFile(resolve(dir, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          routes.map(path => '  <url><loc>' + siteUrl + path + '</loc></url>').join('\n') + '\n</urlset>\n'),
      ]);
    },
  };
}

export default defineConfig({
  plugins: [react(), marketingDocuments()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
});
