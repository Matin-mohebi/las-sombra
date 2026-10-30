/**
 * Unified input: keyboard + mouse (pointer lock or drag-look) + touch controls.
 * Touch UI widgets are rendered by hud.ts and call into this class.
 */
export type BtnName = 'fire' | 'aim' | 'jump' | 'sprint' | 'horn' | 'pause'

export class Input {
  keys: Record<string, boolean> = {}
  move = { x: 0, y: 0 }          // -1..1 (y forward)
  look = { x: 0, y: 0 }          // consumed each frame (radians delta applied by camera)
  fireHeld = false
  aimHeld = false
  isTouch = false
  pointerLocked = false
  enabled = false                 // game playing
  // one-shot actions (cleared by consume)
  private queue: string[] = []
  private el: HTMLElement
  private onEsc: () => void
  private dragLook = false
  private lookTouchId: number | null = null
  private stickTouchId: number | null = null
  private stickCenter = { x: 0, y: 0 }

  constructor(el: HTMLElement, onEsc: () => void) {
    this.el = el
    this.onEsc = onEsc
    this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window

    window.addEventListener('keydown', this.kd)
    window.addEventListener('keyup', this.ku)
    window.addEventListener('blur', this.blur)
    document.addEventListener('pointerlockchange', this.plc)
    document.addEventListener('mousemove', this.mm)
    el.addEventListener('mousedown', this.md)
    window.addEventListener('mouseup', this.mu)
    el.addEventListener('contextmenu', this.cm)
    window.addEventListener('touchstart', this.ts, { passive: false })
    window.addEventListener('touchmove', this.tm, { passive: false })
    window.addEventListener('touchend', this.te)
    window.addEventListener('touchcancel', this.te)
  }

  requestLock() {
    if (this.isTouch) return
    try {
      const p = this.el.requestPointerLock() as unknown as Promise<void> | undefined
      if (p && typeof p.catch === 'function') p.catch(() => { this.dragLook = true })
    } catch {
      this.dragLook = true
    }
    // if lock doesn't engage within 300ms, fall back to drag-look
    setTimeout(() => { if (!this.pointerLocked) this.dragLook = true }, 350)
  }
  releaseLock() {
    try { document.exitPointerLock() } catch { /* ignore */ }
  }

  private plc = () => {
    this.pointerLocked = document.pointerLockElement === this.el
    if (!this.pointerLocked && this.enabled && !this.isTouch) {
      // unlocking mid-game (Esc) → pause
      this.onEsc()
    }
  }

  private kd = (e: KeyboardEvent) => {
    if (!this.enabled) return
    const k = e.code
    if (k === 'Escape') { this.onEsc(); return }
    if (this.keys[k]) return
    this.keys[k] = true
    if (k === 'KeyF' || k === 'KeyE') this.queue.push('enter')
    if (k === 'KeyR') this.queue.push('reload')
    if (k === 'Digit1') this.queue.push('w1')
    if (k === 'Digit2') this.queue.push('w2')
    if (k === 'Digit3') this.queue.push('w3')
    if (k === 'KeyQ') this.queue.push('wcycle')
    if (k === 'KeyH') this.queue.push('horn')
    if (k === 'Space') { this.queue.push('jump'); e.preventDefault() }
  }
  private ku = (e: KeyboardEvent) => { this.keys[e.code] = false }
  private blur = () => { this.keys = {}; this.fireHeld = false; this.aimHeld = false }

  private cm = (e: Event) => { e.preventDefault() }

  private md = (e: MouseEvent) => {
    if (!this.enabled || this.isTouch) return
    if (e.button === 0) this.fireHeld = true
    if (e.button === 2) this.aimHeld = true
  }
  private mu = (e: MouseEvent) => {
    if (e.button === 0) this.fireHeld = false
    if (e.button === 2) this.aimHeld = false
  }
  private mm = (e: MouseEvent) => {
    if (!this.enabled || this.isTouch) return
    if (this.pointerLocked) {
      this.look.x += e.movementX * 0.0023
      this.look.y += e.movementY * 0.0023
    } else if (this.dragLook && (e.buttons & 3)) {
      this.look.x += e.movementX * 0.0032
      this.look.y += e.movementY * 0.0032
    }
  }

