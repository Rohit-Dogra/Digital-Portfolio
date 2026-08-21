/* Work archive — data-driven grid with filtering. No isotope, no jQuery. */
(function () {
  'use strict';
  var grid = document.getElementById('grid');
  if (!grid) return;

  var filtersEl = document.getElementById('filters');
  var emptyEl   = document.getElementById('empty');
  var countEl   = document.getElementById('countLine');

  var GROUPS = [
    { key: 'all',      label: 'All work' },
    { key: 'product',  label: 'Live products' },
    { key: 'mern',     label: 'MERN stack' },
    { key: 'basicweb', label: 'Web builds' },
    { key: 'android',  label: 'Android' }
  ];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Two initials, so a project with no screenshot still gets a real identity.
  // Capitals first — that reads CamelCase product names the way a logo would
  // ("GrowithAmazon" → GA, "WorkflowHub" → WH), not as a random letter pair.
  function monogram(name) {
    var caps = name.match(/[A-Z]/g);
    if (caps && caps.length >= 2) return caps[0] + caps[1];
    var letters = name.replace(/[^A-Za-z0-9]/g, '');
    return (letters.slice(0, 2) || '??').toUpperCase();
  }

  function shot(p) {
    if (p.image) {
      return '<img src="/assets/images/projects/' + esc(p.image) + '.png" alt="Screenshot of ' +
             esc(p.name) + '" loading="lazy" decoding="async" width="640" height="400">';
    }
    return '<span class="pcard__mono" aria-hidden="true">' + esc(monogram(p.name)) + '</span>';
  }

  function card(p) {
    var links = '';
    if (p.links && p.links.view) {
      links += '<a href="' + esc(p.links.view) + '" target="_blank" rel="noopener">' +
               'Visit <svg aria-hidden="true"><use href="#i-arrow-ur"/></svg></a>';
    }
    if (p.links && p.links.code) {
      links += '<a href="' + esc(p.links.code) + '" target="_blank" rel="noopener">' +
               'Code <svg aria-hidden="true"><use href="#i-code"/></svg></a>';
    }
    if (p.internal) {
      links += '<span style="display:inline-flex;align-items:center;gap:.4rem;font-size:var(--t-xs);color:var(--fg-faint)">' +
               '<svg aria-hidden="true" style="width:13px;height:13px"><use href="#i-lock"/></svg> Internal — no public link</span>';
    }

    var flag = p.internal ? '<span class="pcard__flag">Internal</span>'
             : p.featured ? '<span class="pcard__flag pcard__flag--featured">Featured</span>'
             : '';

    return '<article class="pcard" data-cat="' + esc(p.category) + '">' +
             '<div class="pcard__shot">' + shot(p) + flag + '</div>' +
             '<div class="pcard__body">' +
               '<h3>' + esc(p.name) + '</h3>' +
               (p.tech ? '<p class="mono" style="letter-spacing:.08em">' + esc(p.tech) + '</p>' : '') +
               '<p>' + esc(p.desc) + '</p>' +
               '<div class="pcard__links">' + links + '</div>' +
             '</div>' +
           '</article>';
  }

  function render(list) {
    grid.innerHTML = list.map(card).join('');
  }

  function buildFilters(list) {
    var counts = {};
    list.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });

    filtersEl.innerHTML = GROUPS
      .filter(function (g) { return g.key === 'all' || counts[g.key]; })
      .map(function (g, i) {
        var n = g.key === 'all' ? list.length : counts[g.key];
        return '<button class="filter" type="button" data-cat="' + g.key + '" aria-pressed="' +
               (i === 0) + '">' + g.label + '<span class="n">' + n + '</span></button>';
      }).join('');

    filtersEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      Array.prototype.forEach.call(filtersEl.children, function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      var cat = btn.dataset.cat, shown = 0;
      Array.prototype.forEach.call(grid.children, function (c) {
        var on = cat === 'all' || c.dataset.cat === cat;
        c.classList.toggle('is-hidden', !on);
        if (on) shown++;
      });
      emptyEl.hidden = shown > 0;
    });
  }

  fetch('projects.json?v=1.1.1')
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then(function (list) {
      render(list);
      buildFilters(list);
      if (countEl) countEl.textContent = list.length + ' projects listed.';
    })
    .catch(function () {
      grid.innerHTML = '';
      emptyEl.hidden = false;
      emptyEl.textContent = 'The archive could not be loaded. See the selected work on the home page instead.';
    });
})();
