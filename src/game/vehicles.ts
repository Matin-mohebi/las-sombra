import * as THREE from 'three'
import { makeCar, makeHorse, animateHorse, type CarParts, type HorseParts, type CarType } from './entities'
import type { World } from './world'
import { WORLD_HALF } from './world'
import type { Sfx } from './audio'
import type { Particles } from './particles'
import type { Input } from './input'
import { resolveCollisions, rand, randi, pick, lerpAngle, angleDiff, clamp } from './utils'

export interface Vehicle {
  id: number
  kind: 'car' | 'horse'
  type: CarType | 'horse'
  parts: CarParts | HorseParts
  group: THREE.Group
  pos: THREE.Vector3
  heading: number
  speed: number
  steerV: number
  health: number
  maxSpeed: number
  accel: number
  turnRate: number
  isPolice: boolean
  occupied: boolean
  ai: { from: number; to: number } | null
  chase: boolean
  lightsOn: boolean
  smokeT: number
  dead: boolean
  deadT: number
  stamina: number
  gallop: boolean
  phase: number
  radius: number
  color: string
  wanderT: number
  wanderTarget: THREE.Vector3
  deployT: number
  wasJacked?: boolean
  gallopToggle?: boolean
  lastHoof?: number
  tame?: boolean
}

export interface VehicleHooks {
  onJack: () => void
  onPedHit: (pos: THREE.Vector3, speed: number, byPlayer: boolean) => void
  onExplosion: (pos: THREE.Vector3) => void
  deployCops: (pos: THREE.Vector3) => void
  crash: (impact: number) => void
}

let VID = 1

export class Vehicles {
  list: Vehicle[] = []
  playerVehicle: Vehicle | null = null
  hooks: VehicleHooks
  private night = 0

  constructor(
    private scene: THREE.Scene,
    private world: World,
    private sfx: Sfx,
    private particles: Particles,
    private input: Input,
    private quality: 'low' | 'med' | 'high',
  ) {
    this.hooks = {
      onJack: () => {}, onPedHit: () => {}, onExplosion: () => {},
      deployCops: () => {}, crash: () => {},
    }
  }

  spawnAll() {
    // parked cars
    for (const s of this.world.parkedSpots) {
      const type: CarType = s.police ? 'police' : pick<CarType>(['sedan', 'sedan', 'sports', 'taxi', 'truck', 'van'])
      this.addCar(type, s.x, s.z, s.h, !!s.police)
    }
    // traffic
    const n = this.quality === 'low' ? 8 : this.quality === 'med' ? 12 : 16
    for (let i = 0; i < n; i++) this.spawnTraffic()
    // horses
    for (const h of this.world.horseSpots) {
      const tame = h.z > 460 || Math.hypot(h.x - 16, h.z - 512) < 40
      this.addHorse(h.x, h.z, tame)
    }
  }

  private addCar(type: CarType, x: number, z: number, h: number, police = false, traffic = false): Vehicle {
    const parts = makeCar(type)
    const group = parts.group
    group.position.set(x, 0, z)
    group.rotation.y = h
    this.scene.add(group)
    const v: Vehicle = {
      id: VID++,
      kind: 'car',
      type,
      parts,
      group,
      pos: new THREE.Vector3(x, 0, z),
      heading: h,
      speed: 0,
      steerV: 0,
      health: 100,
      maxSpeed: type === 'sports' ? 34 : type === 'truck' ? 20 : type === 'police' ? 30 : 26,
      accel: type === 'sports' ? 14 : type === 'truck' ? 7 : 10,
      turnRate: type === 'sports' ? 2.1 : 1.7,
      isPolice: police,
      occupied: false,
      ai: traffic ? this.pickEdge() : null,
      chase: false,
      lightsOn: false,
      smokeT: 0,
      dead: false,
      deadT: 0,
      stamina: 0,
      gallop: false,
      phase: rand(0, 6),
      radius: 1.7,
      color: '#888',
      wanderT: 0,
      wanderTarget: new THREE.Vector3(),
      deployT: 0,
    }
    this.list.push(v)
    return v
  }

