// The normal cursor stays everywhere. Over the gallery and the work strips a small label takes its
// place and says what a press will do: "Drag", "View project", "Open".
export function initCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return null
  const el = document.createElement('div')
  el.className = 'cur'
  el.setAttribute('aria-hidden', 'true')
  document.body.append(el)
  document.documentElement.classList.add('has-cur')

  const target = { x: -200, y: -200 }, at = { x: -200, y: -200 }
  let on = false, last = null

  const read = (node) => {
    const hit = node?.closest?.('[data-cur]')
    const text = hit?.dataset.cur || ''
    if (text && el.textContent !== text) el.textContent = text
    if (!!text !== on) { on = !!text; el.classList.toggle('is-on', on); if (on) { at.x = target.x; at.y = target.y } }
  }
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return
    target.x = e.clientX; target.y = e.clientY
    last = e.target
    read(last)
  }, { passive: true })
  window.addEventListener('pointerdown', () => el.classList.add('is-down'))
  window.addEventListener('pointerup', () => el.classList.remove('is-down'))
  document.addEventListener('pointerleave', () => { on = false; el.classList.remove('is-on') })

  return function frame() {
    if (!on) return
    read(last)   // the label under a still pointer can change, e.g. when the ring turns a card under it
    at.x += (target.x - at.x) * 0.3; at.y += (target.y - at.y) * 0.3
    el.style.transform = `translate3d(${at.x + 14}px, ${at.y + 16}px, 0)`
  }
}
