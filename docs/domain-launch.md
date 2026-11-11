# Launch cosmicnexus.xyz

## Current state

Public DNS checked on 11 November 2026, Brisbane time.

- Registrar supplied by Luke is GoDaddy.
- Apex A records currently resolve to `13.248.243.5` and `76.223.105.230`.
- `www` currently aliases `cosmicnexus.xyz`.
- The current public website is served from `https://auraofintelligence.github.io/strange-but-true-cosmic-nexus/`.

## Connect GitHub Pages and GoDaddy

1. Open this repository's Settings → Pages. Confirm its publishing source, then set Custom domain to `cosmicnexus.xyz` and save. Branch publishing creates a root `CNAME` file containing that domain. For an Actions publishing source, configure the domain in Pages settings.
2. Open GoDaddy Domain Portfolio → cosmicnexus.xyz → DNS. Replace the two existing apex A records with the four rows below. Each row uses the name `@`.

   | Type | Name | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | auraofintelligence.github.io |

3. Change the existing `www` CNAME to the target above. Use GoDaddy's default TTL.
4. Wait for GitHub Pages to report a successful DNS check and issue the certificate. Enable Enforce HTTPS once available. DNS changes can take up to 24 hours according to GitHub's documentation.
5. Open both `https://cosmicnexus.xyz/` and `https://www.cosmicnexus.xyz/`. Check the field guide, menu, styles, assets, sign-up destination and field-brief download. Check that the previous project Pages address redirects correctly.
6. Update the sitemap URLs and the Sitemap line in `robots.txt` to `https://cosmicnexus.xyz/`, add page-specific canonical URLs and update the README public-site links. Fetch the GitHub-generated `CNAME` commit into the local checkout.

The source uses relative internal URLs and local assets so the pages can move to the domain root.

## Documentation

- [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GoDaddy A records](https://www.godaddy.com/help/add-or-edit-an-a-record-42545)
- [GoDaddy DNS management](https://www.godaddy.com/help/manage-dns-records-680)
