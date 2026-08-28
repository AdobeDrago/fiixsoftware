const tagLabels = {
  '@product': 'Products',
  '@reviews': 'Reviews',
  '@indexes': 'Indexes',
  '@resource': 'Resources',
  '@case-studies': 'Case studies',
  '@blog': 'Blog posts',
};

const state = {
  pages: [],
  selectedSlugs: new Set(),
  activeTags: new Set(),
  search: '',
  status: 'idle',
};

const elements = {
  statusValue: document.querySelector('#status-value'),
  statusSpinner: document.querySelector('#status-spinner'),
  statusDetail: document.querySelector('#status-detail'),
  edsOrigin: document.querySelector('#eds-origin'),
  viewport: document.querySelector('#viewport'),
  runButton: document.querySelector('#run-button'),
  currentReportLink: document.querySelector('#current-report-link'),
  selectionSummary: document.querySelector('#selection-summary'),
  tagFilters: document.querySelector('#tag-filters'),
  pageList: document.querySelector('#page-list'),
  search: document.querySelector('#search'),
  logOutput: document.querySelector('#log-output'),
  selectAll: document.querySelector('#select-all'),
  clearSelection: document.querySelector('#clear-selection'),
};

function setGeneratedReportLink(reportReady) {
  elements.currentReportLink.hidden = !reportReady;
}

function setStatus(status, detail) {
  state.status = status;
  document.body.dataset.status = status;
  elements.statusValue.textContent = {
    idle: 'Ready',
    running: 'Running',
    complete: 'Complete',
    error: 'Failed',
  }[status] || status;
  if (detail) elements.statusDetail.textContent = detail;
  elements.runButton.disabled = status === 'running';
  if (elements.statusSpinner) elements.statusSpinner.hidden = status !== 'running';
}

function setIdleState(reportReady = false) {
  setGeneratedReportLink(reportReady);
  const detail = reportReady
    ? 'Select pages below to begin, or open the generated report.'
    : 'Select pages below to begin.';
  setStatus('idle', detail);
}

async function resetSessionIfFinished() {
  if (state.status === 'running') return;
  await fetch('/api/reset', { method: 'POST' });
}

function prepareForNewSelection() {
  if (state.status === 'complete' || state.status === 'error') {
    setIdleState(!elements.currentReportLink.hidden);
    resetSessionIfFinished();
  }
}

function isFiltered() {
  return Boolean(state.search) || state.activeTags.size > 0;
}

function visiblePages() {
  return state.pages.filter((page) => {
    const matchesSearch = !state.search
      || page.name.toLowerCase().includes(state.search.toLowerCase());
    const matchesTags = !state.activeTags.size
      || page.tags.some((tag) => state.activeTags.has(tag));
    return matchesSearch && matchesTags;
  });
}

function effectiveSelection() {
  const pages = isFiltered() ? visiblePages() : state.pages;
  return pages.filter((page) => state.selectedSlugs.has(page.slug));
}

function effectiveSlugs() {
  return effectiveSelection().map((page) => page.slug);
}

function updateSelectionSummary() {
  const count = effectiveSelection().length;
  elements.selectionSummary.textContent = count === 1
    ? '1 page selected'
    : `${count} pages selected`;
}

function selectAllPages() {
  const visible = visiblePages();
  if (isFiltered()) {
    state.selectedSlugs.clear();
    visible.forEach((page) => state.selectedSlugs.add(page.slug));
    return;
  }
  state.pages.forEach((page) => state.selectedSlugs.add(page.slug));
}

function clearSelectedPages() {
  if (isFiltered()) {
    visiblePages().forEach((page) => state.selectedSlugs.delete(page.slug));
    return;
  }
  state.selectedSlugs.clear();
}

function renderPageList() {
  const pages = visiblePages();
  if (!pages.length) {
    elements.pageList.replaceChildren(Object.assign(document.createElement('li'), {
      className: 'page-item',
      textContent: 'No pages match the current filters.',
    }));
    return;
  }

  elements.pageList.replaceChildren(...pages.map((page) => {
    const item = document.createElement('li');
    item.className = 'page-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `page-${page.slug}`;
    checkbox.checked = state.selectedSlugs.has(page.slug);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) state.selectedSlugs.add(page.slug);
      else state.selectedSlugs.delete(page.slug);
      updateSelectionSummary();
      prepareForNewSelection();
    });

    const label = document.createElement('label');
    label.setAttribute('for', checkbox.id);

    const name = document.createElement('p');
    name.className = 'page-name';
    name.textContent = page.name;

    const meta = document.createElement('p');
    meta.className = 'page-meta';
    meta.textContent = page.pageType;

    label.append(name, meta);

    item.append(checkbox, label);
    return item;
  }));
}

