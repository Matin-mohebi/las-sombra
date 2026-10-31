import type { Input } from './input'
import type { World } from './world'
import { faNum, clamp } from './utils'

export interface HudCallbacks {
  onStart: () => void
  onResume: () => void
  onRestart: () => void
  onAccept: (id: string) => void
  onDecline: () => void
  onBuyWeapon: (i: number) => string | null
  onBuyAmmo: () => string | null
  onBuyHealth: () => string | null
  onQuality: (q: 'low' | 'med' | 'high') => void
  onToggleSound: () => void
}

const CSS = `
.lshud{position:absolute;inset:0;overflow:hidden;pointer-events:none;font-family:Vazirmatn,Tahoma,sans-serif;
  color:#f0e8d8;user-select:none;-webkit-user-select:none;direction:rtl;z-index:5}
.lshud .panel{background:rgba(12,14,18,.78);border:1px solid rgba(232,182,76,.35);border-radius:14px;
  backdrop-filter:blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.45)}
.lshud button{pointer-events:auto;cursor:pointer;font-family:inherit}
.btn{background:linear-gradient(180deg,#e8b64c,#c8922e);color:#241a08;border:none;border-radius:12px;
  padding:12px 34px;font-size:18px;font-weight:800;box-shadow:0 4px 14px rgba(0,0,0,.4);transition:transform .12s,filter .12s}
.btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
.btn:active{transform:translateY(1px)}
.btn.ghost{background:rgba(240,232,216,.12);color:#f0e8d8;border:1px solid rgba(240,232,216,.35)}
.btn.small{padding:8px 18px;font-size:15px;border-radius:10px}
/* vitals */
.vitals{position:absolute;top:14px;right:16px;display:flex;flex-direction:column;gap:7px;align-items:flex-end}
.vitals .row{display:flex;gap:8px;align-items:center}
.bar{width:190px;height:14px;border-radius:7px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.25);overflow:hidden}
.bar>i{display:block;height:100%;border-radius:7px;transition:width .18s}
.bar.hp>i{background:linear-gradient(90deg,#58c470,#8ae098)}
.bar.st>i{background:linear-gradient(90deg,#c8a83a,#e8cc70)}
.money{font-size:21px;font-weight:900;color:#ffd76a;text-shadow:0 2px 6px rgba(0,0,0,.7)}
.stars{font-size:20px;letter-spacing:3px;color:#3a3a3a;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.stars b{color:#ffd24a;text-shadow:0 0 10px rgba(255,190,60,.9)}
.wpn{font-size:14px;background:rgba(0,0,0,.5);padding:5px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.16)}
.speedo{font-size:15px;font-weight:800;color:#bfe6ff;background:rgba(0,0,0,.5);padding:4px 12px;border-radius:9px}
/* objective */
.objective{position:absolute;top:14px;left:50%;transform:translateX(-50%);text-align:center;min-width:280px;padding:9px 20px}
.objective .t{font-size:15.5px;font-weight:700}
.objective .timer{font-size:14px;color:#ffd76a;font-weight:800}
/* minimap */
.mapwrap{position:absolute;bottom:14px;left:14px;width:178px;height:178px;border-radius:50%;
  border:3px solid rgba(240,225,190,.55);overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.55),inset 0 0 30px rgba(0,0,0,.4)}
.mapwrap canvas{width:100%;height:100%;display:block}
/* crosshair */
.xhair{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26px;height:26px;opacity:0;transition:opacity .12s}
.xhair i{position:absolute;background:#f8f4e8;box-shadow:0 0 3px rgba(0,0,0,.8)}
.xhair .h{width:9px;height:2px;top:12px}.xhair .v{width:2px;height:9px;left:12px}
.xhair .l{left:0}.xhair .r{right:0}.xhair .t{top:0}.xhair .b{bottom:0}
/* prompt + toasts */
.prompt{position:absolute;bottom:20%;left:50%;transform:translateX(-50%);font-size:16px;font-weight:700;
  background:rgba(10,12,16,.72);padding:9px 20px;border-radius:11px;border:1px solid rgba(232,182,76,.4);opacity:0;transition:opacity .15s}
.prompt b{color:#ffd76a}
.toasts{position:absolute;bottom:110px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center}
.toast{padding:9px 22px;border-radius:11px;font-size:15px;font-weight:700;background:rgba(10,12,16,.82);
  border:1px solid rgba(255,255,255,.25);animation:toastIn .25s ease-out;white-space:nowrap}
.toast.gold{color:#ffd76a;border-color:rgba(232,182,76,.55)}
.toast.bad{color:#ff8a7a;border-color:rgba(255,90,70,.5)}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* damage vignette */
.dmg{position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse at center,transparent 55%,rgba(160,10,10,.55) 100%)}
/* fullscreen menus */
.overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;
  background:rgba(5,6,10,.62);backdrop-filter:blur(4px)}
.card{padding:30px 38px;max-width:min(520px,92vw);text-align:center;max-height:88vh;overflow-y:auto}
.title{font-size:52px;font-weight:950;line-height:1.15;color:#ffd76a;
  text-shadow:0 3px 0 #7a4a10,0 10px 34px rgba(0,0,0,.7);letter-spacing:1px}
.subtitle{font-size:16px;color:#d8ccb2;margin:6px 0 22px}
.mrow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.kv{display:flex;justify-content:space-between;gap:18px;padding:7px 4px;border-bottom:1px dashed rgba(255,255,255,.14);font-size:14.5px}
.kv b{color:#ffd76a}
.seg{display:inline-flex;border:1px solid rgba(255,255,255,.3);border-radius:10px;overflow:hidden}
.seg button{background:transparent;color:#e8dfc8;border:none;padding:8px 16px;font-size:14px;font-weight:700}
.seg button.on{background:#e8b64c;color:#241a08}
.err{color:#ff9a8a;font-size:14px;min-height:20px;margin-top:6px}
/* touch */
.touch{position:absolute;inset:0;display:none}
.touch.on{display:block}
.tbtn{position:absolute;border-radius:50%;background:rgba(20,22,28,.5);border:2px solid rgba(255,255,255,.4);
  color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;
  pointer-events:auto;touch-action:none;text-shadow:0 1px 3px #000}
.tbtn:active,.tbtn.hold{background:rgba(232,182,76,.55)}
.tbtn.fire{width:88px;height:88px;right:26px;bottom:34px;background:rgba(160,40,30,.55);font-size:17px;border-color:rgba(255,140,110,.6)}
.tbtn.aim{width:62px;height:62px;right:36px;bottom:140px}
.tbtn.enter{width:64px;height:64px;right:132px;bottom:52px;font-size:13px}
.tbtn.jump{width:56px;height:56px;right:140px;bottom:138px}
.tbtn.wpn{width:50px;height:50px;right:30px;bottom:222px}
.tbtn.sprint{width:50px;height:50px;right:118px;bottom:212px}
.tbtn.sprint.on{background:rgba(90,160,80,.6)}
.stick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);
  background:rgba(20,22,28,.35);pointer-events:none;display:none}
.stick i{position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(240,230,210,.55);
  left:34px;top:34px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.pausebtn{position:absolute;top:14px;left:16px;width:42px;height:42px;border-radius:11px;font-size:18px;
  background:rgba(12,14,18,.7);border:1px solid rgba(255,255,255,.3);color:#f0e8d8;pointer-events:auto}
`

