import * as THREE from 'three'
import { rand, pick, texSign } from './utils'

/* ================= humanoid ================= */
export interface HumanParts {
  group: THREE.Group
  lLeg: THREE.Group
  rLeg: THREE.Group
  lArm: THREE.Group
  rArm: THREE.Group
  head: THREE.Mesh
  gun: THREE.Mesh | null
  body: THREE.Group
}

const SKIN = ['#c89468', '#a8764e', '#8a5c3a', '#d8a878', '#6b4526']

function limb(w: number, h: number, d: number, color: string, pivotY: number): THREE.Group {
  const g = new THREE.Group()
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }))
  m.position.y = -h / 2
  m.castShadow = false
  g.add(m)
  g.position.y = pivotY
  return g
}

export interface HumanOpts {
  shirt?: string
  pants?: string
  hat?: 'cowboy' | 'cap' | 'none'
  bandana?: boolean
  scale?: number
}

export function makeHuman(opts: HumanOpts = {}): HumanParts {
  const shirt = opts.shirt ?? pick(['#7a3a2a', '#3a5a4a', '#5a4a6b', '#8a6a2a', '#4a4a52', '#6b2a2a'])
  const pants = opts.pants ?? pick(['#3a3630', '#2c2c30', '#4a3a28', '#26221e'])
  const skin = pick(SKIN)
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.3), new THREE.MeshLambertMaterial({ color: shirt }))
  torso.position.y = 1.24
  body.add(torso)
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.28), new THREE.MeshLambertMaterial({ color: pants }))
  hips.position.y = 0.88
  body.add(hips)
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.3), new THREE.MeshLambertMaterial({ color: skin }))
  head.position.y = 1.73
  body.add(head)

  if (opts.bandana) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.32), new THREE.MeshLambertMaterial({ color: '#a03028' }))
    b.position.y = 1.66
    body.add(b)
  }

  const lLeg = limb(0.2, 0.82, 0.24, pants, 0.86)
  lLeg.children[0].position.y = -0.41
  lLeg.position.y = 0.82
  const rLeg = limb(0.2, 0.82, 0.24, pants, 0.86)
  rLeg.children[0].position.y = -0.41
  rLeg.position.y = 0.82
  lLeg.position.x = -0.14
  rLeg.position.x = 0.14
  body.add(lLeg, rLeg)

  const lArm = limb(0.15, 0.58, 0.18, shirt, 1.48)
  const rArm = limb(0.15, 0.58, 0.18, shirt, 1.48)
  lArm.position.x = -0.34
  rArm.position.x = 0.34
  body.add(lArm, rArm)

  // hat
  if (opts.hat === 'cowboy' || !opts.hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.05, 10), new THREE.MeshLambertMaterial({ color: '#5a4028' }))
    brim.position.y = 1.92
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.18, 8), new THREE.MeshLambertMaterial({ color: '#5a4028' }))
    crown.position.y = 2.02
    body.add(brim, crown)
  } else if (opts.hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.32), new THREE.MeshLambertMaterial({ color: '#223a5a' }))
    cap.position.y = 1.94
    const peak = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.04, 0.16), new THREE.MeshLambertMaterial({ color: '#1a2c44' }))
    peak.position.set(0, 1.9, 0.22)
    body.add(cap, peak)
  }

  // gun in right hand
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.34), new THREE.MeshLambertMaterial({ color: '#22242a' }))
  gun.position.set(0, -0.62, 0.14)
  gun.visible = false
  rArm.add(gun)

  if (opts.scale) group.scale.setScalar(opts.scale)
  return { group, lLeg, rLeg, lArm, rArm, head, gun, body }
}

export function animateHuman(h: HumanParts, phase: number, speed: number, aiming: boolean, pitch = 0) {
  const amp = Math.min(1, speed / 6) * 0.75
  const s = Math.sin(phase)
  h.lLeg.rotation.x = s * amp
  h.rLeg.rotation.x = -s * amp
  if (aiming) {
    h.rArm.rotation.x = -Math.PI / 2 + pitch
    h.rArm.rotation.z = 0
    h.lArm.rotation.x = -Math.PI / 2 + pitch + 0.12
    h.lArm.rotation.z = -0.5
    if (h.gun) h.gun.visible = true
  } else {
    h.rArm.rotation.x = -s * amp * 0.8
    h.lArm.rotation.x = s * amp * 0.8
    h.rArm.rotation.z = 0
    h.lArm.rotation.z = 0
    if (h.gun) h.gun.visible = speed > 0.1
  }
}

/* ================= car ================= */
export interface CarParts {
  group: THREE.Group
  wheels: THREE.Mesh[]
  frontWheels: THREE.Mesh[]
  headlights: THREE.Mesh[]
  taillights: THREE.Mesh[]
  beam: THREE.Mesh | null
  lightbar?: { red: THREE.Mesh; blue: THREE.Mesh }
  driverSeat: THREE.Vector3
}

export type CarType = 'sedan' | 'sports' | 'police' | 'truck' | 'taxi' | 'van'

