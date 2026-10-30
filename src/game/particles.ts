import * as THREE from 'three'
import { texGlow, texSmoke, rand, clamp } from './utils'

interface P {
  pos: THREE.Vector3
  vel: THREE.Vector3
  life: number
  maxLife: number
  size: number
  sizeEnd: number
  r: number
  g: number
  b: number
  gravity: number
  drag: number
}

/**
 * GPU point-sprite particle pool. Two systems: additive (fire/glow) and alpha (smoke/dust).
 */
export class Particles {
  private sysAdd:ParticleSystem
  private sysAlpha: ParticleSystem

  constructor(private scene: THREE.Scene) {
    this.sysAdd = new ParticleSystem(scene, texGlow(), THREE.AdditiveBlending, 220)
    this.sysAlpha = new ParticleSystem(scene, texSmoke(), THREE.NormalBlending, 220)
  }

  spawn(pos: THREE.Vector3, opts: {
    vel?: THREE.Vector3
    life?: number
    size?: number
    sizeEnd?: number
    color?: THREE.Color | number
    gravity?: number
    drag?: number
    additive?: boolean
  } = {}) {
    const sys = opts.additive ? this.sysAdd : this.sysAlpha
    sys.spawn(pos, opts)
  }

  burst(pos: THREE.Vector3, n: number, opts: Parameters<Particles['spawn']>[1] & { spread?: number; speed?: number; up?: number } = {}) {
    const spread = opts.spread ?? 0.4
    const speed = opts.speed ?? 4
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rand(-spread, spread), rand(0.2, 1) * (opts.up ?? 1), rand(-spread, spread)).normalize().multiplyScalar(rand(speed * 0.4, speed))
      this.spawn(pos, { ...opts, vel: v })
    }
  }

  update(dt: number) {
    this.sysAdd.update(dt)
    this.sysAlpha.update(dt)
  }

  dispose() {
    this.sysAdd.dispose()
    this.sysAlpha.dispose()
    this.scene.remove(this.sysAdd.points, this.sysAlpha.points)
  }
}

class ParticleSystem {
  points: THREE.Points
  private pool: P[] = []
  private active = 0
  private posAttr: THREE.BufferAttribute
  private sizeAttr: THREE.BufferAttribute
  private alphaAttr: THREE.BufferAttribute
  private colAttr: THREE.BufferAttribute
  private mat: THREE.ShaderMaterial

  constructor(scene: THREE.Scene, map: THREE.Texture, blending: THREE.Blending, private capacity: number) {
    const geo = new THREE.BufferGeometry()
    this.posAttr = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3)
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(capacity), 1)
    this.alphaAttr = new THREE.BufferAttribute(new Float32Array(capacity), 1)
    this.colAttr = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3)
    geo.setAttribute('position', this.posAttr)
    geo.setAttribute('aSize', this.sizeAttr)
    geo.setAttribute('aAlpha', this.alphaAttr)
    geo.setAttribute('aColor', this.colAttr)
    geo.setDrawRange(0, 0)
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map } },
      vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = aAlpha;
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (240.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(vColor, vAlpha) * tex;
        }`,
      transparent: true,
      depthWrite: false,
      blending,
    })
    this.points = new THREE.Points(geo, this.mat)
    this.points.frustumCulled = false
    scene.add(this.points)
  }

  spawn(pos: THREE.Vector3, opts: { vel?: THREE.Vector3; life?: number; size?: number; sizeEnd?: number; color?: THREE.Color | number; gravity?: number; drag?: number } = {}) {
    if (this.active >= this.capacity) return
    const c = new THREE.Color(opts.color ?? 0xffffff)
    this.pool[this.active] = {
      pos: pos.clone(),
      vel: (opts.vel ?? new THREE.Vector3()).clone(),
      life: 0,
      maxLife: opts.life ?? 1,
      size: opts.size ?? 1,
      sizeEnd: opts.sizeEnd ?? (opts.size ?? 1) * 1.6,
      r: c.r, g: c.g, b: c.b,
      gravity: opts.gravity ?? 0,
      drag: opts.drag ?? 0.6,
    }
    this.active++
  }

  update(dt: number) {
    const geo = this.points.geometry
    for (let i = 0; i < this.active; i++) {
      const p = this.pool[i]
      p.life += dt
      if (p.life >= p.maxLife) {
        // swap with last
        this.active--
        if (i < this.active) {
          this.pool[i] = this.pool[this.active]
          i--
        }
        continue
      }
      p.vel.y -= p.gravity * dt
      p.vel.multiplyScalar(1 - clamp(p.drag * dt, 0, 0.95))
      p.pos.addScaledVector(p.vel, dt)
      const t = p.life / p.maxLife
      this.posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z)
      this.sizeAttr.setX(i, p.size + (p.sizeEnd - p.size) * t)
      this.alphaAttr.setX(i, 1 - t)
      this.colAttr.setXYZ(i, p.r, p.g, p.b)
    }
    geo.setDrawRange(0, this.active)
    this.posAttr.needsUpdate = true
    this.sizeAttr.needsUpdate = true
    this.alphaAttr.needsUpdate = true
    this.colAttr.needsUpdate = true
  }

  dispose() {
    this.points.geometry.dispose()
    this.mat.dispose()
  }
}
