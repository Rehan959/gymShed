import { reducedMotion } from '../lib/seasonal.js'
import './easter.css'

/* Easter (1.5.0), fetched only while the theme shows (components/Seasonal.jsx): eggs tucked into
   card corners, one shy bunny that crosses the hero card a couple of times, petals behind a
   header. Hand-drawn inline SVG, CSS transforms and opacity only, a fixed number of passes and
   then quiet. Everything is aria-hidden and lets taps through. Never on the workout screen
   except where the "Also during workouts" switch allows (lib/seasonal.js, seasonInWorkout). */

// One egg with its own band; the CSS gives it the pastel of its lane.
const Egg = ({ className = '' }) => (
  <svg className={'ea-egg ' + className} viewBox="0 0 22 28" aria-hidden="true" focusable="false">
    <path className="ea-shell" d="M11 1C6 1 2 8.2 2 14.6 2 22 6 27 11 27s9-5 9-12.4C20 8.2 16 1 11 1Z" />
    <path className="ea-band" d="M2.6 12.2c8.4 1.4 16.4.6 18.8 0-1-2.8-1.6-4.6-2.4-6-4.6 1.2-11.4 1.2-14-.2-.9 1.4-1.7 3.6-2.4 6.2Z" />
  </svg>
)

// The bunny: long ears first, seen in profile, mid-hop.
const Bunny = ({ className = '' }) => (
  <svg className={'ea-bunny ' + className} viewBox="0 0 46 34" aria-hidden="true" focusable="false">
    <ellipse className="ea-ear" cx="17" cy="6" rx="2.6" ry="7" transform="rotate(-14 17 6)" />
    <ellipse className="ea-ear" cx="23" cy="5" rx="2.6" ry="7" transform="rotate(4 23 5)" />
    <circle className="ea-head" cx="22" cy="17" r="6.4" />
    <ellipse className="ea-body" cx="33" cy="23" rx="9.4" ry="6.2" />
    <circle className="ea-tail" cx="42.6" cy="21" r="2.6" />
    <circle className="ea-eye" cx="21" cy="15.6" r="1" />
  </svg>
)

export function Layer({ hidden }) {
  if (hidden) return null
  return null   // Easter stays inside cards and headers; nothing floats page-wide.
}

/** Decoration for one place in a view. Unknown spots draw nothing. */
export function Deco({ spot }) {
  switch (spot) {
    case 'header-bats': return <HeaderPetals />
    case 'stats-hdr': return <HeaderPetals />
    case 'home-hero': return <HeroHunt />
    case 'home-streak': return <CornerEggs small />
    case 'rest-timer': return <RestEgg />
    case 'streak-party': return <FinishHunt />
    case 'finish': return <FinishHunt />
    default: return null
  }
}

// Petals drift down through a header, five of them, then the branch is empty.
const HeaderPetals = () => (
  <span className={'ea-petals' + (reducedMotion() ? ' ea-still' : '')} aria-hidden="true">
    {[0, 1, 2, 3, 4].map(i => <span key={i} className={'ea-petal ea-p' + i} />)}
  </span>
)

// The hero card hides three eggs; the bunny crosses once behind them.
const HeroHunt = () => (
  <span className="ea-hero" aria-hidden="true">
    <CornerEggs />
    {!reducedMotion() && <Bunny className="ea-bunny-run" />}
  </span>
)

const CornerEggs = ({ small }) => (
  <span className={'ea-pair' + (small ? ' ea-pair-sm' : '')} aria-hidden="true">
    <Egg className="ea-ea" /><Egg className="ea-eb" />
  </span>
)

// The rest timer gets one egg that tips its straw hat of stripes while the set recovers.
const RestEgg = () => (
  <span className={'ea-rest' + (reducedMotion() ? ' ea-still' : '')} aria-hidden="true"><Egg className="ea-relax" /></span>
)

const FinishHunt = () => (
  <span className={'ea-finish' + (reducedMotion() ? ' ea-still' : '')} aria-hidden="true">
    <Egg className="ea-f e0" /><Egg className="ea-f e1" /><Egg className="ea-f e2" />
  </span>
)
