import * as THREE from 'three'
import { makeHuman, animateHuman, type HumanParts, type HorseParts } from './entities'
import { clamp, lerpAngle, damp, segmentVsColliders, resolveCollisions, angleDiff } from './utils'
import type { Input } from './input'
import type { World } from './world'
import type { Vehicles, Vehicle } from './vehicles'
import type { Sfx } from './audio'

export class Player {
  parts: HumanParts
  pos = new THREE.Vector3(0, 0, 0)
  vy = 0
  yaw = 0
  health = 100
  stamina = 100
  money = 250
  aiming = false
  dead = false
  sprintToggle = false
  camYaw = Math.PI
  camPitch = 0.18
  camDist = 5.4
  private phase = 0
  private lastStep = 0
  private lastDamage = -99
  private lastCamInput = -99
  private time = 0
  onDamage: ((d: number) => void) | null = null

  constructor(
    private scene: THREE.Scene,
    private world: World,
    private vehicles: Vehicles,
    private sfx: Sfx,
    start: { x: number; z: number },
  ) {
    this.parts = makeHuman({ hat: 'cowboy', shirt: '#6b3a24', pants: '#33291e' })
    this.parts.gun!.visible = true
    this.pos.set(start.x, 0, start.z)
    this.parts.group.position.copy(this.pos)
    scene.add(this.parts.group)
  }

  get speed() {
    return this.horizontalSpeed
  }
  private horizontalSpeed = 0

  damage(d: number, time: number) {
    if (this.dead) return
    this.health = Math.max(0, this.health - d)
    this.lastDamage = time
    this.sfx.hurt()
    this.onDamage?.(d)
    if (this.health <= 0) this.dead = true
  }

  respawn(at: { x: number; z: number }, time: number) {
    this.dead = false
    this.health = 100
    this.stamina = 100
    this.pos.set(at.x, 0, at.z)
    this.vy = 0
    this.lastDamage = time
    this.parts.group.rotation.x = 0
    this.parts.group.visible = true
  }

