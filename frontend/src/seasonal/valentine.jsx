import { reducedMotion } from '../lib/seasonal.js'
import './valentine.css'

/* Valentine (1.5.0), fetched only while the theme shows (components/Seasonal.jsx). Hand-drawn
   inline SVG hearts that drift up through a header's or a card's frame, CSS transforms and
   opacity only, a fixed number of passes and then quiet. Everything is aria-hidden and lets
   taps through. Never on the workout screen except where the "Also during workouts" switch
   allows (lib/seasonal.js, seasonInWorkout). */

// One heart, leaning by its lane. Small and open so a stack of them layers without crowding.
const Heart = ({ className = '' }) => (
  <svg className={'vl-heart ' + className} viewBox="0 0 24 22" aria-hidden="true" focusable="false">
    <path d="M12 21C10.4 19.4 2 13.6 2 7.9 2 4.2 4.7 1.5 8 1.5c1.7 0 3.2.8 4 2 .8-1.2 2.3-2 4-2 3.3 0 6 2.7 6 6.4 0 5.7-8.4 11.5-10 13.1Z" />
  </svg>
)

export function Layer({ hidden }) {
  if (hidden) return null
  return null   // Valentine stays inside cards and headers; nothing floats page-wide.
}

/** Decoration for one place in a view. Unknown spots draw nothing. */
export function Deco({ spot }) {
  switch (spot) {
    case 'header-bats': return <HeaderHearts />
    case 'stats-hdr': return <HeaderHearts />
    case 'home-hero': return <CornerPair />
    case 'home-streak': return <CornerPair small />
    case 'rest-timer': return <RestHearts />
    case 'streak-party': return <FinishHearts />
    case 'finish': return <FinishHearts />
    default: return null
  }
}

// Three small hearts crossing a header, each once, staggered.
const HeaderHearts = () => (
  <div className={'vl-bursts' + (reducedMotion() ? ' vl-still' : '')} aria-hidden="true">
    {[0, 1, 2].map(i => <span key={i} className={'vl-lane vl-hl' + i}><Heart /></span>)}
  </div>
)

// A pair of leaning hearts snuggled into a card corner.
const CornerPair = ({ small }) => (
  <span className={'vl-pair' + (small ? ' vl-pair-sm' : '')} aria-hidden="true">
    <Heart className="vl-a" /><Heart className="vl-b" />
  </span>
)

// Two hearts drift along the rest bar's edge while it is up.
const RestHearts = () => {
  if (reducedMotion()) return null
  return <span className="vl-rest" aria-hidden="true">
    {[0, 1].map(i => <span key={i} className={'vl-lane vl-rl' + i}><Heart /></span>)}
  </span>
}

// The finish screen's cluster — three hearts that pop once, like a small round of applause.
const FinishHearts = () => (
  <span className="vl-finish" aria-hidden="true">
    {[0, 1, 2].map(i => <Heart key={i} className={'vl-f vl-f' + i} />)}
  </span>
)
