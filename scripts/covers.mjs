// Photographs each cover in covers.html into public/covers. Needs the dev server on :5173.
// A picture saved as incoming/<id>.png (or .jpg / .webp) becomes that cover's artwork; ids are
// crash, mul, sunuwa, quake, prep, learn, sajha.
//   node scripts/covers.mjs
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

const PORT = 9555
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const profile = await mkdtemp(join(tmpdir(), 'covers-'))
const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--window-size=1800,1200', 'about:blank'], { stdio: 'ignore' })
let target
for (let i = 0; i < 60 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch {} }
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })) })

await send('Emulation.setDeviceMetricsOverride', { width: 1800, height: 1200, deviceScaleFactor: 1.5, mobile: false })
await send('Page.navigate', { url: 'http://localhost:5173/covers.html' })
await sleep(2500)
await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true })
await send('Runtime.evaluate', { expression: 'window.coversReady', awaitPromise: true })
await sleep(600)
const { result } = await send('Runtime.evaluate', { expression: 'JSON.stringify([...document.querySelectorAll(".cover")].map(c => { const r = c.getBoundingClientRect(); return { id: c.id, x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height } }))', returnByValue: true })
await mkdir('public/covers', { recursive: true })
for (const c of JSON.parse(result.value)) {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: c.x, y: c.y, width: c.width, height: c.height, scale: 1 } })
  await sharp(Buffer.from(data, 'base64')).webp({ quality: 86 }).toFile(`public/covers/${c.id}.webp`)
  console.log('cover', c.id)
}
ws.close(); chrome.kill(); await sleep(300); await rm(profile, { recursive: true, force: true })
