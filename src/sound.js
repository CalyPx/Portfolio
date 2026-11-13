// Sound, synthesised in the browser. Everything is a soft bell tone in D major pentatonic, so any two
// sounds on the site always sit in the same calm chord. No noise, no clicks, no audio files.
// Nothing plays until the visitor turns sound on.
const KEY = 'rp-sound'
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } })()

export const state = { on: false, ambient: saved.ambient ?? true, volume: saved.volume ?? 0.6, wanted: !!saved.on }
const listeners = new Set()
export const onChange = (fn) => { listeners.add(fn); fn(state) }
const emit = () => {
  try { localStorage.setItem(KEY, JSON.stringify({ on: state.on, ambient: state.ambient, volume: state.volume })) } catch {}
  listeners.forEach((fn) => fn(state))
}

// D major pentatonic: D E F# A B
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86]   // D4 .. D6
const pick = (from, to) => SCALE[from + Math.floor(Math.random() * (to - from))]

let ctx = null, master = null, dry = null, wet = null, drone = null, droneGain = null, shade = null, timer = 0, lastTick = 0, lastPass = 0, passStep = 4, voices = 0, mood = 0.5

// A long, dark reverb tail made from decaying noise, generated once.
function impulse(seconds) {
  const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c)
    let lp = 0
    for (let i = 0; i < n; i++) {
      lp = lp * 0.86 + (Math.random() * 2 - 1) * 0.14   // darker tail: low-passed noise
      d[i] = lp * (1 - i / n) ** 3.2
    }
  }
  return buf
}

function build() {
  // iPhone: play through the ringer switch, like a media app, instead of being silenced by it
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch {}
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  const glue = ctx.createDynamicsCompressor()
  glue.threshold.value = -20; glue.ratio.value = 3; glue.attack.value = 0.01; glue.release.value = 0.3
  const limit = ctx.createDynamicsCompressor()   // a hard ceiling after the glue, so nothing can clip
  limit.threshold.value = -3; limit.ratio.value = 20; limit.attack.value = 0.002; limit.release.value = 0.1
  const warm = ctx.createBiquadFilter()
  warm.type = 'lowpass'; warm.frequency.value = 3200; warm.Q.value = 0.4
  master = ctx.createGain()
  master.gain.value = 0
  warm.connect(glue); glue.connect(master); master.connect(limit); limit.connect(ctx.destination)

  dry = ctx.createGain(); dry.gain.value = 0.55; dry.connect(warm)
  const room = ctx.createConvolver(); room.buffer = impulse(5)
  wet = ctx.createGain(); wet.gain.value = 0.8
  wet.connect(room); room.connect(warm)
}

/**
 * One bell: a sine with a quiet octave partial, soft attack and a long natural decay.
 * `space` is how much goes to the reverb (0..1).
 */
