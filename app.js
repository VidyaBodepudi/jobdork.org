/**
 * JobDork.org — Warm, Modern ATS Job Search Engine
 * Exclusively focused on Lever, Ashby, and Greenhouse.
 */

(function () {
  'use strict';

  // ATS Board Registry — Strictly Lever, Ashby, Greenhouse
  const ATS_BOARDS = {
    ashby: {
      id: 'ashby',
      name: 'Ashby',
      tag: 'AI & High-Growth Tech',
      examples: 'OpenAI, Perplexity, Linear, Cursor, Ramp',
      dork: 'site:jobs.ashbyhq.com',
      badgeClass: 'ashby',
      defaultActive: true
    },
    greenhouse: {
      id: 'greenhouse',
      name: 'Greenhouse',
      tag: 'Scale-Ups & Tech Leaders',
      examples: 'Stripe, Airbnb, Figma, Datadog, GitHub',
      dork: '(site:boards.greenhouse.io OR site:job-boards.greenhouse.io)',
      badgeClass: 'greenhouse',
      defaultActive: true
    },
    lever: {
      id: 'lever',
      name: 'Lever',
      tag: 'Venture-Backed & Engineering',
      examples: 'Spotify, Netflix, Eventbrite, Plex',
      dork: 'site:jobs.lever.co',
      badgeClass: 'lever',
      defaultActive: true
    }
  };

  const ROLE_PRESETS = [
    { label: '🧑‍💻 Software Engineer', query: 'Software Engineer' },
    { label: '🥞 Full Stack', query: 'Full Stack Engineer' },
    { label: '🎨 Product Designer', query: 'Product Designer' },
    { label: '📦 Product Manager', query: 'Product Manager' },
    { label: '🤖 AI / ML Engineer', query: 'Machine Learning Engineer, AI Engineer' },
    { label: '⚡ Frontend Dev', query: 'Frontend Engineer' },
    { label: '⚙️ Backend Dev', query: 'Backend Engineer' },
    { label: '☁️ DevOps / SRE', query: 'DevOps Engineer, Site Reliability Engineer' },
    { label: '📊 Data Engineer', query: 'Data Engineer' },
    { label: '📈 Growth / Mktg', query: 'Growth Marketing Manager' },
    { label: '💼 Account Executive', query: 'Account Executive' }
  ];

  const SENIORITY_LEVELS = [
    { id: 'Junior', label: 'Junior / Entry' },
    { id: 'Mid', label: 'Mid-Level' },
    { id: 'Senior', label: 'Senior' },
    { id: 'Staff', label: 'Staff' },
    { id: 'Lead', label: 'Lead' },
    { id: 'Principal', label: 'Principal' },
    { id: 'Director', label: 'Director' }
  ];

  const DEFAULT_EXCLUSIONS = [
    { id: 'closed', label: 'Closed Posts', pattern: '"no longer accepting"', active: true },
    { id: 'not_found', label: '404 Errors', pattern: '"page not found"', active: true },
    { id: 'filled', label: 'Filled Roles', pattern: '"position has been filled"', active: true },
    { id: 'internship', label: 'Internships', pattern: 'internship', active: true },
    { id: 'clearance', label: 'US Clearance', pattern: '"security clearance required"', active: false },
    { id: 'citizenship', label: 'US Citizen Req', pattern: '"US citizenship required"', active: false }
  ];

  // Application State
  const state = {
    role: '',
    location: '',
    workplace: 'any', // any | remote | hybrid | onsite
    timeframe: '7d',  // 24h | 3d | 7d | 30d | all
    engine: 'google', // google | kagi | duckduckgo | bing
    seniority: new Set(),
    activeAts: new Set(Object.keys(ATS_BOARDS)),
    exclusions: JSON.parse(JSON.stringify(DEFAULT_EXCLUSIONS)),
    customExclusions: []
  };

  // DOM Elements cache
  const el = {
    roleInput: document.getElementById('job-title'),
    locationInput: document.getElementById('location'),
    clearRoleBtn: document.getElementById('clear-role-btn'),
    clearLocBtn: document.getElementById('clear-loc-btn'),
    searchEngine: document.getElementById('search-engine'),
    workplaceToggle: document.getElementById('workplace-toggle'),
    timeframeToggle: document.getElementById('timeframe-toggle'),
    seniorityContainer: document.getElementById('seniority-container'),
    exclusionContainer: document.getElementById('exclusion-container'),
    customExInput: document.getElementById('custom-ex-input'),
    customExBtn: document.getElementById('custom-ex-btn'),
    presetContainer: document.getElementById('preset-container'),
    atsContainer: document.getElementById('ats-container'),
    selectAllAts: document.getElementById('select-all-ats'),
    deselectAllAts: document.getElementById('deselect-all-ats'),
    searchAllBtn: document.getElementById('search-all-btn'),
    searchStaggeredBtn: document.getElementById('search-staggered-btn'),
    copyQueryBtn: document.getElementById('copy-query-btn'),
    copyQueryInline: document.getElementById('copy-query-inline'),
    saveSearchBtn: document.getElementById('save-search-btn'),
    shareBtn: document.getElementById('share-btn'),
    resetBtn: document.getElementById('reset-btn'),
    queryPreview: document.getElementById('query-preview'),
    inspectorChips: document.getElementById('inspector-chips'),
    individualCardsGrid: document.getElementById('individual-cards-grid'),
    savedSearchesBtn: document.getElementById('saved-searches-btn'),
    savedCountBadge: document.getElementById('saved-count-badge'),
    savedModal: document.getElementById('saved-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    savedListContainer: document.getElementById('saved-list-container'),
    toastContainer: document.getElementById('toast-container')
  };

  // Initialize
  function init() {
    renderPresets();
    renderSeniority();
    renderExclusions();
    renderAtsToggles();
    parseUrlParams();
    bindEvents();
    updateUi();
    updateSavedSearchesBadge();
  }

  // Render Role Presets
  function renderPresets() {
    el.presetContainer.innerHTML = ROLE_PRESETS.map(p => `
      <button type="button" class="pill" data-query="${escapeHtml(p.query)}" title="Search ${escapeHtml(p.query)}">
        ${p.label}
      </button>
    `).join('');
  }

  // Render Seniority Pills
  function renderSeniority() {
    el.seniorityContainer.innerHTML = SENIORITY_LEVELS.map(s => `
      <button type="button" class="pill ${state.seniority.has(s.id) ? 'active' : ''}" data-sen="${s.id}">
        ${s.label}
      </button>
    `).join('');
  }

  // Render Exclusions (Defaults + Custom)
  function renderExclusions() {
    const defaultHtml = state.exclusions.map((item, index) => `
      <button type="button" class="pill pill-danger ${item.active ? 'active' : ''}" data-ex-idx="${index}">
        ${item.active ? '✕' : '+'} -${escapeHtml(item.label)}
      </button>
    `).join('');

    const customHtml = state.customExclusions.map((word, index) => `
      <button type="button" class="pill pill-danger active" data-custom-idx="${index}" title="Click to remove">
        ✕ -"${escapeHtml(word)}"
      </button>
    `).join('');

    el.exclusionContainer.innerHTML = defaultHtml + customHtml;
  }

  // Render ATS Board Selector (Lever, Ashby, Greenhouse)
  function renderAtsToggles() {
    el.atsContainer.innerHTML = Object.values(ATS_BOARDS).map(board => {
      const isChecked = state.activeAts.has(board.id);
      return `
        <label class="ats-card-toggle ${isChecked ? 'active' : ''}" data-board-id="${board.id}">
          <input type="checkbox" data-board="${board.id}" ${isChecked ? 'checked' : ''}>
          <div class="ats-info">
            <div class="ats-name">
              <span>${board.name}</span>
              <span class="ats-tag ${board.badgeClass} ats-badge-mini">${board.tag.split('&')[0].trim()}</span>
            </div>
            <div class="ats-desc">${board.examples}</div>
            <div class="ats-dork-domain">${board.dork}</div>
          </div>
        </label>
      `;
    }).join('');
  }

  // Core Query Compiler
  function compileQuery(singleAtsKey = null) {
    const parts = [];

    // 1. ATS Board Scope
    if (singleAtsKey && ATS_BOARDS[singleAtsKey]) {
      parts.push(ATS_BOARDS[singleAtsKey].dork);
    } else {
      const activeDorks = Array.from(state.activeAts).map(k => ATS_BOARDS[k]?.dork).filter(Boolean);
      if (activeDorks.length === 1) {
        parts.push(activeDorks[0]);
      } else if (activeDorks.length > 1) {
        parts.push(`(${activeDorks.join(' OR ')})`);
      }
    }

    // 2. Job Title / Role Parsing (Supports comma-separated: "Software Engineer, Full Stack")
    const rawRole = state.role.trim();
    if (rawRole) {
      const titles = rawRole.split(',').map(t => t.trim()).filter(Boolean);
      const titleClauses = [];

      titles.forEach(t => {
        if (state.seniority.size > 0) {
          state.seniority.forEach(sen => {
            titleClauses.push(`"${sen} ${t}"`);
          });
          // Also include the base title
          titleClauses.push(`"${t}"`);
        } else {
          titleClauses.push(`"${t}"`);
        }
      });

      if (titleClauses.length === 1) {
        parts.push(titleClauses[0]);
      } else if (titleClauses.length > 1) {
        parts.push(`(${titleClauses.join(' OR ')})`);
      }
    } else if (state.seniority.size > 0) {
      // If no role specified but seniority is selected
      const senClauses = Array.from(state.seniority).map(s => `"${s}"`);
      parts.push(`(${senClauses.join(' OR ')})`);
    }

    // 3. Workplace & Location
    const loc = state.location.trim();

    if (state.workplace === 'remote') {
      if (loc) {
        parts.push(`("Remote" OR "Work from anywhere") "${loc}"`);
      } else {
        parts.push('("Remote" OR "Remote - US" OR "Work from anywhere")');
      }
    } else if (state.workplace === 'hybrid') {
      if (loc) {
        parts.push(`"${loc}" "Hybrid"`);
      } else {
        parts.push('"Hybrid"');
      }
    } else if (state.workplace === 'onsite') {
      if (loc) {
        parts.push(`"${loc}" -"Remote"`);
      } else {
        parts.push('-"Remote"');
      }
    } else if (loc) {
      // Workplace is 'any' but location is specified
      parts.push(`"${loc}"`);
    }

    // 4. Default Exclusions
    state.exclusions.forEach(item => {
      if (item.active) {
        parts.push(`-${item.pattern}`);
      }
    });

    // 5. Custom Exclusions
    state.customExclusions.forEach(word => {
      if (word.trim()) {
        parts.push(`-"${word.trim()}"`);
      }
    });

    return parts.join(' ');
  }

  // Search Engine URL Builder
  function buildSearchUrl(singleAtsKey = null) {
    const query = compileQuery(singleAtsKey);
    const eng = state.engine;
    let base = 'https://www.google.com/search';

    if (eng === 'duckduckgo') base = 'https://duckduckgo.com/';
    if (eng === 'bing') base = 'https://www.bing.com/search';
    if (eng === 'kagi') base = 'https://kagi.com/search';

    const url = new URL(base);
    url.searchParams.set('q', query);

    // Engine-specific timeframe filters
    if (eng === 'google' && state.timeframe !== 'all') {
      const gMap = { '24h': 'qdr:d', '3d': 'qdr:d3', '7d': 'qdr:w', '30d': 'qdr:m' };
      if (gMap[state.timeframe]) url.searchParams.set('tbs', gMap[state.timeframe]);
    } else if (eng === 'duckduckgo' && state.timeframe !== 'all') {
      const ddgMap = { '24h': 'd', '3d': 'd', '7d': 'w', '30d': 'm' };
      if (ddgMap[state.timeframe]) url.searchParams.set('df', ddgMap[state.timeframe]);
    } else if (eng === 'kagi' && state.timeframe !== 'all') {
      const kMap = { '24h': 'd', '3d': 'd', '7d': 'w', '30d': 'm' };
      if (kMap[state.timeframe]) url.searchParams.set('qdr', kMap[state.timeframe]);
    }

    return url.toString();
  }

  // Update Visuals & Query Previews
  function updateUi() {
    const compiled = compileQuery();
    el.queryPreview.textContent = compiled || '(Enter your desired job title or role above to construct dork)';

    // Update Input clear buttons
    el.clearRoleBtn.style.display = state.role ? 'block' : 'none';
    el.clearLocBtn.style.display = state.location ? 'block' : 'none';

    // Update Token Chips in Inspector
    updateInspectorChips();

    // Update Individual ATS Cards
    renderIndividualCards();

    // Sync to URL parameters
    syncUrl();
  }

  // Inspector Breakdown Chips
  function updateInspectorChips() {
    const chips = [];

    // ATS Scope Chip
    if (state.activeAts.size === 0) {
      chips.push('<span class="token-chip token-ats">⚠️ No ATS Selected</span>');
    } else if (state.activeAts.size === 3) {
      chips.push('<span class="token-chip token-ats">🏢 All 3 Tech ATS (Ashby, Greenhouse, Lever)</span>');
    } else {
      const names = Array.from(state.activeAts).map(k => ATS_BOARDS[k].name).join(', ');
      chips.push(`<span class="token-chip token-ats">🏢 ATS: ${escapeHtml(names)}</span>`);
    }

    // Role Chip
    if (state.role.trim()) {
      chips.push(`<span class="token-chip token-role">💼 Role: "${escapeHtml(state.role.trim())}"</span>`);
    }

    // Seniority Chip
    if (state.seniority.size > 0) {
      const senStr = Array.from(state.seniority).join(', ');
      chips.push(`<span class="token-chip token-sen">🎖️ Seniority: ${escapeHtml(senStr)}</span>`);
    }

    // Workplace / Location Chip
    if (state.workplace !== 'any' || state.location.trim()) {
      let locText = '';
      if (state.workplace !== 'any') locText += capitalize(state.workplace);
      if (state.location.trim()) locText += (locText ? ` in ` : '') + state.location.trim();
      chips.push(`<span class="token-chip token-loc">📍 ${escapeHtml(locText)}</span>`);
    }

    // Exclusions Chip
    const activeExCount = state.exclusions.filter(e => e.active).length + state.customExclusions.length;
    if (activeExCount > 0) {
      chips.push(`<span class="token-chip token-ex">🛡️ Exclusions: ${activeExCount} active</span>`);
    }

    // Timeframe Chip
    chips.push(`<span class="token-chip" style="background: rgba(168,85,247,0.15); color:#C084FC; border:1px solid rgba(168,85,247,0.3);">⏱️ ${state.timeframe}</span>`);

    el.inspectorChips.innerHTML = chips.join('');
  }

  // Render 3 Dedicated ATS Cards (Ashby, Greenhouse, Lever)
  function renderIndividualCards() {
    el.individualCardsGrid.innerHTML = Object.values(ATS_BOARDS).map(board => {
      const dorkForBoard = compileQuery(board.id);
      const url = buildSearchUrl(board.id);
      return `
        <div class="ats-board-card card-${board.id}">
          <div class="card-top">
            <div class="card-top-left">
              <div class="ats-card-icon">${board.name.charAt(0)}</div>
              <div class="ats-card-title">
                <h3>${board.name}</h3>
                <div class="company-examples">${board.examples}</div>
              </div>
            </div>
            <span class="ats-tag ${board.badgeClass}">${board.tag}</span>
          </div>
          <p>Target only ${board.name} career boards for fresh roles and direct team applications.</p>
          <div class="ats-card-dork" title="${escapeHtml(dorkForBoard)}">${escapeHtml(dorkForBoard)}</div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="ats-launch-btn">
            Search ${board.name} in ${capitalize(state.engine)} ↗
          </a>
        </div>
      `;
    }).join('');
  }

  // URL State Synchronization
  function syncUrl() {
    const params = new URLSearchParams();
    if (state.role.trim()) params.set('q', state.role.trim());
    if (state.location.trim()) params.set('loc', state.location.trim());
    if (state.workplace !== 'any') params.set('work', state.workplace);
    if (state.timeframe !== '7d') params.set('t', state.timeframe);
    if (state.engine !== 'google') params.set('eng', state.engine);
    if (state.seniority.size > 0) params.set('sen', Array.from(state.seniority).join(','));

    if (state.activeAts.size > 0 && state.activeAts.size < 3) {
      params.set('ats', Array.from(state.activeAts).join(','));
    }

    if (state.customExclusions.length > 0) {
      params.set('neg', state.customExclusions.join(','));
    }

    const str = params.toString();
    const newUrl = str ? `${window.location.pathname}?${str}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }

  // Parse URL parameters on initial load
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('q')) {
      state.role = params.get('q');
      el.roleInput.value = state.role;
    }

    if (params.has('loc')) {
      state.location = params.get('loc');
      el.locationInput.value = state.location;
    }

    if (params.has('work')) {
      const val = params.get('work');
      if (['any', 'remote', 'hybrid', 'onsite'].includes(val)) {
        state.workplace = val;
        el.workplaceToggle.querySelectorAll('.segmented-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === val);
        });
      }
    }

    if (params.has('t')) {
      const tVal = params.get('t');
      if (['24h', '3d', '7d', '30d', 'all'].includes(tVal)) {
        state.timeframe = tVal;
        el.timeframeToggle.querySelectorAll('.segmented-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.val === tVal);
        });
      }
    }

    if (params.has('eng')) {
      const engVal = params.get('eng');
      if (['google', 'kagi', 'duckduckgo', 'bing'].includes(engVal)) {
        state.engine = engVal;
        el.searchEngine.value = engVal;
      }
    }

    if (params.has('sen')) {
      state.seniority.clear();
      params.get('sen').split(',').forEach(s => {
        if (SENIORITY_LEVELS.some(lvl => lvl.id === s)) {
          state.seniority.add(s);
        }
      });
      renderSeniority();
    }

    if (params.has('ats')) {
      state.activeAts.clear();
      params.get('ats').split(',').forEach(k => {
        if (ATS_BOARDS[k]) state.activeAts.add(k);
      });
      renderAtsToggles();
    }

    if (params.has('neg')) {
      state.customExclusions = params.get('neg').split(',').map(w => w.trim()).filter(Boolean);
      renderExclusions();
    }
  }

  // Toast System
  function showToast(message, icon = '✓') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 2400);
  }

  // Saved Searches Management (localStorage)
  const STORAGE_KEY = 'jobdork_saved_searches';

  function getSavedSearches() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCurrentSearch() {
    const list = getSavedSearches();
    const currentRole = state.role.trim() || 'All Roles';
    const loc = state.location.trim() || capitalize(state.workplace);
    const item = {
      id: Date.now().toString(),
      title: `${currentRole} (${loc})`,
      timestamp: new Date().toLocaleDateString(),
      url: window.location.search,
      role: state.role,
      location: state.location,
      workplace: state.workplace,
      timeframe: state.timeframe,
      seniority: Array.from(state.seniority),
      ats: Array.from(state.activeAts)
    };

    list.unshift(item);
    // Keep max 20
    if (list.length > 20) list.pop();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    updateSavedSearchesBadge();
    showToast('Search saved to bookmarks!');
  }

  function deleteSavedSearch(id) {
    const list = getSavedSearches().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    updateSavedSearchesBadge();
    renderSavedSearchesList();
  }

  function loadSavedSearch(item) {
    if (item.url) {
      window.history.replaceState({}, '', `${window.location.pathname}${item.url}`);
      parseUrlParams();
      updateUi();
      closeSavedModal();
      showToast(`Loaded "${item.title}"`);
    }
  }

  function updateSavedSearchesBadge() {
    const list = getSavedSearches();
    el.savedCountBadge.textContent = list.length;
    el.savedCountBadge.style.display = list.length > 0 ? 'inline-block' : 'none';
  }

  function renderSavedSearchesList() {
    const list = getSavedSearches();
    if (list.length === 0) {
      el.savedListContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔖</div>
          <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">No Saved Searches Yet</div>
          <div style="font-size: 0.8rem;">Configure your ideal role, location, and filters, then click "Save Search" to bookmark for daily 1-click runs.</div>
        </div>
      `;
      return;
    }

    el.savedListContainer.innerHTML = list.map(item => `
      <div class="saved-item" data-id="${item.id}">
        <div class="saved-info">
          <div class="saved-title">${escapeHtml(item.title)}</div>
          <div class="saved-tags">
            <span class="saved-tag">⏱️ ${item.timeframe || '7d'}</span>
            <span class="saved-tag">🏢 ${(item.ats || []).join(', ') || 'All 3'}</span>
            <span class="saved-tag">${item.timestamp}</span>
          </div>
        </div>
        <div class="saved-actions">
          <button type="button" class="saved-btn load-btn" data-id="${item.id}">Load</button>
          <button type="button" class="saved-btn delete-btn" data-id="${item.id}" title="Delete">✕</button>
        </div>
      </div>
    `).join('');
  }

  function openSavedModal() {
    renderSavedSearchesList();
    el.savedModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeSavedModal() {
    el.savedModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Event Listeners
  function bindEvents() {
    // Role Input
    el.roleInput.addEventListener('input', e => {
      state.role = e.target.value;
      updateUi();
    });

    el.clearRoleBtn.addEventListener('click', () => {
      state.role = '';
      el.roleInput.value = '';
      el.roleInput.focus();
      updateUi();
    });

    // Location Input
    el.locationInput.addEventListener('input', e => {
      state.location = e.target.value;
      updateUi();
    });

    el.clearLocBtn.addEventListener('click', () => {
      state.location = '';
      el.locationInput.value = '';
      el.locationInput.focus();
      updateUi();
    });

    // Quick Location Buttons
    document.querySelectorAll('.quick-loc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const locVal = btn.dataset.loc;
        if (locVal === 'Remote') {
          state.workplace = 'remote';
          state.location = '';
          el.locationInput.value = '';
          el.workplaceToggle.querySelectorAll('.segmented-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.val === 'remote');
          });
        } else {
          state.location = locVal;
          el.locationInput.value = locVal;
        }
        updateUi();
      });
    });

    // Search Engine Selector
    el.searchEngine.addEventListener('change', e => {
      state.engine = e.target.value;
      updateUi();
    });

    // Role Presets
    el.presetContainer.addEventListener('click', e => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      state.role = btn.dataset.query;
      el.roleInput.value = state.role;
      updateUi();
      showToast(`Selected "${state.role}"`);
    });

    // Workplace Toggle
    el.workplaceToggle.addEventListener('click', e => {
      const btn = e.target.closest('.segmented-btn');
      if (!btn) return;
      state.workplace = btn.dataset.val;
      el.workplaceToggle.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUi();
    });

    // Timeframe Toggle
    el.timeframeToggle.addEventListener('click', e => {
      const btn = e.target.closest('.segmented-btn');
      if (!btn) return;
      state.timeframe = btn.dataset.val;
      el.timeframeToggle.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateUi();
    });

    // Seniority Pills
    el.seniorityContainer.addEventListener('click', e => {
      const btn = e.target.closest('.pill');
      if (!btn) return;
      const senId = btn.dataset.sen;
      if (state.seniority.has(senId)) {
        state.seniority.delete(senId);
        btn.classList.remove('active');
      } else {
        state.seniority.add(senId);
        btn.classList.add('active');
      }
      updateUi();
    });

    // Default Exclusions Click
    el.exclusionContainer.addEventListener('click', e => {
      const btn = e.target.closest('.pill-danger');
      if (!btn) return;

      if (btn.hasAttribute('data-ex-idx')) {
        const idx = parseInt(btn.dataset.exIdx, 10);
        state.exclusions[idx].active = !state.exclusions[idx].active;
        renderExclusions();
        updateUi();
      } else if (btn.hasAttribute('data-custom-idx')) {
        const cIdx = parseInt(btn.dataset.customIdx, 10);
        state.customExclusions.splice(cIdx, 1);
        renderExclusions();
        updateUi();
      }
    });

    // Custom Exclusion Adder
    function addCustomExclusion() {
      const word = el.customExInput.value.trim().replace(/^[-"]+|["+]+$/g, '');
      if (word && !state.customExclusions.includes(word)) {
        state.customExclusions.push(word);
        el.customExInput.value = '';
        renderExclusions();
        updateUi();
      }
    }

    el.customExBtn.addEventListener('click', addCustomExclusion);
    el.customExInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomExclusion();
      }
    });

    // ATS Checkboxes & Card Toggles
    el.atsContainer.addEventListener('change', e => {
      const input = e.target.closest('input[type="checkbox"]');
      if (!input) return;
      const boardId = input.dataset.board;
      if (input.checked) {
        state.activeAts.add(boardId);
      } else {
        state.activeAts.delete(boardId);
      }
      renderAtsToggles();
      updateUi();
    });

    el.selectAllAts.addEventListener('click', () => {
      state.activeAts = new Set(Object.keys(ATS_BOARDS));
      renderAtsToggles();
      updateUi();
    });

    el.deselectAllAts.addEventListener('click', () => {
      state.activeAts.clear();
      renderAtsToggles();
      updateUi();
    });

    // Action: Search All
    el.searchAllBtn.addEventListener('click', () => {
      if (state.activeAts.size === 0) {
        alert('Please select at least one ATS board (Ashby, Greenhouse, or Lever).');
        return;
      }
      window.open(buildSearchUrl(), '_blank');
    });

    // Action: Staggered Tabs (Ashby, Greenhouse, Lever)
    el.searchStaggeredBtn.addEventListener('click', () => {
      const activeKeys = Array.from(state.activeAts);
      if (activeKeys.length === 0) {
        alert('Please select at least one ATS board (Ashby, Greenhouse, or Lever).');
        return;
      }

      showToast(`Opening ${activeKeys.length} search tabs...`);

      activeKeys.forEach((key, index) => {
        setTimeout(() => {
          const win = window.open(buildSearchUrl(key), '_blank');
          if (!win && index === 0) {
            alert('Your browser blocked the popups. Please allow popups for jobdork.org to open tabs simultaneously.');
          }
        }, index * 200);
      });
    });

    // Action: Copy Query
    function copyQueryToClipboard() {
      const query = compileQuery();
      navigator.clipboard.writeText(query).then(() => {
        showToast('Dork copied to clipboard!', '📋');
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = query;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showToast('Dork copied to clipboard!', '📋');
      });
    }

    el.copyQueryBtn.addEventListener('click', copyQueryToClipboard);
    el.copyQueryInline.addEventListener('click', copyQueryToClipboard);

    // Action: Share Search Link
    el.shareBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Search link copied to clipboard!', '🔗');
      });
    });

    // Action: Save Search
    el.saveSearchBtn.addEventListener('click', saveCurrentSearch);

    // Modal: Saved Searches
    el.savedSearchesBtn.addEventListener('click', openSavedModal);
    el.closeModalBtn.addEventListener('click', closeSavedModal);
    el.savedModal.addEventListener('click', e => {
      if (e.target === el.savedModal) closeSavedModal();
    });

    el.savedListContainer.addEventListener('click', e => {
      const loadBtn = e.target.closest('.load-btn');
      if (loadBtn) {
        const id = loadBtn.dataset.id;
        const item = getSavedSearches().find(x => x.id === id);
        if (item) loadSavedSearch(item);
        return;
      }

      const delBtn = e.target.closest('.delete-btn');
      if (delBtn) {
        deleteSavedSearch(delBtn.dataset.id);
        return;
      }

      const itemRow = e.target.closest('.saved-info');
      if (itemRow) {
        const id = itemRow.closest('.saved-item').dataset.id;
        const item = getSavedSearches().find(x => x.id === id);
        if (item) loadSavedSearch(item);
      }
    });

    // Action: Reset All
    el.resetBtn.addEventListener('click', () => {
      state.role = '';
      state.location = '';
      state.workplace = 'any';
      state.timeframe = '7d';
      state.seniority.clear();
      state.activeAts = new Set(Object.keys(ATS_BOARDS));
      state.exclusions = JSON.parse(JSON.stringify(DEFAULT_EXCLUSIONS));
      state.customExclusions = [];

      el.roleInput.value = '';
      el.locationInput.value = '';
      el.workplaceToggle.querySelector('[data-val="any"]').click();
      el.timeframeToggle.querySelector('[data-val="7d"]').click();
      renderSeniority();
      renderExclusions();
      renderAtsToggles();
      updateUi();
      showToast('Filters reset to default.');
    });

    // Global Keydown shortcuts
    window.addEventListener('keydown', e => {
      // Enter launches search if in input
      if (e.key === 'Enter' && (document.activeElement === el.roleInput || document.activeElement === el.locationInput)) {
        e.preventDefault();
        el.searchAllBtn.click();
      }

      // Cmd+K or Ctrl+K to focus search input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        el.roleInput.focus();
        el.roleInput.select();
      }

      // Escape closes modal
      if (e.key === 'Escape' && el.savedModal.classList.contains('show')) {
        closeSavedModal();
      }
    });
  }

  // Utilities
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
