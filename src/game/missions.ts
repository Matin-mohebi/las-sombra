import * as THREE from 'three'
import { makeBeacon } from './entities'
import type { World } from './world'
import type { Combat, Team } from './combat'
import type { Vehicles } from './vehicles'
import type { Player } from './player'
import type { Sfx } from './audio'
import { clamp, faNum } from './utils'

export interface MissionDef {
  id: string
  title: string
  desc: string
  giver: { x: number; z: number }
  reward: number
}

interface Runtime {
  def: MissionDef
  stage: string
  timer: number
  data: Record<string, unknown>
  target: { x: number; z: number } | null
  objective: string
}

export class Missions {
  defs: MissionDef[] = []
  active: Runtime | null = null
  onComplete: ((def: MissionDef) => void) | null = null
  onFail: ((def: MissionDef, reason: string) => void) | null = null
  private giverMarkers: { def: MissionDef; mesh: THREE.Mesh }[] = []
  private targetBeacon: THREE.Mesh
  private cpBeacon: THREE.Mesh
  private killCount = 0
  private cpIndex = 0

  constructor(
    private scene: THREE.Scene,
    private world: World,
    private combat: Combat,
    private vehicles: Vehicles,
    private player: Player,
    private sfx: Sfx,
  ) {
    const g = world.spots.givers
    this.defs = [
      {
        id: 'delivery', title: 'تحویل مرسوله', giver: g.delivery, reward: 500,
        desc: 'یکی بسته‌ی مشکوک از اداره پست لاس سومبرا باید تا سالون سنگ‌سرخ برسد. وقت کم است — سریع باش.',
      },
      {
        id: 'bounty', title: 'شکار جایزه‌باز', giver: g.bounty, reward: 800,
        desc: 'کلانتر سنگ‌سرخ برای از بین بردن ۴ یاغی کمپ شرقی جایزه گذاشته. حواست به کمین باشد.',
      },
      {
        id: 'race', title: 'مسابقه خیابانی', giver: g.race, reward: 600,
        desc: 'راننده‌های زیرزمینی لاس سومبرا چالش گذاشته‌اند: ۸ ایستگاه کنترل در خیابان‌های شهر. ماشین لازم داری!',
      },
      {
        id: 'duel', title: 'دوئل غروب', giver: g.duel, reward: 700,
        desc: 'سه تیرانداز حرفه‌ای پشت سالون منتظر تو هستند. قانون قدیمی مرز: هرکس زود بکشد، زنده می‌ماند.',
      },
      {
        id: 'escape', title: 'فرار بزرگ', giver: g.escape, reward: 1500,
        desc: 'می‌خواهی شهرتی شبیه افسانه‌ها داشته باشی؟ ۴ ستاره‌ی تعقیب را ۷۵ ثانیه زنده بمان...',
      },
      {
        id: 'farmraid', title: 'راهزنان مزرعه', giver: g.farmraid, reward: 900,
        desc: 'راهزنان مزرعه دلگون را محاصره کرده‌اند و بار مزارع را می‌دزدند. کلانتر می‌گوید هر کدام را که از پا درآوردی، جایزه دارد. اسلحه خوب بردار!',
      },
      {
        id: 'convoy', title: 'کشتیر غله', giver: g.convoy, reward: 750,
        desc: 'بار غله‌ی مزرعه باید به انبار شهر برسد. اول بار را بردار، بعد تا انبار غربی شهر بران — قبل از غروب!',
      },
      {
        id: 'treasure', title: 'نقشه گنج', giver: g.treasure, reward: 650,
        desc: 'یک نقشه‌ی کهنه پای کلیسا پیدا شده: گنجی نزدیک «دکل رادیوی بیابان» دفن شده. نشان روی نقشه را دنبال کن.',
      },
    ]

    // giver markers (pulsing rings)
    for (const def of this.defs) {
      const mesh = makeBeacon(0xffd24a, 1.6, 26)
      mesh.position.set(def.giver.x, 13, def.giver.z)
      mesh.visible = true
      scene.add(mesh)
      this.giverMarkers.push({ def, mesh })
    }
    this.targetBeacon = makeBeacon(0xffa02a, 2.2, 60)
    this.targetBeacon.visible = false
    scene.add(this.targetBeacon)
    this.cpBeacon = makeBeacon(0x4ad8ff, 3.2, 40)
    this.cpBeacon.visible = false
    scene.add(this.cpBeacon)

    // kill notifications are relayed by engine via notifyKill()
  }

