// NovelKit launch page: scroll reveals, the film's play buttons, and the ghost-text demo.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Reveals: content is visible without JS; with it, each block eases in once.
const revealed = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue
    entry.target.classList.add('is-in')
    revealed.unobserve(entry.target)
  }
}, { rootMargin: '0px 0px -8% 0px' })
for (const node of document.querySelectorAll('[data-reveal]')) revealed.observe(node)

// The film.
const film = document.getElementById('film')
for (const button of document.querySelectorAll('[data-play]')) {
  button.addEventListener('click', () => {
    film.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    film.currentTime = 0
    film.play().catch(() => film.focus())
  })
}

// Ghost text: the writer pauses, a grey line is offered, Tab accepts it.
const demo = document.querySelector('[data-ghost-demo]')
if (demo) {
  const accept = demo.querySelector('[data-accept]')
  const label = demo.querySelector('[data-accept-label]')
  const status = demo.querySelector('[data-ghost-status]')
  let timer = 0

  const offer = () => {
    clearTimeout(timer)
    demo.dataset.state = 'writing'
    label.textContent = '接受'
    status.textContent = ''
    timer = setTimeout(() => { demo.dataset.state = 'offered' }, reduceMotion ? 0 : 1100)
  }
  const take = () => {
    clearTimeout(timer)
    demo.dataset.state = 'accepted'
    label.textContent = '再看一次'
    status.textContent = '已接受，接着写。'
  }

  accept.addEventListener('click', () => (demo.dataset.state === 'accepted' ? offer() : take()))
  // While the key is focused, the real Tab accepts once; the next Tab moves on as usual.
  accept.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab' || event.shiftKey || demo.dataset.state !== 'offered') return
    event.preventDefault()
    take()
  })

  const seen = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    offer()
    seen.disconnect()
  }, { threshold: 0.5 })
  seen.observe(demo)
}

// Downloads: the newest release (prereleases included) of the public repo, matched per platform.
const releases = 'https://api.github.com/repos/ForgeAILab/novelkit/releases?per_page=1'
const patterns = {
  'mac-arm': /_aarch64\.dmg$/,
  'mac-intel': /_x64\.dmg$/,
  windows: /_x64-setup\.exe$/,
  linux: /\.AppImage$/,
}
const platform = (() => {
  const ua = navigator.userAgent
  if (/Windows/.test(ua)) return 'windows'
  if (/Mac/.test(ua)) return 'mac-arm' // Browsers hide the chip; Apple silicon is the safer guess.
  if (/Linux/.test(ua)) return 'linux'
  return null
})()
fetch(releases)
  .then((response) => (response.ok ? response.json() : []))
  .then(([release]) => {
    if (!release) return
    const name = document.querySelector('[data-release-name]')
    if (name) name.textContent = release.tag_name
    for (const link of document.querySelectorAll('[data-asset]')) {
      const asset = release.assets.find((candidate) => patterns[link.dataset.asset].test(candidate.name))
      if (asset) link.href = asset.browser_download_url
      if (link.dataset.asset === platform) link.classList.add('is-yours')
    }
  })
  .catch(() => {})