  private addHorse(x: number, z: number, tame = false): Vehicle {
    const parts = makeHorse()
    parts.group.position.set(x, 0, z)
    this.scene.add(parts.group)
    const v: Vehicle = {
      id: VID++,
      kind: 'horse',
      type: 'horse',
      parts,
      group: parts.group,
      pos: new THREE.Vector3(x, 0, z),
      heading: rand(0, 6),
      speed: 0,
      steerV: 0,
      health: 100,
      maxSpeed: 19,
      accel: 9,
      turnRate: 2.4,
      isPolice: false,
      occupied: false,
      ai: null,
      chase: false,
      lightsOn: false,
      smokeT: 0,
      dead: false,
      deadT: 0,
      stamina: 100,
      gallop: false,
      phase: rand(0, 6),
      radius: 0.9,
      color: '#6b4526',
      wanderT: 0,
      wanderTarget: new THREE.Vector3(x, 0, z),
      deployT: 0,
      tame,
    }
    this.list.push(v)
    return v
  }

  private pickEdge(): { from: number; to: number } {
    const { nodes, adj } = this.world.graph
    const from = randi(0, nodes.length - 1)
    if (adj[from].length === 0) return { from, to: from }
    const to = pick(adj[from])
    return { from, to }
  }

  private spawnTraffic() {
    const { nodes } = this.world.graph
    for (let t = 0; t < 10; t++) {
      const e = this.pickEdge()
      const a = nodes[e.from]
      if (!a) continue
      const type = pick<CarType>(['sedan', 'sedan', 'taxi', 'van', 'truck', 'sports'])
      const dir = this.edgeDir(e.from, e.to)
      const tAlong = rand(0.15, 0.85)
      const px = a.x + (nodes[e.to].x - a.x) * tAlong
      const pz = a.z + (nodes[e.to].z - a.z) * tAlong
      const h = Math.atan2(dir.x, dir.z)
      this.addCar(type, px, pz, h, false, true)
      return
    }
  }

  private edgeDir(from: number, to: number) {
    const { nodes } = this.world.graph
    const a = nodes[from], b = nodes[to]
    const dx = b.x - a.x, dz = b.z - a.z
    const len = Math.hypot(dx, dz) || 1
    return { x: dx / len, z: dz / len }
  }

  /* ================= enter/exit helpers ================= */
  nearest(pos: THREE.Vector3, maxDist = 4.5, kind?: 'car' | 'horse'): Vehicle | null {
    let best: Vehicle | null = null
    let bd = maxDist * maxDist
    for (const v of this.list) {
      if (v.occupied || v.dead || v.deadT > 0) continue
      if (kind && v.kind !== kind) continue
      const d = v.pos.distanceToSquared(pos)
      if (d < bd) { bd = d; best = v }
    }
    return best
  }

  enter(v: Vehicle) {
    v.occupied = true
    this.playerVehicle = v
    if (v.ai) { v.ai = null; this.hooks.onJack() }
    if (v.isPolice && !v.wasJacked) { v.wasJacked = true }
    if (v.kind === 'car') this.sfx.engineStart()
  }

