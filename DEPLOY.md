# Raíz — Deploy to Vercel (alaraiz.mx)

This folder is a complete, static website. No build step. Everything it needs is here.

```
site/
├─ index.html            ← the website (entry point)
├─ detente-no-01.html    ← Détente Nº 01 (self-contained)
├─ raiz-v3.css
├─ tweaks-panel.jsx
├─ favicon.svg
├─ robots.txt
├─ sitemap.xml
├─ vercel.json
└─ assets/               ← all images
```

---

## A. Deploy (pick ONE path)

### Option 1 — Vercel CLI (fastest, no Git needed)
1. Install Node.js (if you don't have it): https://nodejs.org
2. In a terminal:
   ```bash
   npm i -g vercel
   cd site            # this folder
   vercel             # log in when prompted, accept defaults → creates a preview URL
   vercel --prod      # promotes it to production
   ```
   When asked "In which directory is your code located?" answer `./`.
   There is no framework and no build command — it's plain static files.

### Option 2 — Git + Vercel dashboard
1. Put the **contents of this folder** in a new GitHub repo (the repo root should contain `index.html`).
2. Go to https://vercel.com/new → Import that repo.
3. Framework Preset: **Other**. Build Command: **(leave empty)**. Output Directory: **(leave empty / `.`)**.
4. Click **Deploy**.

You'll get a `*.vercel.app` URL. Confirm the site looks right before adding the domain.

---

## B. Connect the domain alaraiz.mx
1. In the Vercel project → **Settings → Domains → Add** → type `alaraiz.mx` (and it will offer `www.alaraiz.mx` too — add both; Vercel redirects www → apex by default).
2. Vercel shows the DNS records to set. At your domain registrar (where you bought alaraiz.mx), add them:
   - **Apex `alaraiz.mx`** → an **A record** to `76.76.21.21`
     *(or, if your registrar supports it, an ALIAS/ANAME to `cname.vercel-dns.com`)*
   - **`www`** → a **CNAME** to `cname.vercel-dns.com`
3. Back in Vercel, wait for the checkmarks (DNS can take minutes to a few hours). Vercel issues the HTTPS certificate automatically.

That's it — https://alaraiz.mx will serve this site.

---

## Notes
- **Booking form** opens the visitor's email app prefilled to `bookingrecreo@pm.me` (mailto handoff — no server). Contact addresses: `alaraiz@pm.me` (general/Esporas/advisory) and `recreobyraiz@pm.me` (experiences).
- **Détente** is linked at `/detente-no-01` (clean URL is enabled in `vercel.json`).
- The **Tweaks panel** (Babel/JSX) loads from CDNs at runtime — fine on Vercel; it needs internet, which any live site has.
- To update the site later, re-run `vercel --prod` (Option 1) or push to the repo (Option 2).