export class Hud {
  root: HTMLDivElement
  private hpBar!: HTMLElement
  private stBar!: HTMLElement
  private moneyEl!: HTMLElement
  private starsEl!: HTMLElement
  private wpnEl!: HTMLElement
  private speedo!: HTMLElement
  private objEl!: HTMLElement
  private objText: HTMLElement | null = null
  private objTimer: HTMLElement | null = null
  private xhair!: HTMLElement
  private promptEl!: HTMLElement
  private toastsEl!: HTMLElement
  private dmgEl!: HTMLElement
  private mapCanvas!: HTMLCanvasElement
  private staticMap!: HTMLCanvasElement
  private touchEl!: HTMLElement
  private stickEl!: HTMLElement
  private stickKnob!: HTMLElement
  private enterBtn!: HTMLButtonElement
  private sprintBtn!: HTMLButtonElement
  private aimBtn!: HTMLButtonElement
  private overlays: Record<string, HTMLElement> = {}
  private lastCache: Record<string, string | number> = {}
  private promptTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(container: HTMLElement, private input: Input, private cbs: HudCallbacks, private world: World) {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    this.root = document.createElement('div')
    this.root.className = 'lshud'
    container.appendChild(this.root)
    this.build()
    this.buildStaticMap()
    this.bindTouch()
  }

