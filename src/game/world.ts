import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  Box2, rand, randi, pick, boxGeo, texDesert, texAsphalt, texSidewalk, texConcrete, texWood,
  texGlow, texSign, texSmoke, clamp,
} from './utils'

export interface GraphNode { x: number; z: number }
export interface MiniRect { x: number; z: number; hw: number; hd: number; t: string }
export interface MiniRoad { x: number; z: number; len: number; vert: boolean }

const V_ROADS = [-240, -120, 0, 120, 240]
const H_ROADS = [-840, -660, -480, -300]
const ROAD_W = 14
const COLS = [
  { x: -270, hw: 23 }, { x: -180, hw: 53 }, { x: -60, hw: 53 },
  { x: 60, hw: 53 }, { x: 180, hw: 53 }, { x: 270, hw: 23 },
]
const ROWS = [
  { z: -870, hd: 23 }, { z: -750, hd: 83 }, { z: -570, hd: 83 }, { z: -390, hd: 83 },
]

export const TOWN = { x0: -220, x1: 220, z0: 500, z1: 700, streetZ: 600 }
export const WORLD_HALF = 1600

export interface Camp { x: number; z: number; spawns: { x: number; z: number }[] }

export class World {
  group = new THREE.Group()
  colliders: Box2[] = []
  graph: { nodes: GraphNode[]; adj: number[][] } = { nodes: [], adj: [] }
  lamps: THREE.Vector3[] = []
  firePoints: THREE.Vector3[] = []
  camps: Camp[] = []
  minimap = { roads: [] as MiniRoad[], rects: [] as MiniRect[], camps: [] as { x: number; z: number }[] }
  parkedSpots: { x: number; z: number; h: number; police?: boolean }[] = []
  horseSpots: { x: number; z: number }[] = []
  spots = {
    start: { x: 4, z: 505 },
    starterHorse: { x: 16, z: 512 },
    starterCar: { x: -100, z: 596.5, h: Math.PI / 2 },
    extraCar: { x: 9, z: 190, h: 0 },
    hospital: { x: -60, z: -372 },
    gunShops: [{ x: 30, z: 612 }, { x: 60, z: -372 }],
    givers: {
      delivery: { x: 165, z: -712 },
      bounty: { x: -40, z: 592 },
      race: { x: 60, z: -748 },
      duel: { x: -5, z: 596 },
      escape: { x: -95, z: -568 },
      farmraid: { x: 584, z: -474 },
      convoy: { x: 616, z: -524 },
      treasure: { x: -118, z: 612 },
    },
    farm: { x: 600, z: -500 },
    cityDepot: { x: -180, z: -460 },
    treasureSpot: { x: 462, z: 342 },
    gasStations: [{ x: 22, z: -60 }, { x: -22, z: 380 }],
    farmRaiders: [
      { x: 588, z: -512 }, { x: 612, z: -530 }, { x: 632, z: -494 },
      { x: 574, z: -486 }, { x: 604, z: -476 }, { x: 640, z: -520 },
    ],
    deliveryDrop: { x: -8, z: 590 },
    bountyCamp: 1,
    raceCp: [
      { x: -180, z: -840 }, { x: 60, z: -840 }, { x: 240, z: -660 }, { x: 180, z: -480 },
      { x: 0, z: -390 }, { x: -180, z: -480 }, { x: -240, z: -660 }, { x: -120, z: -840 },
    ],
    duelSpot: { x: 60, z: 725 },
  }
  // animated materials
  lampHeadMat!: THREE.MeshLambertMaterial
  windowMat!: THREE.MeshBasicMaterial
  lampGlowMat!: THREE.PointsMaterial
  poolMat!: THREE.MeshBasicMaterial
  fireLights: THREE.PointLight[] = []
  private fireFlick: number[] = []

  radioBeacon!: THREE.Sprite
  private blink = 0

  constructor(private quality: 'low' | 'med' | 'high') {
    this.buildGround()
    this.buildRoads()
    this.buildCity()
    this.buildTown()
    this.buildDesert()
    this.buildGasStations()
    this.buildFarm()
    this.buildLake()
    this.buildRadioTower()
    this.buildGraph()
  }

  /** merge geometries with normalized attributes (index + color) */
  private mergeAll(geos: THREE.BufferGeometry[], defaultColor = '#ffffff'): THREE.BufferGeometry {
    const out = geos.map(g => {
      const gg = g.index ? g.toNonIndexed() : g
      if (!gg.attributes.color) {
        const n = gg.attributes.position.count
        const c = new THREE.Color(defaultColor)
        const col = new Float32Array(n * 3)
        for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
        gg.setAttribute('color', new THREE.BufferAttribute(col, 3))
      }
      return gg
    })
    return mergeGeometries(out, false)!
  }

  private inCity(x: number, z: number, m = 0) {
    return x > -300 - m && x < 300 + m && z > -900 - m && z < -300 + m
  }
  private inTown(x: number, z: number, m = 0) {
    return x > TOWN.x0 - m && x < TOWN.x1 + m && z > TOWN.z0 - m && z < TOWN.z1 + m
  }
  private nearRoad(x: number, z: number, m = 12) {
    if (Math.abs(x) < m && z > -900 && z < 620) return true // highway
    if (Math.abs(z - TOWN.streetZ) < m && x > TOWN.x0 && x < TOWN.x1) return true
    return false
  }

  /* ================= ground ================= */
  private buildGround() {
    const g = new THREE.PlaneGeometry(WORLD_HALF * 2 + 400, WORLD_HALF * 2 + 400)
    g.rotateX(-Math.PI / 2)
    const m = new THREE.MeshLambertMaterial({ map: texDesert() })
    const mesh = new THREE.Mesh(g, m)
    mesh.receiveShadow = this.quality !== 'low'
    this.group.add(mesh)
  }

