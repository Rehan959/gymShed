import { useEffect, useState } from 'react'
import { reducedMotion } from '../lib/seasonal.js'
import './newyear.css'

/* New Year's Eve (1.5.0), fetched only while the theme shows (components/Seasonal.jsx). CSS
   animations over inline SVG, transforms and opacity only: an opening firework burst in the
   page's sky, a slow countdown ring in a corner and sparks behind the rest timer. Everything
   is aria-hidden and taps pass through. Never on the workout screen except where its
   "Also during workouts" switch allows. */

// One round of sparks, positioned and coloured by the CSS class.
const Firework = ({ className = '' }) => (
  <svg className={'ny-fw ' + className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    {Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6
      const r1 = 10 + (i % 3)
      const r2 = 20 + (i % 4) * 2
      return <line key={i}
        x1={(24 + r1 * Math.cos(a)).toFixed(1)} y1={(24 + r1 * Math.sin(a)).toFixed(1)}
        x2={(24 + r2 * Math.cos(a)).toFixed(1)} y2={(24 + r2 * Math.sin(a)).toFixed(1)} />
    })}
    <circle className="ny-core" cx="24" cy="24" r="3.2" />
  </svg>
)

// A slow ring that sweeps once a minute (the CSS turns one turn into the sweep), with a tiny
// firework tucked against it. A corner thing that reads as alive without an rAF loop.
const CornerClock = () => (
  <span className="ny-clock" aria-hidden="true">
    <svg className="ny-clockring" viewBox="0 0 36 36">
      <circle className="ny-clockpath" cx="18" cy="18" r="15.5" pathLength="100" />
    </svg>
    <Firework className="ny-fw-minisvg" />
  </span>
)

export function Layer({ hidden, fresh }) {
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (hidden || reducedMotion()) return
    if (!fresh) setBurst(1)
    const tm = setTimeout(() => setBurst(2), 900)
    return () => clearTimeout(tm)
  }, [hidden, fresh])
  if (hidden) return null
  return <>
    {/* The session opens on one big burst up top; the corner clock keeps the slow ring. */}
    <div key={burst} className={'ny-sky' + (burst === 2 ? ' ny-sky-done' : '')} aria-hidden="true">
      <Firework className="ny-fw-a" /><Firework className="ny-fw-b" /><Firework className="ny-fw-c" />
    </div>
    {!reducedMotion() && <CornerClock />}
  </>
}

/** Decoration for one place in a view. Unknown spots draw nothing. */
export function Deco({ spot }) {
  switch (spot) {
    case 'header-bats': return <HeaderSparks />
    case 'stats-hdr': return <HeaderSparks />
    case 'workout-hdr': return <HeaderSparks />
    case 'home-hero': return <span className="ny-hero" aria-hidden="true"><Firework className="ny-fw-h" /></span>
    case 'home-streak': return <span className="ny-corner" aria-hidden="true"><Firework /></span>
    case 'rest-timer': return <RestSparks />
    case 'streak-party': return <FinishFireworks />
    case 'finish': return <FinishFireworks />
    default: return null
  }
}

// The finish screen's pair of pops, staggered like a real show.
const FinishFireworks = () => (
  <span className="ny-finish" aria-hidden="true">
    <Firework className="ny-fw-f" /><Firework className="ny-fw-f ny-fw-f2" />
  </span>
)

// Sparks cross along the rest bar's top edge while it is up.
function RestSparks() {
  if (reducedMotion()) return null
  return <span className="ny-restsparks" aria-hidden="true">
    {[0, 1, 2].map(i => <span key={i} className={'ny-lane ny-l' + i}><Firework /></span>)}
  </span>
}

// Three sparks behind the page title, each once, then the sky stays quiet until the next visit.
function HeaderSparks() {
  const still = reducedMotion()
  return <div className={'ny-bursts' + (still ? ' ny-bursts-still' : '')} aria-hidden="true">
    {[0, 1, 2].map(i => <span key={i} className={'ny-lane ny-bl' + i}><Firework /></span>)}
  </div>
}