  /* ================= build ================= */
  private el(tag: string, cls?: string, parent?: HTMLElement) {
    const e = document.createElement(tag)
    if (cls) e.className = cls
    ;(parent ?? this.root).appendChild(e)
    return e
  }

  private build() {
    // vitals
    const v = this.el('div', 'vitals')
    const rMoney = this.el('div', 'row', v)
    this.moneyEl = this.el('div', 'money', rMoney)
    this.starsEl = this.el('div', 'stars', rMoney)
    const rHp = this.el('div', 'row', v)
    const hp = this.el('div', 'bar hp', rHp)
    this.hpBar = this.el('i', '', hp)
    const rSt = this.el('div', 'row', v)
    const st = this.el('div', 'bar st', rSt)
    this.stBar = this.el('i', '', st)
    const rW = this.el('div', 'row', v)
    this.wpnEl = this.el('div', 'wpn', rW)
    this.speedo = this.el('div', 'speedo', v)
    this.speedo.style.display = 'none'

    // objective
    this.objEl = this.el('div', 'objective panel')
    this.objEl.style.display = 'none'
    this.objText = this.el('div', 't', this.objEl)
    this.objTimer = this.el('div', 'timer', this.objEl)

    // minimap
    const mw = this.el('div', 'mapwrap')
    this.mapCanvas = document.createElement('canvas')
    this.mapCanvas.width = 356
    this.mapCanvas.height = 356
    mw.appendChild(this.mapCanvas)

    // crosshair
    this.xhair = this.el('div', 'xhair')
    for (const cls of ['h l', 'h r', 'v t', 'v b']) {
      this.el('i', cls, this.xhair)
    }

    // prompt / toasts / dmg
    this.promptEl = this.el('div', 'prompt')
    this.toastsEl = this.el('div', 'toasts')
    this.dmgEl = this.el('div', 'dmg')

    // touch
    this.touchEl = this.el('div', 'touch')
    this.stickEl = this.el('div', 'stick', this.touchEl)
    this.stickKnob = this.el('i', '', this.stickEl)
    this.mkBtn('fire', 'شلیک', 'fire')
    this.aimBtn = this.mkBtn('aim', 'نشانه', 'aim')
    this.enterBtn = this.mkBtn('enter', 'سوار', 'enter')
    this.mkBtn('jump', 'پرش', 'jump')
    this.mkBtn('wpn', 'اسلحه', 'wpn')
    this.sprintBtn = this.mkBtn('sprint', 'دویدن', 'sprint')

    // pause button
    const pb = this.el('button', 'pausebtn') as HTMLButtonElement
    pb.textContent = '❚❚'
    pb.addEventListener('click', () => { this.input.btnDown('pause') })
    pb.style.display = 'none'
    this.overlays.pausebtn = pb
  }

