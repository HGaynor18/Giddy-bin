// Giddy-bin platform: Google sign-in, the approved-people check, and the shared store.
//
// Each page loads, in order: the three Firebase compat scripts, config.js, registry.js, then this file.
// A work-site page also sets window.GB_SPACE = "<site id>" before this file.
//
// Site pages were first written against a small shared-store API (window.claude.use('db') / use('user')).
// This file provides that same API on top of Firestore, scoped to spaces/<site id>/..., so a site page
// does not need to know about Firebase at all.
(function () {
  'use strict';

  var CFG = window.GB_CONFIG, REG = window.GB_REGISTRY || [];
  var SPACE = window.GB_SPACE || null;
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
  var entry = SPACE ? REG.filter(function (r) { return r.id === SPACE; })[0] : null;
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
      var s = { uid: u.uid, email: u.email, name: u.displayName || u.email, role: role,
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

  window.GB = { ready: ready, fs: fs, auth: auth, root: ROOT, registry: REG, config: CFG, canOpen: canOpen };
})();
