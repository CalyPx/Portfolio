// Captures the live sites shown in the "Live" section into public/img.
// Drives an installed Chrome over the DevTools protocol; no extra packages.
//   node scripts/shots.mjs
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const SHOTS = [
  { name: 'lukla', url: 'https://thelukla.vercel.app' },
  { name: 'lukla-2', url: 'https://thelukla.vercel.app', scroll: 1.6 },
  { name: 'sahayatri', url: 'https://sahayatri-nepal.vercel.app' },
  { name: 'sahayatri-2', url: 'https://sahayatri-nepal.vercel.app', scroll: 2.2 },
  { name: 'nepalprep', url: 'https://nepalprep.vercel.app', wait: 9000 },
  { name: 'ceeprep', url: 'https://ceeprep.vercel.app' },
]
const W = 1440, H = 900, PORT = 9333
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = await mkdtemp(join(tmpdir(), 'shots-'))
const chrome = spawn(process.env.CHROME || 'google-chrome', [
  '--headless=new', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' })

let target
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250)
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
    target = list.find((t) => t.type === 'page')
  } catch {}
}
if (!target) throw new Error('Chrome did not start')

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
}
const send = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })) })

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false })
await mkdir('public/img', { recursive: true })

for (const s of SHOTS) {
  await send('Page.navigate', { url: s.url })
  await sleep(s.wait || 5000)
  if (s.scroll) {
    await send('Runtime.evaluate', { expression: `window.scrollTo({ top: ${Math.round(s.scroll * H)}, behavior: 'instant' })` })
    await sleep(2500)
  }
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  await sharp(Buffer.from(data, 'base64')).webp({ quality: 82 }).toFile(`public/img/${s.name}.webp`)
  console.log('saved', s.name)
}

ws.close()
chrome.kill()
await sleep(300)
await rm(profile, { recursive: true, force: true })
