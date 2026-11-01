import { defineConfig } from 'vite'
import fs from 'node:fs/promises'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { DEMO_SLUGS, renderTemplateDemo } from './server/src/site-factory/demo'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

/**
 * Every template ships a real, fully rendered demo website at
 * /templates/<slug>/ so visitors can browse the actual content of a template
 * before ordering. Files are generated with the same renderer used for
 * published sites, both in `vite dev` (in memory) and at build time (dist).
 */
function templatePreviews() {
  const lookup = (url: string) => {
    const clean = (url || '').split('?')[0]
    const match = /^\/templates\/([^/]+)(?:\/(.*))?$/.exec(clean)
    if (!match) return null
    const slug = decodeURIComponent(match[1])
    if (!DEMO_SLUGS.includes(slug)) return null
    let file = match[2] || ''
    if (!file || file.endsWith('/')) file += 'index.html'
    const site = renderTemplateDemo(slug, 'ar')
    const entry = site.files[file]
    if (!entry) return null
    return {
      type: entry.type,
      body: entry.encoding === 'base64' ? Buffer.from(entry.content, 'base64') : entry.content,
    }
  }

  return {
    name: 'template-previews',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const found = lookup(req.url || '')
        if (!found) return next()
        res.setHeader('Content-Type', found.type)
        res.setHeader('Cache-Control', 'no-store')
        res.end(found.body)
      })
    },
    async closeBundle(this: any) {
      const outDir = path.resolve(__dirname, 'dist/templates')
      await fs.rm(outDir, { recursive: true, force: true })
      let written = 0
      for (const slug of DEMO_SLUGS) {
        const site = renderTemplateDemo(slug, 'ar')
        for (const [file, entry] of Object.entries(site.files)) {
          const target = path.join(outDir, slug, file)
          await fs.mkdir(path.dirname(target), { recursive: true })
          const data = entry.encoding === 'base64' ? Buffer.from(entry.content, 'base64') : entry.content
          await fs.writeFile(target, data)
          written++
        }
      }
      this.info(`template previews: ${DEMO_SLUGS.length} templates, ${written} files`)
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    templatePreviews(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'motion'],
          ui: ['lucide-react', 'sonner'],
        },
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    sourcemap: false,
  },
})
