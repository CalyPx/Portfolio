import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/anek-devanagari'
import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { initCursor } from './cursor.js'
import { runIntro } from './intro.js'
import { PROJECTS } from './projects.js'
import * as sound from './sound.js'

gsap.registerPlugin(ScrollTrigger, SplitText)

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const wide = () => window.innerWidth > 1100   // below this the work strips are an accordion
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const cover = (p) => `/covers/${p.id}.webp`
const no = (i) => String(i + 1).padStart(2, '0')
const EMAIL = 'rohitpoudel020@gmail.com'

/* Smooth scroll ---------------------------------------------------- */
let lenis = null
let scrollV = 0
if (!reduce) {
  lenis = new Lenis({ lerp: 0.1, anchors: true })
  lenis.on('scroll', (e) => { scrollV = e.velocity; ScrollTrigger.update() })
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}
const scrollToEl = (target) => (lenis ? lenis.scrollTo(target, { offset: 0 }) : (typeof target === 'number' ? window.scrollTo(0, target) : target.scrollIntoView()))

/* Addresses: every case study has its own page, /work/<slug>/ -------- */
const PAGE = { title: document.title, description: $('meta[name="description"]').content }
const casePath = (i) => `/work/${PROJECTS[i].slug}/`
function caseFromURL() {
  const m = window.location.pathname.match(/^\/work\/([^/]+)/)
  if (m) return PROJECTS.findIndex((p) => p.slug === m[1])
  const h = window.location.hash.match(/^#case-(.+)$/)   // older shared links
  return h ? PROJECTS.findIndex((p) => p.id === h[1]) : -1
}
function setMeta(p) {
  document.title = p ? `${p.name}: case study · Rohit Poudel` : PAGE.title
  $('meta[name="description"]').content = p ? `${p.name}. ${p.tag}. ${p.problem}` : PAGE.description
}

/* Hero: posters orbit the name, in WebGL ------------------------------ */
let playHero = () => {}
async function gallery() {
  const hero = $('.hero'), list = $('.hero__covers')
  // real buttons stay in the page: keyboard access, and the whole hero if WebGL is missing
  PROJECTS.forEach((p, i) => {
    const li = document.createElement('li')
    li.innerHTML = `<button type="button" aria-label="Open the ${p.name} case study"><img src="${cover(p)}" alt="" width="1200" height="1500" loading="lazy"></button>`
    $('button', li).addEventListener('click', (e) => openSheet(i, e))
    list.append(li)
  })
  if (reduce) return
  try {
    const { mountGallery } = await import('./gallery.js')
    const g = mountGallery(hero, {
      covers: PROJECTS.map(cover), names: PROJECTS.map((p) => p.short || p.name),
      gsap, ScrollTrigger, scrollVelocity: () => scrollV,
      onOpen: openSheet,
      onHover: () => sound.cue('tick'),
      onPass: (dir, speed) => sound.pass(dir, speed),
      onThrow: () => sound.cue('click'),
      onFirstDrag: () => hero.classList.add('is-turned'),
      onLost: () => document.documentElement.classList.remove('gl-on'),
    })
    document.documentElement.classList.add('gl-on')
    gsap.ticker.add((t, dt) => g.frame(Math.min(0.05, dt / 1000)))
    playHero = g.play
  } catch (err) {
    console.warn('3D gallery unavailable, showing the flat one.', err)
  }
}

/* Work: seven strips; the open one explains its project --------------- */
const stripFacts = (p) => [
  ['Built with', p.stack.join(', ')],
  p.result ? ['Outcome', p.result] : p.safeguard ? ['Safeguard', p.safeguard] : ['Status', p.status || p.access],
].filter(Boolean)

function work() {
  const box = $('.strips')
  const strips = PROJECTS.map((p, i) => {
    const li = document.createElement('li')
    li.className = 'strip'
    li.innerHTML = `
      <button class="strip__btn" type="button" data-cur="Open" aria-expanded="false" aria-label="${p.name}: ${p.tag}">
        <img class="strip__img" src="${cover(p)}" alt="" width="1200" height="1500" loading="lazy">
        <span class="strip__label">${no(i)}<b>${p.short || p.name}</b></span>
        <span class="strip__info">
          <span class="chips" role="list" data-cur=""><span role="listitem" class="is-key">${p.access}</span><span role="listitem">${p.kind}</span>${p.origin ? `<span role="listitem">${p.origin}</span>` : ''}</span>
          <span class="strip__main" data-cur="">
            <span class="strip__name">${p.short || p.name}</span>
            <span class="strip__problem">${p.problem}</span>
          </span>
          <span class="strip__foot">
            <span class="strip__facts" data-cur="">${stripFacts(p).map(([k, v]) => `<span><span class="k">${k}</span><span class="v">${v}</span></span>`).join('')}</span>
            <span class="btn strip__go">Read the case study</span>
          </span>
        </span>
      </button>`
    box.append(li)
    return li
  })
  const show = (i, quiet) => {
    strips.forEach((el, k) => {
      const on = k === i
      if (on && !el.classList.contains('is-on') && !quiet) sound.cue('tick')
      el.classList.toggle('is-on', on)
      $('.strip__btn', el).setAttribute('aria-expanded', String(on))
      $('.strip__btn', el).dataset.cur = on ? 'Read case study' : 'Open'
    })
  }
  // hover intent: a strip opens only when the pointer rests on it, not when it sweeps across
  let wait = 0
  strips.forEach((li, i) => {
    const btn = $('.strip__btn', li)
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch' || !wide()) return
      clearTimeout(wait)
      wait = setTimeout(() => show(i), 90)
    })
    btn.addEventListener('pointerleave', () => clearTimeout(wait))
    btn.addEventListener('focus', () => show(i))
    // a closed strip opens on the first press; an open one goes to its case study
    btn.addEventListener('click', (e) => { if (!li.classList.contains('is-on')) return show(i); openSheet(i, e) })
  })
  show(0, true)
  if (!reduce) gsap.from(strips, { yPercent: 14, opacity: 0, duration: 1.1, stagger: 0.055, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 84%', once: true } })
}

/* Results: notes on hover or focus; each tile is a note in the scale ---- */
function tiles() {
  $$('.tile').forEach((t, i) => {
    if (!$('a', t)) t.tabIndex = 0
    t.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') sound.cue('tile', i) })
  })
  $$('[data-case]').forEach((a) => a.addEventListener('click', (e) => {
    const i = PROJECTS.findIndex((p) => p.slug === a.dataset.case)
    if (i < 0) return
    e.preventDefault()
    openSheet(i, e)
  }))
}

/* The shelf: two belts of everything else ------------------------------ */
function ticker() {
  const rows = $$('.ticker__row'), btn = $('.ticker__pause')
  rows.forEach((row) => {
    $$('a.tick', row).forEach((a) => { a.target = '_blank'; a.rel = 'noopener' })
    if (!reduce) for (let k = 0; k < 2; k++) [...row.children].slice(0, row.children.length / (k + 1)).forEach((c) => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); d.tabIndex = -1; row.append(d) })
  })
  if (reduce) { btn.hidden = true; rows.forEach((r) => { r.style.flexWrap = 'wrap'; r.style.width = 'auto'; r.style.rowGap = '10px' }); return }
  let stopped = false
  btn.addEventListener('click', () => {
    stopped = !stopped
    btn.setAttribute('aria-pressed', String(stopped))
    btn.textContent = stopped ? 'Play' : 'Pause'
  })
  const st = rows.map((row, i) => ({ row, x: 0, dir: i % 2 ? 1 : -1, paused: false }))
  st.forEach((o) => {
    o.row.addEventListener('pointerenter', () => { o.paused = true })
    o.row.addEventListener('pointerleave', () => { o.paused = false })
    o.row.addEventListener('focusin', () => { o.paused = true })
    o.row.addEventListener('focusout', () => { o.paused = false })
  })
  gsap.ticker.add((t, dt) => {
    if (stopped) return
    for (const o of st) {
      const unit = o.row.scrollWidth / 3   // three copies of the list sit in each row
      if (!o.paused) o.x += o.dir * (38 + Math.min(600, Math.abs(scrollV) * 18)) * (dt / 1000)
      if (o.x <= -unit) o.x += unit
      if (o.x > 0) o.x -= unit
      o.row.style.transform = `translate3d(${o.x.toFixed(1)}px, 0, 0)`
    }
  })
}

