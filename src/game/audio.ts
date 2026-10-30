/**
 * Procedural sound kit — all sounds are synthesized with WebAudio (no asset files).
 */
export class Sfx {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private engineNodes: { osc: OscillatorNode; osc2: OscillatorNode; gain: GainNode; filter: BiquadFilterNode } | null = null
  private sirenTimer: ReturnType<typeof setInterval> | null = null
  private sirenOsc: OscillatorNode | null = null
  private sirenGain: GainNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private ambientTimer: ReturnType<typeof setTimeout> | null = null
  private ambientOn = false
  muted = false

  /** must be called from a user gesture */
  init() {
    if (this.ctx) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.55
      this.master.connect(this.ctx.destination)
      const len = this.ctx.sampleRate * 1.2
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this.noiseBuf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    } catch {
      this.ctx = null
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05)
  }

  private noise(dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'lowpass', delay = 0) {
    if (!this.ctx || !this.master || !this.noiseBuf) return
    const t = this.ctx.currentTime + delay
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t)
    src.stop(t + dur + 0.05)
  }

  private tone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0, slideTo?: number) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + delay
    const o = this.ctx.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  shot(kind: 'revolver' | 'pistol' | 'rifle') {
    if (kind === 'revolver') {
      this.noise(0.22, 1400, 0.6, 0.9)
      this.noise(0.5, 500, 1, 0.22, 'lowpass', 0.03) // echo
      this.tone(140, 0.12, 0.5, 'triangle', 0, 60)
    } else if (kind === 'pistol') {
      this.noise(0.14, 2200, 0.7, 0.65)
      this.tone(200, 0.08, 0.35, 'triangle', 0, 90)
    } else {
      this.noise(0.3, 900, 0.5, 1.0)
      this.noise(0.7, 320, 1, 0.3, 'lowpass', 0.05)
      this.tone(90, 0.18, 0.6, 'triangle', 0, 40)
    }
  }
  enemyShot(far: number) {
    const v = Math.max(0.05, 0.5 - far * 0.01)
    this.noise(0.15, 1200, 0.7, v)
  }
  dryFire() { this.tone(900, 0.04, 0.15, 'square') }
  reload() { this.tone(500, 0.05, 0.2, 'square'); this.tone(700, 0.05, 0.2, 'square', 0.18) }
  hit() { this.tone(1600, 0.05, 0.25, 'square') }
  kill() { this.tone(220, 0.25, 0.4, 'triangle', 0, 80); this.noise(0.2, 400, 1, 0.3) }
  hurt() { this.noise(0.2, 600, 1, 0.4); this.tone(160, 0.2, 0.3, 'sawtooth', 0, 70) }
  pickup() { this.tone(660, 0.09, 0.25); this.tone(990, 0.12, 0.25, 'sine', 0.09) }
  cash() { this.tone(1320, 0.07, 0.2, 'sine'); this.tone(1760, 0.1, 0.2, 'sine', 0.07) }
  buy() { this.noise(0.1, 5000, 2, 0.2, 'highpass'); this.tone(880, 0.08, 0.25, 'sine', 0.02); this.tone(1320, 0.12, 0.25, 'sine', 0.1) }
  jingleWin() {
    const notes = [523, 659, 784, 1046]
    notes.forEach((n, i) => this.tone(n, 0.28, 0.22, 'triangle', i * 0.13))
  }
  jingleFail() { this.tone(330, 0.3, 0.25, 'triangle'); this.tone(233, 0.5, 0.25, 'triangle', 0.28) }
  horn() { this.tone(340, 0.35, 0.3, 'square'); this.tone(425, 0.35, 0.25, 'square') }
  neigh() { this.tone(700, 0.4, 0.18, 'sawtooth', 0, 380); this.noise(0.3, 1800, 2, 0.12, 'bandpass', 0.05) }
  explosion() {
    this.noise(1.2, 300, 0.5, 1.2)
    this.tone(60, 0.9, 0.8, 'triangle', 0, 30)
    this.noise(0.6, 120, 1, 0.5, 'lowpass', 0.15)
  }
  crash(v: number) { this.noise(0.25, 900, 0.8, Math.min(0.8, 0.15 + v * 0.04)); this.tone(120, 0.15, 0.3, 'square', 0, 60) }
  door() { this.noise(0.08, 700, 1, 0.25) }
  hoof() { this.noise(0.06, 260, 2.5, 0.18, 'bandpass') }
  step() { this.noise(0.05, 320, 2, 0.07, 'bandpass') }
  checkpoint() { this.tone(880, 0.1, 0.25, 'sine'); this.tone(1174, 0.14, 0.25, 'sine', 0.1) }
  star() { this.tone(392, 0.12, 0.3, 'square'); this.tone(523, 0.12, 0.3, 'square', 0.12) }
  click() { this.tone(600, 0.04, 0.15, 'square') }

  /* ---- engine loop ---- */
  engineStart() {
    if (!this.ctx || !this.master || this.engineNodes) return
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = 55
    const o2 = this.ctx.createOscillator()
    o2.type = 'square'
    o2.frequency.value = 28
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 420
    const g = this.ctx.createGain()
    g.gain.value = 0
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.master)
    o.start(); o2.start()
    this.engineNodes = { osc: o, osc2: o2, gain: g, filter: f }
  }
  engineUpdate(speed: number, throttle: number, active: boolean) {
    if (!this.engineNodes || !this.ctx) return
    const t = this.ctx.currentTime
    const rpm = 55 + Math.abs(speed) * 4.2
    this.engineNodes.osc.frequency.setTargetAtTime(rpm, t, 0.06)
    this.engineNodes.osc2.frequency.setTargetAtTime(rpm * 0.5, t, 0.06)
    this.engineNodes.filter.frequency.setTargetAtTime(360 + Math.abs(speed) * 26, t, 0.1)
    this.engineNodes.gain.gain.setTargetAtTime(active ? 0.05 + Math.abs(throttle) * 0.06 + Math.abs(speed) * 0.0012 : 0, t, 0.1)
  }
  engineStop() {
    if (this.engineNodes && this.ctx) {
      this.engineNodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08)
      const n = this.engineNodes
      setTimeout(() => { try { n.osc.stop(); n.osc2.stop() } catch { /* ignore */ } }, 400)
      this.engineNodes = null
    }
  }

  /* ---- siren ---- */
  sirenOn() {
    if (!this.ctx || !this.master || this.sirenOsc) return
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = 660
    const g = this.ctx.createGain()
    g.gain.value = 0.045
    o.connect(g).connect(this.master)
    o.start()
    this.sirenOsc = o
    this.sirenGain = g
    let hi = false
    this.sirenTimer = setInterval(() => {
      hi = !hi
      if (this.sirenOsc && this.ctx) this.sirenOsc.frequency.setTargetAtTime(hi ? 880 : 620, this.ctx.currentTime, 0.08)
    }, 480)
  }
  sirenVol(v: number) {
    if (this.sirenGain && this.ctx) this.sirenGain.gain.setTargetAtTime(0.05 * v, this.ctx.currentTime, 0.2)
  }
  sirenOff() {
    if (this.sirenTimer) { clearInterval(this.sirenTimer); this.sirenTimer = null }
    if (this.sirenOsc && this.ctx) {
      this.sirenGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15)
      const o = this.sirenOsc
      setTimeout(() => { try { o.stop() } catch { /* ignore */ } }, 500)
      this.sirenOsc = null
    }
  }

  /* ---- wind ambience ---- */
  windStart() {
    if (!this.ctx || !this.master || !this.noiseBuf || this.windGain) return
    const src = this.ctx.createBufferSource()
    src.buffer = this.noiseBuf
    src.loop = true
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 280
    f.Q.value = 0.4
    const g = this.ctx.createGain()
    g.gain.value = 0.018
    src.connect(f).connect(g).connect(this.master)
    src.start()
    this.windGain = g
    this.windFilter = f
  }
  windUpdate(speed: number, night: boolean) {
    if (!this.windGain || !this.windFilter || !this.ctx) return
    const t = this.ctx.currentTime
    this.windGain.gain.setTargetAtTime(0.012 + Math.min(0.05, speed * 0.0025) + (night ? -0.004 : 0), t, 0.4)
    this.windFilter.frequency.setTargetAtTime(240 + speed * 8, t, 0.4)
  }

  /** lonely western plucks, occasionally */
  ambientStart() {
    this.ambientOn = true
    this.scheduleAmbient()
  }
  private scheduleAmbient() {
    if (!this.ambientOn) return
    this.ambientTimer = setTimeout(() => {
      const scale = [220, 261.6, 293.7, 329.6, 392, 440]
      let t = 0
      const n = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < n; i++) {
        const f = scale[Math.floor(Math.random() * scale.length)]
        this.pluck(f, t)
        t += 0.35 + Math.random() * 0.5
      }
      this.scheduleAmbient()
    }, 7000 + Math.random() * 9000)
  }
  ambientStop() {
    this.ambientOn = false
    if (this.ambientTimer) { clearTimeout(this.ambientTimer); this.ambientTimer = null }
  }
  private pluck(freq: number, delay: number) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime + delay
    const o = this.ctx.createOscillator()
    o.type = 'triangle'
    o.frequency.value = freq
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
    o.connect(g).connect(this.master)
    o.start(t)
    o.stop(t + 1.2)
  }

  dispose() {
    this.ambientStop()
    this.sirenOff()
    this.engineStop()
    if (this.ctx) this.ctx.close().catch(() => {})
    this.ctx = null
  }
}
