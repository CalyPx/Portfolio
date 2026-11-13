// The hero: the project covers orbit the name in real 3D. Covers at the back pass behind the
// letters, covers at the front pass in front of them, and the cards curl and split colour with speed.
import {
  CanvasTexture, CircleGeometry, Color, DoubleSide, Group, LinearFilter, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry,
  Plane, Raycaster, Scene, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer,
} from 'three'

const R = 2.5          // ring radius, in card widths
const TILT = 0.3       // front of the ring dips, back rises
const FOV = 32

const vertex = /* glsl */ `
  uniform float uBend;
  varying vec2 vUv;
  varying float vDepth;
  varying float vFace;
  void main() {
    vUv = uv;
    vFace = abs(normalize(normalMatrix * normal).z);
    vec3 p = position;
    p.z -= p.x * p.x * uBend;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`
const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uPaper;
  uniform float uShift;
  uniform float uNear;
  uniform float uFar;
  uniform float uLift;
  varying vec2 vUv;
  varying float vDepth;
  varying float vFace;
  void main() {
    vec2 uv = vUv;
    if (!gl_FrontFacing) uv.x = 1.0 - uv.x;
    vec3 c = vec3(texture2D(map, uv + vec2(uShift, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(uShift, 0.0)).b);
    c *= mix(0.74, 1.0, smoothstep(0.25, 1.0, vFace));   // cards turned away fall into shade
    c = mix(c, uPaper, smoothstep(uNear, uFar, vDepth) * 0.62);
    c += uLift * 0.06;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`

function nameTexture(lines, family = "'Geist Variable', sans-serif", track = -0.068) {
  const c = document.createElement('canvas')
  const size = 520, lead = 0.8
  const ctx = c.getContext('2d')
  const font = `800 ${size}px ${family}`
  ctx.font = font
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * track}px`
  const w = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 40
  c.width = Math.min(4096, w)
  c.height = Math.ceil(lines.length * size * lead + size * 0.22)
  const k = c.width / w
  ctx.scale(k, 1)
  ctx.font = font
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * track}px`
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'alphabetic'
  lines.forEach((l, i) => ctx.fillText(l, 14, size * 0.78 + i * size * lead))
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return { texture: t, aspect: c.width / c.height }
}

export function mountGallery(hero, { covers, names, onOpen, onHover, onPass, onThrow, onFirstDrag, onLost, gsap, ScrollTrigger, scrollVelocity }) {
  const canvas = hero.querySelector('.gl')
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  // if the GPU drops the context, hand back to the flat row of covers
  let lost = false
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; onLost?.() })
  renderer.outputColorSpace = SRGBColorSpace
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100)
  const tilt = new Group(), ring = new Group()
  tilt.add(ring)
  scene.add(tilt)

  const loader = new TextureLoader()
  const paper = new Color('#eeece5')
  const geo = new PlaneGeometry(1, 1.25, 20, 1)
  const n = covers.length * 2
  const cards = Array.from({ length: n }, (_, i) => {
    const map = loader.load(covers[i % covers.length], () => { mesh.visible = true })
    map.colorSpace = SRGBColorSpace
    map.minFilter = LinearFilter
    const mat = new ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, side: DoubleSide,
      uniforms: { map: { value: map }, uPaper: { value: paper }, uBend: { value: 0.12 }, uShift: { value: 0 }, uNear: { value: 4 }, uFar: { value: 11 }, uLift: { value: 0 } },
    })
    const mesh = new Mesh(geo, mat)
    mesh.visible = false   // no black placeholders while the cover loads
    const a = (i / n) * Math.PI * 2
    mesh.position.set(Math.sin(a) * R, 0, Math.cos(a) * R)
    mesh.rotation.y = a
    mesh.userData = { index: i % covers.length, pop: 0, phase: i * 1.7 }
    ring.add(mesh)
    return mesh
  })

  // A soft pool of shade on the floor under the ring, so the cards stand somewhere.
  const sc = document.createElement('canvas')
  sc.width = sc.height = 256
  const sx = sc.getContext('2d'), grad = sx.createRadialGradient(128, 128, 60, 128, 128, 128)
  grad.addColorStop(0, 'rgba(17,17,17,0)'); grad.addColorStop(0.62, 'rgba(17,17,17,0.16)'); grad.addColorStop(0.8, 'rgba(17,17,17,0.1)'); grad.addColorStop(1, 'rgba(17,17,17,0)')
  sx.fillStyle = grad; sx.fillRect(0, 0, 256, 256)
  const floor = new Mesh(new CircleGeometry(R * 1.42, 48), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.74
  tilt.add(floor)

  // The name stands in the middle of the ring.
  const name = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ transparent: true, depthWrite: false }))
  scene.add(name)

  const s = { a: -2.4, v: 0, drag: false, moved: 0, lx: 0, intro: true, grow: 0.55, show: 0, out: 0, mx: 0, my: 0, tx: 0, ty: 0, dragged: false }
  let W = 0, H = 0, portrait = false, base = 1, seen = true

  const size = () => {
    W = hero.clientWidth; H = hero.clientHeight
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, W < 760 ? 1.75 : 2))
    renderer.setSize(W, H, false)
    const aspect = W / H
    camera.aspect = aspect
    const was = portrait
    portrait = aspect < 0.62   // phones; tablets keep the one-line name
    if (!name.material.map || was !== portrait) {
      name.material.map?.dispose()
      const t = nameTexture(portrait ? ['Rohit', 'Poudel'] : ['Rohit Poudel'])
      name.material.map = t.texture
      name.material.needsUpdate = true
      name.userData.aspect = t.aspect
    }
    // the name fills most of the width; the camera backs off until it does
    const nw = portrait ? 3.5 : 6.3
    name.scale.set(nw, nw / name.userData.aspect, 1)
    const half = Math.tan((FOV * Math.PI) / 360)
    camera.position.z = nw / (0.94 * 2 * half * aspect)
    camera.updateProjectionMatrix()
    // between phone and desktop the screen gets taller than the scene, so the ring grows to fill it
    const tall = portrait ? 0 : Math.max(0, 1.25 - aspect)
    base = portrait ? 1.55 : 1 + tall * 1.7
    if (portrait) {
      // on phones, hang the name just under the top bar whatever the screen's height
      const halfH = camera.position.z * half, nh = nw / name.userData.aspect
      name.position.y = halfH - nh / 2 - (76 / H) * 2 * halfH
    } else name.position.y = 0.8 + tall * 1.4
    tilt.position.y = portrait ? 0.25 : 0.42 - tall * 0.5
    const front = camera.position.z - R * base
    cards.forEach((c) => { c.material.uniforms.uNear.value = front + 0.6 * base; c.material.uniforms.uFar.value = camera.position.z + R * base })
  }
  size()
  new ResizeObserver(size).observe(hero)
  document.fonts.ready.then(() => { name.material.map?.dispose(); name.material.map = null; size() })
  const step = (Math.PI * 2) / n
  let front = 0

  /* Pointer: drag to spin, hover to lift, click to open -------------- */
  const ray = new Raycaster(), ndc = new Vector2(-9, -9)
  let hovered = null
  const aim = (e) => {
    const b = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    s.tx = ndc.x; s.ty = ndc.y
  }
  // A drag decides what it is after a few pixels: sideways spins the ring; mostly up or down, when it
  // starts on a card, pulls that card out of the ring to be thrown.
  canvas.addEventListener('pointerdown', (e) => {
    s.drag = true; s.moved = 0; s.lx = e.clientX; s.v = 0; s.intro = false; gsap.killTweensOf(s, 'a'); aim(e)
    s.sx = e.clientX; s.sy = e.clientY; s.mode = null; s.down = hovered
  })
  window.addEventListener('pointermove', (e) => {
    if (e.target === canvas || s.drag) aim(e)
    if (!s.drag) return
    if (!s.mode) {
      const tx = e.clientX - s.sx, ty = e.clientY - s.sy
      if (Math.hypot(tx, ty) < 10) return
      s.mode = s.down && !s.down.userData.free && Math.abs(ty) > Math.abs(tx) * 1.2 ? 'card' : 'ring'
      if (s.mode === 'card') grab(s.down)
      s.lx = e.clientX
    }
    if (!s.dragged && (s.mode === 'card' || s.moved > 24)) { s.dragged = true; onFirstDrag?.() }
    if (s.mode === 'card') { s.moved += 20; return }
    const dx = e.clientX - s.lx
    s.lx = e.clientX
    s.moved += Math.abs(dx)
    const d = (dx / W) * (portrait ? 2.6 : 1.9)
    s.a += d
    s.v = s.v * 0.55 + d * 0.45
  }, { passive: true })
  canvas.addEventListener('pointerleave', () => { if (!held) { ndc.set(-9, -9); s.tx = 0; s.ty = 0 } })

  /* Throwing a card ------------------------------------------------------ */
  // The held card follows the pointer across a plane just in front of the ring; let go and it keeps the
  // speed it had, tumbles under gravity, then floats back to its slot in the ring.
  const hand = new Plane(new Vector3(0, 0, 1), 0), grip = new Vector3(), was = new Vector3()
  let held = null
  const flying = []
  function grab(card) {
    held = card
    const u = card.userData
    u.free = true
    u.home = { p: card.position.clone(), r: card.rotation.clone() }
    u.vel = new Vector3()
    scene.attach(card)   // out of the ring, keeping where it is on screen
    hand.constant = -Math.min(camera.position.z - 3, 3.4)   // the plane z = 3.4, in front of the ring
    was.copy(card.position)
  }
  function release() {
    const card = held
    held = null
    card.userData.t = 0
    card.userData.spin = new Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, -card.userData.vel.x * 1.5)
    flying.push(card)
    onThrow?.(Math.min(1, card.userData.vel.length() / 14))
  }
  function goHome(card) {
    const u = card.userData
    u.returning = true
    ring.attach(card)
    // wherever it landed, it comes back in from below
    card.position.set(u.home.p.x, u.home.p.y - 3, u.home.p.z)
    gsap.to(card.position, { x: u.home.p.x, y: u.home.p.y, z: u.home.p.z, duration: 1.1, ease: 'expo.out' })
    gsap.to(card.rotation, { x: u.home.r.x, y: u.home.r.y, z: u.home.r.z, duration: 1.1, ease: 'expo.out' })
    gsap.to(card.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'expo.out', onComplete: () => { u.free = false; u.returning = false } })
  }
  function moveCards(dt) {
    if (held) {
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(hand, grip)) {
        was.copy(held.position)
        held.position.lerp(grip, 0.35)
        held.userData.vel.copy(held.position).sub(was).divideScalar(Math.max(dt, 1 / 120)).clampLength(0, 24)
      }
      // face the viewer, leaning with the movement
      held.rotation.x += (0 - held.rotation.x) * 0.2
      held.rotation.y += (0 - held.rotation.y) * 0.2
      held.rotation.z += (-held.userData.vel.x * 0.04 - held.rotation.z) * 0.2
    }
    for (let i = flying.length - 1; i >= 0; i--) {
      const c = flying[i], u = c.userData
      u.t += dt
      u.vel.y -= 16 * dt
      c.position.addScaledVector(u.vel, dt)
      c.rotation.x += u.spin.x * dt; c.rotation.y += u.spin.y * dt; c.rotation.z += u.spin.z * dt
      if (u.t > 1.6 || c.position.y < -9) { flying.splice(i, 1); goHome(c) }
    }
  }

  const drop = () => { if (held) release(); s.drag = false }
  window.addEventListener('pointerup', drop)
  window.addEventListener('pointercancel', drop)
  canvas.addEventListener('click', (e) => { if (s.moved < 8 && hovered) onOpen(hovered.userData.index, e) })

  /* Scroll: the ring opens up and tips over as the hero leaves -------- */
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom top',
    onUpdate: (self) => {
      s.out = self.progress
      canvas.style.opacity = String(1 - Math.min(1, Math.max(0, (self.progress - 0.6) / 0.35)))
    },
  })
  new IntersectionObserver(([e]) => { seen = e.isIntersecting }).observe(hero)

  /* Entrance: held until the page says go, so it can follow the intro --- */
  const play = () => {
    gsap.to(s, { a: step / 2, duration: 2.6, ease: 'expo.out', onComplete: () => { s.intro = false } })
    gsap.to(s, { grow: 1, duration: 2.2, ease: 'expo.out' })
    gsap.to(s, { show: 1, duration: 1.2, ease: 'expo.out' })
  }

  let smooth = 0, clock = 0
  const frame = (dt) => {
    if (!seen || lost || canvas.style.opacity === '0') return
    clock += dt
    if (!s.drag && !s.intro) {
      s.a += s.v
      s.v *= 0.95
      s.a -= dt * 0.085 + scrollVelocity() * 0.0009
    }
    smooth += ((s.drag || !s.intro ? s.v : 0.02) - smooth) * 0.12
    const speed = Math.min(1, Math.abs(smooth) * 22)
    s.mx += (s.tx - s.mx) * 0.06; s.my += (s.ty - s.my) * 0.06

    ring.rotation.y = s.a
    const k = base * s.grow * (1 + s.out * 0.35)
    tilt.scale.setScalar(k)
    tilt.rotation.set(TILT + s.out * 0.5 - s.my * 0.04, s.mx * 0.08, -0.07 + s.mx * 0.012)
    floor.material.opacity = s.show
    name.material.opacity = s.show
    name.position.x = -s.mx * 0.05
    name.rotation.y = s.mx * 0.03

    moveCards(dt)

    // which card is under the pointer
    ray.setFromCamera(ndc, camera)
    const hit = s.drag ? null : ray.intersectObjects(cards.filter((c) => !c.userData.free), false)[0]?.object || null
    if (hit !== hovered) {
      hovered = hit
      canvas.dataset.cur = hit ? `View · ${names[hit.userData.index]}` : 'Drag'
      if (hit) onHover?.(hit.userData.index)
    }

    // a soft tick each time a card passes the front while the ring is being turned
    const f = Math.round(-ring.rotation.y / step)
    if (f !== front) {
      if (s.drag || Math.abs(s.v) > 0.004) onPass?.(Math.sign(front - f), Math.min(1, Math.abs(s.v) * 40))
      front = f
    }
    for (const c of cards) {
      const u = c.userData, m = c.material.uniforms
      if (u.free) { m.uBend.value = 0.06; m.uShift.value = 0; m.uLift.value = 0.6; continue }
      u.pop += ((c === hovered ? 1 : 0) - u.pop) * 0.14
      c.scale.setScalar(1 + u.pop * 0.09)
      c.position.y = Math.sin(clock * 0.7 + u.phase) * 0.022 + u.pop * 0.05   // a slow, small bob
      m.uBend.value = 0.1 + speed * 0.55 - u.pop * 0.08
      m.uShift.value = smooth * 0.5
      m.uLift.value = u.pop
    }
    renderer.render(scene, camera)
  }
  return { frame, play }
}
