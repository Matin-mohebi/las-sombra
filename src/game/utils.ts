import * as THREE from 'three'

/* ---------- math helpers ---------- */
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const rand = (a = 1, b?: number) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a))
export const randi = (a: number, b: number) => Math.floor(rand(a, b + 1))
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
export const TAU = Math.PI * 2

export function angleDiff(a: number, b: number) {
  let d = (b - a) % TAU
  if (d > Math.PI) d -= TAU
  if (d < -Math.PI) d += TAU
  return d
}
export function lerpAngle(a: number, b: number, t: number) {
  return a + angleDiff(a, b) * clamp(t, 0, 1)
}
export function damp(a: number, b: number, lambda: number, dt: number) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

/** convert digits to persian */
export function faNum(n: number, fractionDigits = 0) {
  try {
    return n.toLocaleString('fa-IR', { maximumFractionDigits: fractionDigits })
  } catch {
    return String(Math.round(n))
  }
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx
  const dz = az - bz
  return dx * dx + dz * dz
}

/* ---------- collider ---------- */
export interface Box2 {
  x: number
  z: number
  hw: number
  hd: number
  h?: number
}

/** push a circle out of an AABB (2D). returns collision normal length applied or null */
export function circleVsBox(p: { x: number; z: number }, r: number, b: Box2): { nx: number; nz: number; depth: number } | null {
  const dx = p.x - clamp(p.x, b.x - b.hw, b.x + b.hw)
  const dz = p.z - clamp(p.z, b.z - b.hd, b.z + b.hd)
  const d2 = dx * dx + dz * dz
  if (d2 > r * r) return null
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2)
    return { nx: dx / d, nz: dz / d, depth: r - d }
  }
  // center inside box: push along smallest penetration axis
  const px = b.hw - Math.abs(p.x - b.x)
  const pz = b.hd - Math.abs(p.z - b.z)
  if (px < pz) return { nx: Math.sign(p.x - b.x) || 1, nz: 0, depth: px + r }
  return { nx: 0, nz: Math.sign(p.z - b.z) || 1, depth: pz + r }
}

/** resolve circle against all colliders (mutates p). returns hit count */
export function resolveCollisions(p: { x: number; z: number }, r: number, colliders: Box2[]): number {
  let hits = 0
  for (let i = 0; i < colliders.length; i++) {
    const b = colliders[i]
    // broad phase
    if (Math.abs(p.x - b.x) > b.hw + r + 0.2 || Math.abs(p.z - b.z) > b.hd + r + 0.2) continue
    const hit = circleVsBox(p, r, b)
    if (hit) {
      p.x += hit.nx * hit.depth
      p.z += hit.nz * hit.depth
      hits++
    }
  }
  return hits
}

/** 2D segment vs AABB (slab method). returns t in [0,1] or null */
export function segmentVsBox(ax: number, az: number, bx: number, bz: number, box: Box2): number | null {
  const dx = bx - ax
  const dz = bz - az
  let tmin = 0
  let tmax = 1
  for (let axis = 0; axis < 2; axis++) {
    const o = axis === 0 ? ax : az
    const d = axis === 0 ? dx : dz
    const lo = axis === 0 ? box.x - box.hw : box.z - box.hd
    const hi = axis === 0 ? box.x + box.hw : box.z + box.hd
    if (Math.abs(d) < 1e-8) {
      if (o < lo || o > hi) return null
    } else {
      let t1 = (lo - o) / d
      let t2 = (hi - o) / d
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t }
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) return null
    }
  }
  return tmin
}

/** nearest collider hit along segment; returns t or null */
export function segmentVsColliders(ax: number, az: number, bx: number, bz: number, colliders: Box2[]): number | null {
  let best: number | null = null
  for (const b of colliders) {
    const t = segmentVsBox(ax, az, bx, bz, b)
    if (t !== null && (best === null || t < best)) best = t
  }
  return best
}

/* ---------- canvas textures ---------- */
function mkCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, x: c.getContext('2d')! }
}

function finishTex(c: HTMLCanvasElement, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function noiseOn(x: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], sMin = 1, sMax = 4, alpha = 0.5) {
  for (let i = 0; i < n; i++) {
    x.globalAlpha = rand(0.05, alpha)
    x.fillStyle = pick(colors)
    const s = rand(sMin, sMax)
    x.fillRect(rand(0, w), rand(0, h), s, s)
  }
  x.globalAlpha = 1
}

const cache: Record<string, THREE.Texture> = {}

export function texDesert() {
  if (cache.desert) return cache.desert
  const { c, x } = mkCanvas(512, 512)
  x.fillStyle = '#c2a06b'
  x.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 60; i++) {
    x.globalAlpha = rand(0.04, 0.14)
    x.fillStyle = pick(['#b18c57', '#d0b078', '#a67f4e', '#c8a464'])
    x.beginPath()
    x.ellipse(rand(0, 512), rand(0, 512), rand(20, 90), rand(14, 60), rand(0, TAU), 0, TAU)
    x.fill()
  }
  noiseOn(x, 512, 512, 2600, ['#8a6a3e', '#e0c890', '#7a5c38'], 1, 3, 0.4)
  const t = finishTex(c, 14, 14)
  cache.desert = t
  return t
}

