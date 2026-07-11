import { useEffect, useState } from 'react'

interface IntroSplashProps {
  onDone: () => void
}

export function IntroSplash({ onDone }: IntroSplashProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const holdTimer = window.setTimeout(() => setPhase('hold'), 900)
    const exitTimer = window.setTimeout(() => setPhase('exit'), 2200)
    const doneTimer = window.setTimeout(() => onDone(), 3000)

    return () => {
      window.clearTimeout(holdTimer)
      window.clearTimeout(exitTimer)
      window.clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div className={`intro-splash intro-splash--${phase}`} aria-hidden="true">
      <div className="intro-splash__glow" />
      <div className="intro-splash__beam" />

      <div className="intro-splash__brand">
        <div className="intro-splash__mark">
          <svg viewBox="0 0 64 64" className="intro-splash__icon" aria-hidden="true">
            <path
              d="M12 42 L32 14 L52 42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="27" y="40" width="10" height="10" rx="2" fill="#f59e0b" />
          </svg>
        </div>
        <h1 className="intro-splash__title">ProcureAI</h1>
        <p className="intro-splash__subtitle">Purchase & Supplier Intelligence</p>
      </div>

      <div className="intro-splash__bar">
        <span />
      </div>
    </div>
  )
}