  update(dt: number, input: Input, camera: THREE.PerspectiveCamera, time: number, inVehicle: Vehicle | null) {
    this.time = time
    input.pollKeyboard()
    const look = input.consumeLook()
    if (Math.abs(look.x) > 0.0001 || Math.abs(look.y) > 0.0001) this.lastCamInput = time
    this.camYaw -= look.x
    this.camPitch = clamp(this.camPitch + look.y, -0.85, 1.3)

    // stamina / sprint
    const sprint = input.sprintHeld() || this.sprintToggle
    this.aiming = input.aimHeld && !inVehicle

    if (inVehicle) {
      // ride pose on horse
      if (inVehicle.kind === 'horse') {
        const v = inVehicle
        this.parts.group.visible = true
        const seat = (v.parts as HorseParts).seat
        const off = seat.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), v.heading)
        this.parts.group.position.set(v.pos.x + off.x, seat.y + v.group.position.y, v.pos.z + off.z)
        this.parts.group.rotation.y = v.heading
        this.parts.lLeg.rotation.x = 0.15
        this.parts.rLeg.rotation.x = 0.15
        this.parts.lLeg.rotation.z = 0.5
        this.parts.rLeg.rotation.z = -0.5
        this.parts.lArm.rotation.x = -0.7
        this.parts.rArm.rotation.x = -0.7
        this.pos.set(v.pos.x, 0, v.pos.z)
      } else {
        this.parts.group.visible = false
        this.pos.set(inVehicle.pos.x, 0, inVehicle.pos.z)
      }
      this.horizontalSpeed = Math.abs(inVehicle.speed)
      this.stamina = Math.min(100, this.stamina + 14 * dt)
      this.updateCamera(dt, camera, inVehicle, time)
      return
    }

    this.parts.group.visible = !this.dead
    this.parts.lLeg.rotation.z = 0
    this.parts.rLeg.rotation.z = 0

    // movement (camera looks toward -(sin,cos) of camYaw, so forward is the negation)
    const mv = input.move
    if (this.dead) {
      this.horizontalSpeed = damp(this.horizontalSpeed, 0, 10, dt)
      this.parts.group.rotation.x = Math.min(Math.PI / 2, this.parts.group.rotation.x + dt * 4)
      this.updateCamera(dt, camera, null, time)
      return
    }
    const fx = -Math.sin(this.camYaw)
    const fz = -Math.cos(this.camYaw)
    const wx = fx * mv.y + (-fz) * mv.x
    const wz = fz * mv.y + fx * mv.x
    const moving = Math.hypot(wx, wz) > 0.05

    let maxSpeed = this.aiming ? 2.9 : 4.6
    const running = sprint && moving && this.stamina > 1 && !this.aiming
    if (running) maxSpeed = 7.6
    if (running) this.stamina = Math.max(0, this.stamina - 11 * dt)
    else this.stamina = Math.min(100, this.stamina + 9 * dt)

    const targetSpeed = moving ? maxSpeed * Math.min(1, Math.hypot(mv.x, mv.y)) : 0
    this.horizontalSpeed = damp(this.horizontalSpeed, targetSpeed, 10, dt)
    if (moving) {
      const dirYaw = Math.atan2(wx, wz)
      if (this.aiming) {
        this.yaw = this.camYaw
      } else {
        this.yaw = lerpAngle(this.yaw, dirYaw, 1 - Math.exp(-10 * dt))
      }
      const nx = this.pos.x + Math.sin(dirYaw) * this.horizontalSpeed * dt
      const nz = this.pos.z + Math.cos(dirYaw) * this.horizontalSpeed * dt
      this.pos.x = nx
      this.pos.z = nz
    } else {
      this.horizontalSpeed = damp(this.horizontalSpeed, 0, 14, dt)
      if (this.aiming) this.yaw = this.camYaw
    }

    // jump & gravity
    const jumpPressed = input.consume('jump')
    if (jumpPressed && this.pos.y <= 0.02 && !this.dead) this.vy = 6.4
    if (this.pos.y > 0 || this.vy > 0) {
      this.vy -= 20 * dt
      this.pos.y += this.vy * dt
      if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0 }
    }

    // collisions
    resolveCollisions(this.pos, 0.42, this.world.colliders)
    // vs vehicles
    for (const v of this.vehicles.list) {
      if (v.dead && v.deadT > 3) continue
      const dx = this.pos.x - v.pos.x
      const dz = this.pos.z - v.pos.z
      const rr = v.radius + 0.4
      const d2 = dx * dx + dz * dz
      if (d2 < rr * rr && d2 > 0.0001) {
        const d = Math.sqrt(d2)
        this.pos.x += (dx / d) * (rr - d)
        this.pos.z += (dz / d) * (rr - d)
      }
    }
    const B = 1150
    this.pos.x = clamp(this.pos.x, -B, B)
    this.pos.z = clamp(this.pos.z, -B, B)

    // health regen
    if (time - this.lastDamage > 8 && this.health > 0 && !this.dead) {
      this.health = Math.min(100, this.health + 2.5 * dt)
    }

    // animation
    this.phase += this.horizontalSpeed * dt * 2.1
    if (this.horizontalSpeed > 1.2) {
      const c = Math.sin(this.phase)
      if (Math.abs(c) > 0.92 && time - this.lastStep > 0.22) {
        this.lastStep = time
        this.sfx.step()
      }
    }
    if (!this.dead) {
      animateHuman(this.parts, this.phase, this.horizontalSpeed, this.aiming, this.camPitch)
      this.parts.group.position.copy(this.pos)
      this.parts.group.rotation.y = this.yaw
    }

    this.updateCamera(dt, camera, null, time)
  }

  private camPos = new THREE.Vector3()
  private lookTarget = new THREE.Vector3()
  private tmpDir = new THREE.Vector3()

  private updateCamera(dt: number, camera: THREE.PerspectiveCamera, vehicle: Vehicle | null, time: number) {
    let dist: number
    if (vehicle) {
      // auto-align behind vehicle when camera idle
      if (time - this.lastCamInput > 1.4) {
        this.camYaw = lerpAngle(this.camYaw, vehicle.heading + Math.PI, 1 - Math.exp(-1.6 * dt))
        this.camPitch = damp(this.camPitch, 0.22, 2, dt)
      }
      dist = vehicle.kind === 'car' ? 9 + Math.abs(vehicle.speed) * 0.07 : 7.2
    } else {
      dist = this.aiming ? 2.5 : 5.4
    }
    this.camDist = damp(this.camDist, dist, 6, dt)

    if (vehicle) {
      this.lookTarget.set(vehicle.pos.x, 2.1, vehicle.pos.z)
    } else {
      this.lookTarget.copy(this.pos)
      this.lookTarget.y += 1.55
      if (this.aiming) {
        const rx = Math.cos(this.camYaw) * 0.62
        const rz = -Math.sin(this.camYaw) * 0.62
        this.lookTarget.x += rx
        this.lookTarget.z += rz
      }
    }

    const cp = Math.cos(this.camPitch)
    this.tmpDir.set(Math.sin(this.camYaw) * cp, Math.sin(this.camPitch), Math.cos(this.camYaw) * cp)
    this.camPos.copy(this.lookTarget).addScaledVector(this.tmpDir, this.camDist)

    // pull in on walls
    const t = segmentVsColliders(this.lookTarget.x, this.lookTarget.z, this.camPos.x, this.camPos.z, this.world.colliders)
    if (t !== null && t < 1) {
      this.camPos.copy(this.lookTarget).addScaledVector(this.tmpDir, Math.max(0.8, this.camDist * t * 0.85))
    }
    if (this.camPos.y < 0.4) this.camPos.y = 0.4

    camera.position.copy(this.camPos)
    camera.lookAt(this.lookTarget)

    // fov
    const inCar = vehicle?.kind === 'car'
    const targetFov = this.aiming ? 46 : inCar ? Math.min(96, 70 + Math.abs(vehicle!.speed) * 0.5) : 70
    if (Math.abs(camera.fov - targetFov) > 0.1) {
      camera.fov = damp(camera.fov, targetFov, 5, dt)
      camera.updateProjectionMatrix()
    }
  }

  /** camera-space forward for shooting */
  aimRay(camera: THREE.PerspectiveCamera) {
    return camera.getWorldDirection(new THREE.Vector3())
  }

  /** muzzle world position */
  muzzle(): THREE.Vector3 {
    const p = new THREE.Vector3()
    this.parts.rArm.children[0]?.getWorldPosition(p)
    return p
  }

  turnToward(yaw: number, dt: number) {
    this.yaw = lerpAngle(this.yaw, yaw, 1 - Math.exp(-8 * dt))
  }
}