  private mkBtn(name: string, label: string, cls: string) {
    const b = this.el('button', `tbtn ${cls}`, this.touchEl) as HTMLButtonElement
    b.textContent = label
    b.dataset.btn = name
    b.addEventListener('touchstart', (e) => {
      e.preventDefault()
      b.classList.add('hold')
      if (name === 'fire') this.input.btnDown('fire')
      else if (name === 'aim') { this.input.btnDown('aim'); this.aimBtn.classList.toggle('on', this.input.aimHeld) }
      else if (name === 'sprint') { this.input.btnDown('sprint'); this.sprintBtn.classList.toggle('on', this.sprintBtn.classList.contains('on') === false) }
      else if (name === 'jump') this.input.btnDown('jump')
      else this.input.btnTap(name)
    }, { passive: false })
    b.addEventListener('touchend', (e) => {
      e.preventDefault()
      b.classList.remove('hold')
      if (name === 'fire') this.input.btnUp('fire')
    }, { passive: false })
    return b
  }

  private bindTouch() {
    window.addEventListener('stick-show', (e) => {
      const d = (e as CustomEvent).detail as { x: number; y: number }
      this.stickEl.style.display = 'block'
      this.stickEl.style.left = `${d.x - 60}px`
      this.stickEl.style.top = `${d.y - 60}px`
      this.stickKnob.style.transform = 'translate(0,0)'
    })
    window.addEventListener('stick-move', (e) => {
      const d = (e as CustomEvent).detail as { x: number; y: number }
      this.stickKnob.style.transform = `translate(${clamp(d.x, -1, 1) * 32}px,${clamp(d.y, -1, 1) * 32}px)`
    })
    window.addEventListener('stick-hide', () => {
      this.stickEl.style.display = 'none'
    })
  }

  /* ================= static minimap ================= */
  private buildStaticMap() {
    const S = 0.4 // px per world unit
    const size = Math.ceil(2400 * S)
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const x = c.getContext('2d')!
    const W = (wx: number) => (wx + 1200) * S
    // desert bg
    x.fillStyle = '#a8895c'
    x.fillRect(0, 0, size, size)
    // town dirt
    x.fillStyle = '#b09068'
    x.fillRect(W(-240), W(480), 480 * S, 220 * S)
    // city base
    x.fillStyle = '#7c786e'
    x.fillRect(W(-300), W(-900), 600 * S, 600 * S)
    // roads
    x.strokeStyle = '#3c3d40'
    x.lineCap = 'round'
    for (const r of this.world.minimap.roads) {
      x.lineWidth = 14 * S + 2
      x.beginPath()
      if (r.vert) { x.moveTo(W(r.x), W(r.z - r.len / 2)); x.lineTo(W(r.x), W(r.z + r.len / 2)) }
      else { x.moveTo(W(r.x - r.len / 2), W(r.z)); x.lineTo(W(r.x + r.len / 2), W(r.z)) }
      x.stroke()
    }
    // rects
    for (const r of this.world.minimap.rects) {
      if (r.t === 'b') x.fillStyle = 'rgba(60,58,52,.85)'
      else if (r.t === 'r') x.fillStyle = 'rgba(90,74,54,.8)'
      else if (r.t === 't') x.fillStyle = '#8a4a2a'
      else if (r.t === 'w') x.fillStyle = '#4a7a9a'
      else x.fillStyle = '#556b44'
      x.fillRect(W(r.x - r.hw), W(r.z - r.hd), r.hw * 2 * S, r.hd * 2 * S)
    }
    // camps
    for (const cmp of this.world.minimap.camps) {
      x.strokeStyle = '#c03020'
      x.lineWidth = 2
      x.beginPath()
      x.arc(W(cmp.x), W(cmp.z), 9, 0, Math.PI * 2)
      x.stroke()
    }
    this.staticMap = c
  }