  exit() {
    const v = this.playerVehicle
    if (!v) return null
    v.occupied = false
    this.playerVehicle = null
    this.sfx.engineStop()
    // place player beside
    const side = new THREE.Vector3(Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(v.kind === 'horse' ? 1.2 : 2.2)
    return { pos: new THREE.Vector3().copy(v.pos).add(side), v }
  }

  placeForExit(v: Vehicle) {
    const side = new THREE.Vector3(Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(v.kind === 'horse' ? 1.2 : 2.2)
    return new THREE.Vector3().copy(v.pos).add(side)
  }

  copsNear(pos: THREE.Vector3, radius: number): number {
    let n = 0
    for (const v of this.list) {
      if (v.isPolice && !v.dead && v.pos.distanceToSquared(pos) < radius * radius) n++
    }
    return n
  }

  spawnPolice(playerPos: THREE.Vector3): Vehicle | null {
    const { nodes, adj } = this.world.graph
    // find node 90-160 from player
    const cands = nodes.filter(n => {
      const d = Math.hypot(n.x - playerPos.x, n.z - playerPos.z)
      return d > 80 && d < 170
    })
    if (cands.length === 0) return null
    const n = pick(cands)
    const ni = nodes.indexOf(n)
    const to = adj[ni][0] ?? ni
    const dir = this.edgeDir(ni, to)
    const v = this.addCar('police', n.x, n.z, Math.atan2(dir.x, dir.z), true, false)
    v.chase = true
    v.ai = { from: ni, to }
    return v
  }

  clearPolice() {
    for (const v of this.list) {
      if (v.isPolice && !v.occupied) {
        v.chase = false
      }
    }
  }

  damage(v: Vehicle, amount: number, byPlayer: boolean) {
    if (v.dead) return
    v.health -= amount
    if (v.health <= 0) this.explode(v, byPlayer)
  }

  private explode(v: Vehicle, byPlayer: boolean) {
    if (v.dead) return
    v.dead = true
    v.speed = 0
    v.chase = false
    v.ai = null
    v.deadT = 0
    this.sfx.explosion()
    this.particles.burst(v.pos.clone().add(new THREE.Vector3(0, 1, 0)), 26, {
      additive: true, color: 0xff8830, life: rand(0.5, 0.9), size: 3, sizeEnd: 7, speed: 9, up: 1.4, drag: 1.2, gravity: 2,
    })
    this.particles.burst(v.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 18, {
      color: 0x333330, life: rand(1.2, 2.2), size: 3.5, sizeEnd: 9, speed: 5, up: 1, drag: 0.8,
    })
    // darken
    v.group.traverse(o => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && mesh.material && !Array.isArray(mesh.material)) {
        const mat = mesh.material as THREE.MeshLambertMaterial
        if (mat.color) mat.color.multiplyScalar(0.28)
      }
    })
    this.hooks.onExplosion(v.pos)
    void byPlayer
  }

  /* ================= update ================= */
  update(dt: number, playerPos: THREE.Vector3, night: number, inVehicle: boolean) {
    this.night = night
    this.playerPos = playerPos
    for (const v of this.list) {
      if (v.dead) {
        v.deadT += dt
        if (v.deadT < 4) {
          if (Math.random() < 0.3) {
            this.particles.spawn(v.pos.clone().add(new THREE.Vector3(rand(-0.8, 0.8), 1, rand(-0.8, 0.8))), {
              color: 0x222220, life: rand(1, 2), size: 2.5, sizeEnd: 6, vel: new THREE.Vector3(rand(-0.5, 0.5), rand(1.5, 2.5), rand(-0.5, 0.5)),
            })
            this.particles.spawn(v.pos.clone().add(new THREE.Vector3(rand(-0.5, 0.5), 0.8, rand(-0.5, 0.5))), {
              additive: true, color: 0xff6a20, life: rand(0.3, 0.6), size: 1.6, sizeEnd: 3, vel: new THREE.Vector3(0, rand(1, 2), 0),
            })
          }
        }
        // wreck fade after 25s
        if (v.deadT > 25 && !v.occupied) {
          this.removeVehicle(v)
        }
        this.sync(v)
        continue
      }

      if (v === this.playerVehicle && inVehicle) {
        if (v.kind === 'car') this.drivePlayerCar(v, dt)
        else this.drivePlayerHorse(v, dt)
      } else if (v.kind === 'car' && v.isPolice && v.chase) {
        this.policeChase(v, dt, playerPos)
      } else if (v.kind === 'car' && v.ai) {
        this.trafficCar(v, dt)
      } else if (v.kind === 'horse') {
        this.wildHorse(v, dt, playerPos)
      } else {
        // parked / abandoned: idle physics
        v.speed *= 1 - clamp(2 * dt, 0, 1)
        if (Math.abs(v.speed) > 0.05) this.integrate(v, dt)
      }

      // damage smoke
      if (v.kind === 'car' && v.health < 45 && Math.random() < 0.25) {
        const fwd = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading)).multiplyScalar(1.4)
        this.particles.spawn(v.pos.clone().add(fwd).add(new THREE.Vector3(0, 0.9, 0)), {
          color: 0x555550, life: rand(0.8, 1.5), size: 1.2, sizeEnd: 3.5,
          vel: new THREE.Vector3(rand(-0.4, 0.4), rand(1, 2), rand(-0.4, 0.4)),
        })
      }

