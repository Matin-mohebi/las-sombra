import * as THREE from 'three'
import { World, WORLD_HALF } from './world'
import { Sfx } from './audio'
import { Input } from './input'
import { Particles } from './particles'
import { Vehicles } from './vehicles'
import { Player } from './player'
import { Combat } from './combat'
import { Missions } from './missions'
import { Hud } from './hud'
import { Coins } from './collectibles'
import { texGlow, clamp, smoothstep, lerp, faNum } from './utils'

const SAVE_KEY = 'lasombra_save_v1'

interface SaveData {
  money?: number
  weapons?: { owned: boolean; mag: number; reserve: number }[]
  current?: number
  quality?: 'low' | 'med' | 'high'
  muted?: boolean
  coins?: number[]
}

export type Quality = 'low' | 'med' | 'high'

export class Game {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private raf = 0
  private disposed = false

  private world: World
  private sfx = new Sfx()
  private input: Input
  private particles: Particles
  private vehicles: Vehicles
  private player: Player
  private combat: Combat
  private missions: Missions
  private hud: Hud

  private quality: Quality
  private timeHour = 9.4
  private dayLength = 520
  private time = 0
  started = false
  paused = false
  private menuOpen = false
  private lastSave = 0
  private policeSpawnT = 0
  private markerCd = 0
  private respawnPending = false
  private coins!: Coins

  // weather
  private rainT = 0
  private rainTarget = 0
  private weatherT = 110
  private garageCd = 0

  // sky
  private skyMat!: THREE.ShaderMaterial
  private stars!: THREE.Points
  private starsMat!: THREE.PointsMaterial
  private moon!: THREE.Sprite
  private sunLight!: THREE.DirectionalLight
  private hemi!: THREE.HemisphereLight
  private clouds: { sprite: THREE.Sprite; base: THREE.Vector3; speed: number }[] = []