  /* ================= minimap frame ================= */
  drawMap(px: number, pz: number, camYaw: number, ents: { x: number; z: number; t: string }[], target: { x: number; z: number; t: string } | null, stars: number) {
    const ctx = this.mapCanvas.getContext('2d')!
    const W = this.mapCanvas.width
    const c = W / 2
    const pxPerUnit = 0.62
    const k = pxPerUnit / 0.4
    ctx.clearRect(0, 0, W, W)
    ctx.save()
    ctx.beginPath()
    ctx.arc(c, c, c - 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#1a1c20'
    ctx.fillRect(0, 0, W, W)
    ctx.translate(c, c)
    ctx.rotate(camYaw)
    ctx.translate(-((px + 1200) * 0.4) * k, -((pz + 1200) * 0.4) * k)
    ctx.scale(k, k)
    ctx.drawImage(this.staticMap, 0, 0)
    ctx.restore()

    // entity dots (in rotated space)
    const dot = (wx: number, wz: number, color: string, r: number) => {
      const dx = (wx - px) * pxPerUnit
      const dz = (wz - pz) * pxPerUnit
      const th = camYaw
      const rx = dx * Math.cos(th) - dz * Math.sin(th)
      const ry = dx * Math.sin(th) + dz * Math.cos(th)
      if (rx * rx + ry * ry > (c - 8) * (c - 8)) return
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(c + rx, c + ry, r, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const e of ents) {
      if (e.t === 'cop') dot(e.x, e.z, '#4a9af0', 4)
      else if (e.t === 'enemy') dot(e.x, e.z, '#e04030', 4)
      else if (e.t === 'pickup') dot(e.x, e.z, '#ffd24a', 3)
    }
    if (target) dot(target.x, target.z, target.t === 'cp' ? '#4ad8ff' : '#ffb02a', 6.5)

    // player arrow
    ctx.save()
    ctx.translate(c, c)
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = 'rgba(0,0,0,.6)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -9)
    ctx.lineTo(6.5, 7)
    ctx.lineTo(0, 3.5)
    ctx.lineTo(-6.5, 7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // wanted border flash
    if (stars > 0) {
      const a = 0.35 + Math.sin(performance.now() * 0.006) * 0.3
      ctx.strokeStyle = `rgba(255,70,50,${a})`
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.arc(c, c, c - 3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  /* ================= dynamic values ================= */
  private setText(key: string, e: HTMLElement, v: string) {
    if (this.lastCache[key] !== v) {
      this.lastCache[key] = v
      e.textContent = v
    }
  }

  vitals(health: number, stamina: number, money: number, stars: number, wpn: string, ammo: string, reloading: boolean, speed: number | null) {
    this.hpBar.style.width = `${clamp(health, 0, 100)}%`
    this.stBar.style.width = `${clamp(stamina, 0, 100)}%`
    this.setText('money', this.moneyEl, `${faNum(money)} دلار`)
    let s = ''
    for (let i = 0; i < 5; i++) s += i < stars ? '<b>★</b>' : '★'
    if (this.lastCache.stars !== s) { this.lastCache.stars = s; this.starsEl.innerHTML = s }
    this.setText('wpn', this.wpnEl, reloading ? 'در حال پرکردن...' : `${wpn} — ${ammo}`)
    if (speed !== null) {
      this.speedo.style.display = ''
      this.setText('speed', this.speedo, `${faNum(Math.round(Math.abs(speed) * 3.6))} کیلومتر/ساعت`)
    } else {
      this.speedo.style.display = 'none'
    }
  }

  objective(text: string | null, timer: number | null) {
    if (!text) {
      this.objEl.style.display = 'none'
      return
    }
    this.objEl.style.display = ''
    this.setText('obj', this.objText!, text)
    if (timer !== null) {
      this.objTimer!.style.display = ''
      this.setText('objt', this.objTimer!, `${faNum(Math.ceil(timer))} ثانیه`)
    } else {
      this.objTimer!.style.display = 'none'
    }
  }

  crosshair(on: boolean) {
    this.xhair.style.opacity = on ? '0.9' : '0'
  }

  prompt(html: string | null) {
    if (!html) {
      if (this.promptEl.style.opacity !== '0') this.promptEl.style.opacity = '0'
      return
    }
    if (this.promptEl.innerHTML !== html) this.promptEl.innerHTML = html
    this.promptEl.style.opacity = '1'
  }

  toast(text: string, type: 'info' | 'gold' | 'bad' = 'info') {
    const t = this.el('div', `toast ${type === 'info' ? '' : type}`, this.toastsEl)
    t.textContent = text
    setTimeout(() => {
      t.style.transition = 'opacity .5s'
      t.style.opacity = '0'
      setTimeout(() => t.remove(), 550)
    }, 3200)
    while (this.toastsEl.children.length > 4) this.toastsEl.firstChild?.remove()
  }

  damageFlash(strength: number) {
    this.dmgEl.style.transition = 'none'
    this.dmgEl.style.opacity = String(clamp(strength, 0, 0.85))
    requestAnimationFrame(() => {
      this.dmgEl.style.transition = 'opacity .6s'
      this.dmgEl.style.opacity = '0'
    })
  }

  fadeBlack(on: boolean, ms = 500) {
    let f = this.overlays.fade as HTMLElement | undefined
    if (!f) {
      f = this.el('div', '')
      f.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;transition:opacity .5s;pointer-events:none'
      this.overlays.fade = f
    }
    f.style.transition = `opacity ${ms}ms`
    requestAnimationFrame(() => { f!.style.opacity = on ? '1' : '0' })
  }

  setTouchVisible(on: boolean) {
    this.touchEl.classList.toggle('on', on)
    this.overlays.pausebtn.style.display = on ? '' : 'none'
  }

  setPlayingUI(on: boolean) {
    this.overlays.pausebtn.style.display = on ? (this.touchEl.classList.contains('on') ? '' : 'none') : 'none'
  }

  setEnterLabel(label: string | null) {
    if (label === null) {
      this.enterBtn.style.display = 'none'
    } else {
      this.enterBtn.style.display = ''
      this.setText('enter', this.enterBtn, label)
    }
  }

  /* ================= overlays ================= */
  private overlay(id: string): HTMLElement {
    let o = this.overlays[id]
    if (!o) {
      o = this.el('div', 'overlay')
      this.overlays[id] = o
    }
    o.innerHTML = ''
    return o
  }
  private hideAll() {
    for (const k of Object.keys(this.overlays)) {
      if (k !== 'fade' && k !== 'pausebtn') {
        const o = this.overlays[k]
        if (o && o.style.display !== 'none') o.style.display = 'none'
      }
    }
  }

  showStart(quality: 'low' | 'med' | 'high', muted: boolean) {
    const o = this.overlay('start')
    o.style.display = ''
    const card = this.el('div', 'panel card', o)
    this.el('div', 'title', card).textContent = 'لاس سومبرا'
    this.el('div', 'subtitle', card).textContent = 'جایی که خیابان‌های شهر به مرزِ بی‌قانون می‌رسد'
    const desc = this.el('div', 'subtitle', card)
    desc.style.fontSize = '13.5px'
    desc.textContent = 'دنیای باز سه‌بعدی — ماشین‌سواری و تعقیب‌وگریز در شهر، اسب‌سواری و شش‌لول در بیابان'
    const start = this.el('button', 'btn', card) as HTMLButtonElement
    start.textContent = 'شروع بازی'
    start.onclick = () => this.cbs.onStart()
    const row = this.el('div', 'mrow', card)
    const help = this.el('button', 'btn ghost small', row) as HTMLButtonElement
    help.textContent = 'راهنما'
    help.onclick = () => this.showHelp('start')
    // quality
    const qrow = this.el('div', 'mrow', card)
    this.el('span', '', qrow).textContent = 'کیفیت گرافیک: '
    const seg = this.el('div', 'seg', qrow)
    for (const [val, label] of [['low', 'ساده'], ['med', 'متعادل'], ['high', 'عالی']] as const) {
      const b = this.el('button', quality === val ? 'on' : '', seg) as HTMLButtonElement
      b.textContent = label
      b.onclick = () => {
        this.cbs.onQuality(val)
        for (const bb of Array.from(seg.children)) bb.classList.remove('on')
        b.classList.add('on')
      }
    }
    const srow = this.el('div', 'mrow', card)
    const sb = this.el('button', 'btn ghost small', srow) as HTMLButtonElement
    sb.textContent = muted ? 'صدا: خاموش' : 'صدا: روشن'
    sb.onclick = () => {
      this.cbs.onToggleSound()
      sb.textContent = sb.textContent?.includes('خاموش') ? 'صدا: روشن' : 'صدا: خاموش'
    }
    const credit = this.el('div', 'subtitle', card)
    credit.style.cssText = 'margin-top:18px;font-size:12px;opacity:.7'
    credit.textContent = 'ساخته‌شده با Three.js — برای ویندوز و اندروید (مرورگر)'
  }

  showHelp(back: 'start' | 'pause') {
    const o = this.overlay('help')
    o.style.display = ''
    const card = this.el('div', 'panel card', o)
    const h = this.el('div', 'title', card)
    h.style.fontSize = '28px'
    h.textContent = 'راهنمای بازی'
    const grid = this.el('div', '', card)
    grid.style.cssText = 'text-align:right;margin:16px 0'
    const rows: [string, string][] = [
      ['W A S D / اهرم لمسی', 'حرکت'],
      ['ماوس / کشیدن انگشت (سمت راست)', 'دوربین'],
      ['کلیک چپ / دکمه شلیک', 'شلیک'],
      ['کلیک راست / دکمه نشانه', 'نشانه‌گیری'],
      ['F (یا E) / دکمه سوار', 'سوار/پیاده شدن از ماشین و اسب'],
      ['Shift / دکمه دویدن', 'دویدن (پیاده) — گالوپ (اسب)'],
      ['Space', 'پرش — ترمزدست (ماشین)'],
      ['R', 'پرکردن خشاب'],
      ['1 2 3 یا Q', 'تعویض سلاح'],
      ['H', 'بوق ماشین'],
      ['Esc / دکمه ❚❚', 'توقف بازی'],
    ]
    for (const [k, v] of rows) {
      const r = this.el('div', 'kv', grid)
      r.innerHTML = `<b>${k}</b><span>${v}</span>`
    }
    const tip = this.el('div', 'subtitle', card)
    tip.style.cssText = 'font-size:13px;text-align:right'
    tip.textContent = 'نشانگرهای طلایی روی نقشه = محل مأموریت‌ها. داخل دایره قرمز نقشه، کمپ یاغی‌هاست. با ضربه زدن به مغازه اسلحه می‌توانی تجهیزات بخری.'
    const row = this.el('div', 'mrow', card)
    const back2 = this.el('button', 'btn small', row) as HTMLButtonElement
    back2.textContent = 'بازگشت'
    back2.onclick = () => {
      if (back === 'start') this.showStart((this.lastQuality as 'low' | 'med' | 'high') ?? 'high', this.lastMuted)
      else this.showPause()
    }
  }
  lastQuality: string = 'high'
  lastMuted = false

  showPause() {
    const o = this.overlay('pause')
    o.style.display = ''
    const card = this.el('div', 'panel card', o)
    const h = this.el('div', 'title', card)
    h.style.fontSize = '34px'
    h.textContent = 'توقف'
    const row = this.el('div', 'mrow', card)
    const resume = this.el('button', 'btn', row) as HTMLButtonElement
    resume.textContent = 'ادامه بازی'
    resume.onclick = () => this.cbs.onResume()
    const row2 = this.el('div', 'mrow', card)
    const help = this.el('button', 'btn ghost small', row2) as HTMLButtonElement
    help.textContent = 'راهنما'
    help.onclick = () => this.showHelp('pause')
    const restart = this.el('button', 'btn ghost small', row2) as HTMLButtonElement
    restart.textContent = 'شروع دوباره'
    restart.onclick = () => this.cbs.onRestart()
  }

  showDeath(fee: number) {
    const o = this.overlay('death')
    o.style.display = ''
    o.style.background = 'rgba(40,4,4,.55)'
    const card = this.el('div', 'panel card', o)
    const h = this.el('div', 'title', card)
    h.style.fontSize = '40px'
    h.style.color = '#ff8a7a'
    h.textContent = 'از نفس افتادی...'
    const sub = this.el('div', 'subtitle', card)
    sub.textContent = `درمانگاه تو را جمع کرد — ${faNum(fee)} دلار جریمه`
    const row = this.el('div', 'mrow', card)
    const b = this.el('button', 'btn', row) as HTMLButtonElement
    b.textContent = 'بازگشت'
    b.onclick = () => this.cbs.onResume()
  }

  showMissionOffer(def: { id: string; title: string; desc: string; reward: number }) {
    const o = this.overlay('mission')
    o.style.display = ''
    const card = this.el('div', 'panel card', o)
    const h = this.el('div', 'title', card)
    h.style.fontSize = '30px'
    h.textContent = def.title
    const d = this.el('div', 'subtitle', card)
    d.textContent = def.desc
    const rw = this.el('div', 'money', card)
    rw.style.fontSize = '24px'
    rw.textContent = `جایزه: ${faNum(def.reward)} دلار`
    const row = this.el('div', 'mrow', card)
    const ok = this.el('button', 'btn', row) as HTMLButtonElement
    ok.textContent = 'قبول می‌کنم'
    ok.onclick = () => this.cbs.onAccept(def.id)
    const no = this.el('button', 'btn ghost', row) as HTMLButtonElement
    no.textContent = 'بی‌خیال'
    no.onclick = () => this.cbs.onDecline()
  }

  showShop(owned: boolean[], prices: { pistol: number; rifle: number; shotgun: number; smg: number }, canBuyAmmo: boolean, ammoLabel: string) {
    const o = this.overlay('shop')
    o.style.display = ''
    const card = this.el('div', 'panel card', o)
    const h = this.el('div', 'title', card)
    h.style.fontSize = '28px'
    h.textContent = 'مغازه اسلحه'
    const err = this.el('div', 'err', card)
    const list = this.el('div', '', card)
    list.style.cssText = 'text-align:right;margin:12px 0'
    const mkRow = (label: string, price: string, cb: () => string | null, disabled: boolean) => {
      const r = this.el('div', 'kv', list)
      r.innerHTML = `<b>${label}</b><span>${price}</span>`
      const b = this.el('button', 'btn small', r) as HTMLButtonElement
      b.style.marginRight = '10px'
      b.textContent = 'خرید'
      b.onclick = () => {
        const e = cb()
        if (e) err.textContent = e
        else err.textContent = ''
      }
      if (disabled) b.style.display = 'none'
    }
    if (!owned[1]) mkRow('کلت برنی', `${faNum(prices.pistol)} دلار`, () => this.cbs.onBuyWeapon(1), false)
    if (!owned[2]) mkRow('شاهین ۷۰۸ (تفنگ)', `${faNum(prices.rifle)} دلار`, () => this.cbs.onBuyWeapon(2), false)
    if (!owned[3]) mkRow('تفنگ شکاری', `${faNum(prices.shotgun)} دلار`, () => this.cbs.onBuyWeapon(3), false)
    if (!owned[4]) mkRow('مسلسل رگبار', `${faNum(prices.smg)} دلار`, () => this.cbs.onBuyWeapon(4), false)
    mkRow(ammoLabel, '', () => this.cbs.onBuyAmmo(), false)
    mkRow('بسته سلامتی (کامل)', '۳۰ دلار', () => this.cbs.onBuyHealth(), false)
    const row = this.el('div', 'mrow', card)
    const b = this.el('button', 'btn', row) as HTMLButtonElement
    b.textContent = 'خروج'
    b.onclick = () => this.cbs.onDecline()
  }

  hideOverlays() {
    this.hideAll()
  }

  showHelpFromStart() {
    this.showHelp('start')
  }

  dispose() {
    this.root.remove()
    document.querySelectorAll('style').forEach(s => {
      if (s.textContent?.includes('.lshud{')) s.remove()
    })
  }
}
