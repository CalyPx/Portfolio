// Screenshots for checking the site. Drives an installed Chrome over the DevTools protocol.
//   node scripts/snap.mjs <width> <height> <out-prefix> '<json steps>'
// Steps run in order; each may have: wait (ms), js (expression), log (print its value), move [x,y],
// click [x,y], wheel [x,y,deltaY], drag [[x1,y1],[x2,y2],steps,ms] (with optional shotMid), after (ms), shot (name). URL defaults to the production preview on :4173.
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [W, H, prefix] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900), process.argv[4] || 'shot']
const steps = JSON.parse(process.argv[5] || '[]')
const PORT = 9400 + Math.floor(Math.random() * 300)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const profile = await mkdtemp(join(tmpdir(), 'snap-'))
const chrome = spawn(process.env.CHROME || 'google-chrome', ['--headless=new', '--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' })

let target
for (let i = 0; i < 60 && !target; i++) {
  await sleep(200)
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === 'page') } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map(), errors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result || m.error); pending.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push('console.error: ' + m.params.args.map((a) => a.value || a.description).join(' '))
}
const send = (method, params = {}) => new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })) })

await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 })
if (W < 700) await send('Emulation.setTouchEmulationEnabled', { enabled: true })
await send('Page.navigate', { url: process.env.URL || 'http://localhost:4173/' })

for (const s of steps) {
  if (s.wait) await sleep(s.wait)
  if (s.js) {
    const r = await send('Runtime.evaluate', { expression: s.js, awaitPromise: true, returnByValue: true })
    if (s.log) console.log(JSON.stringify(r.result?.value))
  }
  if (s.move) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: s.move[0], y: s.move[1] })
  if (s.click) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: s.click[0], y: s.click[1], button: 'left', clickCount: 1 })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: s.click[0], y: s.click[1], button: 'left', clickCount: 1 })
  }
  if (s.drag) {   // drag: [[x1, y1], [x2, y2], steps, ms per step]; releases at the end
    const [[x1, y1], [x2, y2], n = 12, ms = 16] = s.drag
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1, y: y1 })
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x1, y: y1, button: 'left', clickCount: 1 })
    for (let k = 1; k <= n; k++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x1 + ((x2 - x1) * k) / n, y: y1 + ((y2 - y1) * k) / n, button: 'left', buttons: 1 }); await sleep(ms) }
    if (s.shotMid) { const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 }); await writeFile(`${prefix}-${s.shotMid}.jpg`, Buffer.from(data, 'base64')) }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x2, y: y2, button: 'left', clickCount: 1 })
  }
  if (s.wheel) await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: s.wheel[0], y: s.wheel[1], deltaX: 0, deltaY: s.wheel[2] })
  if (s.after) await sleep(s.after)
  if (s.shot) {
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 })
    await writeFile(`${prefix}-${s.shot}.jpg`, Buffer.from(data, 'base64'))
  }
}
console.log(errors.length ? `ERRORS ${JSON.stringify(errors)}` : 'no errors')
ws.close()
chrome.kill()
await sleep(300)
await rm(profile, { recursive: true, force: true })
