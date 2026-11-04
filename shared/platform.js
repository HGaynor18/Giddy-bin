// Giddy-bin platform: Google sign-in, the approved-people check, and the shared store.
//
// Each page loads, in order: the three Firebase compat scripts, config.js, registry.js, seeds.js, then this file.
// The site page sets window.GB_SPACE = "<site id>" (from its ?id=) before this file.
//
// Add ?embed=1 to any page to drop the account bar, for showing a page inside another app.
//
// Site pages were first written against a small shared-store API (window.claude.use('db') / use('user')).
// This file provides that same API on top of Firestore, scoped to spaces/<site id>/..., so a site page
// does not need to know about Firebase at all.
(function () {
  'use strict';

  var CFG = window.GB_CONFIG, REG = window.GB_REGISTRY || [], SEEDS = window.GB_SEEDS || {};
  var SPACE = window.GB_SPACE || null;
  var EMBED = /[?&]embed=1(&|$)/.test(location.search);
  if (EMBED) document.documentElement.classList.add('gb-embed');
  var me = document.currentScript && document.currentScript.src;
  var ROOT = me ? me.replace(/shared\/platform\.js(\?.*)?$/, '') : './';

  firebase.initializeApp(CFG.firebase);
  var auth = firebase.auth(), fs = firebase.firestore();
  // Keep a copy on the phone so the page still opens with poor signal on site; changes sync when back online.
  // Single-tab mode: the first tab keeps the offline copy, any other tab just works online. (Multi-tab mode
  // routes every tab through one "primary" tab, which stalls when that tab is asleep in the background.)
  try { fs.enablePersistence().catch(function () {}); } catch (e) {}

  // ---------- the gate shown until someone is signed in and approved ----------
  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ROOT + 'shared/platform.css';
  document.head.appendChild(css);

  var gate = document.createElement('div'); gate.className = 'gb-gate'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true');
  gate.innerHTML = '<div class="gb-card"><p class="gb-org"></p><h1 class="gb-title"></h1><p class="gb-msg" aria-live="polite">Checking who you are…</p>' +
    '<div class="gb-actions"></div><p class="gb-fine"></p></div>';
  var bar = document.createElement('div'); bar.className = 'gb-bar'; bar.hidden = true;
  bar.innerHTML = '<a class="gb-home" href="' + ROOT + '">All sites</a><span class="gb-who"></span><button type="button" class="gb-out">Sign out</button>';

  function mount() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', mount); return; }
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(gate);
  }
  mount();
  var q = function (sel) { return gate.querySelector(sel); };
  q('.gb-org').textContent = CFG.orgName;
  var entry = SPACE ? (REG.filter(function (r) { return r.id === SPACE; })[0] || SEEDS[SPACE]) : null;
  q('.gb-title').textContent = entry ? entry.name : CFG.orgName;
  bar.querySelector('.gb-out').addEventListener('click', function () { auth.signOut().then(function () { location.reload(); }); });
  if (!SPACE) bar.querySelector('.gb-home').hidden = true;

  function showGate(msg, buttons, fine) {
    gate.hidden = false; document.documentElement.classList.add('gb-locked');
    q('.gb-msg').textContent = msg;
    var a = q('.gb-actions'); a.innerHTML = '';
    (buttons || []).forEach(function (b) {
      var el = document.createElement('button'); el.type = 'button'; el.textContent = b[0]; el.className = b[2] || 'gb-primary';
      el.addEventListener('click', b[1]); a.appendChild(el);
    });
    q('.gb-fine').textContent = fine || '';
  }
  function hideGate() { gate.hidden = true; document.documentElement.classList.remove('gb-locked'); bar.hidden = false; }

  function signIn() {
    var p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    q('.gb-msg').textContent = 'Opening Google sign-in…';
    auth.signInWithPopup(p).catch(function (err) {
      var c = err && err.code;
      if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment') return auth.signInWithRedirect(p);
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') { showSignIn(); return; }
      if (c === 'auth/unauthorized-domain') { showSignIn('This web address has not been allowed in Firebase yet. Add it under Authentication, Settings, Authorised domains.'); return; }
      showSignIn('Sign-in did not work (' + (c || 'unknown error') + '). Try again.');
    });
  }
  function showSignIn(msg) {
    showGate(msg || 'Sign in with your Google account to open the site notes.', [['Sign in with Google', signIn]],
      'First time? After you sign in, ask Harrison to approve you. You only need to do this once.');
  }

  // ---------- who is signed in and what they can open ----------
  var resolveReady, ready = new Promise(function (r) { resolveReady = r; });
  var session = null, accessUnsub = null, firstOk = null;

  function isOwner(u) { return !!(u && u.emailVerified && u.email && u.email.toLowerCase() === CFG.ownerEmail.toLowerCase()); }
  function allowedSites(acc) { return acc && Array.isArray(acc.sites) ? acc.sites : []; }
  function canOpen(s, id) { return s.isAdmin || s.sites.indexOf('*') !== -1 || s.sites.indexOf(id) !== -1; }

  auth.onAuthStateChanged(function (u) {
    if (accessUnsub) { accessUnsub(); accessUnsub = null; }
    if (!u) { bar.hidden = true; showSignIn(); return; }
    showGate('Checking your access…');
    bar.querySelector('.gb-who').textContent = u.displayName || u.email;
    // Record name and email so an admin can find and approve this person, and so others see who wrote what.
    fs.collection('users').doc(u.uid).set({
      name: u.displayName || u.email || '', email: u.email || '', photo: u.photoURL || '', seen: Date.now()
    }, { merge: true }).catch(function () {});

    accessUnsub = fs.collection('access').doc(u.uid).onSnapshot(function (doc) {
      var acc = doc.exists ? doc.data() : null, owner = isOwner(u);
      var role = owner ? 'admin' : (acc && acc.role) || null;
      // type (staff, supervisor, builder) changes nothing yet; it is there so later tools can tell staff from site people.
      var s = { uid: u.uid, email: u.email, name: u.displayName || u.email, role: role, type: (acc && acc.type) || (owner ? 'staff' : null),
        isAdmin: role === 'admin', sites: allowedSites(acc), canEdit: role === 'admin' || role === 'member' };
      var ok = !!role && (SPACE ? canOpen(s, SPACE) : true);
      // Access changed while the page was open: reload so everything starts from the right footing.
      if (firstOk !== null && ok !== firstOk) { location.reload(); return; }
      if (firstOk === null) firstOk = ok;
      session = s;
      if (!ok) {
        showGate(role ? 'You are approved, but not for this site yet. Ask Harrison to tick it for you.'
          : 'Signed in as ' + u.email + '. Waiting for Harrison to approve you. This page opens by itself once you are approved.',
          [['Use a different account', function () { auth.signOut(); }, 'gb-secondary']].concat(SPACE && role ? [['All sites', function () { location.href = ROOT; }]] : []));
        return;
      }
      hideGate();
      resolveReady(s);
    }, function () {
      showGate('Could not check your access. Check your connection and reload.', [['Reload', function () { location.reload(); }]]);
    });
  });
  auth.getRedirectResult().catch(function () {});

  // ---------- the shared-store API used by site pages, scoped to spaces/<id> ----------
  var CODE = { 'permission-denied': 'not_granted', 'unauthenticated': 'not_granted', 'not-found': 'invalid_argument',
    'invalid-argument': 'invalid_argument', 'resource-exhausted': 'quota_exceeded' };
  function tidy(err) { var e = new Error(err && err.message); e.code = CODE[err && err.code] || 'unavailable'; e.cause = err; throw e; }
  function wrapDoc(ref) {
    return {
      id: ref.id,
      set: function (v) { return ref.set(v).catch(tidy); },
      update: function (v) { return ref.update(v).catch(tidy); },
      delete: function () { return ref.delete().catch(tidy); },
      onSnapshot: function (a, b) { return ref.onSnapshot(a, b); }
    };
  }
  function wrapQuery(qr) {
    var o = {
      limit: function (n) { return wrapQuery(qr.limit(n)); },
      onSnapshot: function (next, err) { return qr.onSnapshot(next, err); }
    };
    if (typeof qr.doc === 'function') o.doc = function (id) { return wrapDoc(id === undefined ? qr.doc() : qr.doc(String(id))); };
    return o;
  }
  var spaceDb = SPACE ? {
    collection: function (name) { return wrapQuery(fs.collection('spaces').doc(SPACE).collection(name)); }
  } : null;
  var userApi = {
    id: function () { return ready.then(function (s) { return s.uid; }); },
    can: function (what) { return ready.then(function (s) { return what === 'data.write' ? s.canEdit : true; }); },
    profiles: function (ids) {
      return Promise.all(ids.map(function (id) {
        return fs.collection('users').doc(id).get().then(function (d) { return [id, d.exists ? { name: d.data().name || '' } : null]; }, function () { return [id, null]; });
      })).then(function (pairs) { var out = {}; pairs.forEach(function (p) { out[p[0]] = p[1]; }); return out; });
    }
  };
  window.claude = window.claude || {};
  window.claude.use = function (name) {
    return ready.then(function () { return name === 'db' ? spaceDb : name === 'user' ? userApi : null; });
  };

  // ---------- sites: kept in Firestore (sites/<id>, plan image in sitePlans/<id>) ----------
  //
  // A site record: { name, detail, kind: 'units' | 'house', status: 'active' | 'archived', unitWord: 'Unit' | 'Lot' | ...,
  //   units: [ { id, label, x, y, storey: 'single' | 'double', type, extra } ], plan: { w, h, pageMm, source, v } | null,
  //   hit: { w, h } (optional tap area), source (credit line), links: {} (for a future job system), mod, by }
  // A unit's id never changes, so notes stay with the unit even if its number is changed on the plan.
  function str(v, max, dflt) { return typeof v === 'string' ? v.slice(0, max) : (dflt || ''); }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function normSite(id, v) {
    v = v || {};
    var units = Array.isArray(v.units) ? v.units : [];
    return {
      id: id, name: str(v.name, 120) || id, detail: str(v.detail, 300), kind: v.kind === 'house' ? 'house' : 'units',
      status: v.status === 'archived' ? 'archived' : 'active', unitWord: str(v.unitWord, 20) || 'Unit', source: str(v.source, 600),
      plan: v.plan && v.plan.w && v.plan.h ? { w: num(v.plan.w), h: num(v.plan.h), pageMm: v.plan.pageMm || null, source: v.plan.source || null, v: num(v.plan.v), src: v.plan.src || null } : null,
      hit: v.hit && v.hit.w ? { w: num(v.hit.w), h: num(v.hit.h) } : null,
      links: v.links && typeof v.links === 'object' ? v.links : {},
      units: units.filter(function (u) { return u && typeof u.id === 'string' && u.id; }).map(function (u) {
        var o = { id: u.id.slice(0, 40), label: str(u.label, 12) || u.id, x: num(u.x), y: num(u.y), storey: u.storey === 'double' ? 'double' : 'single', type: str(u.type, 20), extra: str(u.extra, 200) };
        if (typeof u.hx === 'number') { o.hx = u.hx; o.hy = num(u.hy); }
        return o;
      }),
      fromSeed: false, mod: num(v.mod)
    };
  }
  function seedSite(id) { var s = normSite(id, SEEDS[id]); s.fromSeed = true; return s; }
  function siteRef(id) { return fs.collection('sites').doc(id); }
  // Every site this person can open (archived ones included; callers decide whether to show them).
  function listSites(s) {
    var all = s.isAdmin || s.sites.indexOf('*') !== -1, sites = fs.collection('sites');
    var got = all ? sites.get().then(function (snap) { return snap.docs.map(function (d) { return normSite(d.id, d.data()); }); })
      : Promise.all(s.sites.map(function (id) {
        return siteRef(id).get().then(function (d) { return d.exists ? normSite(d.id, d.data()) : null; }, function () { return null; });
      })).then(function (list) { return list.filter(Boolean); });
    return got.catch(function () { return []; }).then(function (list) {
      Object.keys(SEEDS).forEach(function (id) {
        if (canOpen(s, id) && !list.some(function (x) { return x.id === id; })) list.push(seedSite(id));
      });
      return list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
  }
  // One site and the address of its plan image (a data: URL from Firestore, or the seed's file).
  function getSite(id) {
    return siteRef(id).get().then(function (d) {
      if (!d.exists) return SEEDS[id] ? seedSite(id) : null;
      return normSite(d.id, d.data());
    }, function (err) { if (SEEDS[id]) return seedSite(id); throw err; }).then(function (site) {
      if (!site) return null;
      if (site.fromSeed) { site.planSrc = site.plan && site.plan.src ? ROOT + site.plan.src : null; return site; }
      if (!site.plan) { site.planSrc = null; return site; }
      return fs.collection('sitePlans').doc(id).get().then(function (p) { site.planSrc = p.exists && p.data().data || null; return site; },
        function () { site.planSrc = null; return site; });
    });
  }
  // Admins: copy a built-in site into Firestore, so it can be edited like any other.
  function blobToDataUrl(b) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(b); }); }
  function storeSeed(id, s) {
    var seed = SEEDS[id]; if (!seed || !s || !s.isAdmin) return Promise.resolve(false);
    return siteRef(id).get().then(function (d) {
      if (d.exists) return false;
      var write = function (data) {
        var now = Date.now(), body = JSON.parse(JSON.stringify(seed));
        if (body.plan) { delete body.plan.src; body.plan.v = now; }
        body.mod = now; body.by = s.uid;
        var steps = data ? fs.collection('sitePlans').doc(id).set({ data: data, w: seed.plan.w, h: seed.plan.h, v: now }) : Promise.resolve();
        return steps.then(function () { return siteRef(id).set(body); }).then(function () { return true; });
      };
      if (!seed.plan || !seed.plan.src) return write(null);
      return fetch(ROOT + seed.plan.src).then(function (r) { if (!r.ok) throw new Error('plan ' + r.status); return r.blob(); }).then(blobToDataUrl).then(write);
    });
  }

  window.GB = { ready: ready, fs: fs, auth: auth, root: ROOT, registry: REG, config: CFG, canOpen: canOpen, embed: EMBED,
    seeds: SEEDS, normSite: normSite, listSites: listSites, getSite: getSite, storeSeed: storeSeed };
})();