/* Entrances: a rule draws over each section, its heading rises, the rest lifts once */
function entrances() {
  const heads = $$('.head')
  if (reduce) { heads.forEach((h) => h.classList.add('is-in')); return }
  heads.forEach((h) => ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: () => h.classList.add('is-in') }))
  $$('[data-lines]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 112, duration: 1.15, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    })
  })
  const rise = $$('[data-rise]')
  gsap.set(rise, { y: 24, opacity: 0 })
  ScrollTrigger.batch(rise, {
    start: 'top 93%', once: true,
    onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.95, stagger: 0.06, ease: 'expo.out', overwrite: true, clearProps: 'transform' }),
  })
}

// the About statement darkens word by word, and is fully dark by the time it reaches mid-screen
function inkWords() {
  if (reduce) return
  $$('[data-ink]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words', wordsClass: 'w' })
    let lit = -1
    ScrollTrigger.create({
      trigger: el, start: 'top 82%', end: 'bottom 62%',
      onUpdate: (self) => {
        const n = Math.round(self.progress * split.words.length)
        if (n === lit) return
        lit = n
        split.words.forEach((w, i) => w.classList.toggle('is-on', i < n))
      },
    })
  })
}

function magnets() {
  if (!fine || reduce) return
  $$('[data-magnet]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }), y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect()
      x((e.clientX - b.left - b.width / 2) * 0.26); y((e.clientY - b.top - b.height / 2) * 0.34)
    })
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }))
  })
}

