// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://voteclt.org',
  // Static output -> plain files in dist/, which is what Firebase Hosting serves.
  output: 'static',
  build: {
    // Emits `next-elections/index.html` etc. Pairs with `cleanUrls` in firebase.json
    // so the live URLs are /next-elections with no extension and no trailing slash.
    format: 'directory',
  },
});
