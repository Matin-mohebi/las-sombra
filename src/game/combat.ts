import * as THREE from 'three'
import { makeHuman, animateHuman, makePickupMesh, type HumanParts } from './entities'
import type { World, Camp } from './world'
import type { Sfx } from './audio'
import type { Particles } from './particles'
import type { Vehicles, Vehicle } from './vehicles'
import type { Player } from './player'
import { rand, randi, pick, clamp, segmentVsColliders, lerpAngle, faNum, type Box2 } from './utils'

/* ================= weapons ================= */
export interface WeaponDef {
  id: 'revolver' | 'pistol' | 'rifle'
  name: string
  dmg: number
  rate: number
  mag: number
  reload: number
  range: number
  spreadHip: number
  spreadAim: number
  price: number
  ammoPack: number
  ammoCost: number
  sfx: 'revolver' | 'pistol' | 'rifle'
}

export const WEAPONS: WeaponDef[] = [
  { id: 'revolver', name: 'شش‌لول', dmg: 34, rate: 0.38, mag: 6, reload: 2.1, range: 70, spreadHip: 0.035, spreadAim: 0.008, price: 0, ammoPack: 12, ammoCost: 30, sfx: 'revolver' },
  { id: 'pistol', name: 'کلت برنی', dmg: 24, rate: 0.17, mag: 14, reload: 1.5, range: 80, spreadHip: 0.04, spreadAim: 0.014, price: 250, ammoPack: 24, ammoCost: 40, sfx: 'pistol' },
  { id: 'rifle', name: 'شاهین ۷۰۸', dmg: 65, rate: 0.95, mag: 5, reload: 2.6, range: 170, spreadHip: 0.05, spreadAim: 0.004, price: 600, ammoPack: 10, ammoCost: 55, sfx: 'rifle' },
]

interface WeaponState { def: WeaponDef; mag: number; reserve: number; owned: boolean }

/* ================= humans ================= */
export type Team = 'bandit' | 'cop' | 'civ' | 'duelist'

interface HumanEnt {
  parts: HumanParts
  pos: THREE.Vector3
  yaw: number
  health: number
  team: Team
  state: 'idle' | 'engage' | 'flee' | 'dead'
  fireT: number
  losT: number
  hasLOS: boolean
  phase: number
  speed: number
  home: THREE.Vector3
  wander: THREE.Vector3
  wanderT: number
  deadT: number
  strafe: number
  camp?: number
}

interface Pickup { kind: 'cash' | 'ammo' | 'health'; amount: number; mesh: THREE.Group; pos: THREE.Vector3; t: number }

export interface CombatHooks {
  onKill: (team: Team, pos: THREE.Vector3, camp?: number) => void
  onStarsChange: (stars: number) => void
  onPlayerDeath: () => void
}

export class Combat {
  weapons: WeaponState[] = WEAPONS.map(d => ({
    def: d,
    mag: d.id === 'revolver' ? 6 : 0,
    reserve: d.id === 'revolver' ? 24 : 0,
    owned: d.id === 'revolver',
  }))
  current = 0
  reloadT = 0
  private fireCd = 0

  humans: HumanEnt[] = []
  pickups: Pickup[] = []
  heat = 0
  stars = 0
  private lastCrime = -99
  hooks: CombatHooks

  // tracers
  private tracers: { mesh: THREE.Mesh; t: number }[] = []
  private tracerPool: THREE.Mesh[] = []
  private muzzleLight: THREE.PointLight
  private muzzleT = 0

  private playerPos = new THREE.Vector3()
  private playerSpeed = 0
  private copSpawnT = 0
  private shotsNearT = 0