function clock() {
  const el = $('[data-clock]')
  if (!el) return
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const tick = () => { el.textContent = `${fmt.format(new Date())} (UTC+5:45)` }
  tick()
  setInterval(tick, 1000)
}

/* Contact: the address copies itself ----------------------------------- */
async function copyEmail() {
  try { await navigator.clipboard.writeText(EMAIL); return true } catch { return false }
}
function contact() {
  const btn = $('.contact__mail'), state = $('.contact__state span')
  let timer = 0
  btn.addEventListener('click', async () => {
    if (!(await copyEmail())) { window.location.href = `mailto:${EMAIL}`; return }   // no clipboard: open the mail app instead
    sound.cue('copy')
    btn.classList.add('is-done')
    state.textContent = 'Copied. Paste it anywhere.'
    clearTimeout(timer)
    timer = setTimeout(() => { btn.classList.remove('is-done'); state.textContent = 'Click to copy' }, 2600)
  })
}

/* Sound: the control in the bar, where cues play, and the mood of each section */
function soundUI() {
  const box = $('.snd'), btn = $('.snd__btn'), panel = $('.snd__panel'), word = $('.snd__word')
  const on = $('[data-snd="on"]'), amb = $('[data-snd="ambient"]'), vol = $('[data-snd="volume"]')
  const open = (v) => { panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)) }
  btn.addEventListener('click', () => open(panel.hidden))
  document.addEventListener('pointerdown', (e) => { if (!box.contains(e.target)) open(false) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { open(false); btn.focus() } })
  on.addEventListener('change', () => sound.setOn(on.checked))
  amb.addEventListener('change', () => { sound.setAmbient(amb.checked); sound.cue('toggle') })
  vol.addEventListener('input', () => sound.setVolume(vol.value / 100))
  sound.onChange((s) => {
    on.checked = s.on; amb.checked = s.ambient; vol.value = Math.round(s.volume * 100)
    box.classList.toggle('is-on', s.on)
    word.textContent = s.on ? 'Sound on' : 'Sound off'
    btn.setAttribute('aria-label', `Sound settings. Sound is ${s.on ? 'on' : 'off'}.`)
  })

  // a quiet note when the pointer lands on a control, a click when it is pressed. Not on plain text
  // links or the moving shelf, which slides under a still pointer.
  const HOT = '.bar__nav a, .bar__mark, .btn, .snd__btn, .bar__menu, .sheet__next, .contact__mail, .intro__btn'
  document.addEventListener('pointerover', (e) => {
    const hit = e.target.closest?.(HOT)
    if (hit && !hit.contains(e.relatedTarget)) sound.cue('tick')
  })
  document.addEventListener('click', (e) => { if (e.target.closest?.('a, button')) sound.cue('click') })

  // the ambient brightens and darkens slowly from section to section
  const moods = { top: 0.6, work: 0.35, results: 1, about: 0.5, contact: 0.15 }
  Object.entries(moods).forEach(([id, v]) => {
    const el = document.getElementById(id)
    if (el) ScrollTrigger.create({ trigger: el, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && sound.setMood(v) })
  })
}

