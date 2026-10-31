import * as THREE from 'three'
import { texGlow } from './utils'
import type { World } from './world'

/** 25 hidden gold coins scattered across the whole map. */
const COIN_SPOTS: [number, number][] = [
  // city (streets & park, never inside blocks)
  [-180, -570], [-129.5, -750], [-180, -468], [120, -840], [240, -392],
  // highway
  [8, 0], [-9, 300], [9, 520],
  // western town
  [-85, 606], [164, 648], [95, 616], [-132, 620],
  // gas stations
  [22, -52], [-22, 388],
  // farm
  [600, -498], [588, -470],
  // lake & pier
  [-588, 690], [-610, 748],
  // radio tower
  [452, 348], [470, 336],
  // wilderness & far corners
  [-344, -1040], [662, 770], [860, -860], [-860, -860], [1050, 300],
]

const COIN_VALUE = 25

export class Coins {
  group = new THREE.Group()
  collected = new Set<number>()
  private meshes: THREE.Mesh[] = []
  private t = 0
  total = COIN_SPOTS.length

  constructor(
    scene: THREE.Scene,
    world: World,
    quality: 'low' | 'med' | 'high',
    alreadyCollected: number[] = [],
    private onCollect: (count: number, total: number, all: boolean) => void,
  ) {
    void quality
    const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.09, 14)
    geo.rotateX(Math.PI / 2)
    const mat = new THREE.MeshLambertMaterial({ color: 0xe8b54a, emissive: 0x7a5a10, emissiveIntensity: 0.6 })
    const glowTex = texGlow()
    for (let i = 0; i < COIN_SPOTS.length; i++) {
      if (alreadyCollected.includes(i)) { this.collected.add(i); continue }
      let [x, z] = COIN_SPOTS[i]
      // nudge out of any collider so coins are always reachable
      for (let attempt = 0; attempt < 24; attempt++) {
        const hit = world.colliders.find(b => Math.abs(x - b.x) < b.hw + 1.1 && Math.abs(z - b.z) < b.hd + 1.1)
        if (!hit) break
        x = hit.x + (x >= hit.x ? 1 : -1) * (hit.hw + 1.4)
        z = hit.z + (z >= hit.z ? 1 : -1) * (hit.hd + 1.4)
      }
      const m = new THREE.Mesh(geo, mat)
      m.position.set(x, 0.8, z)
      m.userData.ci = i
      // soft glow halo
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: 0xffd060, transparent: true, opacity: 0.35, depthWrite: false,
      }))
      halo.scale.setScalar(2.6)
      m.add(halo)
      this.group.add(m)
      this.meshes.push(m)
    }
    scene.add(this.group)
  }

  update(dt: number, playerPos: THREE.Vector3) {
    this.t += dt
    for (let i = this.meshes.length - 1; i >= 0; i--) {
      const m = this.meshes[i]
      m.rotation.y += dt * 2.2
      m.position.y = 0.8 + Math.sin(this.t * 2.4 + i) * 0.14
      const dx = m.position.x - playerPos.x
      const dz = m.position.z - playerPos.z
      if (dx * dx + dz * dz < 2.2 * 2.2) {
        this.collected.add(m.userData.ci as number)
        this.group.remove(m)
        this.meshes.splice(i, 1)
        this.onCollect(this.collected.size, this.total, this.collected.size >= this.total)
      }
    }
  }

  /** remap minimap entries on save-load (removed coins stay hidden) */
  dispose(scene: THREE.Scene) {
    scene.remove(this.group)
    this.meshes = []
  }
}