  notifyKill(team: Team, pos: THREE.Vector3, camp?: number) {
    if (!this.active) return
    const id = this.active.def.id
    if (id === 'bounty' && team === 'bandit' && camp === this.world.spots.bountyCamp) {
      this.killCount++
      const need = 4
      this.active.objective = `یاغی‌های کمپ شرقی را از بین ببر (${faNum(Math.min(this.killCount, need))} از ${faNum(need)})`
      if (this.killCount >= need) this.complete()
    } else if (id === 'farmraid' && team === 'bandit' && camp === 4) {
      this.killCount++
      const need = 6
      this.active.objective = `راهزنان مزرعه را از پا درآور (${faNum(Math.min(this.killCount, need))} از ${faNum(need)})`
      if (this.killCount >= need) this.complete()
    } else if (id === 'duel' && team === 'duelist') {
      this.killCount++
      if (this.killCount >= 3) this.complete()
    }
    void pos
  }

  startMission(def: MissionDef) {
    if (this.active) this.fail('مأموریت دیگری فعال است')
    this.active = { def, stage: 'start', timer: 0, data: {}, target: null, objective: def.title }
    for (const gm of this.giverMarkers) gm.mesh.visible = false
    this.killCount = 0
    this.cpIndex = 0

    switch (def.id) {
      case 'delivery': {
        this.active.stage = 'pickup'
        this.active.target = def.giver
        this.active.objective = 'مرسوله را از اداره پست بگیر'
        this.active.timer = 160
        break
      }
      case 'bounty': {
        const camp = this.world.camps[this.world.spots.bountyCamp]
        this.active.stage = 'hunt'
        this.active.target = { x: camp.x, z: camp.z }
        this.active.objective = 'یاغی‌های کمپ شرقی را از بین ببر (۰ از ۴)'
        break
      }
      case 'race': {
        this.active.stage = 'race'
        this.active.timer = 115
        this.cpIndex = 0
        const cp = this.world.spots.raceCp[0]
        this.active.target = cp
        this.active.objective = 'از ایستگاه‌های کنترل عبور کن (۱ از ۸)'
        break
      }
      case 'duel': {
        const spot = this.world.spots.duelSpot
        this.combat.spawnDuelists(new THREE.Vector3(spot.x, 0, spot.z))
        this.active.stage = 'fight'
        this.active.target = spot
        this.active.objective = 'هر سه تیرانداز را شکست بده (۰ از ۳)'
        break
      }
      case 'escape': {
        this.combat.setHeatForEscape()
        this.combat.forceSpawnCops(3)
        this.active.stage = 'survive'
        this.active.timer = 75
        this.active.target = null
        this.active.objective = '۷۵ ثانیه زنده بمان!'
        break
      }
      case 'farmraid': {
        this.active.stage = 'hunt'
        this.active.target = this.world.spots.farm
        this.active.objective = 'راهزنان مزرعه را از پا درآور (۰ از ۶)'
        break
      }
      case 'convoy': {
        this.active.stage = 'pickup'
        this.active.target = def.giver
        this.active.timer = 190
        this.active.objective = 'بار غله را از مزرعه بردار'
        break
      }
      case 'treasure': {
        this.active.stage = 'seek'
        this.active.target = this.world.spots.treasureSpot
        this.active.objective = 'به دکل رادیوی بیابان برس و گنج را بکاو'
        break
      }
    }
    this.sfx.checkpoint()
    this.updateBeacons()
  }

  private fail(reason: string) {
    const def = this.active?.def
    this.active = null
    this.targetBeacon.visible = false
    this.cpBeacon.visible = false
    for (const gm of this.giverMarkers) gm.mesh.visible = true
    this.sfx.jingleFail()
    this.onFail?.(def!, reason)
  }

  private complete() {
    const def = this.active!.def
    this.player.money += def.reward
    this.active = null
    this.targetBeacon.visible = false
    this.cpBeacon.visible = false
    for (const gm of this.giverMarkers) gm.mesh.visible = true
    this.sfx.jingleWin()
    this.onComplete?.(def)
  }

  private updateBeacons() {
    if (!this.active) {
      this.targetBeacon.visible = false
      this.cpBeacon.visible = false
      return
    }
    if (this.active.def.id === 'race') {
      const cp = this.world.spots.raceCp[this.cpIndex]
      this.cpBeacon.visible = true
      this.cpBeacon.position.set(cp.x, 20, cp.z)
      this.targetBeacon.visible = false
    } else if (this.active.target) {
      this.targetBeacon.visible = true
      this.targetBeacon.position.set(this.active.target.x, 30, this.active.target.z)
      this.cpBeacon.visible = false
    } else {
      this.targetBeacon.visible = false
      this.cpBeacon.visible = false
    }
  }