/* Case study --------------------------------------------------------------- */
function flowHTML(flow) {
  const groups = Array.isArray(flow) ? [[null, flow]] : Object.entries(flow)
  return `<div class="flow">${groups.map(([name, steps]) => `<div>${name ? `<p class="flow__name">${name}</p>` : ''}<ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>`).join('')}</div>`
}
let sheetOpen = -1, sheetFrom = null
function fillSheet(i) {
  const p = PROJECTS[i], el = $('.sheet'), n = PROJECTS.length, next = PROJECTS[(i + 1) % n]
  sheetOpen = i
  setMeta(p)
  $('.sheet__no', el).textContent = `Case study ${no(i)} of ${no(n - 1)}`
  $('.sheet__name', el).textContent = p.name
  $('.sheet__tag', el).textContent = `${p.tag}.`
  $('.sheet__cover', el).src = cover(p)
  $('.sheet__cover', el).alt = `Cover artwork for ${p.name}`
  $('.sheet__chips', el).innerHTML = `<li class="is-key">${p.access}</li><li>${p.kind}</li>${p.origin ? `<li>${p.origin}</li>` : ''}`
  const rows = [
    p.ne && ['The name', [`<span lang="ne">${p.ne}</span>: ${p.means}.`]],
    ['Problem', [p.problem]],
    ['Approach', p.approach],
    p.flow && ['How it flows', [flowHTML(p.flow)]],
    p.outcome && ['Outcome', [p.outcome], true],
    p.safeguard && ['Safeguard', [p.safeguard]],
    p.limits && ['Limits', [p.limits]],
    ['Built with', [`<ul class="chips">${p.stack.map((s) => `<li>${s}</li>`).join('')}</ul>`]],
  ].filter(Boolean)
  $('.study', el).innerHTML = rows.map(([k, v, big]) => `<div><dt>${k}</dt><dd${big ? ' class="is-big"' : ''}>${v.map((t) => (/^<(ul|ol|div)[ >]/.test(t) ? t : `<p>${t}</p>`)).join('')}</dd></div>`).join('')
  $('.sheet__links', el).innerHTML = p.links.map(([label, url]) => `<a class="btn" href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')
    + (p.id === 'quake' ? '<button class="btn btn--lime" type="button" data-game="survive">Try the model</button>' : '')
  $('.sheet__shot', el).innerHTML = p.shot ? `<img src="${p.shot[0]}" alt="${p.shot[1]}" width="1440" height="900" loading="lazy"><figcaption class="meta">The live site</figcaption>` : ''
  $('.sheet__next b', el).textContent = next.name
  $('.sheet__body', el).scrollTop = 0
}
function sheetIn() {
  if (reduce) return
  gsap.fromTo($$('.sheet__body > *, .study > div'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.04, ease: 'expo.out', delay: 0.12, overwrite: true })
  gsap.fromTo('.sheet__cover', { scale: 1.22, rotate: 4 }, { scale: 1, rotate: -3, duration: 1.4, ease: 'expo.out', overwrite: true })
}
function openSheet(i, e, fromRoute) {
  const el = $('.sheet')
  if (!el.hidden) return
  if (!fromRoute) window.history.pushState({ rpCase: true }, '', casePath(i))
  sheetFrom = document.activeElement
  const x = e?.clientX || window.innerWidth / 2, y = e?.clientY || window.innerHeight / 2
  el.style.setProperty('--x', `${x}px`)
  el.style.setProperty('--y', `${y}px`)
  el.hidden = false
  fillSheet(i)
  lenis?.stop()
  sound.cue('open')
  const far = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 40
  gsap.fromTo(el, { '--r': '0px' }, { '--r': `${far}px`, duration: reduce ? 0 : 0.95, ease: 'expo.inOut', onComplete: () => el.style.setProperty('--r', '200vmax') })
  sheetIn()
  $('.sheet__close', el).focus({ preventScroll: true })
}
function closeSheet() {
  const el = $('.sheet')
  if (el.hidden) return
  sound.cue('close')
  setMeta(null)
  gsap.fromTo(el, { '--r': `${Math.hypot(window.innerWidth, window.innerHeight)}px` }, {
    '--r': '0px', duration: reduce ? 0 : 0.7, ease: 'expo.inOut',
    onComplete: () => { el.hidden = true; sheetOpen = -1; lenis?.start(); sheetFrom?.focus?.({ preventScroll: true }) },
  })
}
function sheet() {
  const el = $('.sheet')
  const step = (d) => {
    const n = PROJECTS.length, next = (sheetOpen + d + n) % n
    sound.cue('open')
    window.history.replaceState(window.history.state, '', casePath(next))
    if (reduce) return fillSheet(next)
    gsap.to($$('.sheet__body > *'), { y: -18, opacity: 0, duration: 0.22, stagger: 0.01, ease: 'power2.in', overwrite: true, onComplete: () => { fillSheet(next); sheetIn() } })
  }
  // Close steps back through history when this visit opened the sheet; a direct link goes to the home page
  const leave = () => {
    if (window.history.state?.rpCase) return window.history.back()
    window.history.replaceState(null, '', '/')
    closeSheet()
  }
  $('.sheet__close', el).addEventListener('click', leave)
  const body = $('.sheet__body', el)
  $('.sheet__art', el).addEventListener('wheel', (e) => { body.scrollTop += e.deltaY; e.preventDefault() }, { passive: false })
  $('.sheet__next', el).addEventListener('click', () => step(1))
  window.addEventListener('popstate', () => {
    const i = caseFromURL()
    if (i < 0) return closeSheet()
    if (el.hidden) openSheet(i, null, true)
    else if (i !== sheetOpen) { fillSheet(i); sheetIn() }
  })
  document.addEventListener('keydown', (e) => {
    if (el.hidden || !$('.pal').hidden || openGameId) return
    if (e.key === 'Escape') leave()
    if (e.key === 'ArrowRight') step(1)
    if (e.key === 'ArrowLeft') step(-1)
    if (e.key === 'Tab') {
      const f = $$('button, a[href]', el).filter((n) => n.offsetParent)
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })
}

/* Jump palette: Ctrl K or ⌘ K, to any case study, section or action ---------- */
function palette() {
  const box = $('.pal'), q = $('.pal__q'), list = $('.pal__list')
  const go = (target) => () => { if (!$('.sheet').hidden) closeSheet(); setTimeout(() => scrollToEl(document.getElementById(target)), 50) }
  const items = [
    ...PROJECTS.map((p, i) => ({ label: p.name, hint: p.tag, run: () => { if (!$('.sheet').hidden) { window.history.replaceState(window.history.state, '', casePath(i)); fillSheet(i); sheetIn() } else openSheet(i) } })),
    { label: 'Selected work', hint: 'Section', run: go('work') },
    { label: 'Judged, and placed', hint: 'Section', run: go('results') },
    { label: 'About', hint: 'Section', run: go('about') },
    { label: 'Contact', hint: 'Section', run: go('contact') },
    { label: 'Will it survive?', hint: 'Play: the QuakeSafe model', run: () => openGame('survive') },
    { label: 'Bomb Dodger', hint: 'Play: my first game', run: () => openGame('bomb') },
    { label: 'Copy email address', hint: EMAIL, run: () => copyEmail().then((ok) => ok && sound.cue('copy')) },
    { label: 'Open GitHub', hint: 'github.com/CalyPx', run: () => window.open('https://github.com/CalyPx', '_blank', 'noopener') },
    { label: 'Open LinkedIn', hint: 'Rohit Poudel', run: () => window.open('https://www.linkedin.com/in/rohit-poudel-633364310/', '_blank', 'noopener') },
    { label: 'Turn sound on or off', hint: 'Sound', run: () => sound.setOn(!sound.state.on) },
  ]
  let shown = items, at = 0, from = null
  const draw = () => {
    list.innerHTML = shown.map((it, k) => `<li id="pal-${k}" role="option" aria-selected="${k === at}" class="${k === at ? 'is-at' : ''}"><b>${it.label}</b><span>${it.hint}</span></li>`).join('') || '<li class="pal__none">Nothing matches</li>'
    q.setAttribute('aria-activedescendant', shown.length ? `pal-${at}` : '')
    list.querySelector('.is-at')?.scrollIntoView({ block: 'nearest' })
  }
  const open = () => {
    from = document.activeElement
    box.hidden = false
    q.value = ''; shown = items; at = 0; draw()
    lenis?.stop()
    q.focus()
    if (!reduce) gsap.fromTo('.pal__box', { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'expo.out' })
  }
  const close = () => { box.hidden = true; if ($('.sheet').hidden && !openGameId) lenis?.start(); from?.focus?.({ preventScroll: true }) }
  const run = (k) => { const it = shown[k]; if (!it) return; close(); it.run() }
  q.addEventListener('input', () => {
    const t = q.value.trim().toLowerCase()
    shown = items.filter((it) => `${it.label} ${it.hint}`.toLowerCase().includes(t))
    at = 0; draw()
  })
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); at = Math.min(shown.length - 1, at + 1); draw() }
    if (e.key === 'ArrowUp') { e.preventDefault(); at = Math.max(0, at - 1); draw() }
    if (e.key === 'Enter') { e.preventDefault(); run(at) }
    if (e.key === 'Escape') { e.preventDefault(); close() }
    if (e.key === 'Tab') e.preventDefault()   // focus stays in the palette while it is open
  })
  list.addEventListener('pointermove', (e) => { const li = e.target.closest('[role="option"]'); if (li) { const k = +li.id.slice(4); if (k !== at) { at = k; draw() } } })
  list.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) run(+li.id.slice(4)) })
  box.addEventListener('pointerdown', (e) => { if (e.target === box) close() })
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close() }
  })
}

/* Games: Will it survive? and Bomb Dodger, each in its own dialog, loaded on first open ------- */
let openGameId = null
const gameApi = {}
async function openGame(id, e) {
  const box = document.getElementById(`game-${id}`)
  if (!box || openGameId) return
  openGameId = id
  const from = document.activeElement
  box.hidden = false
  box.dataset.from = ''
  box._from = from
  lenis?.stop()
  if (!reduce) gsap.fromTo($('.game__box', box), { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' })
  sound.cue('open')
  if (!gameApi[id]) {
    if (id === 'bomb') gameApi.bomb = (await import('./bomb.js')).mountBombDodger(box, { cue: sound.cue })
    if (id === 'survive') gameApi.survive = (await import('./survive.js')).mountSurvive(box, { gsap, cue: sound.cue, reduce })
  }
  $(id === 'bomb' ? '[data-bomb-start]' : '.sv__form input:checked', box)?.focus({ preventScroll: true })
}
function closeGame() {
  const box = document.getElementById(`game-${openGameId}`)
  if (!box) return
  gameApi[openGameId]?.stop?.()
  gameApi[openGameId]?.reset?.()
  box.hidden = true
  openGameId = null
  sound.cue('close')
  if ($('.sheet').hidden) lenis?.start()
  box._from?.focus?.({ preventScroll: true })
}
function games() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest?.('[data-game]')
    if (b) { e.preventDefault(); openGame(b.dataset.game, e) }
  })
  $$('.game').forEach((box) => {
    $('.game__close', box).addEventListener('click', closeGame)
    box.addEventListener('pointerdown', (e) => { if (e.target === box) closeGame() })
  })
  document.addEventListener('keydown', (e) => {
    if (!openGameId) return
    const box = document.getElementById(`game-${openGameId}`)
    if (e.key === 'Escape') { e.preventDefault(); closeGame() }
    if (e.key === 'Tab') {   // focus stays inside the open game
      const f = $$('button, a[href], input, canvas[tabindex]', box).filter((n) => n.offsetParent && !(n.type === 'radio' && !n.checked))
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })
}

/* Bar: solid once you leave the hero, away on the way down, one lime block on the active link */
function bar() {
  const el = $('.bar'), menu = $('.bar__menu'), nav = $('.bar__nav'), ind = $('.bar__ind')
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      if (el.classList.contains('is-open')) return
      const y = self.scroll()
      el.classList.toggle('bar--solid', y > window.innerHeight * 0.85)
      // stays put while keyboard focus is inside it
      el.classList.toggle('bar--away', self.direction === 1 && y > window.innerHeight * 0.5 && !el.contains(document.activeElement))
    },
  })
  const place = () => {
    const a = $('a[aria-current="true"]', nav)
    ind.style.opacity = a && window.innerWidth > 760 ? '1' : '0'
    if (!a) return
    ind.style.transform = `translateX(${a.offsetLeft}px)`
    ind.style.width = `${a.offsetWidth}px`
  }
  $$('.bar__nav a').forEach((a) => {
    const section = document.getElementById(a.getAttribute('href').slice(1))
    if (!section) return
    ScrollTrigger.create({
      trigger: section, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { self.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); place() },
    })
  })
  window.addEventListener('resize', place)
  $('[data-home]').addEventListener('click', (e) => { e.preventDefault(); if (!$('.sheet').hidden) return; scrollToEl(0) })

  const toggle = (open) => {
    el.classList.toggle('is-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.textContent = open ? 'Close' : 'Menu'
    open ? lenis?.stop() : lenis?.start()
    if (open) $('a', nav).focus()
  }
  menu.addEventListener('click', () => toggle(!el.classList.contains('is-open')))
  $$('.bar__nav a').forEach((a) => a.addEventListener('click', () => toggle(false)))
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return
    if (e.key === 'Escape') { toggle(false); menu.focus() }
    if (e.key === 'Tab') {   // keep focus inside the open phone menu
      const f = [...$$('a', nav), menu], first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })
}

/* Boot --------------------------------------------------------------- */
async function boot() {
  const cursorFrame = reduce ? null : initCursor()
  if (cursorFrame) gsap.ticker.add(cursorFrame)
  soundUI()
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1600))])
  work()
  ticker()
  sheet()
  tiles()
  contact()
  clock()
  entrances()
  inkWords()
  magnets()
  bar()
  palette()
  games()
  ScrollTrigger.refresh()

  // a direct link to a case study opens straight into it
  const deep = caseFromURL()
  if (deep >= 0) {
    if (!window.location.pathname.startsWith('/work/')) window.history.replaceState(null, '', casePath(deep))
    openSheet(deep, null, true)
  }

  // The intro starts at once; the 3D scene loads behind it and spins in as the lime sheet lifts.
  const heroIn = ['.bar', ...$$('[data-in]')]
  if (!reduce) gsap.set(heroIn, { autoAlpha: 0, y: 20 })
  const ready = gallery()
  if (document.documentElement.classList.contains('intro-on')) lenis?.stop()
  runIntro({
    gsap, covers: PROJECTS.map(cover), names: PROJECTS.map((p) => p.short || p.name),
    onSound: () => sound.setOn(true),
    onReveal: async () => {
      if ($('.sheet').hidden) lenis?.start()
      if (!reduce) gsap.to(heroIn, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, delay: 0.4, ease: 'expo.out', clearProps: 'transform' })
      await ready
      playHero()
    },
  })
}
boot()