const CAR_COLORS = ['#8a2a2a', '#2a4a6b', '#6b6b70', '#2a2c30', '#7a6a2a', '#3a5a3a', '#7a4a2a', '#9a9a9a', '#5a3a6b']

export function makeCar(type: CarType = 'sedan', color?: string): CarParts {
  const group = new THREE.Group()
  const c = color ?? pick(CAR_COLORS)
  const bodyMat = new THREE.MeshPhongMaterial({ color: c, shininess: 90, specular: 0x555555 })
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x18222c, shininess: 120, specular: 0x88aacc })
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1b1e })
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 })
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xaa2018 })
  let lightbar: { red: THREE.Mesh; blue: THREE.Mesh } | undefined

  const dims = type === 'truck' ? { w: 2.2, l: 5.2, cab: 1.9 }
    : type === 'sports' ? { w: 1.9, l: 4.2, cab: 1.6 }
    : type === 'van' ? { w: 2.0, l: 4.8, cab: 2.6 }
    : { w: 1.9, l: 4.4, cab: 1.8 }

  const bodyH = type === 'sports' ? 0.45 : type === 'truck' ? 0.7 : 0.55
  const body = new THREE.Mesh(new THREE.BoxGeometry(dims.w, bodyH, dims.l), bodyMat)
  body.position.y = 0.42 + bodyH / 2
  group.add(body)

  // cabin
  const cabL = type === 'truck' ? dims.cab : dims.cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(dims.w * 0.88, 0.52, cabL), glassMat)
  cab.position.set(0, 0.42 + bodyH + 0.24, type === 'truck' ? 0.7 : type === 'van' ? 0.4 : -0.15)
  group.add(cab)

  if (type === 'truck') {
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(dims.w, 1.5, 2.6), new THREE.MeshLambertMaterial({ color: 0x9a9a94 }))
    cargo.position.set(0, 1.45, -1.15)
    group.add(cargo)
  }
  if (type === 'taxi') {
    bodyMat.color.set('#d8b02a')
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.3), new THREE.MeshBasicMaterial({ map: texSign('تاکسی', 128, 40, '#202020', '#ffd84a', 'bold 28px Tahoma') }))
    sign.position.set(0, 0.42 + bodyH + 0.62, cab.position.z)
    group.add(sign)
  }
  if (type === 'police') {
    bodyMat.color.set('#e8e8e8')
    // black doors band
    const band = new THREE.Mesh(new THREE.BoxGeometry(dims.w + 0.02, 0.26, 2.2), new THREE.MeshLambertMaterial({ color: 0x181c24 }))
    band.position.set(0, 0.42 + bodyH * 0.55, 0)
    group.add(band)
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0xff2222 }))
    red.position.set(-0.3, 0.42 + bodyH + 0.62, cab.position.z)
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.3), new THREE.MeshBasicMaterial({ color: 0x2255ff }))
    blue.position.set(0.3, 0.42 + bodyH + 0.62, cab.position.z)
    group.add(red, blue)
    lightbar = { red, blue }
    const side = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshBasicMaterial({ map: texSign('پلیس لاس سومبرا', 256, 48, '#181c24', '#e8e8f0', 'bold 30px Tahoma'), side: THREE.DoubleSide }))
    side.rotation.y = Math.PI / 2
    side.position.set(0, 0.42 + bodyH * 0.5, 0.3)
    group.add(side)
  }

  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12)
  wheelGeo.rotateZ(Math.PI / 2)
  const wheels: THREE.Mesh[] = []
  const frontWheels: THREE.Mesh[] = []
  const wx = dims.w / 2 - 0.05
  const wz = dims.l / 2 - 0.85
  for (const [x, z, front] of [[-wx, wz, true], [wx, wz, true], [-wx, -wz, false], [wx, -wz, false]] as const) {
    const w = new THREE.Mesh(wheelGeo, darkMat)
    w.position.set(x, 0.34, z)
    group.add(w)
    wheels.push(w)
    if (front) frontWheels.push(w)
  }

  // lights
  const headlights: THREE.Mesh[] = []
  const taillights: THREE.Mesh[] = []
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.06), lightMat)
    hl.position.set(s * (dims.w / 2 - 0.35), 0.42 + bodyH * 0.6, dims.l / 2 + 0.01)
    group.add(hl)
    headlights.push(hl)
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.06), tailMat)
    tl.position.set(s * (dims.w / 2 - 0.35), 0.42 + bodyH * 0.6, -dims.l / 2 - 0.01)
    group.add(tl)
    taillights.push(tl)
  }

  // headlight beam quad
  const beam = makeBeamMesh()
  group.add(beam)

  return { group, wheels, frontWheels, headlights, taillights, beam, lightbar, driverSeat: new THREE.Vector3(0.42, 0.95, 0.15) }
}