  update(dt: number, playerPos: THREE.Vector3, time: number) {
    // pulse markers
    const pulse = 0.7 + Math.sin(time * 3) * 0.25
    for (const gm of this.giverMarkers) {
      if (gm.mesh.visible) {
        ;(gm.mesh.material as THREE.MeshBasicMaterial).opacity = 0.22 * pulse
        gm.mesh.rotation.y += dt * 0.5
      }
    }
    ;(this.targetBeacon.material as THREE.MeshBasicMaterial).opacity = 0.24 * pulse
    ;(this.cpBeacon.material as THREE.MeshBasicMaterial).opacity = 0.3 * pulse
    this.cpBeacon.rotation.y -= dt * 0.8

    if (!this.active) {
      // check giver proximity → offer (engine handles UI)
      return
    }

    const m = this.active
    const def = m.def
    const dist = (p: { x: number; z: number }) => Math.hypot(p.x - playerPos.x, p.z - playerPos.z)

    switch (def.id) {
      case 'delivery': {
        m.timer -= dt
        if (m.timer <= 0) { this.fail('وقت تمام شد'); return }
        if (m.stage === 'pickup' && dist(def.giver) < 4) {
          m.stage = 'deliver'
          m.target = this.world.spots.deliveryDrop
          m.objective = 'مرسوله را به سالون سنگ‌سرخ برسان'
          this.sfx.checkpoint()
        } else if (m.stage === 'deliver' && dist(m.target!) < 5) {
          this.complete()
          return
        }
        break
      }
      case 'bounty': {
        break
      }
      case 'race': {
        m.timer -= dt
        if (m.timer <= 0) { this.fail('وقت تمام شد'); return }
        const cp = this.world.spots.raceCp[this.cpIndex]
        if (dist(cp) < 9) {
          this.cpIndex++
          this.sfx.checkpoint()
          if (this.cpIndex >= this.world.spots.raceCp.length) {
            this.complete()
            return
          }
          const next = this.world.spots.raceCp[this.cpIndex]
          m.target = next
          m.objective = `از ایستگاه‌های کنترل عبور کن (${faNum(this.cpIndex + 1)} از ${faNum(this.world.spots.raceCp.length)})`
          this.updateBeacons()
        }
        break
      }
      case 'duel': {
        break
      }
      case 'escape': {
        m.timer -= dt
        if (m.timer <= 0) { this.complete(); return }
        m.objective = `${faNum(Math.ceil(m.timer))} ثانیه زنده بمان!`
        // keep pressure
        if (Math.random() < dt * 0.25) this.combat.spawnCop(playerPos)
        break
      }
      case 'convoy': {
        m.timer -= dt
        if (m.timer <= 0) { this.fail('وقت تمام شد'); return }
        if (m.stage === 'pickup' && dist(def.giver) < 5) {
          m.stage = 'deliver'
          m.target = this.world.spots.cityDepot
          m.objective = 'غله را به انبار غربی شهر برسان'
          this.sfx.checkpoint()
        } else if (m.stage === 'deliver' && dist(m.target!) < 6) {
          this.complete()
          return
        }
        break
      }
      case 'treasure': {
        if (m.stage === 'seek' && dist(m.target!) < 7) {
          m.objective = 'گنج پیدا شد!'
          this.complete()
          return
        }
        break
      }
    }
    this.updateBeacons()
    void clamp
  }

  /** current target for minimap */
  mapTarget(): { x: number; z: number; t: string } | null {
    if (!this.active) return null
    if (this.active.def.id === 'race') {
      const cp = this.world.spots.raceCp[this.cpIndex]
      return { x: cp.x, z: cp.z, t: 'cp' }
    }
    if (this.active.target) return { x: this.active.target.x, z: this.active.target.z, t: 'target' }
    return null
  }

  objective(): { text: string; timer: number | null } | null {
    if (!this.active) return null
    return { text: this.active.objective, timer: this.active.timer > 0 ? this.active.timer : null }
  }

  giverNear(playerPos: THREE.Vector3): MissionDef | null {
    if (this.active) return null
    for (const def of this.defs) {
      if (Math.hypot(def.giver.x - playerPos.x, def.giver.z - playerPos.z) < 3.4) return def
    }
    return null
  }

  dispose() {
    for (const gm of this.giverMarkers) this.scene.remove(gm.mesh)
    this.scene.remove(this.targetBeacon)
    this.scene.remove(this.cpBeacon)
  }
}
