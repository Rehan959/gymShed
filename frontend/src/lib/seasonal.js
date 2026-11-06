// Seasonal themes (v1.4.3): a little decoration for a few weeks a year. Halloween first, then
// Christmas (v1.4.4) with its advent calendar (lib/advent.js).
//
// This file is all the main bundle carries of them: the list, the date windows and the choice.
// The art, its CSS and its timers live in seasonal/<id>.jsx, fetched only while a theme is on
// (components/Seasonal.jsx), so a profile with themes off, or a day out of season, pays nothing.
//
// The choice is a Look setting like Theme and Accent color, so it syncs with the profile:
// S.seasonal = { halloween: 'auto' | 'on' | 'off', halloweenColors: true, halloweenWorkout: false,
//               christmas: 'auto', christmasColors: false, christmasWorkout: true }.
// Absent reads as Auto, without the colours, and with the workout screen decorated.
// What happens once a day (the pumpkin's surprise) is per device, in localStorage below.

/* One entry per theme. `from` and `to` are [month, day], 1-based and inclusive, in local time:
   Halloween is on from 1 October to the end of 31 October and gone on 1 November. A theme whose
   dates move with the year (Easter) sets `when` instead: a function that answers the same
   [from, to] md pair for the year `now` falls in. The strings are English keys, translated
   where they are shown. A theme with `colors` offers an accent override, which is only ever
   opt-in. `appIcon` names its icon in lib/app-icon-variants.js, which the settings page then
   suggests while the theme shows. */
import { isOn } from './modules.js'

export const THEMES = [
  {
    id: 'halloween', title: 'Halloween', icon: 'pumpkin', tint: 'var(--orange)',
    from: [10, 1], to: [10, 31],
    colors: 'orange', colorsTitle: 'Spooky colors', colorsNote: 'A pumpkin orange accent while Halloween shows. Your own color comes back after.',
    workoutTitle: 'Also during workouts', workoutNote: 'A cobweb in the header, bats behind the rest timer, pumpkins on the finish screen. Never on your sets.',
    during: 'Spiders, bats and one shy pumpkin until the end of October. Never during a workout.',
    back: 'Back next October. The spiders are on holiday.',
    appIcon: 'halloween', appIconTitle: 'Try the Halloween app icon',
  },
  {
    id: 'christmas', title: 'Christmas', icon: 'gift', tint: 'var(--red)',
    // The 31st belongs to New Year's Eve, so the two windows butt up and never overlap.
    from: [12, 1], to: [12, 30],
    colors: 'red', colorsTitle: 'Festive colors', colorsNote: 'A berry red accent while Christmas shows. Your own color comes back after.',
    workoutTitle: 'Also during workouts', workoutNote: 'A few snowflakes behind the cards, a bauble in the header, presents on the finish screen. Never on your sets.',
    during: 'Snow, fairy lights, a sleigh and an advent calendar until the 30th of December. Never on your sets.',
    back: 'Back next December. The elves are on a tea break.',
    appIcon: 'christmas', appIconTitle: 'Try the Christmas app icon',
  },
  {
    id: 'newyear', title: "New Year's Eve", icon: 'sparkles', tint: 'var(--gold)',
    from: [12, 31], to: [1, 1],
    colors: 'gold', colorsTitle: 'Firework colors', colorsNote: "A gold accent while the fireworks show. Your own color comes back after January's first log.",
    workoutTitle: 'Also during workouts', workoutNote: 'Sparks behind the rest timer and a bottle-pop card on the finish screen. Never on your sets.',
    during: 'Fireworks, a countdown and a quiet midnight clock until the 1st is over. Never on your sets.',
    back: 'Back on New Year’s Eve. The clock is resting.',
  },
  {
    id: 'valentine', title: 'Valentine', icon: 'heart', tint: 'var(--pink)',
    from: [2, 10], to: [2, 15],
    colors: 'pink', colorsTitle: 'Lovestruck colors', colorsNote: 'A pink accent while the hearts float. Your own color comes back after the 15th.',
    workoutTitle: 'Also during workouts', workoutNote: 'A heart in the header and one on the finish screen, if you failed your sets. Never judge, though.',
    during: 'A few gently drifting hearts until the 15th of February. Never during a workout.',
    back: 'Back next February. The hearts have other plans.',
  },
  {
    id: 'pride', title: 'Pride', icon: 'flag', tint: 'var(--pink)',
    from: [6, 20], to: [6, 30],
    workoutTitle: 'Also during workouts', workoutNote: 'A rainbow ribbon behind the cards. Never on your sets.',
    during: 'A rainbow ribbon and a few floating confetti until the end of June. Never during a workout.',
    back: 'Back next June. The ribbon rests.',
  },
  {
    id: 'summer', title: 'Summer', icon: 'sun', tint: 'var(--yellow)',
    // Pride owns late June, so the summer light starts the 1st of July and the two never meet.
    from: [7, 1], to: [8, 31],
    workoutTitle: 'Also during workouts', workoutNote: 'A sunbeam in the header and on the finish screen. Never on your sets.',
    during: 'Warm light, a sun and a few bees from the 1st of July to the end of August. Never during a workout.',
    back: 'Back next July. The sun has gone on tour.',
  },
  {
    id: 'easter', title: 'Easter', icon: 'egg', tint: 'var(--teal)',
    // Nominal window, unused while `when` answers: the real one is Easter Saturday to Easter
    // Monday, computed per year below.
    from: [4, 4], to: [4, 6],
    when: easterWindow,
    colors: 'teal', colorsTitle: 'Pastel colors', colorsNote: 'A teal accent while the eggs hide. Your own color comes back after the Monday.',
    workoutTitle: 'Also during workouts', workoutNote: 'An egg behind the rest timer and a hunts on the finish screen. Never on your sets.',
    during: 'Eggs, a shy bunny and spring petals from Saturday to Monday. Never during a workout.',
    back: 'Back with the Easter eggs. The bunny is off duty.',
  },
]
export const THEME_IDS = THEMES.map(th => th.id)
export const CHOICES = ['auto', 'on', 'off']
const byId = id => THEMES.find(th => th.id === id) || null

