# ShortCut Studio ownership and ad monetization guide

This app is ready to be moved to an account you control and monetized with ads.

## What you own

- `index.html` - app structure and SEO metadata.
- `styles.css` - responsive visual design.
- `script.js` - deterministic Shorts script generation logic.
- `OWNER_GUIDE.md` - this setup guide.

## Recommended ownership setup

1. Create a GitHub repository under your own account.
2. Upload these files to that repository.
3. Deploy the repository on Vercel or Netlify.
4. Connect a custom domain that you own.
5. Add privacy policy, terms, contact page, and about page before applying for Google AdSense.

## How to earn with ads

Google AdSense and most ad networks require approval before ads show. After approval:

1. Get your publisher ID and ad unit code from the ad network.
2. Replace the two `.ad-slot` placeholders in `index.html` with the ad network script.
3. Keep ad density low at first: one leaderboard near the top and one placement after the tool output.
4. Add analytics so you can measure page views, clicks, RPM, and topics that bring users back.

## Important limitation

The current Perplexity deployment is a preview link. For real ownership and revenue, deploy the files to your own hosting account and connect your own domain and ad account.
