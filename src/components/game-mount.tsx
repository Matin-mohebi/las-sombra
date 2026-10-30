'use client'

import { useEffect, useRef, useState } from 'react'

export default function GameMount() {
  const ref = useRef<HTMLDivElement>(null)
  const [portrait, setPortrait] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // register service worker (production / GitHub Pages) for offline PWA play
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {})
    }

    // on phones suggest landscape for a better view (game stays playable anyway)
    const touch = window.matchMedia('(pointer: coarse)').matches
    const mq = window.matchMedia('(orientation: portrait)')
    const update = () => setPortrait(!!touch && mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    let game: { dispose: () => void } | null = null
    let cancelled = false

    import('@/game/engine').then(({ Game }) => {
      if (cancelled || !ref.current) return
      try {
        game = new Game(ref.current)
      } catch {
        // engine shows its own error UI when WebGL is missing
      }
    })

    return () => {
      cancelled = true
      game?.dispose()
      game = null
    }
  }, [])

  return (
    <>
      <div
        ref={ref}
        id="game-root"
        className="fixed inset-0 overflow-hidden bg-[#0a0c10]"
        aria-label="بازی لاس سومبرا"
      />
      {portrait && !dismissed && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 p-8 text-center">
          <div className="animate-[spin_3s_linear_infinite] text-6xl" aria-hidden>📱</div>
          <p className="max-w-xs text-lg font-bold leading-8 text-[#f0e8d8]">
            برای تجربه بهتر، گوشی را <span className="text-[#e8b54a]">افقی</span> بگیرید
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg border border-[#8a6420] bg-[#2b1f14] px-6 py-3 text-base font-bold text-[#e8b54a] active:scale-95"
          >
            همین‌طور ادامه می‌دهم
          </button>
        </div>
      )}
    </>
  )
}
