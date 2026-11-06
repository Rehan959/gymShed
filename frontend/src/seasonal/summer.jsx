import { reducedMotion } from '../lib/seasonal.js'
import './summer.css'

/* Summer (1.5.0), fetched only while the theme shows (components/Seasonal.jsx): a slow sun in
   a header corner, a bee's single pass over a card, a warm beam behind the hero card. Hand-drawn
   inline SVG, CSS transforms and opacity only, a fixed number of passes and then quiet.
   Everything is aria-hidden and lets taps through. Never on the workout screen except where
   the "Also during workouts" switch allows (lib/seasonal.js, seasonInWorkout). */

// One sun with slow rays; the CSS turns it, sway and all, a couple of times and stops.
const Sun = ({ className = '' }) => (
  <svg className={'su-sun ' + className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i * Math.PI) / 5 + Math.PI / 10
      return <line key={i} className="su-ray" x1={(24 + 13 * Math.cos(a)).toFixed(1)} y1={(24 + 13 * Math.sin(a)).toFixed(1)}
        x2={(24 + 18 * Math.cos(a)).toFixed(1)} y2={(24 + 18 * Math.sin(a)).toFixed(1)} />
    })}
    <circle className="su-disc" cx="24" cy="24" r="10" />
    <path className="su-smile" d="M19.5 25.5c1.4 2 3 3 4.5 3s3.1-1 4.5-3" />
    <circle className="su-eye" cx="20.4" cy="21.4" r="1" />
    <circle className="su-eye" cx="27.6" cy="21.4" r="1" />
  </svg>
)

// One bee: a striped oval with two quick wings, drifting one pass across.
const Bee = ({ className = '' }) => (
  <svg className={'su-bee ' + className} viewBox="0 0 28 20" aria-hidden="true" focusable="false">
    <ellipse className="su-wing" cx="10" cy="5" rx="4.6" ry="2.6" />
    <ellipse className="su-body" cx="15" cy="11" rx="9" ry="6" />
    <path className="su-stripe" d="M11.5 5.8c1 3.2 1 6.2 0 10.4M15.5 5.2c1.2 3.6 1.2 7.4 0 11.6M19.5 5.6c1 3.2 1 6.6 0 10.8" />
    <circle className="su-eyeb" cx="7.8" cy="9.6" r=".9" />
  </svg>
)

export function Layer({ hidden }) {
  if (hidden) return null
  return null   // Summer stays inside cards and headers; nothing floats page-wide.
}

/** Decoration for one place in a view. Unknown spots draw nothing. */
export function Deco({ spot }) {
  switch (spot) {
    case 'header-bats': return <HeaderSun />
    case 'stats-hdr': return <HeaderSun />
    case 'home-hero': return <HeroBeam />
    case 'home-streak': return <MiniSun />
    case 'rest-timer': return <RestBee />
    case 'streak-party': return <FinishSun />
    case 'finish': return <FinishSun />
    default: return null
  }
}

// The header sun: sets with two slow passes of its rays, then sits still for the season.
const HeaderSun = () => (
  <span className={'su-hdrsun' + (reducedMotion() ? ' su-still' : '')} aria-hidden="true">
    <Sun />
  </span>
)

// A warm slant of light behind the hero card, plus the bee's one cross.
const HeroBeam = () => (
  <span className="su-beam" aria-hidden="true">
    <Sun className="su-beamsun" />
    {!reducedMotion() && <Bee className="su-bee-hero" />}
  </span>
)

const MiniSun = () => (
  <span className="su-mini" aria-hidden="true"><Sun /></span>
)

// The rest timer gets the bee: one crossing at each end, then quiet.
const RestBee = () => {
  if (reducedMotion()) return null
  return <span className="su-rest" aria-hidden="true">
    <Bee className="su-bee su-r0" /><Bee className="su-bee su-r1" />
  </span>
}

const FinishSun = () => (
  <span className={'su-finish' + (reducedMotion() ? ' su-still' : '')} aria-hidden="true"><Sun /></span>
)
