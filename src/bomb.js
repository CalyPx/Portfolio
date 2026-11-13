// Bomb Dodger, rebuilt for the browser from Rohit's first Pygame game (github.com/CalyPx/Bomb-dodger).
// Same rules as the original: seven bombs fall from the top, four fly in from the left, every bomb that
// leaves the board scores a point, and the first hit ends the run. Same 500 by 500 board and speeds.
// Added for the web: arrow keys and touch, a best score saved in the browser, and a slow speed-up.
const SIZE = 500, BOMB = 25, ME = 20
const FALLING = 7, FLYING = 4
const BOMB_SPEED = 180, ME_SPEED = 300   // pixels per second: the original moved 3 and 5 per frame at 60fps
const KEY = 'rp-bomb-best'

export function mountBombDodger(root, { cue = () => {} } = {}) {
  const canvas = root.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const scoreEl = root.querySelector('[data-bomb-score]'), bestEl = root.querySelector('[data-bomb-best]')
  const overlay = root.querySelector('.game__over'), title = root.querySelector('[data-bomb-title]'), note = root.querySelector('[data-bomb-note]')
  const startBtn = root.querySelector('[data-bomb-start]')
  const css = getComputedStyle(document.documentElement)
  const C = { paper: css.getPropertyValue('--paper').trim() || '#eeece5', ink: css.getPropertyValue('--ink').trim() || '#111', lime: css.getPropertyValue('--lime').trim() || '#d4ff35' }

  let best = 0
  try { best = +localStorage.getItem(KEY) || 0 } catch {}
  bestEl.textContent = best

  const rand = (a, b) => a + Math.random() * (b - a)
  let bombs = [], me = null, score = 0, playing = false, raf = 0, last = 0, speed = 1
  const keys = new Set()
  let finger = null

  const reset = () => {
    // the original spread its starting bombs over the two halves of the board; so does this
    bombs = [
      ...Array.from({ length: FALLING }, (_, i) => ({ x: i % 2 ? rand(250, 475) : rand(0, 250), y: -rand(0, SIZE), dx: 0, dy: 1 })),
      ...Array.from({ length: FLYING }, (_, i) => ({ x: -rand(0, SIZE), y: i % 2 ? rand(250, 475) : rand(0, 250), dx: 1, dy: 0 })),
    ]
    me = { x: 240, y: 460 }
    score = 0; speed = 1
    scoreEl.textContent = '0'
  }

  // the board scales to its box; all game logic stays in the original 500 by 500 units
  const fit = () => {
    const w = canvas.clientWidth, dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = canvas.height = Math.round(w * dpr)
    ctx.setTransform((w * dpr) / SIZE, 0, 0, (w * dpr) / SIZE, 0, 0)
    draw()
  }

  const draw = () => {
    ctx.fillStyle = C.paper
    ctx.fillRect(0, 0, SIZE, SIZE)
    // a faint grid, for a sense of speed
    ctx.fillStyle = 'rgba(17,17,17,0.07)'
    for (let x = 25; x < SIZE; x += 25) for (let y = 25; y < SIZE; y += 25) ctx.fillRect(x - 1, y - 1, 2, 2)
    for (const b of bombs) {
      ctx.fillStyle = C.ink
      ctx.fillRect(b.x, b.y, BOMB, BOMB)
      ctx.fillStyle = C.lime   // a lit fuse
      ctx.fillRect(b.x + 9, b.y + 9, 7, 7)
    }
    if (me) {
      ctx.fillStyle = C.ink
      ctx.fillRect(me.x - 2, me.y - 2, ME + 4, ME + 4)
      ctx.fillStyle = C.lime
      ctx.fillRect(me.x, me.y, ME, ME)
    }
  }

  const hit = (b) => b.x < me.x + ME && b.x + BOMB > me.x && b.y < me.y + ME && b.y + BOMB > me.y

  const step = (now) => {
    const dt = Math.min(0.04, (now - last) / 1000)
    last = now
    speed = 1 + Math.min(1, score / 120)   // after 120 points the bombs are twice as fast

    let mx = 0, my = 0
    if (keys.has('a') || keys.has('arrowleft')) mx -= 1
    if (keys.has('d') || keys.has('arrowright')) mx += 1
    if (keys.has('w') || keys.has('arrowup')) my -= 1
    if (keys.has('s') || keys.has('arrowdown')) my += 1
    if (finger) {   // touch: the square chases the finger
      const fx = finger.x - me.x - ME / 2, fy = finger.y - me.y - ME / 2, d = Math.hypot(fx, fy)
      if (d > 2) { mx = fx / d * Math.min(1, d / 12); my = fy / d * Math.min(1, d / 12) }
    }
    me.x = Math.max(0, Math.min(SIZE - ME, me.x + mx * ME_SPEED * dt))
    me.y = Math.max(0, Math.min(SIZE - ME, me.y + my * ME_SPEED * dt))

    for (const b of bombs) {
      b.x += b.dx * BOMB_SPEED * speed * dt
      b.y += b.dy * BOMB_SPEED * speed * dt
      if (b.dy && b.y > SIZE) { b.y = -BOMB; b.x = rand(0, SIZE - BOMB); score++ }
      if (b.dx && b.x > SIZE) { b.x = -BOMB; b.y = rand(0, SIZE - BOMB); score++ }
    }
    scoreEl.textContent = score
    draw()
    if (bombs.some(hit)) return over()
    raf = requestAnimationFrame(step)
  }

  const start = () => {
    reset()
    playing = true
    overlay.hidden = true
    canvas.focus({ preventScroll: true })
    cue('toggle')
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  }
  const over = () => {
    playing = false
    cue('close')
    const record = score > best
    if (record) { best = score; try { localStorage.setItem(KEY, String(best)) } catch {} bestEl.textContent = best }
    title.textContent = record && score > 0 ? 'New best' : 'Boom'
    note.textContent = `You dodged ${score} bomb${score === 1 ? '' : 's'}.${record && score > 0 ? '' : ` Best: ${best}.`}`
    startBtn.textContent = 'Play again'
    overlay.hidden = false
    startBtn.focus({ preventScroll: true })
  }

  const down = (e) => {
    const k = e.key.toLowerCase()
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
      e.preventDefault()
      keys.add(k)
      if (!playing && !overlay.hidden && document.activeElement === canvas) start()
    }
    if (k === ' ' && !playing && document.activeElement === canvas) { e.preventDefault(); start() }
  }
  const up = (e) => keys.delete(e.key.toLowerCase())
  const toBoard = (e) => { const r = canvas.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE } }

  startBtn.addEventListener('click', start)
  canvas.addEventListener('keydown', down)
  canvas.addEventListener('keyup', up)
  canvas.addEventListener('blur', () => keys.clear())
  canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { finger = toBoard(e); canvas.setPointerCapture(e.pointerId) } })
  canvas.addEventListener('pointermove', (e) => { if (finger) finger = toBoard(e) })
  const lift = () => { finger = null }
  canvas.addEventListener('pointerup', lift)
  canvas.addEventListener('pointercancel', lift)
  const ro = new ResizeObserver(fit)
  ro.observe(canvas)

  reset()
  fit()

  return {
    stop() { playing = false; cancelAnimationFrame(raf); keys.clear(); finger = null },
    reset() { this.stop(); reset(); draw(); title.textContent = 'Bomb Dodger'; note.textContent = 'Dodge every bomb. Each one that leaves the board is a point.'; startBtn.textContent = 'Start'; overlay.hidden = false },
  }
}