  constructor(
    private scene: THREE.Scene,
    private world: World,
    private sfx: Sfx,
    private particles: Particles,
    private vehicles: Vehicles,
    private player: Player,
    private quality: 'low' | 'med' | 'high',
  ) {
    this.hooks = { onKill: () => {}, onStarsChange: () => {}, onPlayerDeath: () => {} }

    // muzzle light
    this.muzzleLight = new THREE.PointLight(0xffc060, 0, 16, 1.8)
    scene.add(this.muzzleLight)

    // tracer pool
    const tg = new THREE.BoxGeometry(0.035, 0.035, 1)
    tg.translate(0, 0, -0.5)
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({
        color: 0xffe8a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false,
      }))
      m.visible = false
      scene.add(m)
      this.tracerPool.push(m)
    }
  }

  get weapon() { return this.weapons[this.current] }

  /* ================= world population ================= */
  spawnBandits() {
    this.world.camps.forEach((camp: Camp, ci: number) => {
      camp.spawns.forEach((s, si) => {
        if (si === 0 && this.quality === 'low') return
        this.spawnHuman('bandit', new THREE.Vector3(s.x, 0, s.z), ci)
      })
    })
  }

  spawnCivilians() {
    const n = this.quality === 'low' ? 8 : this.quality === 'med' ? 13 : 18
    for (let i = 0; i < n; i++) {
      let x: number, z: number
      if (i % 3 === 0) {
        // town
        x = rand(-180, 180)
        z = pick([590, 594, 606, 610])
      } else {
        // city sidewalks
        const road = pick([-240, -120, 0, 120, 240])
        x = road + pick([-9.5, 9.5])
        z = rand(-860, -320)
        if (Math.random() < 0.4) {
          const h = pick([-840, -660, -480, -300])
          z = h + pick([-9.5, 9.5])
          x = rand(-260, 260)
        }
      }
      this.spawnHuman('civ', new THREE.Vector3(x, 0, z))
    }
  }

  private spawnHuman(team: Team, pos: THREE.Vector3, camp?: number): HumanEnt {
    const opts = team === 'civ'
      ? { shirt: pick(['#7a7a6a', '#5a6a7a', '#8a7a5a', '#6a5a4a', '#4a5a3a']), hat: pick(['none', 'cap']) as 'none' | 'cap' }
      : team === 'cop'
        ? { shirt: '#2c3444', pants: '#22262e', hat: 'cap' as const }
        : { shirt: pick(['#5a3a2a', '#3a3a2a', '#6b4a2a']), bandana: true, hat: 'cowboy' as const }
    const parts = makeHuman(opts)
    parts.group.position.copy(pos)
    parts.gun!.visible = team !== 'civ'
    this.scene.add(parts.group)
    const h: HumanEnt = {
      parts, pos: pos.clone(), yaw: rand(0, 6), health: team === 'cop' ? 60 : team === 'civ' ? 40 : team === 'duelist' ? 90 : 70,
      team, state: team === 'civ' ? 'idle' : 'idle', fireT: rand(0.5, 2), losT: rand(0, 0.4), hasLOS: false,
      phase: rand(0, 6), speed: 0, home: pos.clone(), wander: pos.clone(), wanderT: 0, deadT: 0,
      strafe: Math.random() < 0.5 ? 1 : -1, camp,
    }
    this.humans.push(h)
    return h
  }

  /* ================= wanted ================= */
  addCrime(pts: number, time: number) {
    const before = this.stars
    this.heat = clamp(this.heat + pts, 0, 500)
    this.stars = Math.min(5, Math.max(1, Math.ceil(this.heat / 100)))
    this.lastCrime = time
    if (this.stars > before) {
      this.sfx.star()
      this.hooks.onStarsChange(this.stars)
    }
  }

  clearWanted() {
    this.heat = 0
    if (this.stars > 0) {
      this.stars = 0
      this.hooks.onStarsChange(0)
    }
    this.vehicles.clearPolice()
    for (const h of this.humans) {
      if (h.team === 'cop' && h.state !== 'dead') h.state = 'flee'
    }
  }

  starsDecay(dt: number, time: number) {
    if (this.heat <= 0) return
    const copCars = this.vehicles.copsNear(this.playerPos, 70)
    const copFoot = this.humans.some(h => h.team === 'cop' && h.state === 'engage' && h.pos.distanceToSquared(this.playerPos) < 60 * 60)
    if (time - this.lastCrime > 9 && copCars === 0 && !copFoot) {
      this.heat = Math.max(0, this.heat - 15 * dt)
      const s = Math.ceil(this.heat / 100)
      if (s !== this.stars) {
        this.stars = Math.min(5, Math.max(0, s))
        this.hooks.onStarsChange(this.stars)
        if (this.stars === 0) this.clearWanted()
      }
    }
  }

  /* ================= shooting ================= */
  tryFire(camera: THREE.PerspectiveCamera, playerPos: THREE.Vector3, time: number, isTouch: boolean): boolean {
    if (this.reloadT > 0 || this.fireCd > 0) return false
    const w = this.weapon
    if (w.mag <= 0) {
      if (w.reserve > 0) this.reload()
      else this.sfx.dryFire()
      return false
    }
    this.fireCd = w.def.rate
    w.mag--
    this.sfx.shot(w.def.sfx)
    this.shotsNearT = time

    // direction with spread
    const dir = camera.getWorldDirection(new THREE.Vector3())
    const spread = this.player.aiming ? w.def.spreadAim : w.def.spreadHip
    // touch aim assist
    if (isTouch) {
      const assist = this.findAssist(camera, playerPos, dir)
      if (assist) dir.copy(assist)
    }
    dir.x += rand(-spread, spread)
    dir.y += rand(-spread, spread) * 0.6
    dir.z += rand(-spread, spread)
    dir.normalize()

    const origin = camera.position.clone()
    const range = w.def.range
    const end = origin.clone().addScaledVector(dir, range)

    // find nearest hit: enemies then walls (all distances normalized 0..1 over range)
    let hitHuman: HumanEnt | null = null
    let hitT = 1
    let head = false
    for (const h of this.humans) {
      if (h.state === 'dead') continue
      const bodyC = h.pos.clone().add(new THREE.Vector3(0, 1.05, 0))
      const headC = h.pos.clone().add(new THREE.Vector3(0, 1.72, 0))
      const tbRaw = raySphere(origin, dir, bodyC, 0.55)
      const thRaw = raySphere(origin, dir, headC, 0.3)
      const tb = tbRaw !== null ? tbRaw / range : null
      const th = thRaw !== null ? thRaw / range : null
      const t = th !== null && (tb === null || th < tb) ? th : tb
      if (t !== null && t < hitT) {
        hitT = t
        hitHuman = h
        head = th !== null && (tb === null || th <= tb)
      }
    }
    // walls (2D XZ)
    const wallT = segmentVsColliders(origin.x, origin.z, end.x, end.z, this.world.colliders)
    if (wallT !== null && wallT < hitT) {
      hitT = wallT
      hitHuman = null
    }

    const hitPoint = origin.clone().addScaledVector(dir, hitT * range)
    // muzzle from gun
    const muzzle = this.player.muzzle()
    this.muzzleLight.position.copy(muzzle)
    this.muzzleLight.intensity = 4
    this.muzzleT = 0.06
    this.particles.spawn(muzzle, { additive: true, color: 0xffd070, life: 0.08, size: 1.4, sizeEnd: 0.6 })

    this.spawnTracer(muzzle, hitPoint)

    if (hitHuman) {
      const dmg = w.def.dmg * (head ? 2 : 1)
      this.damageHuman(hitHuman, dmg, hitPoint, time)
      this.particles.burst(hitPoint, 5, { color: 0x8a1a10, life: 0.4, size: 0.5, sizeEnd: 1.4, speed: 3, gravity: 6 })
      this.sfx.hit()
    } else {
      // dust/spark on wall or ground
      this.particles.burst(hitPoint, 4, { additive: true, color: 0xd8c090, life: 0.3, size: 0.4, sizeEnd: 1.2, speed: 2.5, gravity: 4 })
    }

    // recoil
    this.player.camPitch = clamp(this.player.camPitch + 0.012, -0.85, 1.3)

    // firing near people = crime
    if (this.stars < 5) {
      for (const h of this.humans) {
        if (h.state === 'dead') continue
        const d = h.pos.distanceToSquared(playerPos)
        if (d < 26 * 26 && (h.team === 'civ' || h.team === 'cop')) {
          this.addCrime(h.team === 'cop' ? 22 : 12, time)
          break
        }
      }
    }
    return true
  }

  private findAssist(camera: THREE.PerspectiveCamera, playerPos: THREE.Vector3, dir: THREE.Vector3): THREE.Vector3 | null {
    let best: THREE.Vector3 | null = null
    let bestDot = 0.992 // ~7.2deg
    for (const h of this.humans) {
      if (h.state === 'dead') continue
      const to = h.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(camera.position)
      const d = to.length()
      if (d > 90) continue
      to.normalize()
      const dot = to.dot(dir)
      if (dot > bestDot && segmentVsColliders(playerPos.x, playerPos.z, h.pos.x, h.pos.z, this.world.colliders) === null) {
        bestDot = dot
        best = to
      }
    }
    return best
  }

  reload() {
    const w = this.weapon
    if (this.reloadT > 0 || w.mag >= w.def.mag || w.reserve <= 0) return
    this.reloadT = w.def.reload
    this.sfx.reload()
  }

  switchWeapon(i: number) {
    if (i >= 0 && i < this.weapons.length && this.weapons[i].owned && i !== this.current) {
      this.current = i
      this.reloadT = 0
      this.sfx.click()
    }
  }
  cycleWeapon() {
    for (let k = 1; k <= this.weapons.length; k++) {
      const i = (this.current + k) % this.weapons.length
      if (this.weapons[i].owned) { this.switchWeapon(i); return }
    }
  }

  /* ================= damage & death ================= */
  damageHuman(h: HumanEnt, dmg: number, at: THREE.Vector3, time: number) {
    if (h.state === 'dead') return
    h.health -= dmg
    // alert
    if (h.team === 'civ') {
      h.state = 'flee'
      this.panicNearby(h.pos, time)
    } else {
      h.state = 'engage'
    }
    if (h.health <= 0) this.killHuman(h, time, true)
    void at
  }

  private killHuman(h: HumanEnt, time: number, byPlayer: boolean) {
    h.state = 'dead'
    h.deadT = 0
    this.sfx.kill()
    this.hooks.onKill(h.team, h.pos.clone(), h.camp)
    if (byPlayer) {
      if (h.team === 'civ') this.addCrime(85, time)
      else if (h.team === 'cop') this.addCrime(100, time)
      // drops
      if (h.team === 'bandit' || h.team === 'duelist') {
        this.spawnPickup('cash', randi(15, 60), h.pos)
      } else if (h.team === 'cop' && Math.random() < 0.5) {
        this.spawnPickup('cash', randi(20, 40), h.pos)
      } else if (h.team === 'civ' && Math.random() < 0.6) {
        this.spawnPickup('cash', randi(5, 25), h.pos)
      }
      if ((h.team === 'bandit' || h.team === 'cop') && Math.random() < 0.35) {
        this.spawnPickup('ammo', this.weapon.def.id === 'rifle' ? 6 : 12, h.pos)
      }
    }
  }

  private panicNearby(pos: THREE.Vector3, time: number) {
    for (const h of this.humans) {
      if (h.team === 'civ' && h.state !== 'dead' && h.pos.distanceToSquared(pos) < 30 * 30) {
        h.state = 'flee'
        h.wanderT = 0
      }
    }
    void time
  }

  /* vehicle run-over check */
  onVehicleHitPed(front: THREE.Vector3, speed: number) {
    if (speed < 6) return
    for (const h of this.humans) {
      if (h.state === 'dead') continue
      if (h.pos.distanceToSquared(front) < 1.8 * 1.8) {
        const time = this.timeNow
        this.particles.burst(h.pos.clone().add(new THREE.Vector3(0, 1, 0)), 8, { color: 0x8a1a10, life: 0.5, size: 0.6, sizeEnd: 1.6, speed: 4, gravity: 7 })
        this.killHuman(h, time, true)
        if (h.team === 'civ') this.addCrime(70, time)
        else if (h.team === 'cop') this.addCrime(90, time)
      }
    }
  }

  private timeNow = 0

  /* explosion damage */
  onExplosion(pos: THREE.Vector3) {
    const time = this.timeNow
    // player
    const pd = this.player.pos.distanceTo(pos)
    if (pd < 10 && !this.player.dead) {
      this.player.damage(60 - pd * 4.5, time)
      if (this.player.dead) this.hooks.onPlayerDeath()
    }
    for (const h of this.humans) {
      if (h.state === 'dead') continue
      const d = h.pos.distanceTo(pos)
      if (d < 10) {
        this.damageHuman(h, 90 - d * 7, h.pos, time)
      }
    }
  }

  /* ================= pickups ================= */
  spawnPickup(kind: Pickup['kind'], amount: number, pos: THREE.Vector3) {
    const mesh = makePickupMesh(kind)
    mesh.position.copy(pos).setY(0.35)
    this.scene.add(mesh)
    this.pickups.push({ kind, amount, mesh, pos: mesh.position.clone(), t: rand(0, 6) })
  }

  /* ================= buy ================= */
  buyWeapon(idx: number): string | null {
    const w = this.weapons[idx]
    if (w.owned) return 'قبلاً خریده‌اید'
    if (this.player.money < w.def.price) return 'پول کافی ندارید'
    this.player.money -= w.def.price
    w.owned = true
    w.mag = w.def.mag
    w.reserve = w.def.ammoPack
    this.current = idx
    this.sfx.buy()
    return null
  }
  buyAmmo(): string | null {
    const w = this.weapon
    if (this.player.money < w.def.ammoCost) return 'پول کافی ندارید'
    this.player.money -= w.def.ammoCost
    w.reserve += w.def.ammoPack
    this.sfx.buy()
    return null
  }
  buyHealth(): string | null {
    if (this.player.health >= 100) return 'سلامتی کامل است'
    if (this.player.money < 30) return 'پول کافی ندارید'
    this.player.money -= 30
    this.player.health = 100
    this.sfx.buy()
    return null
  }

  /* ================= cops spawn ================= */
  spawnCop(pos: THREE.Vector3) {
    const n = this.countTeam('cop', true)
    const want = Math.min(7, this.stars * 2)
    if (n >= want) return
    // find road point 35-65 away
    const { nodes } = this.world.graph
    const cands = nodes.filter(nn => {
      const d = Math.hypot(nn.x - pos.x, nn.z - pos.z)
      return d > 30 && d < 70
    })
    const at = cands.length ? pick(cands) : { x: pos.x + rand(-40, 40), z: pos.z + rand(-40, 40) }
    this.spawnHuman('cop', new THREE.Vector3(at.x, 0, at.z))
  }

  private countTeam(team: Team, alive: boolean) {
    return this.humans.filter(h => h.team === team && (!alive || h.state !== 'dead')).length
  }

  /* ================= tracers ================= */
  private spawnTracer(a: THREE.Vector3, b: THREE.Vector3) {
    const m = this.tracerPool.find(t => !t.visible)
    if (!m) return
    const len = a.distanceTo(b)
    if (len < 0.5) return
    m.visible = true
    m.position.copy(a)
    m.lookAt(b)
    m.scale.set(1, 1, len)
    this.tracers.push({ mesh: m, t: 0.09 })
  }

  /* ================= update ================= */
  update(dt: number, playerPos: THREE.Vector3, playerSpeed: number, camera: THREE.PerspectiveCamera, time: number, inVehicle: Vehicle | null) {
    this.timeNow = time
    this.playerPos = playerPos
    this.playerSpeed = playerSpeed
    this.fireCd = Math.max(0, this.fireCd - dt)

    // reload
    if (this.reloadT > 0) {
      this.reloadT -= dt
      if (this.reloadT <= 0) {
        const w = this.weapon
        const need = w.def.mag - w.mag
        const take = Math.min(need, w.reserve)
        w.mag += take
        w.reserve -= take
      }
    }

    // muzzle light decay
    if (this.muzzleT > 0) {
      this.muzzleT -= dt
      if (this.muzzleT <= 0) this.muzzleLight.intensity = 0
    }

    // tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i]
      tr.t -= dt
      const mat = tr.mesh.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0, tr.t / 0.09) * 0.9
      if (tr.t <= 0) {
        tr.mesh.visible = false
        this.tracers.splice(i, 1)
      }
    }

    // humans
    const pp = playerPos
    for (let i = this.humans.length - 1; i >= 0; i--) {
      const h = this.humans[i]
      if (h.state === 'dead') {
        h.deadT += dt
        // fall animation
        h.parts.group.rotation.x = Math.min(Math.PI / 2, h.deadT * 5)
        if (h.deadT > 9) {
          this.scene.remove(h.parts.group)
          this.humans.splice(i, 1)
        }
        continue
      }
      this.updateHuman(h, dt, pp, time, inVehicle)
    }

    // pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]
      p.t += dt
      p.mesh.rotation.y += dt * 2
      p.mesh.position.y = 0.35 + Math.sin(p.t * 3) * 0.12
      if (p.mesh.position.distanceToSquared(pp) < 2 * 2) {
        this.collect(p, time)
        this.scene.remove(p.mesh)
        this.pickups.splice(i, 1)
      } else if (p.t > 60) {
        this.scene.remove(p.mesh)
        this.pickups.splice(i, 1)
      }
    }

    // cop spawning (foot)
    if (this.stars >= 1) {
      this.copSpawnT -= dt
      if (this.copSpawnT <= 0) {
        this.copSpawnT = 4.5
        this.spawnCop(pp)
      }
    }

    this.starsDecay(dt, time)
    void camera
  }

  private collect(p: Pickup, time: number) {
    if (p.kind === 'cash') {
      this.player.money += p.amount
      this.sfx.cash()
    } else if (p.kind === 'ammo') {
      const w = this.weapon
      w.reserve += p.amount
      this.sfx.pickup()
    } else {
      this.player.health = Math.min(100, this.player.health + 40)
      this.sfx.pickup()
    }
    void time
  }

  private updateHuman(h: HumanEnt, dt: number, pp: THREE.Vector3, time: number, inVehicle: Vehicle | null) {
    const d = h.pos.distanceTo(pp)
    h.losT -= dt
    if (h.losT <= 0) {
      h.losT = 0.4 + Math.random() * 0.2
      h.hasLOS = segmentVsColliders(h.pos.x, h.pos.z, pp.x, pp.z, this.world.colliders) === null
    }

    let moveTarget: THREE.Vector3 | null = null
    let wantSpeed = 0

    if (h.team === 'civ') {
      if (h.state === 'flee') {
        const away = h.pos.clone().sub(pp).normalize().multiplyScalar(30).add(h.pos)
        moveTarget = away
        wantSpeed = 6.2
        if (d > 42) { h.state = 'idle'; h.wander.copy(h.pos) }
      } else {
        h.wanderT -= dt
        if (h.wanderT <= 0) {
          h.wanderT = rand(4, 9)
          h.wander.copy(h.home).add(new THREE.Vector3(rand(-22, 22), 0, rand(-22, 22)))
        }
        if (h.pos.distanceToSquared(h.wander) > 2) {
          moveTarget = h.wander
          wantSpeed = 1.7
        }
        if (this.stars >= 3 && d < 24 && h.hasLOS) h.state = 'flee'
      }
    } else if (h.team === 'cop' && this.stars === 0) {
      // walk away & despawn
      const away = h.pos.clone().sub(pp).normalize().multiplyScalar(40).add(h.pos)
      moveTarget = away
      wantSpeed = 5
      if (d > 55) {
        this.scene.remove(h.parts.group)
        const idx = this.humans.indexOf(h)
        if (idx >= 0) this.humans.splice(idx, 1)
        return
      }
    } else {
      // bandit / cop / duelist combat
      const engageRange = h.team === 'cop' ? 46 : h.team === 'duelist' ? 40 : 38
      if (this.player.dead) {
        h.state = 'idle'
      } else if (d < engageRange || h.state === 'engage') {
        if (d > engageRange * 1.3) h.state = 'idle'
        else h.state = 'engage'
      }
      if (h.state === 'engage' && h.hasLOS) {
        // strafe/hold position
        const ideal = rand(12, 15)
        if (d > ideal + 3) {
          moveTarget = pp.clone()
          wantSpeed = 5.4
        } else if (d < ideal - 4) {
          const away = h.pos.clone().sub(pp).normalize().multiplyScalar(6).add(h.pos)
          moveTarget = away
          wantSpeed = 4.6
        } else {
          const perp = new THREE.Vector3(pp.z - h.pos.z, 0, -(pp.x - h.pos.x)).normalize().multiplyScalar(h.strafe * 4)
          moveTarget = h.pos.clone().add(perp)
          wantSpeed = 2.4
          if (Math.random() < dt * 0.4) h.strafe *= -1
        }
        // face player
        h.yaw = lerpAngle(h.yaw, Math.atan2(pp.x - h.pos.x, pp.z - h.pos.z), 1 - Math.exp(-8 * dt))
        // shoot
        h.fireT -= dt
        if (h.fireT <= 0 && d < 55) {
          h.fireT = h.team === 'cop' ? rand(0.9, 1.5) : h.team === 'duelist' ? rand(0.7, 1.2) : rand(1.1, 2.2)
          this.enemyShoot(h, pp, d, inVehicle)
        }
      } else if (h.state === 'engage' || d < 60) {
        // lost LOS → move toward last known
        moveTarget = pp.clone()
        wantSpeed = 5.2
      } else {
        // idle wander near home
        h.wanderT -= dt
        if (h.wanderT <= 0) {
          h.wanderT = rand(5, 10)
          h.wander.copy(h.home).add(new THREE.Vector3(rand(-10, 10), 0, rand(-10, 10)))
        }
        if (h.pos.distanceToSquared(h.wander) > 2) {
          moveTarget = h.wander
          wantSpeed = 1.6
        }
      }
    }

    // movement
    if (moveTarget && wantSpeed > 0.1) {
      const dx = moveTarget.x - h.pos.x
      const dz = moveTarget.z - h.pos.z
      const dl = Math.hypot(dx, dz)
      if (dl > 0.6) {
        const step = Math.min(wantSpeed * dt, dl)
        h.pos.x += (dx / dl) * step
        h.pos.z += (dz / dl) * step
        if (h.state !== 'engage') h.yaw = lerpAngle(h.yaw, Math.atan2(dx, dz), 1 - Math.exp(-8 * dt))
        h.speed = wantSpeed
      } else {
        h.speed = 0
      }
    } else {
      h.speed = 0
    }

    // collide with world (cheap: only near buildings)
    if (h.speed > 0.1) {
      for (const b of this.world.colliders) {
        if (Math.abs(h.pos.x - b.x) > b.hw + 0.5 || Math.abs(h.pos.z - b.z) > b.hd + 0.5) continue
        const cx = clamp(h.pos.x, b.x - b.hw, b.x + b.hw)
        const cz = clamp(h.pos.z, b.z - b.hd, b.z + b.hd)
        const dx = h.pos.x - cx
        const dz = h.pos.z - cz
        const d2 = dx * dx + dz * dz
        if (d2 < 0.25 && d2 > 0.0001) {
          const dd = Math.sqrt(d2)
          h.pos.x += (dx / dd) * (0.5 - dd)
          h.pos.z += (dz / dd) * (0.5 - dd)
        }
      }
    }

    h.phase += h.speed * dt * 2.1
    const armed = h.team !== 'civ' && (h.state === 'engage' || h.speed > 0.1)
    animateHuman(h.parts, h.phase, h.speed, armed && h.state === 'engage', 0)
    h.parts.group.position.copy(h.pos)
    h.parts.group.rotation.y = h.yaw
    void time
  }

  private enemyShoot(h: HumanEnt, pp: THREE.Vector3, d: number, inVehicle: Vehicle | null) {
    this.sfx.enemyShot(d)
    const from = h.pos.clone().add(new THREE.Vector3(0, 1.35, 0))
    // hit chance
    let chance = 0.42 - d * 0.006 - this.playerSpeed * 0.018
    if (inVehicle && inVehicle.kind === 'car') chance -= 0.12
    if (!h.hasLOS) chance = 0
    if (Math.random() < clamp(chance, 0.05, 0.42)) {
      const to = pp.clone().add(new THREE.Vector3(0, 1.3, 0))
      this.spawnTracer(from, to)
      const dmg = h.team === 'cop' ? rand(5, 9) : h.team === 'duelist' ? rand(9, 14) : rand(6, 11)
      if (inVehicle) {
        // damage vehicle instead
        this.vehicles.damage(inVehicle, dmg * 0.7, false)
        this.particles.burst(to, 3, { additive: true, color: 0xffe0a0, life: 0.2, size: 0.4, sizeEnd: 1, speed: 2 })
      } else {
        this.player.damage(dmg, this.timeNow)
        if (this.player.dead) this.hooks.onPlayerDeath()
      }
    } else {
      const miss = pp.clone().add(new THREE.Vector3(rand(-2.5, 2.5), rand(0.5, 2.2), rand(-2.5, 2.5)))
      this.spawnTracer(from, miss)
      this.particles.burst(miss, 2, { additive: true, color: 0xd8c090, life: 0.25, size: 0.3, sizeEnd: 1, speed: 2 })
    }
  }

  /* mission helpers */
  banditsAliveNear(pos: THREE.Vector3, r: number) {
    return this.humans.filter(h => h.team === 'bandit' && h.state !== 'dead' && h.pos.distanceToSquared(pos) < r * r).length
  }
  spawnDuelists(pos: THREE.Vector3): HumanEnt[] {
    const arr: HumanEnt[] = []
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2
      const h = this.spawnHuman('duelist', new THREE.Vector3(pos.x + Math.cos(a) * 9, 0, pos.z + Math.sin(a) * 9))
      h.state = 'engage'
      arr.push(h)
    }
    return arr
  }
  setHeatForEscape() {
    this.heat = 380
    this.stars = 4
    this.lastCrime = this.timeNow
    this.hooks.onStarsChange(4)
  }
  forceSpawnCops(n: number) {
    for (let i = 0; i < n; i++) this.spawnCop(this.playerPos)
  }

  /* ammo info for hud */
  hudWeapon() {
    const w = this.weapon
    return { name: w.def.name, mag: w.mag, reserve: w.reserve, reloading: this.reloadT > 0 }
  }

  faAmmo() {
    const w = this.weapon
    return `${faNum(w.mag)} / ${faNum(w.reserve)}`
  }

  /* minimap entity data */
  mapEntities() {
    const out: { x: number; z: number; t: string }[] = []
    for (const h of this.humans) {
      if (h.state === 'dead') continue
      if (h.team === 'cop') out.push({ x: h.pos.x, z: h.pos.z, t: 'cop' })
      else if (h.team === 'bandit' || h.team === 'duelist') out.push({ x: h.pos.x, z: h.pos.z, t: 'enemy' })
    }
    for (const p of this.pickups) out.push({ x: p.pos.x, z: p.pos.z, t: 'pickup' })
    return out
  }

  colliders(): Box2[] {
    return this.world.colliders
  }

  dispose() {
    for (const h of this.humans) this.scene.remove(h.parts.group)
    for (const p of this.pickups) this.scene.remove(p.mesh)
    for (const t of this.tracerPool) this.scene.remove(t)
    this.scene.remove(this.muzzleLight)
    // giver beacons are added by missions
    this.humans = []
    this.pickups = []
  }
}

/* ray-sphere intersection: returns t (distance along normalized dir) or null */
function raySphere(o: THREE.Vector3, d: THREE.Vector3, c: THREE.Vector3, r: number): number | null {
  const ox = o.x - c.x
  const oy = o.y - c.y
  const oz = o.z - c.z
  const b = ox * d.x + oy * d.y + oz * d.z
  const cc = ox * ox + oy * oy + oz * oz - r * r
  const disc = b * b - cc
  if (disc < 0) return null
  const t = -b - Math.sqrt(disc)
  return t > 0 ? t : null
}
