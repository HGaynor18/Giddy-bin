# Giddy-bin

Plumbing site notes and logistics. Live at https://hgaynor18.github.io/Giddy-bin/

- `index.html` – the hub. After sign-in, lists the work sites (and tools) you can open.
- `site/?id=<site>` – one page for every work site: plan with unit numbers, unit notes and lists, materials, important tasks and notes.
  Add `&embed=1` to hide the account bar, for showing a site inside another app.
- `admin/` – People and access: approve people, set what they can do, their type, and which sites they see (by person or by site).
- `admin/sites/` – Site editor (admins): make a site, upload its plan (PDF, PNG or JPG, saved as a JPG), place unit numbers, set single or double storey.
- `shared/` – theme, sign-in, the approval check, the site store, and built-in seed data for Peninsula View.
- `sites/peninsula-view/` – old address, now redirects to `site/?id=peninsula-view`. Also holds the original plan image used as the seed.
- `firestore.rules` – who can read and write what. **Paste into the Firebase console whenever it changes.**

## How access works

1. Someone opens the link and signs in with Google.
2. They show up under "Waiting for approval" on People and access.
3. An admin picks Can view, Can edit or Admin, a person type, and ticks the sites. Their page opens by itself.

The owner (set in `shared/config.js` and `firestore.rules`) is always an admin.

Person type (Staff, Supervisor, Builder) is recorded but does not change anything yet. It is there so later tools, such as job tracking,
can be limited to staff while supervisors and builders only ever see the sites they are ticked for.

## Adding a work site

1. Open Admin > Site editor, type a name, press New site.
2. Upload the plan. For a PDF with several pages, choose the page.
3. Click the plan to place each number. Drag to adjust. Set single or double storey and the type.
4. Save, then tick the site for people on People and access.

Archiving a site hides it from everyone but admins. Nothing is deleted.

## Data (Firestore, project `peninsulaview-notes`)

- `sites/<id>` – name, units (each with a permanent id, its number, position, storey, type), plan size and paper size, `links` (empty, for a future job system).
- `sitePlans/<id>` – the plan as a compressed JPG (kept under 1 MB).
- `spaces/<id>/...` – what people add: `notes`, `items` (lists), `places` and `stock` (materials), `flags` (important tasks and notes).
- `access/<uid>`, `users/<uid>` – who is approved and for what.

Notes and lists are keyed by a unit's id, not its number, so renumbering a unit in the editor keeps its notes.
Pages keep an offline copy on the phone, so they still open with poor signal and sync when back online.

## Adding a tool (quoting, drain measuring, ...)

Make a folder under `tools/<id>/`, add an entry to `shared/registry.js`, and tick it for people on People and access.
A PDF plan's paper size is saved with each site, so a measuring tool can turn plan distances into metres once a scale is set.