const md = d => (d.getMonth() + 1) * 100 + d.getDate()

/** Whether `now` (local time) falls inside the theme's window. A window may wrap the new year.
    A theme with `when` (Easter: its dates move with the year) asks `when(now)` for the window
    that applies this time, and the same md comparison runs on the answer. */
export function inSeason(theme, now = new Date()) {
  const th = typeof theme === 'string' ? byId(theme) : theme
  if (!th) return false
  let from = th.from, to = th.to
  if (th.when) [from, to] = th.when(now)
  const x = md(now), a = from[0] * 100 + from[1], b = to[0] * 100 + to[1]
  return a <= b ? x >= a && x <= b : x >= a || x <= b
}

/* ---------------------------------------------------------------- Easter -- */

/** Easter Sunday for `year` (Meeus/Jones/Butcher, Gregorian): the one movable feast the app has.
    Local time, 1-based [month, day] answers, like every window in this file. */
export function easterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return [month, day]
}

/** The md pair for Easter Saturday to Easter Monday of `now`'s year: [easter-1, easter+1]. */
function easterWindow(now) {
  const [em, ed] = easterSunday(now.getFullYear())
  const easter = new Date(now.getFullYear(), em - 1, ed)
  const sat = new Date(easter); sat.setDate(sat.getDate() - 1)
  const mon = new Date(easter); mon.setDate(mon.getDate() + 1)
  return [[sat.getMonth() + 1, sat.getDate()], [mon.getMonth() + 1, mon.getDate()]]
}

/** 'auto', 'on' or 'off'; anything else (absent, a value from a newer client) reads as Auto. */
export function seasonChoice(S, id) {
  const v = S?.seasonal?.[id]
  return CHOICES.includes(v) ? v : 'auto'
}

/** Whether the theme shows now: On always, Off never, Auto inside its window. */
export function themeOn(S, id, now = new Date()) {
  const c = seasonChoice(S, id)
  return c === 'on' || (c === 'auto' && inSeason(id, now))
}

/** The theme showing now, or null. The first in the list wins if two ever overlap. */
export function activeSeason(S, now = new Date()) {
  // Settings → Modules: Seasonal themes off is no theme at all, whatever each one is set to.
  if (!isOn(S, 'seasonal')) return null
  return THEMES.find(th => themeOn(S, th.id, now))?.id || null
}

/** The accent a showing theme puts on instead of the user's own, when its colours are chosen. */
export function seasonAccent(S, now = new Date()) {
  const id = activeSeason(S, now)
  const th = id && byId(id)
  return th?.colors && S?.seasonal?.[id + 'Colors'] === true ? th.colors : null
}

/** Whether the showing theme also decorates the workout screen: on unless switched off. */
export function seasonInWorkout(S, now = new Date()) {
  const id = activeSeason(S, now)
  return !!id && S?.seasonal?.[id + 'Workout'] !== false
}

/* Once a day per device: true the first time it is asked on a local date, false after. Storage
   that is not there (a private window, blocked site data) answers false, so nothing repeats. */
const pad = n => String(n).padStart(2, '0')
const dayOf = now => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
export function onceToday(key, now = new Date()) {
  try {
    const k = 'og_season_' + key, today = dayOf(now)
    if (localStorage.getItem(k) === today) return false
    localStorage.setItem(k, today)
    return true
  } catch (e) { return false }
}
/** Whether onceToday(key) already fired today, without using it up. */
export function doneToday(key, now = new Date()) {
  try { return localStorage.getItem('og_season_' + key) === dayOf(now) } catch (e) { return true }
}

export const reducedMotion = () => {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
}