function bell(midi, { at = 0, level = 0.08, decay = 1.6, attack = 0.012, space = 0.5, ui = false } = {}) {
  if (ui && voices >= 6) return   // never more than six interface notes ringing at once
  // a few cents of pitch and a little level, different every time, so repeats never sound mechanical
  const t = ctx.currentTime + at, f = hz(midi) * 2 ** (((Math.random() - 0.5) * 16) / 1200)
  level *= 0.9 + Math.random() * 0.2
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(level, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  const a = ctx.createOscillator(), b = ctx.createOscillator(), bg = ctx.createGain()
  a.type = 'sine'; a.frequency.value = f
  b.type = 'sine'; b.frequency.value = f * 2.005; bg.gain.value = 0.18   // a faint shimmer above
  a.connect(g); b.connect(bg); bg.connect(g)
  const d = ctx.createGain(), w = ctx.createGain()
  d.gain.value = 1 - space * 0.6; w.gain.value = space
  g.connect(d); g.connect(w); d.connect(dry); w.connect(wet)
  a.start(t); b.start(t)
  a.stop(t + decay + 0.05); b.stop(t + decay + 0.05)
  if (ui) { voices++; a.onended = () => { voices-- } }
}

// the ambient dips a little under each interface sound, then comes back
function duck() {
  if (!droneGain) return
  const g = droneGain.gain, t = ctx.currentTime
  g.cancelScheduledValues(t)
  g.setValueAtTime(g.value, t)
  g.linearRampToValueAtTime(0.034, t + 0.06)
  g.linearRampToValueAtTime(0.05, t + 0.9)
}

/* Ambient: a quiet low drone, and now and then a bell, like wind chimes in another room ---------- */
function startAmbient() {
  if (drone || !ctx) return
  const t = ctx.currentTime
  droneGain = ctx.createGain()
  droneGain.gain.setValueAtTime(0, t)
  droneGain.gain.linearRampToValueAtTime(0.05, t + 5)
  shade = ctx.createBiquadFilter()
  shade.type = 'lowpass'; shade.frequency.value = 380 + mood * 380; shade.Q.value = 0.2
  const breathe = ctx.createOscillator(), depth = ctx.createGain()
  breathe.frequency.value = 0.045; depth.gain.value = 220   // the drone opens and closes very slowly
  breathe.connect(depth); depth.connect(shade.frequency)
  droneGain.connect(shade); shade.connect(dry); shade.connect(wet)
  drone = [droneGain, shade, breathe, depth]
  ;[[50, 0.6], [57, 0.35], [62, 0.18]].forEach(([m, lvl]) => {   // D3, A3, D4
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sine'; o.frequency.value = hz(m); o.detune.value = (Math.random() - 0.5) * 6
    g.gain.value = lvl
    o.connect(g); g.connect(droneGain); o.start(t)
    drone.push(o, g)
  })
  breathe.start(t)

  const chime = () => {
    if (!drone) return
    // brighter sections reach higher in the scale
    bell(pick(1 + Math.round(mood * 3), 7 + Math.round(mood * 3)), { level: 0.045 + Math.random() * 0.03, decay: 3.5 + Math.random() * 2, attack: 0.03, space: 0.85 })
    if (Math.random() < 0.3) bell(pick(0, 6), { at: 0.35 + Math.random() * 0.4, level: 0.03, decay: 4, attack: 0.04, space: 0.9 })
    timer = setTimeout(chime, 6000 + Math.random() * 8000)
  }
  timer = setTimeout(chime, 1800)
}
function stopAmbient() {
  clearTimeout(timer)
  if (!drone) return
  const old = drone
  drone = null
  ramp(old[0].gain, 0, 1.5)
  setTimeout(() => old.forEach((n) => { try { n.stop?.() } catch {} n.disconnect() }), 1800)
}

const ramp = (param, to, secs) => {
  const t = ctx.currentTime
  param.cancelScheduledValues(t)
  param.setValueAtTime(param.value, t)
  param.linearRampToValueAtTime(to, t + secs)
}
function apply() {
  if (!ctx) return
  ramp(master.gain, state.on ? state.volume : 0, state.on ? 0.8 : 0.4)
  if (state.on && state.ambient) startAmbient()
  else stopAmbient()
}

/** Turn sound on or off. Must be called from a user gesture the first time. */
export function setOn(on) {
  if (on && !ctx) { try { build() } catch { return } }
  // not awaited: a browser that is still holding the context back must not leave the switch stuck
  if (on) ctx.resume().catch(() => {})
  state.on = on; state.wanted = on
  apply()
  emit()
  if (on) cue('toggle')
}
export function setAmbient(v) { state.ambient = v; apply(); emit() }
/** How bright the ambient is, 0 (low and dark) to 1 (open). Each section sets its own. */
export function setMood(v) {
  mood = v
  if (shade && ctx) { const f = shade.frequency, t = ctx.currentTime; f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.linearRampToValueAtTime(380 + v * 380, t + 3.5) }
}
export function setVolume(v) { state.volume = v; if (ctx && state.on) ramp(master.gain, v, 0.08); emit() }

/* Interface cues: short, soft, always in key ------------------------------------------------------ */
const ui = { ui: true }
const CUES = {
  // hovering across controls plays a gentle run of high notes, like brushing a chime
  tick: () => bell(pick(5, 11), { ...ui, level: 0.022, decay: 0.7, space: 0.6 }),
  click: () => bell(74, { ...ui, level: 0.05, decay: 0.9, space: 0.45 }),
  toggle: () => { bell(69, { ...ui, level: 0.045, decay: 1 }); bell(74, { ...ui, at: 0.09, level: 0.045, decay: 1.4 }) },
  open: () => [62, 66, 69, 74].forEach((m, i) => bell(m, { ...ui, at: i * 0.07, level: 0.04, decay: 2.2, space: 0.7 })),
  close: () => [74, 69, 66].forEach((m, i) => bell(m, { ...ui, at: i * 0.07, level: 0.035, decay: 1.6, space: 0.7 })),
  copy: () => { bell(76, { ...ui, level: 0.045, decay: 1 }); bell(81, { ...ui, at: 0.1, level: 0.045, decay: 1.6 }) },
  rumble: () => [38, 45, 38, 43, 38, 45].forEach((m, i) => bell(m, { ...ui, at: i * 0.11, level: 0.07, decay: 1.4, attack: 0.02, space: 0.7 })),
  // the six result tiles are six notes, so sweeping the grid plays a short phrase
  tile: (i) => bell(SCALE[3 + (i % 6)], { ...ui, level: 0.03, decay: 1.1, space: 0.6 }),
}
export function cue(name, arg) {
  if (!state.on || !ctx || ctx.state !== 'running') return
  if (name === 'tick') {
    const now = performance.now()
    if (now - lastTick < 140) return
    lastTick = now
  }
  duck()
  CUES[name]?.(arg)
}

/** A card passing the front of the hero ring: a soft mallet tick that steps along the scale in the
    direction of the turn, louder when it turns faster, never more than twelve a second. */
export function pass(dir, speed) {
  if (!state.on || !ctx || ctx.state !== 'running') return
  const now = performance.now()
  if (now - lastPass < 83) return
  lastPass = now
  passStep = (passStep + (dir || 1) + SCALE.length) % SCALE.length
  bell(SCALE[passStep], { ...ui, level: 0.012 + speed * 0.022, decay: 0.45, attack: 0.004, space: 0.35 })
}

/* Lifecycle: never keep playing in a hidden tab ---------------------------------------------------- */
document.addEventListener('visibilitychange', () => {
  if (!ctx || !state.on) return
  if (document.hidden) { ramp(master.gain, 0, 0.3); setTimeout(() => document.hidden && ctx.suspend(), 400) }
  else ctx.resume().then(() => ramp(master.gain, state.volume, 0.8))
})
window.addEventListener('pagehide', () => { clearTimeout(timer); ctx?.close().catch(() => {}); ctx = null; drone = null })

// A visitor who turned sound on last time gets it back on their first click or key press, never before.
if (state.wanted) {
  const wake = () => { window.removeEventListener('pointerdown', wake); window.removeEventListener('keydown', wake); if (state.wanted && !state.on) setOn(true) }
  window.addEventListener('pointerdown', wake)
  window.addEventListener('keydown', wake)
}
