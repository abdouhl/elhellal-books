import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import rehypeMidAd from './src/lib/rehype-mid-ad.mjs';

export default defineConfig({
  site: 'https://books.elhellal.com',
  integrations: [sitemap()],
  markdown: { rehypePlugins: [rehypeMidAd] },
  adapter: cloudflare(),
});