let beamTexCache: THREE.Texture | null = null
function beamTexture() {
  if (beamTexCache) return beamTexCache
  const c = document.createElement('canvas')
  c.width = 64; c.height = 128
  const x = c.getContext('2d')!
  const g = x.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, 'rgba(255,240,190,0.5)')
  g.addColorStop(1, 'rgba(255,240,190,0)')
  x.fillStyle = g
  x.beginPath()
  x.moveTo(24, 0); x.lineTo(40, 0); x.lineTo(64, 128); x.lineTo(0, 128)
  x.closePath(); x.fill()
  const t = new THREE.CanvasTexture(c)
  beamTexCache = t
  return t
}
function makeBeamMesh() {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 9),
    new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  m.rotation.x = -Math.PI / 2
  m.position.set(0, 0.12, 4.5 + 4.5)
  return m
}

/* ================= horse ================= */
export interface HorseParts {
  group: THREE.Group
  legs: THREE.Group[]
  head: THREE.Group
  tail: THREE.Mesh
  seat: THREE.Vector3
}

export function makeHorse(color?: string): HorseParts {
  const c = color ?? pick(['#6b4526', '#3a2c1c', '#8a6a4a', '#d8d0c0', '#4a3a2a'])
  const group = new THREE.Group()
  const mat = new THREE.MeshLambertMaterial({ color: c })
  const dark = new THREE.MeshLambertMaterial({ color: '#221a10' })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.78, 1.85), mat)
  body.position.y = 1.28
  group.add(body)
  const rump = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.6, 0.5), mat)
  rump.position.set(0, 1.32, -0.95)
  group.add(rump)

  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.85, 0.4), mat)
  neck.position.set(0, 1.75, 0.78)
  neck.rotation.x = 0.5
  group.add(neck)
  const head = new THREE.Group()
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.62), mat)
  skull.position.set(0, 0.1, 0.1)
  head.add(skull)
  const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.05), dark)
  ear1.position.set(-0.09, 0.32, -0.08)
  const ear2 = ear1.clone(); ear2.position.x = 0.09
  head.add(ear1, ear2)
  head.position.set(0, 2.12, 1.12)
  head.rotation.x = 0.35
  group.add(head)

  // mane
  const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.16), dark)
  mane.position.set(0, 1.95, 0.62)
  mane.rotation.x = 0.45
  group.add(mane)
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.2), dark)
  tail.position.set(0, 1.15, -1.18)
  tail.rotation.x = 0.35
  group.add(tail)

  const legs: THREE.Group[] = []
  const legGeo = new THREE.BoxGeometry(0.16, 1.0, 0.18)
  for (const [x, z] of [[-0.26, 0.68], [0.26, 0.68], [-0.26, -0.72], [0.26, -0.72]] as const) {
    const g = new THREE.Group()
    const m = new THREE.Mesh(legGeo, mat)
    m.position.y = -0.5
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), dark)
    hoof.position.y = -1.0
    g.add(m, hoof)
    g.position.set(x, 1.05, z)
    group.add(g)
    legs.push(g)
  }

  return { group, legs, head, tail, seat: new THREE.Vector3(0, 1.68, -0.15) }
}

export function animateHorse(h: HorseParts, phase: number, speed: number) {
  const amp = Math.min(1, speed / 14) * 0.9
  const s = Math.sin(phase), s2 = Math.sin(phase + Math.PI)
  const s3 = Math.sin(phase + Math.PI * 0.5), s4 = Math.sin(phase + Math.PI * 1.5)
  h.legs[0].rotation.x = s * amp
  h.legs[1].rotation.x = s3 * amp * 0.8
  h.legs[2].rotation.x = s2 * amp
  h.legs[3].rotation.x = s4 * amp * 0.8
  h.group.position.y = Math.abs(Math.sin(phase)) * amp * 0.14
  h.head.rotation.x = 0.35 + Math.sin(phase) * 0.06
  h.tail.rotation.x = 0.35 + Math.sin(phase * 0.5) * 0.2
}

/* ================= misc props ================= */
export function makePickupMesh(kind: 'cash' | 'ammo' | 'health'): THREE.Group {
  const g = new THREE.Group()
  if (kind === 'cash') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), new THREE.MeshLambertMaterial({ color: '#3f7a44' }))
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.1, 0.32), new THREE.MeshLambertMaterial({ color: '#d8c88a' }))
    b.position.y = 0.02
    g.add(m, b)
  } else if (kind === 'ammo') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), new THREE.MeshLambertMaterial({ color: '#6b5a2a' }))
    g.add(m)
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.44), new THREE.MeshLambertMaterial({ color: '#4a3e1c' }))
    lid.position.y = 0.2
    g.add(lid)
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshLambertMaterial({ color: '#e8e8e8' }))
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: '#c02828' }))
    c1.position.z = 0.23
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.3, 0.09), new THREE.MeshBasicMaterial({ color: '#c02828' }))
    c2.position.z = 0.23
    g.add(m, c1, c2)
  }
  return g
}

export function makeBeacon(color: number, radius = 1.4, height = 50): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 12, 1, true)
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.28, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const m = new THREE.Mesh(geo, mat)
  m.position.y = height / 2
  return m
}
