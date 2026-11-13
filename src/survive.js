// "Will it survive?": build a house, shake it, read the damage grade Rohit's QuakeSafe model predicts.
// Every prediction is real: public/quake-table.json holds the model's output for every combination the
// game offers, computed offline by scripts/quake_table.py from the trained XGBoost model in the repo.
const NS = 'http://www.w3.org/2000/svg'
const GRADE = ['Low damage', 'Moderate damage', 'Heavy damage']

export function mountSurvive(root, { gsap, cue = () => {}, reduce = false }) {
  const svg = root.querySelector('.sv__house'), seis = root.querySelector('.sv__seis polyline')
  const form = root.querySelector('.sv__form'), out = root.querySelector('.sv__result')
  const ageIn = root.querySelector('[name="age"]'), ageOut = root.querySelector('[data-age]')
  let table = null, loading = null
  // the predictions arrive once; `table` holds the data, `loading` the request for it
  const load = () => (loading ||= fetch('/quake-table.json').then((r) => r.json()).then((d) => (table = d)))

  const pick = () => {
    const f = new FormData(form)
    return {
      region: +f.get('region'), floors: +f.get('floors'), age: table ? table.options.ages[+f.get('age')] : 0,
      foundation: f.get('foundation'), roof: f.get('roof'), mud: +f.get('mud'),
    }
  }

  /* The house, drawn from the choices -------------------------------------- */
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag)
    for (const k in attrs) n.setAttribute(k, attrs[k])
    parent?.append(n)
    return n
  }
  let house = null, cracks = null
  const draw = () => {
    const c = pick()
    svg.replaceChildren()
    const W = 200, X = 100, FH = 54, GROUND = 400
    el('rect', { x: 0, y: GROUND, width: 400, height: 20, class: 'sv-ground' }, svg)
    house = el('g', { class: 'sv-house' }, svg)
    house.style.transformOrigin = `${X + W / 2}px ${GROUND}px`
    // foundation
    const fy = GROUND - 26
    el('rect', { x: X - 10, y: fy, width: W + 20, height: 26, class: `sv-found sv-found--${c.foundation}` }, house)
    if (c.foundation === 'r' || c.foundation === 'u') for (let i = 0; i < 9; i++) el('rect', { x: X - 6 + i * 24, y: fy + 5 + (i % 2) * 6, width: c.foundation === 'r' ? 14 : 18, height: 8, class: 'sv-stone' }, house)
    if (c.foundation === 'w') for (let i = 0; i < 3; i++) el('rect', { x: X - 10, y: fy + 3 + i * 8, width: W + 20, height: 1.5, class: 'sv-line' }, house)
    if (c.foundation === 'i') for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) el('rect', { x: X - 10 + i * 25 + (r % 2) * 12, y: fy + r * 8.6, width: 1.5, height: 8.6, class: 'sv-line' }, house)
    // floors
    for (let k = 0; k < c.floors; k++) {
      const y = fy - (k + 1) * FH
      const g = el('g', { class: 'sv-floor' }, house)
      el('rect', { x: X, y, width: W, height: FH, class: c.mud ? 'sv-wall sv-wall--mud' : 'sv-wall' }, g)
      if (c.mud) for (let i = 0; i < 14; i++) el('circle', { cx: X + 12 + ((i * 53) % 176), cy: y + 8 + ((i * 29) % 40), r: 2 + (i % 3), class: 'sv-stone' }, g)
      ;[X + 26, X + 86, X + 146].forEach((wx) => el('rect', { x: wx, y: y + 14, width: 28, height: 24, class: 'sv-win' }, g))
      el('rect', { x: X, y: y + FH - 1.5, width: W, height: 1.5, class: 'sv-line' }, g)
    }
    // roof
    const top = fy - c.floors * FH
    if (c.roof === 'n') el('polygon', { points: `${X - 14},${top} ${X + W / 2},${top - 44} ${X + W + 14},${top}`, class: 'sv-roof sv-roof--light' }, house)
    if (c.roof === 'q') el('polygon', { points: `${X - 18},${top} ${X + W / 2},${top - 52} ${X + W + 18},${top}`, class: 'sv-roof sv-roof--heavy' }, house)
    if (c.roof === 'x') el('rect', { x: X - 10, y: top - 16, width: W + 20, height: 16, class: 'sv-roof sv-roof--slab' }, house)
    cracks = el('g', { class: 'sv-cracks' }, house)
    // age, written into the ground strip
    el('text', { x: 12, y: GROUND + 14, class: 'sv-age' }, svg).textContent = c.age === 0 ? 'New build' : `${c.age} years old`
  }

  // cracks and a lean, scaled by how much damage the model expects
  const damage = (e) => {
    const c = pick(), FH = 54, fy = 374
    const n = Math.round((e - 1) * 7)
    for (let i = 0; i < n; i++) {
      const k = i % c.floors, y = fy - (k + 1) * FH + 6, x = 108 + ((i * 67) % 170)
      el('polyline', { points: `${x},${y} ${x + 8},${y + 14} ${x + 2},${y + 24} ${x + 12},${y + 40}`, class: 'sv-crack' }, cracks)
    }
    const lean = Math.max(0, e - 1.6) * 5
    if (!reduce) gsap.to(house, { rotation: lean, duration: 0.6, ease: 'back.out(2)' })
    else house.style.transform = `rotate(${lean}deg)`
  }

  // a seismograph trace that draws while the house shakes
  const trace = (amp) => {
    const pts = []
    for (let x = 0; x <= 400; x += 5) {
      const env = Math.sin((x / 400) * Math.PI)
      pts.push(`${x},${30 + Math.sin(x * 0.9) * Math.cos(x * 0.31) * amp * env * 26}`)
    }
    seis.setAttribute('points', pts.join(' '))
    const len = seis.getTotalLength()
    seis.style.strokeDasharray = len
    seis.style.strokeDashoffset = reduce ? 0 : len
    if (!reduce) gsap.to(seis.style, { strokeDashoffset: 0, duration: 1.4, ease: 'none' })
  }

  const show = (p, c) => {
    const g = p.indexOf(Math.max(...p)) + 1, facts = table.regions[c.region]
    out.innerHTML = `
      <p class="meta">The model predicts</p>
      <p class="sv__grade"><b>Grade ${g}</b><span>${GRADE[g - 1]}</span></p>
      <ul class="sv__bars">${p.map((v, i) => `<li class="${i + 1 === g ? 'is-top' : ''}"><span>Grade ${i + 1}</span><i style="--w:${v}%"></i><b>${v.toFixed(0)}%</b></li>`).join('')}</ul>
      <p class="sv__note">In the 2015 survey, ${facts.share_grade3}% of the ${facts.buildings.toLocaleString('en-US')} buildings in region ${c.region} reached grade 3. Grade 1 is light damage, 3 is heavy damage or collapse.</p>`
    out.hidden = false
    out.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' })
    if (!reduce) gsap.from(out.querySelectorAll('.sv__bars i'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, stagger: 0.08, ease: 'expo.out' })
  }

  let busy = false
  const shake = async () => {
    if (busy) return
    busy = true
    await load()
    const c = pick()
    const p = table.p[`${c.region}|${c.floors}|${c.age}|${c.foundation}|${c.roof}|${c.mud}`]
    const e = (p[0] * 1 + p[1] * 2 + p[2] * 3) / 100   // expected grade, 1 to 3
    draw()
    out.hidden = true
    cue('rumble')
    trace(0.35 + (e - 1) * 0.5)
    if (!reduce) {
      const amp = 4 + (e - 1) * 9
      await gsap.timeline()
        .to(house, { x: () => (Math.random() - 0.5) * amp * 2, y: () => -Math.random() * amp * 0.4, rotation: () => (Math.random() - 0.5) * amp * 0.25, duration: 0.05, repeat: 26, ease: 'none', repeatRefresh: true })
        .to(house, { x: 0, y: 0, rotation: 0, duration: 0.25, ease: 'power2.out' })
    }
    damage(e)
    show(p, c)
    cue(e > 2.3 ? 'close' : 'toggle')
    busy = false
  }

  // the slider snaps to the ages the model was asked about
  const ageLabel = () => { load().then(() => { const a = table.options.ages[+ageIn.value]; ageOut.textContent = a === 0 ? 'New' : `${a} years` }) }
  form.addEventListener('input', () => { if (!busy) { draw(); out.hidden = true }; ageLabel() })
  form.addEventListener('submit', (e) => { e.preventDefault(); shake() })
  load().then(() => { ageLabel(); draw() })
  draw()

  return { reset() { out.hidden = true; draw(); seis.setAttribute('points', '') } }
}