  constructor(private container: HTMLElement) {
    /* ---------- quality ---------- */
    const saved = this.loadSave()
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window
    this.quality = saved.quality ?? (isTouch ? 'low' : 'high')

    /* ---------- renderer ---------- */
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: this.quality !== 'low', powerPreference: 'high-performance' })
    } catch {
      this.showWebglError()
      throw new Error('WebGL not available')
    }
    this.renderer = renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === 'low' ? 1 : this.quality === 'med' ? 1.5 : 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = this.quality !== 'low'
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;touch-action:none'
    container.appendChild(renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.4, 2000)
    this.scene.fog = new THREE.Fog(0xc8dde8, 60, this.quality === 'low' ? 340 : this.quality === 'med' ? 460 : 580)

    /* ---------- world & systems ---------- */
    this.world = new World(this.quality)
    this.scene.add(this.world.group)
    this.buildSky()

    this.particles = new Particles(this.scene)
    this.input = new Input(renderer.domElement, () => this.togglePause())
    this.hud = new Hud(container, this.input, {
      onStart: () => this.startGame(),
      onResume: () => { if (this.player?.dead) this.respawn(); else this.resume() },
      onRestart: () => { location.reload() },
      onAccept: (id) => {
        const def = this.missions.defs.find(d => d.id === id)
        if (def) { this.missions.startMission(def); this.menuOpen = false; this.resume() }
      },
      onDecline: () => { this.menuOpen = false; this.resume() },
      onBuyWeapon: (i) => this.combat.buyWeapon(i),
      onBuyAmmo: () => this.combat.buyAmmo(),
      onBuyHealth: () => this.combat.buyHealth(),
      onQuality: (q) => { this.quality = q; this.persist() },
      onToggleSound: () => { this.sfx.setMuted(!this.sfx.muted); this.persist() },
    }, this.world)
    this.hud.lastQuality = this.quality
    this.hud.lastMuted = false

    this.vehicles = new Vehicles(this.scene, this.world, this.sfx, this.particles, this.input, this.quality)
    this.player = new Player(this.scene, this.world, this.vehicles, this.sfx, this.world.spots.start)
    this.combat = new Combat(this.scene, this.world, this.sfx, this.particles, this.vehicles, this.player, this.quality)
    this.missions = new Missions(this.scene, this.world, this.combat, this.vehicles, this.player, this.sfx)
    this.coins = new Coins(this.scene, this.world, this.quality, saved.coins ?? [], (c, t, all) => this.onCoin(c, t, all))

    /* ---------- hooks ---------- */
    this.vehicles.hooks = {
      onJack: () => { this.combat.addCrime(28, this.time) },
      onPedHit: (pos, speed, byPlayer) => { if (byPlayer) this.combat.onVehicleHitPed(pos, speed) },
      onExplosion: (pos) => this.combat.onExplosion(pos),
      deployCops: (pos) => { if (this.combat.stars > 0) this.combat.spawnCop(pos) },
      crash: () => {},
    }
    this.combat.hooks = {
      onKill: (team, pos, camp) => this.missions.notifyKill(team, pos, camp),
      onStarsChange: () => {},
      onPlayerDeath: () => this.onDeath(),
    }
    this.missions.onComplete = (def) => {
      this.hud.toast(`مأموریت کامل شد — ${faNum(def.reward)} دلار`, 'gold')
    }
    this.missions.onFail = (_def, reason) => this.hud.toast(`مأموریت ناتمام ماند: ${reason}`, 'bad')

    // load save into player/combat
    if (saved.money !== undefined) this.player.money = saved.money
    if (saved.weapons) {
      saved.weapons.forEach((w, i) => {
        if (this.combat.weapons[i]) {
          Object.assign(this.combat.weapons[i], { owned: w.owned, mag: w.mag, reserve: w.reserve })
        }
      })
    }
    if (saved.current !== undefined && this.combat.weapons[saved.current]?.owned) {
      this.combat.current = saved.current
    }
    if (saved.muted) this.sfx.setMuted(true)

    this.vehicles.spawnAll()
    this.combat.spawnBandits()
    this.combat.spawnFarmRaiders()
    this.combat.spawnCivilians()

    // events
    window.addEventListener('resize', this.onResize)
    document.addEventListener('visibilitychange', this.onVis)
    renderer.domElement.addEventListener('click', () => {
      if (this.started && !this.paused && !this.input.isTouch && !this.input.pointerLocked) this.input.requestLock()
    })

    this.hud.setTouchVisible(this.input.isTouch)
    this.hud.showStart(this.quality, this.sfx.muted)

    // dev/debug hook
    ;(window as unknown as Record<string, unknown>).__game = this

    // fire lights for camps handled by world; ambient loop
    this.loop()
  }

  private showWebglError() {
    const d = document.createElement('div')
    d.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:#111;font-family:Tahoma;z-index:99;text-align:center;padding:20px'
    d.textContent = 'مرورگر شما از WebGL پشتیبانی نمی‌کند. لطفاً با کروم یا فایرفاکس به‌روز باز کنید.'
    this.container.appendChild(d)
  }

  /* ================= sky ================= */
  private buildSky() {
    const geo = new THREE.SphereGeometry(1250, 28, 14)
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x3f7cc4) },
        bottomColor: { value: new THREE.Color(0xcfe4ee) },
        sunDir: { value: new THREE.Vector3(0, 1, 0) },
        sunColor: { value: new THREE.Color(0xfff2d8) },
      },
      vertexShader: `
        varying vec3 vDir;
        void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 sunDir; uniform vec3 sunColor;
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 col = mix(bottomColor, topColor, pow(h, 0.55));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * pow(s, 260.0) * 1.4;
          col += sunColor * pow(s, 9.0) * 0.16;
          gl_FragColor = vec4(col, 1.0);
        }`,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
    const dome = new THREE.Mesh(geo, this.skyMat)
    dome.frustumCulled = false
    this.scene.add(dome)

    // stars
    const starGeo = new THREE.BufferGeometry()
    const n = 700
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const e = Math.random() * Math.PI * 0.48
      const r = 1150
      pos[i * 3] = Math.cos(a) * Math.cos(e) * r
      pos[i * 3 + 1] = Math.sin(e) * r + 30
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.starsMat = new THREE.PointsMaterial({ color: 0xcdd8ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })
    this.stars = new THREE.Points(starGeo, this.starsMat)
    this.stars.frustumCulled = false
    this.scene.add(this.stars)

    // moon
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xdfe8ff, transparent: true, opacity: 0, fog: false, depthWrite: false }))
    this.moon.scale.setScalar(70)
    this.scene.add(this.moon)

    // clouds
    const cloudTex = texGlow()
    const nC = this.quality === 'low' ? 7 : 14
    for (let i = 0; i < nC; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffffff, transparent: true, opacity: 0.26, fog: false, depthWrite: false }))
      const base = new THREE.Vector3(-900 + Math.random() * 1800, 190 + Math.random() * 130, -900 + Math.random() * 1800)
      s.position.copy(base)
      s.scale.setScalar(120 + Math.random() * 160)
      this.scene.add(s)
      this.clouds.push({ sprite: s, base, speed: 2 + Math.random() * 3 })
    }

    // lights
    this.hemi = new THREE.HemisphereLight(0xbfd8e8, 0x8a7048, 0.55)
    this.scene.add(this.hemi)
    this.sunLight = new THREE.DirectionalLight(0xfff2d8, 2.4)
    this.sunLight.castShadow = this.quality !== 'low'
    const ss = this.quality === 'high' ? 2048 : 1024
    this.sunLight.shadow.mapSize.set(ss, ss)
    this.sunLight.shadow.camera.left = -95
    this.sunLight.shadow.camera.right = 95
    this.sunLight.shadow.camera.top = 95
    this.sunLight.shadow.camera.bottom = -95
    this.sunLight.shadow.camera.near = 20
    this.sunLight.shadow.camera.far = 420
    this.sunLight.shadow.bias = -0.0004
    this.scene.add(this.sunLight)
    this.scene.add(this.sunLight.target)
  }

  /* ================= lifecycle ================= */
  private startGame() {
    this.started = true
    this.paused = false
    this.sfx.init()
    this.sfx.resume()
    this.sfx.windStart()
    this.sfx.ambientStart()
    this.hud.hideOverlays()
    this.input.enabled = true
    this.hud.setPlayingUI(true)
    if (!this.input.isTouch) this.input.requestLock()
    this.hud.toast('به لاس سومبرا خوش آمدی — نشانگرهای طلایی را دنبال کن', 'gold')
  }

  private togglePause() {
    if (!this.started || this.menuOpen || this.respawnPending) return
    if (this.paused) this.resume()
    else this.pause()
  }
  private pause() {
    if (this.paused) return
    this.paused = true
    this.input.enabled = false
    this.input.releaseLock()
    this.input.clearQueue()
    this.sfx.engineUpdate(0, 0, false)
    this.sfx.sirenVol(0)
    this.sfx.rainUpdate(0)
    this.hud.showPause()
  }
  /** pause without showing the pause menu (used when a game panel opens) */
  private softPause() {
    this.paused = true
    this.input.enabled = false
    this.input.releaseLock()
    this.input.clearQueue()
    this.sfx.engineUpdate(0, 0, false)
    this.sfx.sirenVol(0)
  }
  private resume() {
    this.paused = false
    this.menuOpen = false
    this.hud.hideOverlays()
    this.input.enabled = true
    this.hud.setPlayingUI(true)
    this.sfx.resume()
    if (!this.input.isTouch) this.input.requestLock()
  }

  private onDeath() {
    if (this.respawnPending) return
    this.respawnPending = true
    setTimeout(() => {
      this.hud.showDeath(Math.min(100, this.player.money))
      this.respawnPending = false
    }, 1200)
    this.sfx.engineUpdate(0, 0, false)
  }

  private respawn() {
    const fee = Math.min(100, this.player.money)
    this.player.money -= fee
    // leave vehicle first, then move to hospital
    if (this.vehicles.playerVehicle) this.vehicles.exit()
    this.hud.fadeBlack(true, 400)
    setTimeout(() => {
      this.player.respawn(this.world.spots.hospital, this.time)
      this.combat.clearWanted()
      this.vehicles.clearPolice()
      this.hud.fadeBlack(false, 600)
      this.resume()
      this.hud.toast('دوباره سرپا شدی — مراقب باش!', 'info')
    }, 550)
  }

  /* ================= save ================= */
  private loadSave(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      return raw ? JSON.parse(raw) as SaveData : {}
    } catch {
      return {}
    }
  }
  private persist() {
    try {
      const data: SaveData = {
        money: Math.round(this.player.money),
        weapons: this.combat.weapons.map(w => ({ owned: w.owned, mag: w.mag, reserve: w.reserve })),
        current: this.combat.current,
        quality: this.quality,
        muted: this.sfx.muted,
        coins: Array.from(this.coins?.collected ?? []),
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch { /* ignore */ }
  }

  /* ================= loop ================= */
  private onResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }
  private onVis = () => {
    if (document.hidden && this.started && !this.paused) this.pause()
  }

  private tmpV = new THREE.Vector3()

  private loop = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(0.05, this.clock.getDelta())
    if (!this.started || this.paused) {
      // still render menu backdrop
      this.updateSky(0.0001)
      this.renderer.render(this.scene, this.camera)
      return
    }

    this.time += dt
    this.timeHour = (this.timeHour + dt * 24 / this.dayLength) % 24
    this.markerCd = Math.max(0, this.markerCd - dt)

    const inVehicle = this.vehicles.playerVehicle

    // one-shot inputs
    if (this.input.consume('enter') && !this.player.dead) {
      if (inVehicle) {
        const out = this.vehicles.exit()
        if (out) {
          this.player.pos.copy(out.pos)
          this.player.pos.y = 0
          this.sfx.door()
        }
      } else {
        const v = this.vehicles.nearest(this.player.pos, 4.6)
        if (v) {
          this.vehicles.enter(v)
          if (v.kind === 'horse') this.sfx.neigh()
          else this.sfx.door()
        }
      }
    }
    if (this.input.consume('reload')) this.combat.reload()
    if (this.input.consume('w1')) this.combat.switchWeapon(0)
    if (this.input.consume('w2')) this.combat.switchWeapon(1)
    if (this.input.consume('w3')) this.combat.switchWeapon(2)
    if (this.input.consume('w4')) this.combat.switchWeapon(3)
    if (this.input.consume('w5')) this.combat.switchWeapon(4)
    if (this.input.consume('wcycle')) this.combat.cycleWeapon()
    if (this.input.consume('horn') && inVehicle?.kind === 'car') this.sfx.horn()
    if (this.input.consume('sprint-toggle')) this.player.sprintToggle = !this.player.sprintToggle
    if (this.vehicles.playerVehicle) this.vehicles.playerVehicle.gallopToggle = this.player.sprintToggle

    // updates
    this.player.update(dt, this.input, this.camera, this.time, inVehicle)
    this.vehicles.update(dt, this.player.pos, this.nightFactor, !!inVehicle)
    this.combat.update(dt, this.player.pos, this.player.speed, this.camera, this.time, inVehicle)
    this.missions.update(dt, this.player.pos, this.time)
    this.coins.update(dt, this.player.pos)
    this.updateWeather(dt)
    this.particles.update(dt)
    this.world.update(this.nightFactor, dt)
    this.updateSky(dt)

    // fire (on foot)
    if (this.input.fireHeld && !inVehicle && !this.player.dead) {
      this.combat.tryFire(this.camera, this.player.pos, this.time, this.input.isTouch)
    }

    // engine sound
    if (inVehicle?.kind === 'car') {
      const throttle = this.input.move.y
      this.sfx.engineUpdate(inVehicle.speed, throttle, true)
    } else {
      this.sfx.engineUpdate(0, 0, false)
    }

    // police cars cadence
    const desiredCars = this.combat.stars >= 4 ? 3 : this.combat.stars >= 2 ? 2 : this.combat.stars >= 1 ? 1 : 0
    const aliveCops = this.vehicles.list.filter(v => v.isPolice && !v.dead && v.chase).length
    if (aliveCops < desiredCars) {
      this.policeSpawnT -= dt
      if (this.policeSpawnT <= 0) {
        this.policeSpawnT = 5
        this.vehicles.spawnPolice(this.player.pos)
      }
    }
    // siren
    const chasing = this.vehicles.list.some(v => v.isPolice && !v.dead && v.chase && v.pos.distanceToSquared(this.player.pos) < 130 * 130)
    if (chasing) this.sfx.sirenOn()
    else this.sfx.sirenOff()

    // wind
    this.sfx.windUpdate(this.player.speed + (inVehicle ? Math.abs(inVehicle.speed) * 0.7 : 0), this.nightFactor > 0.6)

    // campfire ambience particles
    if (this.quality !== 'low') {
      for (const fp of this.world.firePoints) {
        if (fp.distanceToSquared(this.player.pos) < 90 * 90 && Math.random() < dt * 22) {
          this.particles.spawn(fp.clone().add(new THREE.Vector3(rand2(-0.2, 0.2), rand2(0, 0.3), rand2(-0.2, 0.2))), {
            additive: true, color: 0xff8a30, life: rand2(0.5, 1), size: 0.9, sizeEnd: 0.2,
            vel: new THREE.Vector3(rand2(-0.3, 0.3), rand2(1.4, 2.4), rand2(-0.3, 0.3)),
          })
          if (Math.random() < 0.25) {
            this.particles.spawn(fp.clone().add(new THREE.Vector3(0, 1, 0)), {
              color: 0x555550, life: rand2(1.5, 2.5), size: 0.8, sizeEnd: 2.6,
              vel: new THREE.Vector3(rand2(-0.2, 0.2), rand2(1, 1.8), rand2(-0.2, 0.2)),
            })
          }
        }
      }
    }

    // markers (mission giver / shop) auto-open
    this.checkMarkers()

    // garage repair at gas stations
    this.garageCd = Math.max(0, this.garageCd - dt)
    if (inVehicle && inVehicle.kind === 'car' && inVehicle.health < 100 && this.garageCd <= 0 && this.nearGas()) {
      const cost = Math.ceil((100 - inVehicle.health) * 0.4)
      if (this.player.money >= cost) {
        this.player.money -= cost
        inVehicle.health = 100
        this.garageCd = 5
        this.sfx.buy()
        this.hud.toast(`خودرو تعمیر شد — ${faNum(cost)} دلار`, 'info')
        this.persist()
      } else {
        this.garageCd = 6
      }
    }

    // HUD
    const wpn = this.combat.hudWeapon()
    this.hud.vitals(
      this.player.health, this.player.stamina, this.player.money, this.combat.stars,
      wpn.name, `${faNum(wpn.mag)} / ${faNum(wpn.reserve)}`, wpn.reloading,
      inVehicle ? inVehicle.speed : null,
    )
    const obj = this.missions.objective()
    this.hud.objective(obj?.text ?? null, obj?.timer ?? null)
    this.hud.crosshair(this.player.aiming && !inVehicle)
    this.updatePrompt()
    this.hud.drawMap(
      this.player.pos.x, this.player.pos.z, this.player.camYaw,
      this.combat.mapEntities(), this.missions.mapTarget(), this.combat.stars,
    )

    // autosave
    if (this.time - this.lastSave > 6) {
      this.lastSave = this.time
      this.persist()
    }

    this.renderer.render(this.scene, this.camera)
  }

  private nightFactor = 0

  private updateSky(dt: number) {
    const a = ((this.timeHour - 6) / 12) * Math.PI // 6am: 0 (east horizon), noon: PI/2, 6pm: PI
    const sunDir = this.tmpV.set(Math.cos(a), Math.sin(a), -0.32).normalize().clone()
    const elev = sunDir.y
    const dayT = smoothstep(0.12, 0.38, elev)
    const nightF = clamp(smoothstep(0.02, -0.14, elev), 0, 1)
    this.nightFactor = nightF
    const duskT = Math.max(0, 1 - dayT - nightF)

    // palettes
    const topDay = new THREE.Color(0x3f7cc4), topDusk = new THREE.Color(0x2e3f74), topNight = new THREE.Color(0x05070f)
    const botDay = new THREE.Color(0xcfe4ee), botDusk = new THREE.Color(0xf0a45a), botNight = new THREE.Color(0x121a2c)
    const fogDay = new THREE.Color(0xc8dde8), fogDusk = new THREE.Color(0xe0a878), fogNight = new THREE.Color(0x0d141f)
    const top = new THREE.Color(
      topDay.r * dayT + topDusk.r * duskT + topNight.r * nightF,
      topDay.g * dayT + topDusk.g * duskT + topNight.g * nightF,
      topDay.b * dayT + topDusk.b * duskT + topNight.b * nightF,
    )
    const bot = new THREE.Color(
      botDay.r * dayT + botDusk.r * duskT + botNight.r * nightF,
      botDay.g * dayT + botDusk.g * duskT + botNight.g * nightF,
      botDay.b * dayT + botDusk.b * duskT + botNight.b * nightF,
    )
    const fog = new THREE.Color(
      fogDay.r * dayT + fogDusk.r * duskT + fogNight.r * nightF,
      fogDay.g * dayT + fogDusk.g * duskT + fogNight.g * nightF,
      fogDay.b * dayT + fogDusk.b * duskT + fogNight.b * nightF,
    )
    this.skyMat.uniforms.topColor.value.copy(top)
    this.skyMat.uniforms.bottomColor.value.copy(bot)
    if (this.rainT > 0.01) {
      top.lerp(new THREE.Color(0x5a626c), 0.55 * this.rainT)
      bot.lerp(new THREE.Color(0x8a929a), 0.5 * this.rainT)
      this.skyMat.uniforms.topColor.value.copy(top)
      this.skyMat.uniforms.bottomColor.value.copy(bot)
    }
    ;(this.scene.fog as THREE.Fog).color.copy(fog).multiplyScalar(1 - 0.4 * this.rainT)

    // sun / moon
    const isDay = elev > 0.02
    const lightDir = isDay ? sunDir : sunDir.clone().negate()
    this.skyMat.uniforms.sunDir.value.copy(isDay ? sunDir : sunDir.clone().negate())
    const sunCol = new THREE.Color().lerpColors(new THREE.Color(0xffb46a), new THREE.Color(0xfff2d8), dayT)
    if (isDay) {
      this.skyMat.uniforms.sunColor.value.copy(sunCol)
      this.sunLight.color.copy(sunCol)
      this.sunLight.intensity = lerp(1.5, 2.5, dayT) * (1 - 0.55 * this.rainT)
    } else {
      this.skyMat.uniforms.sunColor.value.setRGB(0.55, 0.62, 0.8)
      this.sunLight.color.setHex(0x9db4d8)
      this.sunLight.intensity = 0.8 * (1 - 0.55 * this.rainT)
    }
    this.hemi.intensity = lerp(0.26, 0.58, dayT) * (1 - 0.3 * this.rainT)
    this.hemi.color.copy(bot).lerp(new THREE.Color(0xffffff), 0.4)

    // follow camera & player for shadow box
    const p = this.player ? this.player.pos : new THREE.Vector3()
    this.stars.position.set(p.x, 0, p.z)
    this.moon.position.set(p.x + lightDir.x * 1100, lightDir.y * 1100, p.z + lightDir.z * 1100)
    ;(this.moon.material as THREE.SpriteMaterial).opacity = nightF * 0.85
    this.starsMat.opacity = nightF * 0.9
    this.sunLight.position.set(p.x + lightDir.x * 190, Math.max(30, lightDir.y * 190), p.z + lightDir.z * 190)
    this.sunLight.target.position.set(p.x, 0, p.z)
    this.sunLight.target.updateMatrixWorld()

    // clouds drift
    for (const c of this.clouds) {
      c.base.x += c.speed * dt
      if (c.base.x > 1000) c.base.x = -1000
      if (this.camera) c.sprite.position.set(c.base.x, c.base.y, c.base.z)
      ;(c.sprite.material as THREE.SpriteMaterial).opacity = lerp(0.07, 0.28, dayT)
    }

    // stars twinkle? skip
    void dt
  }

  private updatePrompt() {
    if (this.player.dead) { this.hud.prompt(null); return }
    if (this.vehicles.playerVehicle) {
      this.hud.prompt(`<b>F</b> یا دکمه سوار — پیاده شدن`)
      this.hud.setEnterLabel('پیاده')
      return
    }
    const v = this.vehicles.nearest(this.player.pos, 4.6)
    if (v) {
      const name = v.kind === 'horse' ? 'اسب' : v.isPolice ? 'ماشین پلیس' : 'ماشین'
      this.hud.prompt(`<b>F</b> — سوار شدن روی ${name}`)
      this.hud.setEnterLabel('سوار')
      return
    }
    const giver = this.missions.giverNear(this.player.pos)
    if (giver) {
      this.hud.prompt(`مأموریت: <b>${giver.title}</b>`)
      this.hud.setEnterLabel(null)
      return
    }
    if (this.nearShop()) {
      this.hud.prompt('<b>مغازه اسلحه</b> — خرید تجهیزات')
      this.hud.setEnterLabel(null)
      return
    }
    this.hud.prompt(null)
    this.hud.setEnterLabel(null)
  }

  private nearShop(): boolean {
    for (const s of this.world.spots.gunShops) {
      if (Math.hypot(s.x - this.player.pos.x, s.z - this.player.pos.z) < 4) return true
    }
    return false
  }

  private nearGas(): boolean {
    for (const s of this.world.spots.gasStations) {
      if (Math.hypot(s.x - this.player.pos.x, s.z - this.player.pos.z) < 11) return true
    }
    return false
  }

  private onCoin(count: number, total: number, all: boolean) {
    this.player.money += 25
    this.sfx.pickup()
    this.hud.toast(`سکه گنج: ${faNum(count)} از ${faNum(total)} — ${faNum(25)} دلار`, 'gold')
    if (all) {
      this.player.money += 500
      this.sfx.jingleWin()
      this.hud.toast(`همه سکه‌های لاس سومبرا پیدا شد! جایزه ویژه: ${faNum(500)} دلار`, 'gold')
    }
    this.persist()
  }

  private updateWeather(dt: number) {
    this.weatherT -= dt
    if (this.weatherT <= 0) {
      if (this.rainTarget > 0.5) {
        this.rainTarget = 0
        this.weatherT = 150 + Math.random() * 170
      } else {
        this.rainTarget = 0.55 + Math.random() * 0.45
        this.weatherT = 70 + Math.random() * 70
        this.hud.toast('ابرها سنگین شد... باران در راه است', 'info')
      }
    }
    const before = this.rainT
    const delta = this.rainTarget - this.rainT
    this.rainT = clamp(this.rainT + clamp(delta, -dt / 8, dt / 8), 0, 1)
    if (before < 0.06 && this.rainT >= 0.06) this.hud.toast('باران گرفت', 'info')
    if (before > 0.06 && this.rainT <= 0.06) this.hud.toast('هوا صاف شد', 'info')
    this.sfx.rainUpdate(this.rainT)

    // falling rain streaks around the player
    if (this.rainT > 0.12) {
      const perFrame = this.quality === 'low' ? 4 : this.quality === 'med' ? 8 : 13
      for (let i = 0; i < perFrame; i++) {
        const a = Math.random() * Math.PI * 2
        const r = Math.random() * 22
        this.particles.spawn(new THREE.Vector3(
          this.player.pos.x + Math.cos(a) * r,
          11 + Math.random() * 4,
          this.player.pos.z + Math.sin(a) * r,
        ), {
          color: 0xaebfd8, life: 0.55, size: 0.16, sizeEnd: 0.08,
          vel: new THREE.Vector3(-3, -30, -1),
        })
      }
    }
  }

  private checkMarkers() {
    if (this.menuOpen || this.markerCd > 0 || this.player.dead) return
    const giver = this.missions.giverNear(this.player.pos)
    if (giver) {
      this.menuOpen = true
      this.softPause()
      this.hud.showMissionOffer(giver)
      return
    }
    if (this.nearShop()) {
      this.menuOpen = true
      this.softPause()
      const owned = this.combat.weapons.map(w => w.owned)
      const w = this.combat.weapon
      this.hud.showShop(owned, { pistol: 250, rifle: 600, shotgun: 450, smg: 850 }, true, `خشاب ${w.def.name} (${faNum(w.def.ammoPack)} تیر) — ${faNum(w.def.ammoCost)} دلار`)
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('visibilitychange', this.onVis)
    this.input.dispose()
    this.hud.dispose()
    this.sfx.dispose()
    this.vehicles.dispose()
    this.combat.dispose()
    this.missions.dispose()
    this.coins?.dispose(this.scene)
    this.sfx.rainStop()
    this.particles.dispose()
    this.persist()
    this.renderer.dispose()
    this.renderer.domElement.remove()
    this.scene.traverse(o => {
      const m = o as THREE.Mesh
      if (m.geometry) m.geometry.dispose()
    })
    void WORLD_HALF
  }
}

function rand2(a: number, b: number) {
  return a + Math.random() * (b - a)
}
