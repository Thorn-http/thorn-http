# thorn-http.dev

Static website for THorn HTTP (no build step, no cookies, no analytics).

- `index.html` — landing page
- `docs/index.html` — user docs (`/docs`)
- `r.html` + `r.js` — rule links (`/r#1.<data>`): shows the shared rules; the extension's `ruleLink.cs.js` adds the Import button
- `BRIEFING.md` — product summary for whoever designs the landing page; `images/` — product screenshots (2x)
- `privacy.html`, `terms.html` — required by the extension stores
- `_redirects` — `/source` and `/issues` → GitHub (Cloudflare Pages / Netlify syntax)

Deploy: point Cloudflare Pages (or Netlify) at this folder with no build command. `.dev` domains require HTTPS, which both provide.
For GitHub Pages, replace `_redirects` with small HTML redirect pages at `source/index.html` and `issues/index.html`.
