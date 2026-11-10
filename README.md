# Wishes and Ribbons

A static gift shop demonstration with three curated sets, an optional personalised message, an editable review summary and a pretend-order confirmation. No account, backend, real order or payment is created.

## Publish on GitHub Pages

1. Create a GitHub repository named `wishes-and-ribbons`, with `main` as its default branch.
2. Upload this folder's contents, including `.github/workflows/pages.yml`. Do not upload the ZIP file itself.
3. In the repository, open **Settings → Pages** and set **Source → GitHub Actions**.
4. In **Actions**, open **Publish Wishes and Ribbons** and choose **Run workflow** if it has not run automatically.
5. After the deployment succeeds, the public website link appears in **Settings → Pages** and in the workflow deployment.

The site will normally appear at `https://joyafolabi2804-beep.github.io/wishes-and-ribbons/`. All local asset links work from a repository subdirectory. The workflow deploys only `dist/`, not the tests or project documentation.

## Local preview

Run `python3 -m http.server 8000 --directory dist`, then open http://localhost:8000.

## Checks

Requires Node.js and Python 3:

```sh
node --test tests/order.test.cjs
node tests/prd-dom-smoke.cjs
```

## Edit the shop

Gift details and integer-cent EUR prices are in `dist/order.js`; page content is in `dist/index.html`; styles are in `dist/styles.css` and `dist/shop.css`. The tea gift set has a sample price. Product photographs and branding assets are in `dist/assets/`.

This export includes only the live website assets. It excludes hosting credentials, local Git history, reference documents and unused photographs. Google Fonts is loaded externally.
