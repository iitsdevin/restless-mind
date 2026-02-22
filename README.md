# The Restless Mind as the Path

An ADHD Buddhist practice companion — time-aware meditation guidance, singing bowl timer, and research overview.

> *"You are not failing at meditation. You are doing more of it."*

## What this is

A web app designed for ADHD practitioners who want to build a contemplative practice rooted in Buddhist traditions. It draws on evidence-based research, classical Buddhist philosophy, and place-based spirituality.

### Features

- **Time-aware practice suggestions** — opens with practices suited to morning, midday, or evening
- **Mood-based recommendations** — select how you're feeling (restless, scattered, anxious, low energy, self-critical, open) and get matched practices
- **Tradition filtering** — Zen, Vajrayana, Theravāda, or Secular approaches
- **Meditation timer** — with layered singing bowl sounds (start bell, end bell, optional interval bells), breathing guide animation, and duration presets from 1–20 minutes
- **Practice-to-timer flow** — tap "Start timer" on any practice card to jump straight to a pre-loaded timer
- **Combined Morning Ritual** — a 10-minute integrated sequence (ancestors + nature + awareness)
- **Research section** — expandable evidence base covering meta-analyses, RCTs, neuroimaging, tradition-specific studies, and honest limitations
- **Noongar seasonal calendar** — practice aligned with the six Whadjuk Noongar seasons (for practitioners on Whadjuk Noongar boodja / Perth, Western Australia)
- **Time-of-day theming** — colours shift from warm amber (morning) to sage green (midday) to deep indigo (evening), with smooth transitions
- **Gentle streak tracker** — notes consecutive days of practice, no guilt
- **Rotating contemplative quotes** — from Dōgen, Tara Brach, Lama Rod Owens, Sophie Strand, Josh Schrei, Shunryu Suzuki, and others

## Getting started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deploy to GitHub Pages

1. Install gh-pages: `npm install -D gh-pages`
2. Add to `package.json` scripts: `"deploy": "vite build && gh-pages -d dist"`
3. Run: `npm run deploy`

Or use any static hosting (Netlify, Vercel, Cloudflare Pages) — just point it at the repo and set the build command to `npm run build` with `dist` as the output directory.

## Tech

- React 19 + Vite
- No external UI libraries — pure React with inline styles
- Web Audio API for singing bowl sounds
- localStorage for streak tracking
- Zero backend, fully static

## Background

This app is a companion to *The Restless Mind as the Path*, a guide exploring the intersection of ADHD neuroscience, Buddhist contemplative traditions, animist spirituality, and place-based practice. The guide covers:

- Evidence from meta-analyses, RCTs, and neuroimaging on mindfulness for ADHD
- How Zen, Vajrayana, Theravāda, and secular approaches each meet the restless mind
- ADHD-adapted practice instructions (shorter sits, movement, multi-sensory anchors)
- Buddhism's animist roots and ancestor veneration traditions
- Nature connection practices and their neurological basis for ADHD
- Seasonal practice aligned with the Noongar calendar

## Acknowledgement

This app is used on Whadjuk Noongar boodja (Perth, Western Australia). We acknowledge the Whadjuk people of the Noongar nation as the traditional custodians of this land and pay our respects to Elders past, present, and emerging.

## License

MIT
