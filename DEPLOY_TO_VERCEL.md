# Deploy ShortCut Studio to Vercel and monetize with ads

## Recommended ownership stack

- Hosting: Vercel
- Domain: a custom `.com` domain you own
- Ads: Google AdSense after the site has original content and legal pages
- Analytics: Google Search Console and Google Analytics

## Step-by-step deployment

1. Go to https://github.com and create a new repository named `shortcut-studio`.
2. Upload all files from this folder to that repository.
3. Go to https://vercel.com and sign in with the same GitHub account.
4. Click `Add New` → `Project`.
5. Import the `shortcut-studio` repository.
6. Framework preset: `Other`.
7. Build command: leave empty.
8. Output directory: leave empty.
9. Click `Deploy`.

## Connect your domain

1. In Vercel, open the project.
2. Go to `Settings` → `Domains`.
3. Add your domain, for example `shortscriptstudio.com`.
4. Follow Vercel’s DNS instructions at your domain registrar.
5. Replace the canonical URL in `index.html` from `https://your-domain.com/` to your real domain.

## Before applying for AdSense

Add these pages:

- `/about.html`
- `/contact.html`
- `/privacy.html`
- `/terms.html`
- 10 to 30 useful SEO pages or blog posts for creators

Google AdSense typically reviews whether you own the site, can edit HTML, and have original useful content that follows policies.

## Add AdSense later

After approval, replace the two `.ad-slot` placeholders in `index.html` with your AdSense ad unit code.
