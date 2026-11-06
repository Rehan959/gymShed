import { reducedMotion } from '../lib/seasonal.js'
import './pride.css'

/* Pride (1.5.0), fetched only while the theme shows (components/Seasonal.jsx): a soft rainbow
   ribbon arcing behind a card and a short fall of tab confetti, plus a small flag by the finish.
   Hand-drawn inline SVG, CSS transforms and opacity only, a fixed number of passes and then
   quiet. Everything is aria-hidden and lets taps through. Never on the workout screen except
   where the "Also during workouts" switch allows (lib/seasonal.js, seasonInWorkout). */

// A flying flag: mast, and a wave of six bands that the CSS sways gently.
const Flag = ({ className = '' }) => (
  <svg className={'pr-flag ' + className} viewBox="0 0 30 34" aria-hidden="true" focusable="false">
    <rect className="pr-mast" x="2.6" y="1" width="2" height="32" rx="1" />
    <path className="pr-band pr-r" d="M6 2.6h19c1.4 0 1.4 2 0 2H6Z" />
    <path className="pr-band pr-o" d="M6 5.4h19c1.4 0 1.4 2 0 2H6Z" />
    <path className="pr-band pr-y" d="M6 8.2h19c1.4 0 1.4 2 0 2H6Z" />
    <path className="pr-band pr-g" d="M6 11h19c1.4 0 1.4 2 0 2H6Z" />
    <path className="pr-band pr-b" d="M6 13.8h19c1.4 0 1.4 2 0 2H6Z" />
    <path className="pr-band pr-v" d="M6 16.6h19c1.4 0 1.4 2 0 2H6Z" />
  </svg>
)

// One confetti tab that falls and tumbles once.
const Tab = ({ className = '' }) => (
  <svg className={'pr-tab ' + className} viewBox="0 0 10 14" aria-hidden="true" focusable="false">
    <rect x="1" y="1" width="8" height="12" rx="2" />
  </svg>
)

export function Layer({ hidden }) {
  if (hidden) return null
  return null   // Pride stays inside cards and headers; nothing floats page-wide.
}

/** Decoration for one place in a view. Unknown spots draw nothing. */
export function Deco({ spot }) {
  switch (spot) {
    case 'header-bats': return <HeaderRibbon />
    case 'stats-hdr': return <HeaderRibbon />
    case 'home-hero': return <HeroRibbon />
    case 'home-streak': return <MiniFlag />
    case 'rest-timer': return <RestRibbon />
    case 'streak-party': return <FinishConfetti />
    case 'finish': return <span className="pr-corner" aria-hidden="true"><Flag /></span>
    default: return null
  }
}

// A ribbon runs once along the header's baseline; the confetti over it stops after five tabs.
const HeaderRibbon = () => (
  <span className={'pr-hribbon' + (reducedMotion() ? ' pr-still' : '')} aria-hidden="true">
    <Ribbon className="pr-hr-svg" />
    {!reducedMotion() && <Confetti className="pr-conf pr-conf-hdr" count={5} />}
  </span>
)

const HeroRibbon = () => (
  <span className="pr-heribbon" aria-hidden="true">
    <Ribbon className="pr-he-svg" />
    {!reducedMotion() && <Confetti className="pr-conf pr-conf-hero" count={4} />}
  </span>
)

const RestRibbon = () => {
  if (reducedMotion()) return null
  return <span className="pr-rest" aria-hidden="true">
    <Ribbon className="pr-rest-svg" />
  </span>
}

const MiniFlag = () => (
  <span className="pr-mini" aria-hidden="true"><Flag className="pr-sway" /></span>
)

const FinishConfetti = () => (
  <span className={'pr-finish' + (reducedMotion() ? ' pr-still' : '')} aria-hidden="true">
    <Flag className="pr-f-flag" />
    {!reducedMotion() && <Confetti className="pr-conf pr-conf-fin" count={6} />}
  </span>
)

// The ribbon: six bands bowed along the bottom edge of its container.
const Ribbon = ({ className = '' }) => (
  <svg className={'pr-ribbon ' + className} viewBox="0 0 200 26" preserveAspectRatio="none" aria-hidden="true">
    {['pr-r', 'pr-o', 'pr-y', 'pr-g', 'pr-b', 'pr-v'].map((c, i) => (
      <path key={c} className={'pr-band ' + c}
        d={`M0 ${8 + i * 3} q 50 ${7 - i}, 100 0 t 100 0`} />
    ))}
  </svg>
)

/** `count` tabs in lanes; the CSS staggers the fall. */
const Confetti = ({ className = '', count = 5 }) => (
  <span className={'pr-fall ' + className} aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <Tab key={i} className={'pr-t' + (i % 6)} />
    ))}
  </span>
)