  /* ---------- touch ---------- */
  private ts = (e: TouchEvent) => {
    if (!this.enabled || !this.isTouch) return
    for (const t of Array.from(e.changedTouches)) {
      const target = t.target as HTMLElement
      if (target && target.dataset && target.dataset.btn) continue // handled by button listeners
      if (t.clientX < window.innerWidth * 0.42 && this.stickTouchId === null) {
        this.stickTouchId = t.identifier
        this.stickCenter = { x: t.clientX, y: t.clientY }
        window.dispatchEvent(new CustomEvent('stick-show', { detail: { x: t.clientX, y: t.clientY } }))
      } else if (this.lookTouchId === null) {
        this.lookTouchId = t.identifier
      }
    }
  }
  private tm = (e: TouchEvent) => {
    if (!this.enabled || !this.isTouch) return
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickTouchId) {
        const dx = (t.clientX - this.stickCenter.x) / 52
        const dy = (t.clientY - this.stickCenter.y) / 52
        const len = Math.hypot(dx, dy)
        const s = len > 1 ? 1 / len : 1
        this.move.x = dx * s
        this.move.y = -dy * s
        window.dispatchEvent(new CustomEvent('stick-move', { detail: { x: dx * s, y: dy * s } }))
        e.preventDefault()
      } else if (t.identifier === this.lookTouchId) {
        this.look.x += (t.clientX - (this.lastLookX ?? t.clientX)) * 0.0045
        this.look.y += (t.clientY - (this.lastLookY ?? t.clientY)) * 0.0045
        this.lastLookX = t.clientX
        this.lastLookY = t.clientY
        e.preventDefault()
      }
    }
  }
  private lastLookX: number | null = null
  private lastLookY: number | null = null

  private te = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === this.stickTouchId) {
        this.stickTouchId = null
        this.move.x = 0; this.move.y = 0
        window.dispatchEvent(new CustomEvent('stick-hide'))
      } else if (t.identifier === this.lookTouchId) {
        this.lookTouchId = null
        this.lastLookX = null; this.lastLookY = null
      }
    }
  }

  /** called by touch buttons */
  btnDown(name: BtnName) {
    if (!this.enabled) return
    if (name === 'fire') this.fireHeld = true
    if (name === 'aim') this.aimHeld = !this.aimHeld
    if (name === 'jump') this.queue.push('jump')
    if (name === 'sprint') this.queue.push('sprint-toggle')
    if (name === 'horn') this.queue.push('horn')
    if (name === 'pause') this.onEsc()
  }
  btnUp(name: BtnName) {
    if (name === 'fire') this.fireHeld = false
  }
  btnTap(name: string) {
    if (!this.enabled) return
    if (name === 'enter') this.queue.push('enter')
    if (name === 'reload') this.queue.push('reload')
    if (name === 'wcycle') this.queue.push('wcycle')
  }

  /** read keyboard into move vector (desktop) */
  pollKeyboard() {
    if (this.isTouch || this.stickTouchId !== null) return
    let x = 0, y = 0
    if (this.keys.KeyW || this.keys.ArrowUp) y += 1
    if (this.keys.KeyS || this.keys.ArrowDown) y -= 1
    if (this.keys.KeyA || this.keys.ArrowLeft) x -= 1
    if (this.keys.KeyD || this.keys.ArrowRight) x += 1
    const len = Math.hypot(x, y)
    this.move.x = len > 1 ? x / len : x
    this.move.y = len > 1 ? y / len : y
  }

  consume(action: string): boolean {
    const i = this.queue.indexOf(action)
    if (i >= 0) { this.queue.splice(i, 1); return true }
    return false
  }
  clearQueue() { this.queue.length = 0 }
  consumeLook() {
    const r = { x: this.look.x, y: this.look.y }
    this.look.x = 0; this.look.y = 0
    return r
  }

  sprintHeld() { return !!(this.keys.ShiftLeft || this.keys.ShiftRight) }
  jumpHeld() { return !!this.keys.Space }

  dispose() {
    window.removeEventListener('keydown', this.kd)
    window.removeEventListener('keyup', this.ku)
    window.removeEventListener('blur', this.blur)
    document.removeEventListener('pointerlockchange', this.plc)
    document.removeEventListener('mousemove', this.mm)
    this.el.removeEventListener('mousedown', this.md)
    window.removeEventListener('mouseup', this.mu)
    this.el.removeEventListener('contextmenu', this.cm)
    window.removeEventListener('touchstart', this.ts)
    window.removeEventListener('touchmove', this.tm)
    window.removeEventListener('touchend', this.te)
    window.removeEventListener('touchcancel', this.te)
  }
}
