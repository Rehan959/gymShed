// @vitest-environment happy-dom
// The managed seasonal themes (1.5.0): every module renders the real spots passively and
// silently, and draws nothing once the layer is hidden. Not an art review — a contract test:
// aria-hidden at the root of each decoration, no text in it, nothing interactive inside, no
// throw, and Deco answers null on the spots it does not decorate (components/Seasonal.jsx
// relies on a theme switch leaving nothing behind where it does not decorate).
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import * as newyear from './newyear.jsx'
import * as valentine from './valentine.jsx'
import * as summer from './summer.jsx'
import * as pride from './pride.jsx'
import * as easter from './easter.jsx'

const MODS = { newyear, valentine, summer, pride, easter }
const SPOTS = ['header-bats', 'stats-hdr', 'home-hero', 'home-advent', 'home-streak',
  'streak-flame', 'streak-party', 'rest-timer', 'plan-card', 'finish', 'workout-hdr',
  'workout', 'stats-web', 'stats-tile', 'stats-peek', 'stats-heatmap']

let host, root
afterEach(() => { if (root) act(() => root.unmount()); root = null; host?.remove() })
const mount = el => { host = document.createElement('div'); document.body.append(host); root = createRoot(host); act(() => root.render(el)) }

describe.each(Object.entries(MODS))('%s', (id, mod) => {
  it('exposes the two components components/Seasonal.jsx lazy-loads', () => {
    expect(typeof mod.Layer).toBe('function')
    expect(typeof mod.Deco).toBe('function')
  })

  it('Layer draws nothing once the theme is hidden, and something real when it shows', () => {
    mount(<mod.Layer hidden />)
    expect(host.innerHTML).toBe('')
    if (id !== 'newyear') return   // card-bound themes keep their layer empty by design
    act(() => root.render(<mod.Layer hidden={false} fresh />))
    expect(host.querySelectorAll('.ny-fw').length).toBeGreaterThan(0)
  })

  it('Deco is aria-hidden, holds no text, nothing interactive, and answers null elsewhere', () => {
    mount(<noscript />)
    let own = 0
    for (const spot of SPOTS) {
      act(() => root.render(<mod.Deco spot={spot} key={spot} />))
      const art = host.firstElementChild
      if (!art || art.tagName === 'NOSCRIPT') continue
      own++
      expect(art.getAttribute('aria-hidden'), `${id} ${spot}`).toBe('true')
      expect(art.textContent.trim(), `${id} ${spot}`).toBe('')
      const interactive = [...art.querySelectorAll('*')].some(el =>
        el.tagName === 'BUTTON' || el.tagName === 'A' ||
        [...(el.attributes || [])].some(a => a.name.startsWith('on')))
      expect(interactive, `${id} ${spot}`).toBe(false)
    }
    expect(own, `${id} decorates at least one spot`).toBeGreaterThan(0)
  })
})