  /* ================= roads ================= */
  private roadGeo(x: number, z: number, len: number, vert: boolean, w = ROAD_W) {
    const g = new THREE.PlaneGeometry(w, len)
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * (len / 16))
    g.rotateX(-Math.PI / 2)
    if (!vert) g.rotateY(Math.PI / 2)
    g.translate(x, 0.06, z)
    return g
  }

  private buildRoads() {
    const geos: THREE.BufferGeometry[] = []
    const addMini = (x: number, z: number, len: number, vert: boolean) =>
      this.minimap.roads.push({ x, z, len, vert })
    // city vertical roads (extend to city border)
    for (const rx of V_ROADS) {
      geos.push(this.roadGeo(rx, -600, 600, true))
      addMini(rx, -600, 600, true)
    }
    // city horizontal roads
    for (const rz of H_ROADS) {
      geos.push(this.roadGeo(0, rz, 600, false))
      addMini(0, rz, 600, false)
    }
    // highway: city south edge to town
    geos.push(this.roadGeo(0, 150, 900, true))
    addMini(0, 150, 900, true)
    // town street
    geos.push(this.roadGeo(0, TOWN.streetZ, 440, false))
    addMini(0, TOWN.streetZ, 440, false)

    const merged = this.mergeAll(geos)
    const mat = new THREE.MeshLambertMaterial({ map: texAsphalt() })
    mat.polygonOffset = true
    mat.polygonOffsetFactor = -1
    const mesh = new THREE.Mesh(merged, mat)
    mesh.receiveShadow = this.quality !== 'low'
    this.group.add(mesh)

    // highway signs
    this.addSign(8, -268, 0, '← لاس سومبرا')
    this.addSign(8, 438, 0, '→ سنگ‌سرخ')

    // world border colliders
    const B = WORLD_HALF + 10
    this.colliders.push(
      { x: 0, z: B, hw: B + 200, hd: 12 }, { x: 0, z: -B, hw: B + 200, hd: 12 },
      { x: B, z: 0, hw: 12, hd: B + 200 }, { x: -B, z: 0, hw: 12, hd: B + 200 },
    )
  }

  private addSign(x: number, z: number, ry: number, text: string, w = 7, h = 2.2, bg = '#2a4a2c', fg = '#e8e0c0') {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, h + 1.6, 6), new THREE.MeshLambertMaterial({ color: 0x4a4a4a }))
    post.position.set(x, (h + 1.6) / 2, z)
    this.group.add(post)
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: texSign(text, 512, 128, bg, fg, 'bold 72px Vazirmatn, Tahoma'), side: THREE.DoubleSide }))
    sign.position.set(x, h + 0.6, z)
    sign.rotation.y = ry
    this.group.add(sign)
  }

  /* ================= city ================= */
  private buildingTints = ['#8d8578', '#7a6f63', '#9a8f7a', '#6f6a63', '#857066', '#5d5a55', '#7d8489', '#8a7a5f']
  private buildingDefs: { x: number; z: number; w: number; d: number; h: number }[] = []
  private windowsData: { m: THREE.Matrix4 }[] = []

  private buildCity() {
    const q = this.quality
    // base slab
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 620),
      new THREE.MeshLambertMaterial({ map: texConcrete(), color: 0x77726a }),
    )
    base.rotation.x = -Math.PI / 2
    base.position.set(0, 0.02, -600)
    base.receiveShadow = q !== 'low'
    this.group.add(base)

    const bGeos: THREE.BufferGeometry[] = []
    const special = new Map<string, string>() // "col,row" -> type
    special.set('1,2', 'park')
    special.set('3,1', 'parking')
    special.set('4,2', 'parking')
    special.set('2,3', 'police')

    for (let ci = 0; ci < COLS.length; ci++) {
      for (let ri = 0; ri < ROWS.length; ri++) {
        const col = COLS[ci]
        const row = ROWS[ri]
        const key = `${ci},${ri}`
        const type = special.get(key)
        const uw = col.hw * 2 - 8
        const ud = row.hd * 2 - 8
        // sidewalk slab
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(uw + 10, ud + 10), new THREE.MeshLambertMaterial({ map: texSidewalk() }))
        sw.rotation.x = -Math.PI / 2
        sw.position.set(col.x, 0.04, row.z)
        sw.receiveShadow = q !== 'low'
        this.group.add(sw)

        if (type === 'park') { this.buildPark(col.x, row.z, uw, ud); continue }
        if (type === 'parking') {
          const lot = new THREE.Mesh(new THREE.PlaneGeometry(uw, ud), new THREE.MeshLambertMaterial({ color: 0x3a3b3e }))
          lot.rotation.x = -Math.PI / 2
          lot.position.set(col.x, 0.05, row.z)
          this.group.add(lot)
          for (let i = 0; i < 4; i++) {
            this.parkedSpots.push({ x: col.x - uw / 2 + 10, z: row.z - ud / 2 + 8 + i * (ud - 14) / 3, h: 0 })
            this.parkedSpots.push({ x: col.x + uw / 2 - 10, z: row.z - ud / 2 + 8 + i * (ud - 14) / 3, h: Math.PI })
          }
          if (key === '3,1') this.parkedSpots.push({ x: col.x, z: row.z, h: Math.PI / 2 })
          continue
        }

        // buildings
        const downtown = Math.abs(col.x) <= 60 && row.z === -570
        const placed: { x: number; z: number; w: number; d: number }[] = []
        const n = col.hw > 40 ? randi(4, 6) : randi(2, 3)
        for (let i = 0; i < n; i++) {
          for (let t = 0; t < 10; t++) {
            const w = rand(18, Math.min(42, uw * 0.55))
            const d = rand(16, Math.min(40, ud * 0.55))
            const x = col.x + rand(-uw / 2 + w / 2, uw / 2 - w / 2)
            const z = row.z + rand(-ud / 2 + d / 2, ud / 2 - d / 2)
            if (placed.some(p => Math.abs(p.x - x) < (p.w + w) / 2 + 4 && Math.abs(p.z - z) < (p.d + d) / 2 + 4)) continue
            placed.push({ x, z, w, d })
            const h = downtown ? rand(26, 60) : rand(9, 26)
            const tint = new THREE.Color(pick(this.buildingTints))
            bGeos.push(boxGeo(w, h, d, x, h / 2, z, 0, tint))
            this.colliders.push({ x, z, hw: w / 2, hd: d / 2, h })
            this.buildingDefs.push({ x, z, w, d, h })
            this.addWindows(x, z, w, d, h)
            if (type === 'police' && placed.length === 1) {
              this.addSign(x, z + d / 2 + 0.3, 0, 'کلانتری — پلیس لاس سومبرا', 10, 1.6)
            }
            if (key === '3,2' && placed.length === 1) this.addSign(x, z + d / 2 + 0.3, 0, 'درمانگاه', 8, 1.6)
            if (key === '4,0' && placed.length === 1) this.addSign(x, z + d / 2 + 0.3, 0, 'اداره پست', 8, 1.6)
            if (key === '2,3' && placed.length === 2) this.addSign(x, z + d / 2 + 0.3, 0, 'مغازه اسلحه قبیله', 9, 1.6)
            break
          }
        }
      }
    }

    // merge buildings
    const bMat = new THREE.MeshLambertMaterial({ map: texConcrete(), vertexColors: true })
    const bMesh = new THREE.Mesh(this.mergeAll(bGeos), bMat)
    bMesh.castShadow = q === 'high'
    bMesh.receiveShadow = q !== 'low'
    this.group.add(bMesh)
    this.minimap.rects.push(...this.buildingDefs.map(b => ({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, t: 'b' })))

    this.buildWindows()
    this.buildLamps()
  }

  private addWindows(x: number, z: number, w: number, d: number, h: number) {
    const floors = Math.floor((h - 4) / 3.1)
    if (floors < 1) return
    const faces = [
      { ry: 0, len: w }, { ry: Math.PI, len: w }, { ry: Math.PI / 2, len: d }, { ry: -Math.PI / 2, len: d },
    ]
    for (const f of faces) {
      const cols = Math.floor((f.len - 3) / 2.9)
      for (let fl = 0; fl < floors; fl++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() < 0.18) continue
          const y = 2.4 + fl * 3.1
          const off = -f.len / 2 + 2.2 + c * 2.9
          const m = new THREE.Matrix4()
          const pos = f.ry === 0 ? new THREE.Vector3(x + off, y, z + d / 2 + 0.07)
            : f.ry === Math.PI ? new THREE.Vector3(x + off, y, z - d / 2 - 0.07)
            : f.ry === Math.PI / 2 ? new THREE.Vector3(x + w / 2 + 0.07, y, z + off)
            : new THREE.Vector3(x - w / 2 - 0.07, y, z + off)
          m.compose(pos, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, f.ry, 0)), new THREE.Vector3(1, 1, 1))
          this.windowsData.push({ m })
        }
      }
    }
  }

  private buildWindows() {
    const n = Math.min(this.windowsData.length, 2400)
    const geo = new THREE.PlaneGeometry(1.5, 1.9)
    this.windowMat = new THREE.MeshBasicMaterial({ color: 0x1c222b })
    const inst = new THREE.InstancedMesh(geo, this.windowMat, n)
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      inst.setMatrixAt(i, this.windowsData[i].m)
      const v = rand(0.75, 1.1)
      inst.setColorAt(i, c.setRGB(v, v * rand(0.85, 1), v * rand(0.7, 0.95)))
    }
    inst.instanceMatrix.needsUpdate = true
    this.group.add(inst)
  }

  private buildPark(cx: number, cz: number, uw: number, ud: number) {
    // plaza with trees + fountain
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(uw, ud), new THREE.MeshLambertMaterial({ color: 0x6f7a58, map: texConcrete() }))
    slab.rotation.x = -Math.PI / 2
    slab.position.set(cx, 0.05, cz)
    this.group.add(slab)
    const geos: THREE.BufferGeometry[] = []
    // fountain
    geos.push(new THREE.CylinderGeometry(3.2, 3.6, 1, 12).translate(cx, 0.5, cz))
    geos.push(new THREE.CylinderGeometry(0.5, 0.7, 2.4, 8).translate(cx, 1.7, cz))
    this.colliders.push({ x: cx, z: cz, hw: 3.4, hd: 3.4, h: 1 })
    // trees
    const treeTrunk = new THREE.CylinderGeometry(0.22, 0.3, 3, 6)
    const treeTop = new THREE.IcosahedronGeometry(1.9, 0)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rand(0, 0.5)
      const r = Math.min(uw, ud) / 2 - 6
      const tx = cx + Math.cos(a) * r
      const tz = cz + Math.sin(a) * r
      geos.push(treeTrunk.clone().translate(tx, 1.5, tz))
      const top = treeTop.clone().translate(tx, 4, tz)
      this.tintGeo(top, new THREE.Color('#4d6b35').offsetHSL(0, 0, rand(-0.05, 0.06)))
      geos.push(top)
      this.colliders.push({ x: tx, z: tz, hw: 0.5, hd: 0.5, h: 3 })
    }
    const merged = this.mergeAll(geos, '#5a4632')
    const m = new THREE.MeshLambertMaterial({ vertexColors: true })
    this.group.add(new THREE.Mesh(merged, m))
  }

  private tintGeo(g: THREE.BufferGeometry, c: THREE.Color) {
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  }

  /* ================= street lamps ================= */
  private buildLamps() {
    const lampPts: { x: number; z: number; ry: number }[] = []
    for (const rx of V_ROADS) {
      for (let z = -860; z <= -340; z += 105) {
        if (H_ROADS.some(h => Math.abs(h - z) < 12)) continue
        const side = (Math.round(z / 105) % 2 === 0) ? 1 : -1
        lampPts.push({ x: rx + side * 8.6, z, ry: side > 0 ? Math.PI : 0 })
      }
    }
    for (const rz of H_ROADS) {
      for (let x = -260; x <= 260; x += 104) {
        if (V_ROADS.some(v => Math.abs(v - x) < 12)) continue
        const side = (Math.round(x / 104) % 2 === 0) ? 1 : -1
        lampPts.push({ x, z: rz + side * 8.6, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2 })
      }
    }
    // highway lamps
    for (let z = -240; z <= 560; z += 100) {
      const side = (Math.round(z / 100) % 2 === 0) ? 1 : -1
      lampPts.push({ x: side * 8.6, z, ry: side > 0 ? Math.PI : 0 })
    }
    // town lamps
    for (let x = -180; x <= 180; x += 72) {
      lampPts.push({ x, z: TOWN.streetZ + (x % 144 === 0 ? 9 : -9), ry: x % 144 === 0 ? Math.PI : 0 })
    }

    const poleGeos: THREE.BufferGeometry[] = []
    const headGeos: THREE.BufferGeometry[] = []
    for (const p of lampPts) {
      poleGeos.push(new THREE.CylinderGeometry(0.09, 0.13, 7, 6).translate(p.x, 3.5, p.z))
      const armLen = 1.7
      // arm points toward road center (opposite of side offset)
      const dx = Math.sin(p.ry + Math.PI)
      const dz = Math.cos(p.ry + Math.PI)
      const hx = p.x + dx * armLen
      const hz = p.z + dz * armLen
      poleGeos.push(
        new THREE.BoxGeometry(0.1, 0.1, armLen)
          .rotateY(Math.atan2(dx, dz))
          .translate(p.x + dx * armLen / 2, 6.9, p.z + dz * armLen / 2),
      )
      headGeos.push(new THREE.BoxGeometry(0.55, 0.22, 0.9).rotateY(Math.atan2(dx, dz) + Math.PI / 2).translate(hx, 6.8, hz))
      this.lamps.push(new THREE.Vector3(hx, 6.6, hz))
    }
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x2c2e33 })
    this.group.add(new THREE.Mesh(this.mergeAll(poleGeos.filter(Boolean)), poleMat))
    this.lampHeadMat = new THREE.MeshLambertMaterial({ color: 0x554d3a, emissive: 0xffd88a, emissiveIntensity: 0 })
    this.group.add(new THREE.Mesh(this.mergeAll(headGeos), this.lampHeadMat))

    // glow points
    const gGeo = new THREE.BufferGeometry()
    gGeo.setAttribute('position', new THREE.Float32BufferAttribute(this.lamps.flatMap(v => [v.x, v.y, v.z]), 3))
    this.lampGlowMat = new THREE.PointsMaterial({
      map: texGlow(), color: 0xffd88a, size: 5, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })
    this.group.add(new THREE.Points(gGeo, this.lampGlowMat))

    // light pools on ground
    const poolGeo = new THREE.PlaneGeometry(11, 11)
    poolGeo.rotateX(-Math.PI / 2)
    const poolInst = new THREE.InstancedMesh(poolGeo, this.poolMat = new THREE.MeshBasicMaterial({
      map: texGlow(), color: 0x5a4a28, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }), this.lamps.length)
    const mm = new THREE.Matrix4()
    this.lamps.forEach((v, i) => { mm.makeTranslation(v.x, 0.08, v.z); poolInst.setMatrixAt(i, mm) })
    this.group.add(poolInst)
  }

  /* ================= western town ================= */
  private buildTown() {
    const q = this.quality
    // dirt slab
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(480, 260), new THREE.MeshLambertMaterial({ color: 0xa8835a, map: texDesert() }))
    slab.rotation.x = -Math.PI / 2
    slab.position.set(0, 0.02, 600)
    slab.receiveShadow = q !== 'low'
    this.group.add(slab)

    const wGeos: THREE.BufferGeometry[] = [] // wood colored
    const aGeos: THREE.BufferGeometry[] = [] // adobe/plaster
    const addBuilding = (x: number, z: number, w: number, d: number, h: number, wood = true, tint = '#936b3e') => {
      const g = boxGeo(w, h, d, x, h / 2, z, 0, new THREE.Color(tint))
      ;(wood ? wGeos : aGeos).push(g)
      this.colliders.push({ x, z, hw: w / 2, hd: d / 2, h })
      this.minimap.rects.push({ x, z, hw: w / 2, hd: d / 2, t: 'b' })
    }
    // flat roof lip
    const roofG = boxGeo(0, 0, 0, 0, 0, 0)

    // north row (front faces street at z=600)
    addBuilding(-5, 572, 46, 26, 9, true, '#c09058')         // saloon
    addBuilding(55, 574, 40, 22, 8, true, '#b0824c')         // hotel
    addBuilding(100, 576, 30, 18, 5.5, true, '#a87c4c')
    addBuilding(-110, 576, 30, 18, 5.5, true, '#a87c4c')
    addBuilding(-65, 574, 40, 22, 6, true, '#b8885a')        // general store
    // south row
    addBuilding(-40, 627, 40, 24, 7, true, '#8a94a4')        // sheriff
    addBuilding(30, 625, 30, 20, 6, true, '#b8884c')         // gunsmith
    addBuilding(145, 627, 30, 18, 5.5, true, '#a87c4c')
    // church (adobe)
    addBuilding(-130, 629, 34, 26, 9, false, '#9a7a50')
    aGeos.push(boxGeo(4, 14, 4, -130, 7, 619, 0, new THREE.Color('#9a7a50')))
    aGeos.push(boxGeo(1, 3.4, 0.6, -130, 15.5, 619, 0, new THREE.Color('#d8c8a0')))
    aGeos.push(boxGeo(2.6, 1, 0.6, -130, 14.4, 619, 0, new THREE.Color('#d8c8a0')))
    this.colliders.push({ x: -130, z: 619, hw: 2.2, hd: 2.2, h: 14 })
    // stable (open front): back + sides
    wGeos.push(boxGeo(50, 6, 1, 95, 3, 638, 0, new THREE.Color('#96703e')))
    wGeos.push(boxGeo(1, 6, 24, 71, 3, 626.5, 0, new THREE.Color('#96703e')))
    wGeos.push(boxGeo(1, 6, 24, 119, 3, 626.5, 0, new THREE.Color('#96703e')))
    wGeos.push(boxGeo(52, 0.8, 26, 95, 6.2, 626, 0, new THREE.Color('#6b4a28')))
    this.colliders.push({ x: 95, z: 638, hw: 25, hd: 0.6, h: 6 })
    this.colliders.push({ x: 71, z: 626.5, hw: 0.6, hd: 12, h: 6 })
    this.colliders.push({ x: 119, z: 626.5, hw: 0.6, hd: 12, h: 6 })
    this.minimap.rects.push({ x: 95, z: 627, hw: 25, hd: 12, t: 'b' })

    void roofG
    const wMat = new THREE.MeshLambertMaterial({ map: texWood(), vertexColors: true })
    const wMesh = new THREE.Mesh(this.mergeAll(wGeos), wMat)
    wMesh.castShadow = q === 'high'
    wMesh.receiveShadow = q !== 'low'
    this.group.add(wMesh)
    const aMat = new THREE.MeshLambertMaterial({ map: texConcrete(), vertexColors: true })
    this.group.add(new THREE.Mesh(this.mergeAll(aGeos), aMat))

    // signs
    this.addSign(-5, 586.2, 0, 'سالون سنگ‌سرخ', 12, 2.4, '#4a2418', '#ffd88a')
    this.addSign(55, 586.2, 0, 'هتل')
    this.addSign(-65, 586.2, 0, 'بازار عمومی', 9, 1.8)
    this.addSign(-40, 614, Math.PI, 'کلانتری', 9, 1.8, '#2c3444', '#d8e0f0')
    this.addSign(30, 614.2, Math.PI, 'مغازه اسلحه', 9, 1.8, '#33241a', '#e8c880')
    this.addSign(95, 613.5, Math.PI, 'اصطبل', 8, 1.6)
    this.addSign(-130, 615.5, Math.PI, 'کلیسا', 7, 1.5, '#4a3c28', '#f0e8d0')

    // boardwalks
    const bw1 = new THREE.Mesh(new THREE.PlaneGeometry(250, 8), new THREE.MeshLambertMaterial({ map: texWood(), color: 0xb09068 }))
    bw1.rotation.x = -Math.PI / 2
    bw1.position.set(-2, 0.07, 589)
    this.group.add(bw1)
    const bw2 = bw1.clone()
    bw2.position.set(-2, 0.07, 611)
    this.group.add(bw2)

    // props: barrels, crates, hitching posts, wagon
    const pGeos: THREE.BufferGeometry[] = []
    for (let i = 0; i < 8; i++) {
      const bx = rand(-30, 70), bz = pick([589, 611])
      pGeos.push(new THREE.CylinderGeometry(0.42, 0.42, 1, 8).translate(bx, 0.5, bz))
    }
    // barrel tint ring is applied by wrapping cylinders below via unified default tint
    const barrelStart = pGeos.length - 8
    for (let i = 0; i < 6; i++) {
      const bx = rand(-120, 120), bz = pick([588, 612])
      pGeos.push(boxGeo(1.1, 1.1, 1.1, bx, 0.55, bz, rand(0, 1), new THREE.Color('#8a6a3c')))
    }
    // hitching rails
    for (const hx of [-20, 40, -75]) {
      pGeos.push(boxGeo(0.14, 1.1, 0.14, hx - 2.4, 0.55, 596, 0, new THREE.Color('#4a3520')))
      pGeos.push(boxGeo(0.14, 1.1, 0.14, hx + 2.4, 0.55, 596, 0, new THREE.Color('#4a3520')))
      pGeos.push(boxGeo(5.2, 0.12, 0.12, hx, 1.05, 596, 0, new THREE.Color('#4a3520')))
    }
    // wagon
    pGeos.push(boxGeo(2.6, 1, 4.4, -85, 1.2, 604, 0.3, new THREE.Color('#6b4a28')))
    for (const [wx, wz] of [[-86.4, 602.4], [-83.6, 602.4], [-86.4, 605.6], [-83.6, 605.6]] as const) {
      pGeos.push(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 10).rotateZ(Math.PI / 2).translate(wx, 0.55, wz))
    }
    this.colliders.push({ x: -85, z: 604, hw: 1.8, hd: 2.4, h: 2 })
    // water tower
    for (const [lx, lz] of [[166, 650], [174, 650], [166, 658], [174, 658]] as const) {
      pGeos.push(new THREE.CylinderGeometry(0.22, 0.28, 9, 6).translate(lx, 4.5, lz))
    }
    pGeos.push(new THREE.CylinderGeometry(3.4, 3.1, 4.4, 10).translate(170, 11, 654))
    pGeos.push(new THREE.ConeGeometry(3.7, 1.8, 10).translate(170, 14.1, 654))
    // tint the un-tinted cylinders (barrels + tower) so they are not white
    for (let i = barrelStart; i < pGeos.length; i++) {
      if (!pGeos[i].attributes.color) {
        const isTower = i >= pGeos.length - 6
        this.tintGeo(pGeos[i], new THREE.Color(isTower ? '#8a6a4a' : '#7a4526'))
      }
    }
    this.colliders.push({ x: 170, z: 654, hw: 3.4, hd: 3.4, h: 9 })
    this.minimap.rects.push({ x: 170, z: 654, hw: 3.4, hd: 3.4, t: 'w' })

    const pMesh = new THREE.Mesh(this.mergeAll(pGeos), new THREE.MeshLambertMaterial({ vertexColors: true }))
    pMesh.castShadow = q === 'high'
    this.group.add(pMesh)

    this.horseSpots.push({ x: 95, z: 610 }, { x: 110, z: 610 })
  }

  /* ================= desert ================= */
  private buildDesert() {
    const q = this.quality
    const nMul = q === 'low' ? 0.5 : q === 'med' ? 0.75 : 1

    /* rocks (instanced) */
    const rockGeo = new THREE.IcosahedronGeometry(1, 0)
    const rockMat = new THREE.MeshLambertMaterial({ vertexColors: true })
    const bigN = Math.floor(70 * nMul), smallN = Math.floor(170 * nMul)
    const rocks = new THREE.InstancedMesh(rockGeo, rockMat, bigN + smallN)
    const m4 = new THREE.Matrix4()
    const col = new THREE.Color()
    let placed = 0
    const scatter = (count: number, big: boolean) => {
      for (let i = 0; i < count; i++) {
        let x = 0, z = 0, ok = false
        for (let t = 0; t < 20 && !ok; t++) {
          x = rand(-WORLD_HALF, WORLD_HALF); z = rand(-WORLD_HALF, WORLD_HALF)
          ok = !this.inCity(x, z, 30) && !this.inTown(x, z, 30) && !this.nearRoad(x, z, 14)
        }
        if (!ok) continue
        const s = big ? rand(1.6, 4.2) : rand(0.4, 1.3)
        m4.compose(
          new THREE.Vector3(x, s * 0.35, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0, 3), rand(0, 6), rand(0, 3))),
          new THREE.Vector3(s * rand(1, 1.6), s, s * rand(1, 1.6)),
        )
        rocks.setMatrixAt(placed, m4)
        rocks.setColorAt(placed, col.setHSL(0.08, rand(0.15, 0.3), rand(0.32, 0.5)))
        if (big) this.colliders.push({ x, z, hw: s * 1.1, hd: s * 1.1, h: s })
        if (big) this.minimap.rects.push({ x, z, hw: s, hd: s, t: 'r' })
        placed++
      }
    }
    scatter(bigN, true)
    scatter(smallN, false)
    rocks.count = placed
    rocks.castShadow = q === 'high'
    rocks.receiveShadow = q !== 'low'
    this.group.add(rocks)

    /* cacti */
    const cacGeos: THREE.BufferGeometry[] = []
    cacGeos.push(new THREE.CylinderGeometry(0.26, 0.34, 2.8, 7).translate(0, 1.4, 0))
    cacGeos.push(new THREE.CylinderGeometry(0.15, 0.18, 1.1, 6).rotateZ(Math.PI / 2).translate(0.55, 1.5, 0))
    cacGeos.push(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6).translate(1.0, 2.1, 0))
    cacGeos.push(new THREE.CylinderGeometry(0.14, 0.17, 0.9, 6).rotateZ(-Math.PI / 2).translate(-0.5, 1.1, 0))
    cacGeos.push(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 6).translate(-0.9, 1.65, 0))
    const cacGeo = this.mergeAll(cacGeos)
    this.tintGeo(cacGeo, new THREE.Color('#ffffff')) // tint via instance color
    const cacti = new THREE.InstancedMesh(cacGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.floor(260 * nMul))
    let cp = 0
    for (let i = 0; i < cacti.count; i++) {
      let x = 0, z = 0, ok = false
      for (let t = 0; t < 15 && !ok; t++) {
        x = rand(-WORLD_HALF, WORLD_HALF); z = rand(-WORLD_HALF, WORLD_HALF)
        ok = !this.inCity(x, z, 20) && !this.inTown(x, z, 25) && !this.nearRoad(x, z, 11)
      }
      if (!ok) continue
      const s = rand(0.7, 1.5)
      m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(0, 6), 0)), new THREE.Vector3(s, s * rand(0.85, 1.25), s))
      cacti.setMatrixAt(cp, m4)
      cacti.setColorAt(cp, col.setHSL(0.29, rand(0.3, 0.45), rand(0.22, 0.34)))
      cp++
    }
    cacti.count = cp
    cacti.castShadow = q === 'high'
    this.group.add(cacti)

    /* bushes */
    const bushGeo = new THREE.IcosahedronGeometry(0.55, 0)
    bushGeo.scale(1.3, 0.7, 1.3)
    const bushes = new THREE.InstancedMesh(bushGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.floor(360 * nMul))
    let bp = 0
    for (let i = 0; i < bushes.count; i++) {
      let x = 0, z = 0, ok = false
      for (let t = 0; t < 10 && !ok; t++) {
        x = rand(-WORLD_HALF, WORLD_HALF); z = rand(-WORLD_HALF, WORLD_HALF)
        ok = !this.inCity(x, z, 10) && !this.inTown(x, z, 15) && !this.nearRoad(x, z, 9)
      }
      if (!ok) continue
      const s = rand(0.6, 1.6)
      m4.compose(new THREE.Vector3(x, 0.25 * s, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(0, 6), 0)), new THREE.Vector3(s, s, s))
      bushes.setMatrixAt(bp, m4)
      bushes.setColorAt(bp, col.setHSL(rand(0.12, 0.2), rand(0.25, 0.4), rand(0.22, 0.32)))
      bp++
    }
    bushes.count = bp
    this.group.add(bushes)

    /* skyline mesas */
    const mesaGeos: THREE.BufferGeometry[] = []
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2)
      const r = rand(980, 1540)
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      const w = rand(70, 200), h = rand(30, 95), d = rand(70, 200)
      mesaGeos.push(boxGeo(w, h, d, x, h / 2 - 4, z, rand(0, 3), new THREE.Color('#8a6a4a').offsetHSL(0, 0, rand(-0.06, 0.06))))
      if (i % 3 === 0) this.minimap.rects.push({ x, z, hw: w / 2, hd: d / 2, t: 'r' })
    }
    this.group.add(new THREE.Mesh(this.mergeAll(mesaGeos), new THREE.MeshLambertMaterial({ vertexColors: true })))

    /* bandit camps */
    const campDefs: { x: number; z: number }[] = [
      { x: -700, z: 180 }, { x: 650, z: 820 }, { x: 760, z: -80 }, { x: -350, z: -1050 },
    ]
    const campGeos: THREE.BufferGeometry[] = []
    for (const cd of campDefs) {
      const spawns: { x: number; z: number }[] = []
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + rand(0, 1)
        spawns.push({ x: cd.x + Math.cos(a) * rand(6, 12), z: cd.z + Math.sin(a) * rand(6, 12) })
      }
      this.camps.push({ x: cd.x, z: cd.z, spawns })
      this.minimap.camps.push({ x: cd.x, z: cd.z })
      // tents
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2
        const tx = cd.x + Math.cos(a) * 7, tz = cd.z + Math.sin(a) * 7
        campGeos.push(new THREE.ConeGeometry(2.4, 2.8, 7).translate(tx, 1.4, tz))
        this.colliders.push({ x: tx, z: tz, hw: 1.8, hd: 1.8, h: 2.4 })
        this.minimap.rects.push({ x: tx, z: tz, hw: 2, hd: 2, t: 't' })
      }
      // campfire logs
      for (let i = 0; i < 3; i++) {
        campGeos.push(new THREE.CylinderGeometry(0.09, 0.11, 1.3, 5).rotateZ(Math.PI / 2.3).rotateY(i * 2.1).translate(cd.x, 0.25, cd.z))
      }
      // crates
      campGeos.push(boxGeo(1, 1, 1, cd.x + 2.5, 0.5, cd.z + 1.5, 0.4, new THREE.Color('#7a5a30')))
      this.firePoints.push(new THREE.Vector3(cd.x, 0.55, cd.z))
    }
    const campMesh = new THREE.Mesh(this.mergeAll(campGeos), new THREE.MeshLambertMaterial({ vertexColors: true }))
    this.group.add(campMesh)

    /* campfire lights */
    if (q !== 'low') {
      for (const fp of this.firePoints) {
        const l = new THREE.PointLight(0xff7a2a, 2.2, 26, 1.6)
        l.position.copy(fp).add(new THREE.Vector3(0, 1.2, 0))
        this.group.add(l)
        this.fireLights.push(l)
        this.fireFlick.push(rand(0, 10))
      }
    }

    /* wild horses & parked cars */
    this.horseSpots.push(this.spots.starterHorse, { x: 350, z: 260 }, { x: -480, z: -60 }, { x: 520, z: -560 }, { x: -560, z: 690 })
    this.parkedSpots.push(
      this.spots.starterCar, this.spots.extraCar,
      { x: -114, z: -700, h: Math.PI / 2 }, { x: 126, z: -520, h: -Math.PI / 2 },
      { x: -6, z: -350, h: 0 }, { x: -240 - 6, z: -800, h: Math.PI / 2 },
      { x: 186, z: -440, h: 0 }, { x: -186, z: -620, h: Math.PI },
      { x: 66, z: -800, h: 0 }, { x: -66, z: -420, h: Math.PI },
      { x: 10, z: -80, h: 0 }, { x: -34, z: 372, h: Math.PI },
      { x: 560, z: -490, h: Math.PI / 2 }, { x: -160, z: -478, h: 0 },
      { x: -640, z: 640, h: Math.PI / 2 }, { x: 420, z: 330, h: -Math.PI / 2 },
    )
    // police cars at station
    this.parkedSpots.push({ x: 60 + 14, z: -570 + 22, h: Math.PI / 2, police: true }, { x: 60 + 14, z: -570 + 32, h: Math.PI / 2, police: true })
  }

  /* ================= gas stations (repair & rest stop) ================= */
  private buildGasStations() {
    for (const gs of this.spots.gasStations) {
      const side = gs.x >= 0 ? 1 : -1
      const gGeos: THREE.BufferGeometry[] = []
      // shop building
      gGeos.push(boxGeo(12, 4.5, 8, gs.x + side * 26, 2.25, gs.z, 0, new THREE.Color('#c8c2b4')))
      this.colliders.push({ x: gs.x + side * 26, z: gs.z, hw: 6, hd: 4, h: 4.5 })
      this.minimap.rects.push({ x: gs.x + side * 26, z: gs.z, hw: 6, hd: 4, t: 'b' })
      // canopy pillars + roof
      for (const [px, pz] of [[-5, -4], [5, -4], [-5, 4], [5, 4]] as const) {
        const g = new THREE.CylinderGeometry(0.28, 0.28, 5, 8).translate(gs.x + px, 2.5, gs.z + pz)
        this.tintGeo(g, new THREE.Color('#9a9a9a'))
        gGeos.push(g)
      }
      gGeos.push(boxGeo(16, 0.7, 14, gs.x, 5.3, gs.z, 0, new THREE.Color('#b03a2a')))
      gGeos.push(boxGeo(16, 0.5, 2.2, gs.x, 4.6, gs.z + 7.6, 0, new THREE.Color('#b03a2a')))
      // pumps
      for (const px of [-2.5, 2.5]) {
        gGeos.push(boxGeo(1.1, 1.6, 0.8, gs.x + px, 0.8, gs.z, 0, new THREE.Color('#8a2f22')))
        this.colliders.push({ x: gs.x + px, z: gs.z, hw: 0.7, hd: 0.55, h: 1.6 })
      }
      const mesh = new THREE.Mesh(this.mergeAll(gGeos), new THREE.MeshLambertMaterial({ vertexColors: true }))
      mesh.castShadow = this.quality === 'high'
      this.group.add(mesh)
      this.addSign(gs.x + side * 8, gs.z + 12.5, side > 0 ? Math.PI : 0, 'گازولین — تعمیرگاه', 10, 1.9, '#7a1f14', '#ffd88a')
    }
  }

  /* ================= farm ================= */
  private buildFarm() {
    const f = this.spots.farm
    const gGeos: THREE.BufferGeometry[] = []
    // barn
    gGeos.push(boxGeo(18, 8, 12, f.x, 4, f.z - 18, 0, new THREE.Color('#8a3a2a')))
    gGeos.push(boxGeo(19, 1, 13, f.x, 8.4, f.z - 18, 0, new THREE.Color('#5a2418')))
    this.colliders.push({ x: f.x, z: f.z - 18, hw: 9, hd: 6, h: 8 })
    this.minimap.rects.push({ x: f.x, z: f.z - 18, hw: 9, hd: 6, t: 'b' })
    // silo
    const silo = new THREE.CylinderGeometry(3, 3.2, 13, 10).translate(f.x + 16, 6.5, f.z - 24)
    this.tintGeo(silo, new THREE.Color('#b0aa9e'))
    gGeos.push(silo)
    const siloTop = new THREE.ConeGeometry(3.5, 2.6, 10).translate(f.x + 16, 14.2, f.z - 24)
    this.tintGeo(siloTop, new THREE.Color('#7a6a50'))
    gGeos.push(siloTop)
    this.colliders.push({ x: f.x + 16, z: f.z - 24, hw: 3.2, hd: 3.2, h: 13 })
    this.minimap.rects.push({ x: f.x + 16, z: f.z - 24, hw: 3.2, hd: 3.2, t: 'w' })
    // windmill
    const mast = new THREE.CylinderGeometry(0.25, 0.5, 12, 6).translate(f.x - 18, 6, f.z + 8)
    this.tintGeo(mast, new THREE.Color('#8a8478'))
    gGeos.push(mast)
    gGeos.push(boxGeo(4.4, 0.5, 0.15, f.x - 18, 11.6, f.z + 8, 0.5, new THREE.Color('#7a7468')))
    gGeos.push(boxGeo(4.4, 0.5, 0.15, f.x - 18, 11.6, f.z + 8, -0.5, new THREE.Color('#7a7468')))
    this.colliders.push({ x: f.x - 18, z: f.z + 8, hw: 0.6, hd: 0.6, h: 12 })
    // hay bales
    for (let i = 0; i < 5; i++) {
      const hay = new THREE.CylinderGeometry(0.8, 0.8, 1.4, 9).rotateZ(Math.PI / 2).translate(f.x + rand(-10, 10), 0.8, f.z + rand(2, 12))
      this.tintGeo(hay, new THREE.Color('#c8a850'))
      gGeos.push(hay)
    }
    // trough + fence posts around yard
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      gGeos.push(boxGeo(0.16, 1.1, 0.16, f.x + Math.cos(a) * 30, 0.55, f.z + Math.sin(a) * 30, 0, new THREE.Color('#5a4028')))
    }
    const mesh = new THREE.Mesh(this.mergeAll(gGeos), new THREE.MeshLambertMaterial({ vertexColors: true }))
    mesh.castShadow = this.quality === 'high'
    this.group.add(mesh)
    // plowed field
    const field = new THREE.Mesh(new THREE.PlaneGeometry(34, 22), new THREE.MeshLambertMaterial({ color: 0x5a4632, map: texDesert() }))
    field.rotation.x = -Math.PI / 2
    field.position.set(f.x + 4, 0.04, f.z + 26)
    this.group.add(field)
    this.addSign(f.x - 6, f.z - 6, 0, 'مزرعه دلگون', 9, 1.8, '#4a3a20', '#e8d8a0')
    this.firePoints.push(new THREE.Vector3(f.x - 4, 0.55, f.z - 4))
    if (this.quality !== 'low') {
      const l = new THREE.PointLight(0xff7a2a, 2.2, 26, 1.6)
      l.position.set(f.x - 4, 1.6, f.z - 4)
      this.group.add(l)
      this.fireLights.push(l)
      this.fireFlick.push(rand(0, 10))
    }
  }

  /* ================= lake & pier ================= */
  private buildLake() {
    const cx = -650, cz = 750
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(130, 26),
      new THREE.MeshLambertMaterial({ color: 0x2e6a8a, transparent: true, opacity: 0.85 }),
    )
    water.rotation.x = -Math.PI / 2
    water.position.set(cx, 0.05, cz)
    this.group.add(water)
    // pier
    const gGeos: THREE.BufferGeometry[] = []
    for (let i = 0; i < 8; i++) {
      gGeos.push(boxGeo(3.4, 0.25, 2.2, cx + 62, 0.7, 690 + i * 8.6, 0, new THREE.Color('#6b4a28')))
    }
    for (let i = 0; i < 8; i += 2) {
      gGeos.push(boxGeo(0.22, 2, 0.22, cx + 60.6, 0.5, 690 + i * 8.6 + 4, 0, new THREE.Color('#4a3520')))
      gGeos.push(boxGeo(0.22, 2, 0.22, cx + 63.4, 0.5, 690 + i * 8.6 + 4, 0, new THREE.Color('#4a3520')))
    }
    // rowboat
    gGeos.push(boxGeo(1.8, 0.7, 5, cx - 40, 0.55, cz - 20, 0.4, new THREE.Color('#7a5a34')))
    gGeos.push(boxGeo(1.4, 0.5, 4.2, cx - 40, 0.85, cz - 20, 0.4, new THREE.Color('#5a4024')))
    // reeds
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2)
      const r = 128 + rand(-4, 4)
      const reed = new THREE.ConeGeometry(0.14, rand(1.2, 2.2), 5).translate(cx + Math.cos(a) * r, 0.7, cz + Math.sin(a) * r)
      this.tintGeo(reed, new THREE.Color('#5a7a3a'))
      gGeos.push(reed)
    }
    const mesh = new THREE.Mesh(this.mergeAll(gGeos), new THREE.MeshLambertMaterial({ vertexColors: true }))
    mesh.castShadow = this.quality === 'high'
    this.group.add(mesh)
    this.addSign(cx + 66, 682, Math.PI, 'دریاچه آبی', 8, 1.7, '#1e3a4a', '#c8e8f0')
  }

  /* ================= radio tower ================= */
  private buildRadioTower() {
    const t = this.spots.treasureSpot
    const gGeos: THREE.BufferGeometry[] = []
    for (let i = 0; i < 3; i++) {
      const h = 14, y = i * h + h / 2
      const r0 = 2.2 - i * 0.55, r1 = 2.2 - (i + 1) * 0.55
      gGeos.push(new THREE.CylinderGeometry(r1, r0, h, 4, 1, true).translate(t.x, y, t.z))
      gGeos.push(boxGeo(0.14, 0.14, 0.14, t.x, y, t.z))
    }
    gGeos.push(new THREE.CylinderGeometry(0.1, 0.1, 4, 5).translate(t.x, 43, t.z))
    const mesh = new THREE.Mesh(this.mergeAll(gGeos, '#8a8f96'), new THREE.MeshLambertMaterial({ vertexColors: true }))
    mesh.castShadow = this.quality === 'high'
    this.group.add(mesh)
    this.colliders.push({ x: t.x, z: t.z, hw: 2.4, hd: 2.4, h: 42 })
    this.minimap.rects.push({ x: t.x, z: t.z, hw: 2.4, hd: 2.4, t: 'w' })
    // blinking beacon
    this.radioBeacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xff3030, transparent: true, opacity: 0.9, depthWrite: false }))
    this.radioBeacon.scale.setScalar(6)
    this.radioBeacon.position.set(t.x, 45.5, t.z)
    this.group.add(this.radioBeacon)
    // small hut at base
    const hut = boxGeo(6, 3, 5, t.x + 8, 1.5, t.z + 6, 0, new THREE.Color('#9a948a'))
    const hm = new THREE.Mesh(hut, new THREE.MeshLambertMaterial({ vertexColors: true }))
    this.group.add(hm)
    this.colliders.push({ x: t.x + 8, z: t.z + 6, hw: 3, hd: 2.5, h: 3 })
  }

  /* ================= traffic graph ================= */
  private buildGraph() {
    const nodes: GraphNode[] = []
    const idx = (x: number, z: number) => {
      const i = nodes.findIndex(n => n.x === x && n.z === z)
      if (i >= 0) return i
      nodes.push({ x, z })
      return nodes.length - 1
    }
    const edges: [number, number][] = []
    const link = (a: number, b: number) => { edges.push([a, b]) }
    // grid
    const gridIdx: number[][] = []
    for (let ri = 0; ri < H_ROADS.length; ri++) {
      gridIdx[ri] = []
      for (let ci = 0; ci < V_ROADS.length; ci++) {
        gridIdx[ri][ci] = idx(V_ROADS[ci], H_ROADS[ri])
      }
    }
    for (let ri = 0; ri < H_ROADS.length; ri++) {
      for (let ci = 0; ci < V_ROADS.length; ci++) {
        if (ci < V_ROADS.length - 1) link(gridIdx[ri][ci], gridIdx[ri][ci + 1])
        if (ri < H_ROADS.length - 1) link(gridIdx[ri][ci], gridIdx[ri + 1][ci])
      }
    }
    // highway chain south of city
    const hwyZ = [-300, -160, 0, 160, 320, 480, 600]
    let prev = idx(0, -300)
    for (let i = 1; i < hwyZ.length; i++) {
      const n = idx(0, hwyZ[i])
      link(prev, n)
      prev = n
    }
    // town street
    const t1 = idx(-200, 600), t2 = idx(0, 600), t3 = idx(200, 600)
    link(t1, t2); link(t2, t3)

    // adjacency
    const adj: number[][] = nodes.map(() => [])
    for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a) }
    this.graph = { nodes, adj }
  }

  /* ================= per-frame ================= */
  private tmpV = new THREE.Vector3()
  update(night: number, dt: number) {
    // windows: dark by day, warm glow by night
    this.windowMat.color.setRGB(
      0.11 + night * 1.15, 0.13 + night * 0.85, 0.17 + night * 0.38,
    )
    this.lampHeadMat.emissiveIntensity = night * 2.4
    this.lampGlowMat.opacity = night * 0.85
    this.poolMat.opacity = night * 0.5
    // radio beacon blink
    this.blink += dt
    ;(this.radioBeacon.material as THREE.SpriteMaterial).opacity = (Math.sin(this.blink * 2.2) > 0 ? 0.9 : 0.12)
    // fire flicker
    for (let i = 0; i < this.fireLights.length; i++) {
      this.fireFlick[i] += dt * rand(6, 12)
      this.fireLights[i].intensity = 1.8 + Math.sin(this.fireFlick[i]) * 0.5 + Math.sin(this.fireFlick[i] * 2.7) * 0.3
    }
    void this.tmpV
    void clamp
  }
}