export function texAsphalt() {
  if (cache.asphalt) return cache.asphalt
  const { c, x } = mkCanvas(128, 128)
  x.fillStyle = '#2e2f31'
  x.fillRect(0, 0, 128, 128)
  noiseOn(x, 128, 128, 700, ['#3a3b3e', '#242527', '#43454a'], 1, 3, 0.5)
  // center dashed line along v (vertical in texture)
  x.fillStyle = '#d8c060'
  x.globalAlpha = 0.85
  x.fillRect(61, 6, 6, 52)
  x.globalAlpha = 1
  const t = finishTex(c)
  cache.asphalt = t
  return t
}

export function texConcrete() {
  if (cache.concrete) return cache.concrete
  const { c, x } = mkCanvas(256, 256)
  x.fillStyle = '#8f8a80'
  x.fillRect(0, 0, 256, 256)
  noiseOn(x, 256, 256, 1400, ['#9a958b', '#837e74', '#a09a8e'], 1, 4, 0.5)
  x.strokeStyle = 'rgba(60,58,52,0.25)'
  x.lineWidth = 2
  x.strokeRect(0, 0, 256, 256)
  const t = finishTex(c, 2, 2)
  cache.concrete = t
  return t
}

export function texSidewalk() {
  if (cache.sidewalk) return cache.sidewalk
  const { c, x } = mkCanvas(128, 128)
  x.fillStyle = '#9b968c'
  x.fillRect(0, 0, 128, 128)
  noiseOn(x, 128, 128, 500, ['#a8a398', '#8c877d'], 1, 3, 0.4)
  x.strokeStyle = 'rgba(70,68,62,0.5)'
  x.lineWidth = 2
  x.strokeRect(0, 0, 64, 64)
  x.strokeRect(64, 64, 64, 64)
  const t = finishTex(c, 4, 4)
  cache.sidewalk = t
  return t
}

export function texWood() {
  if (cache.wood) return cache.wood
  const { c, x } = mkCanvas(128, 128)
  x.fillStyle = '#b08a55'
  x.fillRect(0, 0, 128, 128)
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#a0763f' : '#bd9660'
    x.fillRect(i * 16, 0, 15, 128)
    x.fillStyle = 'rgba(70,45,20,0.5)'
    x.fillRect(i * 16, 0, 1.5, 128)
  }
  noiseOn(x, 128, 128, 400, ['#8a6238', '#caa070'], 1, 2, 0.35)
  const t = finishTex(c, 2, 2)
  cache.wood = t
  return t
}

export function texGlow() {
  if (cache.glow) return cache.glow
  const { c, x } = mkCanvas(64, 64)
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  const t = finishTex(c)
  cache.glow = t
  return t
}

export function texSmoke() {
  if (cache.smoke) return cache.smoke
  const { c, x } = mkCanvas(64, 64)
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 30)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  const t = finishTex(c)
  cache.smoke = t
  return t
}

/** gradient beam for headlight pool */
export function texBeam() {
  if (cache.beam) return cache.beam
  const { c, x } = mkCanvas(64, 128)
  const g = x.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, 'rgba(255,240,190,0.55)')
  g.addColorStop(1, 'rgba(255,240,190,0)')
  x.fillStyle = g
  x.beginPath()
  x.moveTo(26, 0)
  x.lineTo(38, 0)
  x.lineTo(62, 128)
  x.lineTo(2, 128)
  x.closePath()
  x.fill()
  const t = finishTex(c)
  cache.beam = t
  return t
}

/** sign with persian text */
export function texSign(text: string, w = 256, h = 64, bg = '#3a2c1c', fg = '#f0d8a0', font = 'bold 40px Vazirmatn, Tahoma, sans-serif') {
  const { c, x } = mkCanvas(w, h)
  x.fillStyle = bg
  x.fillRect(0, 0, w, h)
  x.strokeStyle = fg
  x.lineWidth = 4
  x.strokeRect(4, 4, w - 8, h - 8)
  x.fillStyle = fg
  x.font = font
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  x.direction = 'rtl'
  x.fillText(text, w / 2, h / 2 + 2)
  return finishTex(c)
}

/* ---------- geometry helper: box with optional vertex tint + transform ---------- */
export function boxGeo(w: number, h: number, d: number, x: number, y: number, z: number, ry = 0, tint?: THREE.Color) {
  const g = new THREE.BoxGeometry(w, h, d)
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  if (tint) {
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      col[i * 3] = tint.r
      col[i * 3 + 1] = tint.g
      col[i * 3 + 2] = tint.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }
  return g
}
