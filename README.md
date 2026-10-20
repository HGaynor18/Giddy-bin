# Giddy-bin

Plumbing site notes and logistics. Live at https://hgaynor18.github.io/Giddy-bin/

- `index.html` – the hub. After sign-in, lists the work sites and tools you can open.
- `admin/` – approve people and tick which sites they can open (admins only).
- `sites/peninsula-view/` – Peninsula View Stage 2 unit notes, materials and morning checks.
- `shared/` – sign-in, the approval check and the shared store used by every page.
- `firestore.rules` – who can read and write what. Paste into the Firebase console when it changes.

## How access works

1. Someone opens the link and signs in with Google.
2. They show up under "Waiting for approval" on the Admin page.
3. An admin picks Can view, Can edit or Admin, and ticks the sites. Their page opens by itself.

The owner (set in `shared/config.js` and `firestore.rules`) is always an admin.

## Adding another work site or tool

1. Copy `sites/peninsula-view/` to `sites/<new-id>/` (or make `tools/<new-id>/`) and change the page.
2. In the new page, set `window.GB_SPACE = "<new-id>"`.
3. Add an entry to `shared/registry.js`.
4. Tick the new site for people on the Admin page.

Each site's data is kept separately in Firestore under `spaces/<id>/`, so sites never mix.

## Data

Firebase project `peninsulaview-notes`, Cloud Firestore. Pages keep an offline copy on the phone, so they still open with poor signal and sync when back online.