function renderTagFilters() {
  const tags = [...new Set(state.pages.flatMap((page) => page.tags))].sort();
  elements.tagFilters.replaceChildren(...tags.map((tag) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = tagLabels[tag] || tag;
    button.setAttribute('aria-pressed', String(state.activeTags.has(tag)));
    button.addEventListener('click', () => {
      if (state.activeTags.has(tag)) state.activeTags.delete(tag);
      else state.activeTags.add(tag);
      renderTagFilters();
      renderPageList();
      updateSelectionSummary();
    });
    return button;
  }));
}

async function loadInitialData() {
  const [configResponse, pagesResponse] = await Promise.all([
    fetch('/api/config'),
    fetch('/api/pages'),
  ]);
  const config = await configResponse.json();
  const pagesPayload = await pagesResponse.json();
  state.pages = pagesPayload.pages;
  elements.edsOrigin.value = config.defaultEdsOrigin;
  setGeneratedReportLink(Boolean(config.currentReportReady));
  renderTagFilters();
  renderPageList();
  updateSelectionSummary();
}

function applyStatusPayload(payload) {
  const reportReady = Boolean(payload.currentReportReady);

  if (payload.status === 'running') {
    setGeneratedReportLink(false);
    setStatus('running', `Comparing ${payload.pageCount} page(s)...`);
  } else if (payload.status === 'complete') {
    setGeneratedReportLink(reportReady);
    setStatus('complete', 'Open the generated report to review visual, accessibility, and performance scores.');
  } else if (payload.status === 'error') {
    setGeneratedReportLink(reportReady);
    setStatus('error', payload.error || 'Review the activity log for details.');
  } else {
    setIdleState(reportReady);
  }

  if (payload.logs?.length) {
    elements.logOutput.textContent = payload.logs.join('\n');
    elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
  }
}

async function pollStatus() {
  const response = await fetch('/api/status');
  const payload = await response.json();
  applyStatusPayload(payload);

  if (payload.status === 'running') {
    window.setTimeout(pollStatus, 1500);
  }
}

async function refreshUiState() {
  const response = await fetch('/api/status');
  const payload = await response.json();
  applyStatusPayload(payload);

  if (payload.status === 'running') {
    window.setTimeout(pollStatus, 1500);
  }
}

async function runComparison() {
  const slugs = effectiveSlugs();
  if (!slugs.length) {
    setStatus('idle', 'Select at least one page before running a comparison.');
    return;
  }

  setGeneratedReportLink(false);
  setStatus('running', `Starting comparison for ${slugs.length} page(s)...`);
  elements.logOutput.textContent = 'Starting comparison...';

  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slugs,
      edsOrigin: elements.edsOrigin.value.trim(),
      viewport: elements.viewport.value,
      workers: 2,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    setStatus('error', payload.error || 'Unable to start comparison.');
    elements.logOutput.textContent = payload.error || 'Unable to start comparison.';
    return;
  }

  pollStatus();
}

elements.search.addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderPageList();
  updateSelectionSummary();
});

elements.selectAll.addEventListener('click', () => {
  selectAllPages();
  renderPageList();
  updateSelectionSummary();
  prepareForNewSelection();
});

elements.clearSelection.addEventListener('click', () => {
  clearSelectedPages();
  renderPageList();
  updateSelectionSummary();
  prepareForNewSelection();
});

elements.runButton.addEventListener('click', () => {
  runComparison().catch((error) => {
    setStatus('error', error.message);
    elements.logOutput.textContent = error.message;
  });
});

window.addEventListener('pageshow', () => {
  resetSessionIfFinished()
    .then(() => refreshUiState())
    .catch((error) => {
      setStatus('error', error.message);
    });
});

loadInitialData()
  .then(() => resetSessionIfFinished())
  .then(() => refreshUiState())
  .catch((error) => {
    setStatus('error', error.message);
    elements.logOutput.textContent = error.message;
  });