      // ped run-over
      const abs = Math.abs(v.speed)
      if (abs > 6) {
        const fwd = new THREE.Vector3(Math.sin(v.heading), 0, Math.cos(v.heading)).multiplyScalar(1.6)
        const front = v.pos.clone().add(fwd)
        this.hooks.onPedHit(front, abs, v === this.playerVehicle)
        // dust
        if (v.kind === 'horse' && Math.random() < 0.5) {
          this.particles.spawn(v.pos.clone().setY(0.2), { color: 0xb09a70, life: 0.7, size: 1.2, sizeEnd: 2.6, vel: new THREE.Vector3(rand(-1, 1), 0.6, rand(-1, 1)) })
        }
      }

      this.sync(v)
    }
  }

  private removeVehicle(v: Vehicle) {
    this.scene.remove(v.group)
    const i = this.list.indexOf(v)
    if (i >= 0) this.list.splice(i, 1)
    if (this.playerVehicle === v) this.playerVehicle = null
  }

  private sync(v: Vehicle) {
    v.group.position.set(v.pos.x, v.kind === 'horse' ? (v.group.position.y) : 0, v.pos.z)
    v.group.rotation.y = v.heading
    if (v.kind === 'car') {
      const parts = v.parts as CarParts
      // wheels
      const spin = v.speed * 0.026
      for (const w of parts.wheels) w.rotation.x += spin
      const steerTarget = v.steerV * 0.45
      for (const w of parts.frontWheels) w.rotation.y = lerpAngle(w.rotation.y, steerTarget, 0.2)
      // lights
      const on = (this.night > 0.25 || v.lightsOn) && !v.dead
      for (const hl of parts.headlights) (hl.material as THREE.MeshBasicMaterial).color.setHex(on ? 0xfff2c0 : 0x555044)
      if (parts.beam) (parts.beam.material as THREE.MeshBasicMaterial).opacity = on ? 0.5 * this.night : 0
      // police flash
      if (parts.lightbar && (v.chase || v.isPolice && v.lightsOn)) {
        const t = performance.now() * 0.008
        const red = Math.sin(t) > 0
        ;(parts.lightbar.red.material as THREE.MeshBasicMaterial).color.setHex(red ? 0xff2222 : 0x440808)
        ;(parts.lightbar.blue.material as THREE.MeshBasicMaterial).color.setHex(red ? 0x080844 : 0x2255ff)
      } else if (parts.lightbar) {
        ;(parts.lightbar.red.material as THREE.MeshBasicMaterial).color.setHex(0x550a0a)
        ;(parts.lightbar.blue.material as THREE.MeshBasicMaterial).color.setHex(0x0a0a55)
      }
    } else {
      const parts = v.parts as HorseParts
      animateHorse(parts, v.phase, Math.abs(v.speed))
    }
  }

  /* ---------- player driving ---------- */
  private drivePlayerCar(v: Vehicle, dt: number) {
    const inp = this.input
    const throttle = inp.move.y
    const steerIn = inp.move.x
    const handbrake = inp.keys.Space || false

    if (throttle > 0.05) {
      v.speed += v.accel * throttle * dt * (v.speed < 0 ? 2.2 : 1)
    } else if (throttle < -0.05) {
      v.speed += v.accel * throttle * dt * (v.speed > 0 ? 2.2 : 0.6)
    } else {
      v.speed *= 1 - clamp(0.9 * dt, 0, 1)
    }
    if (handbrake) v.speed *= 1 - clamp(2.4 * dt, 0, 1)
    v.speed = clamp(v.speed, -v.maxSpeed * 0.4, v.maxSpeed)
    v.speed *= 1 - clamp(0.12 * dt, 0, 1)

    v.steerV = lerpAngle(v.steerV, steerIn, 1 - Math.exp(-8 * dt))
    const sf = Math.min(1, Math.abs(v.speed) / 7) * (1 - 0.42 * Math.min(1, Math.abs(v.speed) / v.maxSpeed))
    const hb = handbrake ? 1.55 : 1
    v.heading += v.steerV * v.turnRate * sf * hb * dt * (v.speed < -0.5 ? -1 : 1)

    this.integrate(v, dt)
    this.sfx.engineUpdate(v.speed, throttle, true)
  }

  private drivePlayerHorse(v: Vehicle, dt: number) {
    const inp = this.input
    const throttle = inp.move.y
    const steerIn = inp.move.x
    v.gallop = inp.sprintHeld() || !!v.gallopToggle
    const wantMax = v.gallop && v.stamina > 1 ? v.maxSpeed : 8.5

    if (throttle > 0.05) {
      v.speed += v.accel * dt * throttle
      v.speed = Math.min(v.speed, wantMax)
    } else if (throttle < -0.05) {
      v.speed -= v.accel * 0.8 * dt * -throttle
      v.speed = Math.max(v.speed, -3)
    } else {
      v.speed *= 1 - clamp(1.6 * dt, 0, 1)
    }

    if (v.gallop && Math.abs(v.speed) > 10) {
      v.stamina = Math.max(0, v.stamina - 7.5 * dt)
    } else {
      v.stamina = Math.min(100, v.stamina + 9 * dt)
    }

    const sf = 0.35 + Math.min(1, Math.abs(v.speed) / 6) * 0.65
    v.heading -= steerIn * v.turnRate * sf * dt
    v.phase += Math.abs(v.speed) * dt * 1.05
    // hoof sound at step
    if (Math.abs(v.speed) > 2) {
      const c = Math.sin(v.phase * 2)
      if (c > 0.9 && v.lastHoof !== Math.floor(v.phase * 2 / Math.PI)) {
        v.lastHoof = Math.floor(v.phase * 2 / Math.PI)
        this.sfx.hoof()
      }
    }
    this.integrate(v, dt)
  }

  /* ---------- AI ---------- */
  private trafficCar(v: Vehicle, dt: number) {
    const { nodes } = this.world.graph
    const ai = v.ai
    if (!ai) return
    const a = nodes[ai.from], b = nodes[ai.to]
    if (!a || !b) { v.ai = this.pickEdge(); return }
    const dir = this.edgeDir(ai.from, ai.to)
    const rx = dir.z, rz = -dir.x // right side
    const tx = b.x + rx * 3.6
    const tz = b.z + rz * 3.6
    const desired = Math.atan2(tx - v.pos.x, tz - v.pos.z)
    v.heading = lerpAngle(v.heading, desired, 1 - Math.exp(-2.6 * dt))
    v.steerV = clamp(angleDiff(v.heading, desired) * -2, -1, 1)

    // obstacle check
    const fx = v.pos.x + Math.sin(v.heading) * 8
    const fz = v.pos.z + Math.cos(v.heading) * 8
    let blocked = false
    const pd = Math.hypot(fx - this.playerPos.x, fz - this.playerPos.z)
    if (pd < 3.4) blocked = true
    for (const o of this.list) {
      if (o === v || o.dead) continue
      if (Math.hypot(fx - o.pos.x, fz - o.pos.z) < 3.6) { blocked = true; break }
    }

    const target = blocked ? 0 : 11
    v.speed += clamp(target - v.speed, -14 * dt, 6 * dt)
    this.integrate(v, dt)

    // arrival → next edge
    const distB = Math.hypot(b.x - v.pos.x, b.z - v.pos.z)
    if (distB < 6) {
      const { adj } = this.world.graph
      const opts = adj[ai.to].filter(n => n !== ai.from)
      const next = opts.length ? pick(opts) : ai.from
      v.ai = { from: ai.to, to: next }
    }
  }

  private playerPos = new THREE.Vector3()
  private policeChase(v: Vehicle, dt: number, playerPos: THREE.Vector3) {
    const dx = playerPos.x - v.pos.x
    const dz = playerPos.z - v.pos.z
    const dist = Math.hypot(dx, dz)
    const desired = Math.atan2(dx, dz)
    v.heading = lerpAngle(v.heading, desired, 1 - Math.exp(-2.2 * dt))
    v.steerV = clamp(angleDiff(v.heading, desired) * -2, -1, 1)
    const playerOnFoot = !this.playerVehicle || this.playerVehicle === v
    const target = dist > 9 || !playerOnFoot ? 24 : 0
    v.speed += clamp(target - v.speed, -20 * dt, 8 * dt)
    this.integrate(v, dt)

    // deploy cops when close & stopped
    if (dist < 14 && playerOnFoot) {
      v.deployT -= dt
      if (v.deployT <= 0 && Math.abs(v.speed) < 3) {
        v.deployT = 7
        this.hooks.deployCops(v.pos)
      }
    }
    // siren volume by distance
    this.sfx.sirenVol(clamp(1 - dist / 90, 0, 1))
  }

  private wildHorse(v: Vehicle, dt: number, playerPos: THREE.Vector3) {
    if (v.tame && !v.occupied) {
      // tame horses stay near their spot
      v.speed += clamp(0 - v.speed, -4 * dt, 2 * dt)
      v.wanderT -= dt
      if (v.wanderT <= 0) {
        v.wanderT = rand(8, 16)
        v.wanderTarget.set(v.pos.x + rand(-6, 6), 0, v.pos.z + rand(-6, 6))
      }
      const desired = Math.atan2(v.wanderTarget.x - v.pos.x, v.wanderTarget.z - v.pos.z)
      v.heading = lerpAngle(v.heading, desired, 1 - Math.exp(-0.6 * dt))
      v.phase += Math.abs(v.speed) * dt * 1.05
      this.integrate(v, dt)
      return
    }
    v.wanderT -= dt
    const pd = Math.hypot(playerPos.x - v.pos.x, playerPos.z - v.pos.z)
    if (v.wanderT <= 0) {
      v.wanderT = rand(5, 11)
      v.wanderTarget.set(v.pos.x + rand(-45, 45), 0, v.pos.z + rand(-45, 45))
    }
    const fleeing = pd < 14 && !v.occupied
    const target = fleeing
      ? new THREE.Vector3(v.pos.x + (v.pos.x - playerPos.x), 0, v.pos.z + (v.pos.z - playerPos.z))
      : v.wanderTarget
    const desired = Math.atan2(target.x - v.pos.x, target.z - v.pos.z)
    v.heading = lerpAngle(v.heading, desired, 1 - Math.exp(-1.8 * dt))
    const ts = fleeing ? 12 : 3.2
    v.speed += clamp(ts - v.speed, -6 * dt, 3.5 * dt)
    v.phase += Math.abs(v.speed) * dt * 1.05
    this.integrate(v, dt)
  }

  /* ---------- shared physics ---------- */
  private integrate(v: Vehicle, dt: number) {
    const fx = Math.sin(v.heading)
    const fz = Math.cos(v.heading)
    const nx = v.pos.x + fx * v.speed * dt
    const nz = v.pos.z + fz * v.speed * dt
    v.pos.x = nx
    v.pos.z = nz

    // colliders
    const before = { x: v.pos.x, z: v.pos.z }
    const hits = resolveCollisions(v.pos, v.radius, this.world.colliders)
    if (hits > 0) {
      const impact = Math.abs(v.speed)
      v.pos.x = (v.pos.x + before.x) / 2
      v.pos.z = (v.pos.z + before.z) / 2
      if (impact > 7) {
        if (v === this.playerVehicle) {
          this.sfx.crash(impact)
          this.hooks.crash(impact)
          this.particles.burst(v.pos.clone().setY(0.8), 6, { color: 0xd8c890, life: 0.5, size: 1, sizeEnd: 2.4, speed: 3 })
        }
        this.damage(v, impact * 1.1, v === this.playerVehicle)
      }
      v.speed *= -0.25
    }

    // world bounds
    const B = WORLD_HALF
    v.pos.x = clamp(v.pos.x, -B, B)
    v.pos.z = clamp(v.pos.z, -B, B)

    // vehicle-vehicle separation
    for (const o of this.list) {
      if (o === v || o.dead) continue
      const dx = v.pos.x - o.pos.x
      const dz = v.pos.z - o.pos.z
      const rr = v.radius + o.radius
      const d2 = dx * dx + dz * dz
      if (d2 < rr * rr && d2 > 0.001) {
        const d = Math.sqrt(d2)
        const push = (rr - d) / 2
        v.pos.x += (dx / d) * push
        v.pos.z += (dz / d) * push
        const rel = Math.abs(v.speed - o.speed)
        if (rel > 12 && v === this.playerVehicle) {
          this.damage(o, rel * 0.8, true)
          this.damage(v, rel * 0.3, false)
          this.sfx.crash(rel)
          this.hooks.crash(rel)
          v.speed *= 0.4
        }
      }
    }
  }

  dispose() {
    for (const v of this.list) this.scene.remove(v.group)
    this.list = []
  }
}


