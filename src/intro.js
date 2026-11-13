// The opening: the seven project covers are dealt onto a stack one by one while a counter names each
// project, the stack fans out as Rohit's name rises behind it, then the cards fly away and the intro
// lifts off to reveal the 3D ring spinning in. About 3 seconds; at most once a week; skippable.
export function runIntro({ gsap, covers, names, onReveal, onSound }) {
  const root = document.documentElement
  const el = document.querySelector('.intro')
  const done = () => {
    try { localStorage.setItem('rp-intro', String(Date.now())) } catch {}
    root.classList.remove('intro-on')
    el?.remove()
  }
  if (!el || !root.classList.contains('intro-on')) { done(); onReveal(); return }

  const deck = el.querySelector('.intro__deck')
  const count = el.querySelector('[data-count]'), label = el.querySelector('[data-count-name]')
  const n = covers.length, mid = (n - 1) / 2
  const cards = covers.map((src) => {
    const img = document.createElement('img')
    img.className = 'intro__card'
    img.src = src
    img.alt = ''
    img.decoding = 'async'
    deck.append(img)
    return img
  })
  // each card lands at a slightly different angle, like a dealt hand
  const tilt = cards.map((_, i) => ((i * 37) % 13) - 6)
  const spread = () => Math.min(window.innerWidth * (window.innerWidth < 760 ? 0.095 : 0.12), 190)

  let left = false, tl = null
  const leave = (fast) => {
    if (left) return
    left = true
    tl?.kill()
    window.removeEventListener('keydown', key)
    gsap.timeline({ onComplete: done })
      .to(cards, {
        y: () => -window.innerHeight * 1.1, rotation: (i) => tilt[i] * 3, duration: fast ? 0.5 : 0.75,
        ease: 'power3.in', stagger: { each: 0.035, from: 'center' },
      })
      .to('.intro__name > span', { yPercent: -105, duration: 0.45, ease: 'power3.in' }, '<0.15')
      .to(['.intro__meta', '.intro__foot'], { opacity: 0, duration: 0.25 }, '<')
      .add(onReveal, '-=0.2')
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: fast ? 0.6 : 0.8, ease: 'expo.inOut' }, '<')
  }

  const start = () => {
    if (left) return
    tl = gsap.timeline({ onComplete: () => leave(false) })
    // deal: each cover drops onto the stack and the counter names it
    cards.forEach((card, i) => {
      tl.fromTo(card,
        { opacity: 1, y: () => window.innerHeight * 0.75, rotation: tilt[i] * 4, scale: 0.9 },
        {
          y: 0, rotation: tilt[i], scale: 1, duration: 0.6, ease: 'expo.out',
          onStart: () => { count.textContent = String(i + 1).padStart(2, '0'); label.textContent = names[i] },
        }, i * 0.11)
    })
    // fan: the stack opens into an arc and the name rises behind it
    tl.to(cards, {
      x: (i) => (i - mid) * spread(),
      y: (i) => Math.abs(i - mid) * 14,
      rotation: (i) => (i - mid) * 5,
      duration: 0.75, ease: 'expo.inOut',
    }, '+=0.15')
      .fromTo('.intro__name > span', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' }, '<0.2')
      .add(() => { label.textContent = 'Seven builds' }, '<')
      .to({}, { duration: 0.35 })
  }

  // start once the covers are ready to draw, but never wait long for them
  Promise.race([
    Promise.all(cards.map((c) => c.decode().catch(() => {}))),
    new Promise((r) => setTimeout(r, 900)),
  ]).then(start)

  el.querySelector('[data-enter="quiet"]').addEventListener('click', () => leave(true))
  el.querySelector('[data-enter="sound"]').addEventListener('click', () => { onSound(); leave(true) })
  const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { if (e.target.closest?.('.intro__btn')) return; leave(true) } }
  window.addEventListener('keydown', key)
}
