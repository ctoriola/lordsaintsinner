# Lord, Saint, Sinner — website

Static, dependency-free website for Lord, Saint, Sinner, an independent music company (label, publishing, management, live, studio, sync).

## Pages

This `landing` branch is the single-page landing site delivered to the client:

| File | Page |
| --- | --- |
| `index.html` | Landing page. The navigation scrolls to its sections: About, Artist, Music, Listen, Services, Live, Journal, Contact |
| `404.html` | Not-found page, linking back to the landing page |

The full multi-page site lives on `main`.

## Deploying (Vercel)

No build step. Import the repo as a Vercel project with Framework Preset "Other", set the production branch to `landing` (Settings → Git), and add the domain to that project.

## Running locally

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

## Logos

- `assets/img/lss-badge.png`: circular badge (header, footer, favicon, about page)
- `assets/img/lss-wordmark.png`: red wordmark (footer, about page, press downloads)
- `assets/img/lss-wordmark-cream.png`: cream version used as the home hero watermark
- `assets/img/favicon.png`, `assets/img/apple-touch-icon.png`: generated from the badge

## Streaming links

Artist, release and playlist links to Spotify, Apple Music, YouTube Music, Audiomack, Boomplay, TIDAL, Deezer and Amazon Music are rendered by `listen_links()`. Until real profile URLs are added, each link opens a search for the artist or release on that platform.

## Notes

- Styles live in `assets/css/styles.css` and behaviour in `assets/js/main.js`.
- The player uses a small WebAudio synth as stand-in audio. Swap in real audio files when they're available.
- Artist portraits and cover art are generated with CSS/SVG. Replace them with real photography and artwork.
- Artists, releases, dates, addresses, emails and phone numbers are placeholder content.
- The forms validate in the browser only. Connect them to a backend or form service before launch.
