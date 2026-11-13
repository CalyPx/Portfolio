import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { defineConfig } from 'vite'
import { PROJECTS } from './src/projects.js'

// Every case study gets a real page at /work/<slug>/ with its own title, description and preview
// image, so a shared link shows the right project. Each page is the built home page with different
// metadata; the script opens the matching case study when it loads. In development, Vite already
// serves the home page for any unknown path, so /work/<slug>/ works there too.
const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function casePages() {
  let outDir = 'dist'
  return {
    name: 'case-pages',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    async closeBundle() {
      const html = await readFile(join(outDir, 'index.html'), 'utf8')
      for (const p of PROJECTS) {
        const title = `${p.name}: case study · Rohit Poudel`
        const desc = escape(`${p.name}. ${p.tag}. ${p.problem}`)
        const page = html
          .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
          .replace(/(<meta name="description" content=")[^"]*/, `$1${desc}`)
          .replace(/(<meta property="og:title" content=")[^"]*/, `$1${escape(title)}`)
          .replace(/(<meta property="og:description" content=")[^"]*/, `$1${desc}`)
          .replace(/(<meta property="og:image" content=")[^"]*/, `$1/covers/${p.id}.webp`)
        const dir = join(outDir, 'work', p.slug)
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'index.html'), page)
      }
    },
  }
}

export default defineConfig({ plugins: [casePages()] })
