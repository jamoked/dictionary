// app.js — UI LOGIC
// Reads and writes data only through storage.js — never touches localStorage directly.
// Organized into clear sections: Theme, Tabs, Form, List, Study, Dev Tools.

// ─── ICONS ────────────────────────────────────────────────────────────────────
// Inline SVGs — no external library needed. Feather-style line icons.

const ICON_EDIT = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
const ICON_DELETE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

// ─── STATE ────────────────────────────────────────────────────────────────────

// editingId tracks which card is being edited (null when adding a new card)
let editingId = null;
let viewCardId = null;
let viewModalDialogHtml = null; // saved html while view modal is showing inline delete confirm
let deletingCardId = null;
let deletingCardOriginalHtml = null;

// Study mode state
let studyDeck = [];
let studyIndex = 0;
let studyFlipped = false;
let reviewFilterStatuses = new Set(['new', 'semi', 'known']); // all on by default

// Search/filter/sort state
let searchQuery = '';
let filterPos = '';
let filterStatuses = new Set(['new', 'semi', 'known']); // all on by default, mirrors review tab
let groupByStatus = false;

// ─── DOM REFERENCES ───────────────────────────────────────────────────────────

const settingsTriggerBtn = document.getElementById('settings-trigger');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close');
const settingsLightBtn = document.getElementById('settings-light-btn');
const settingsDarkBtn = document.getElementById('settings-dark-btn');
const settingsThemeSelect = document.getElementById('settings-theme-select');
const tabCards = document.getElementById('tab-cards');
const tabStudy = document.getElementById('tab-study');
const viewCards = document.getElementById('view-cards');
const viewStudy = document.getElementById('view-study');

const addCardTrigger = document.getElementById('add-card-trigger');
const cardModal = document.getElementById('card-modal');
const viewModal = document.getElementById('view-modal');
const cardForm = document.getElementById('card-form');
const formTitle = document.getElementById('form-title');
const wordInput = document.getElementById('input-word');
const posSelect = document.getElementById('input-pos');
const definitionInput = document.getElementById('input-definition');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

const wordError = document.getElementById('word-error');
const posError = document.getElementById('pos-error');
const definitionError = document.getElementById('definition-error');

const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-pos');
const sortGroupSelect = document.getElementById('sort-group');
const filterStatusBtns = {
  new: document.getElementById('filter-status-new'),
  semi: document.getElementById('filter-status-semi'),
  known: document.getElementById('filter-status-known')
};
const cardList = document.getElementById('card-list');
const emptyState = document.getElementById('empty-state');

const studyFilter = document.getElementById('study-filter');
const reviewFilterBtns = {
  new: document.getElementById('review-filter-new'),
  semi: document.getElementById('review-filter-semi'),
  known: document.getElementById('review-filter-known')
};
const studyCard = document.getElementById('study-card');
const studyCardInner = document.getElementById('study-card-inner');
const studyFront = document.getElementById('study-front');
const studyBack = document.getElementById('study-back');
const studyCounter = document.getElementById('study-counter');
const studyEmpty = document.getElementById('study-empty');
const studyControls = document.getElementById('study-controls');
const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const shuffleBtn = document.getElementById('btn-shuffle');
const studyStatusRow = document.getElementById('study-status-row');
const studyStatusBtns = {
  new: document.getElementById('btn-status-new'),
  semi: document.getElementById('btn-status-semi'),
  known: document.getElementById('btn-status-known')
};

const devPanel = document.getElementById('dev-panel');
const devToggleBtn = document.getElementById('dev-toggle');
const devSeedBtn = document.getElementById('dev-seed');
const devClearBtn = document.getElementById('dev-clear');
const devLogBtn = document.getElementById('dev-log');
const devCount = document.getElementById('dev-count');

// ─── THEME ────────────────────────────────────────────────────────────────────

function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  settingsLightBtn.classList.toggle('active', !isDark);
  settingsDarkBtn.classList.toggle('active', isDark);
}

function applyColorTheme(name) {
  document.documentElement.setAttribute('data-theme', name);
  settingsThemeSelect.value = name;
  localStorage.setItem('color-theme', name);
}

function initTheme() {
  const savedDark = localStorage.getItem('theme');
  if (savedDark) {
    applyTheme(savedDark === 'dark');
  } else {
    applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  const savedColor = localStorage.getItem('color-theme');
  // migrate anyone who had "default" saved before it was renamed to "slate"
  applyColorTheme(
    savedColor === 'default' ? 'slate' : savedColor || 'obsidian'
  );
}

function openSettingsModal() {
  settingsModal.classList.add('open');
}
function closeSettingsModal() {
  settingsModal.classList.remove('open');
}

settingsTriggerBtn.addEventListener('click', openSettingsModal);
settingsCloseBtn.addEventListener('click', closeSettingsModal);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettingsModal();
});

settingsLightBtn.addEventListener('click', () => {
  localStorage.setItem('theme', 'light');
  applyTheme(false);
});
settingsDarkBtn.addEventListener('click', () => {
  localStorage.setItem('theme', 'dark');
  applyTheme(true);
});

settingsThemeSelect.addEventListener('change', () => {
  applyColorTheme(settingsThemeSelect.value);
});

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tab) {
  const isCards = tab === 'cards';
  viewCards.classList.toggle('hidden', !isCards);
  viewStudy.classList.toggle('hidden', isCards);
  tabCards.dataset.active = isCards ? 'true' : 'false';
  tabStudy.dataset.active = isCards ? 'false' : 'true';
  updateTabStyles();
  if (!isCards) renderStudy();
}

function updateTabStyles() {
  [tabCards, tabStudy].forEach((btn) => {
    const active = btn.dataset.active === 'true';
    btn.classList.toggle('border-violet-600', active);
    btn.classList.toggle('text-violet-600', active);
    btn.classList.toggle('dark:text-violet-400', active);
    btn.classList.toggle('dark:border-violet-400', active);
    btn.classList.toggle('border-transparent', !active);
    btn.classList.toggle('text-gray-500', !active);
    btn.classList.toggle('dark:text-gray-400', !active);
  });
}

tabCards.addEventListener('click', () => showTab('cards'));
tabStudy.addEventListener('click', () => showTab('study'));

// ─── FORM (ADD / EDIT) ────────────────────────────────────────────────────────

function openForm() {
  cardModal.classList.add('open');
  wordInput.focus();
}

function closeForm() {
  cardModal.classList.remove('open');
  resetForm();
}

function resetForm() {
  editingId = null;
  cardForm.reset();
  formTitle.textContent = 'Add a card';
  submitBtn.textContent = 'Add card';
  wordError.classList.add('hidden');
  wordInput.classList.remove('border-red-400', 'focus:ring-red-400');
  posError.classList.add('hidden');
  posSelect.classList.remove('border-red-400', 'focus:ring-red-400');
  definitionError.classList.add('hidden');
  definitionInput.classList.remove('border-red-400');
}

function startEdit(id) {
  const card = storage.getCard(id);
  if (!card) return;
  editingId = id;
  wordInput.value = card.word;
  posSelect.value = card.partOfSpeech;
  definitionInput.value = card.definition;
  formTitle.textContent = 'Edit card';
  submitBtn.textContent = 'Save changes';
  openForm();
}

addCardTrigger.addEventListener('click', openForm);
cancelEditBtn.addEventListener('click', closeForm);
document.getElementById('modal-close').addEventListener('click', closeForm);
// Close when clicking the backdrop (the overlay itself, not the dialog inside it)
cardModal.addEventListener('click', (e) => {
  if (e.target === cardModal) closeForm();
});

wordInput.addEventListener('input', () => {
  wordError.classList.add('hidden');
  wordInput.classList.remove('border-red-400', 'focus:ring-red-400');
});

posSelect.addEventListener('change', () => {
  posError.classList.add('hidden');
  posSelect.classList.remove('border-red-400', 'focus:ring-red-400');
});

definitionInput.addEventListener('input', () => {
  definitionError.classList.add('hidden');
  definitionInput.classList.remove('border-red-400');
});

cardForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const word = wordInput.value.trim();
  const partOfSpeech = posSelect.value;
  const definition = definitionInput.value.trim();

  if (!word || !definition) return;

  if (!partOfSpeech) {
    posError.textContent = 'Please select a part of speech.';
    posError.classList.remove('hidden');
    posSelect.classList.add('border-red-400', 'focus:ring-red-400');
    posSelect.focus();
    return;
  }

  const wordValidationError = validateWord(word);
  if (wordValidationError) {
    wordError.textContent = wordValidationError;
    wordError.classList.remove('hidden');
    wordInput.classList.add('border-red-400', 'focus:ring-red-400');
    wordInput.focus();
    return;
  }

  if (definition.length > 200) {
    definitionError.textContent = 'Definition must be 200 characters or fewer.';
    definitionError.classList.remove('hidden');
    definitionInput.classList.add('border-red-400');
    definitionInput.focus();
    return;
  }

  if (editingId) {
    storage.updateCard(editingId, { word, partOfSpeech, definition });
    closeForm();
    renderAll();
    return;
  }

  // Duplicate check: only warn if same word + same part of speech already exists
  const duplicate = storage.findDuplicate(word, partOfSpeech);
  if (duplicate) {
    const proceed = confirm(
      `A card for "${duplicate.word}" (${duplicate.partOfSpeech}) already exists.\n\nAdd another one anyway?`
    );
    if (!proceed) return;
  }

  storage.addCard({ word, partOfSpeech, definition });
  closeForm();
  renderAll();
});

// ─── LIST VIEW ────────────────────────────────────────────────────────────────

function getFilteredCards() {
  return storage.getCards().filter((card) => {
    const matchesSearch = card.word
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPos = !filterPos || card.partOfSpeech === filterPos;
    const matchesStatus = filterStatuses.has(card.status);
    return matchesSearch && matchesPos && matchesStatus;
  });
}

function createCardEl(card) {
  const el = document.createElement('div');
  el.className =
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:-translate-y-px cursor-pointer transition-all';
  el.dataset.cardId = card.id;
  el.innerHTML = `
    <div class="grid gap-x-3 gap-y-2 items-center" style="grid-template-columns: 1fr auto">
      <span class="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">${escapeHtml(card.word)}</span>
      <div class="flex gap-1.5 justify-end">${statusDots(card.id, card.status)}</div>
      <span class="text-xs italic text-gray-400/70 dark:text-gray-500/70">${escapeHtml(card.partOfSpeech)}</span>
      <div class="flex gap-2 justify-end">
        <button data-action="edit" data-id="${card.id}" class="text-gray-300 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors" aria-label="Edit">${ICON_EDIT}</button>
        <button data-action="delete" data-id="${card.id}" class="text-gray-300 dark:text-gray-600 btn-delete transition-colors" aria-label="Delete">${ICON_DELETE}</button>
      </div>
    </div>
    <p class="definition-clamp text-gray-600 dark:text-gray-300 text-sm leading-relaxed">${escapeHtml(card.definition)}</p>
  `;
  return el;
}

function renderCardList() {
  const allCards = storage.getCards();
  const total = allCards.length;
  searchInput.placeholder = `Search ${total} word${total === 1 ? '' : 's'}…`;

  const cards = getFilteredCards();
  cards.sort((a, b) => a.word.localeCompare(b.word));

  cardList.innerHTML = '';

  if (cards.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if (groupByStatus) {
    const groups = [
      { status: 'new', label: 'New', dot: 'bg-red-400' },
      { status: 'semi', label: 'Learning', dot: 'bg-yellow-400' },
      { status: 'known', label: 'Known', dot: 'bg-green-400' }
    ];
    groups.forEach(({ status, label, dot }) => {
      const group = cards.filter((c) => c.status === status);
      if (group.length === 0) return;

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2 mt-1';
      header.style.gridColumn = '1 / -1';
      header.innerHTML = `
        <span class="w-2 h-2 rounded-sm ${dot}"></span>
        <span class="flex items-baseline gap-1">
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">${label}</span>
          <span class="text-[10px] text-gray-300 dark:text-gray-600 tabular-nums">(${group.length})</span>
        </span>
        <div class="status-rule flex-1 h-px bg-gray-100 dark:bg-gray-800"></div>
      `;
      cardList.appendChild(header);
      group.forEach((card) => cardList.appendChild(createCardEl(card)));
    });
  } else {
    cards.forEach((card) => cardList.appendChild(createCardEl(card)));
  }
}

// Handle clicks via event delegation — action buttons take priority, then card body.
cardList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (btn) {
    const { action, id } = btn.dataset;
    if (action === 'edit') {
      startEdit(id);
    } else if (action === 'delete') {
      showInlineDeleteConfirm(id);
    } else if (action === 'confirm-delete') {
      deletingCardId = null;
      deletingCardOriginalHtml = null;
      storage.deleteCard(id);
      renderAll();
    } else if (action === 'cancel-delete') {
      cancelInlineDelete();
    } else if (action === 'set-status') {
      storage.setStatus(id, btn.dataset.status);
      renderAll();
    }
    return;
  }
  // Card body click — open view modal to read full definition
  const cardEl = e.target.closest('[data-card-id]');
  // Don't open view modal on a card that's showing the inline delete confirmation
  if (cardEl && cardEl.dataset.cardId !== deletingCardId)
    openViewModal(cardEl.dataset.cardId);
});

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────

function openViewModal(id) {
  const card = storage.getCard(id);
  if (!card) return;
  viewCardId = id;
  document.getElementById('view-word').textContent = card.word;
  document.getElementById('view-pos').textContent = card.partOfSpeech;
  document.getElementById('view-definition').textContent = card.definition;
  document.getElementById('view-status-dots').innerHTML = statusDots(
    id,
    card.status
  );
  viewModal.classList.add('open');
}

function closeViewModal() {
  // Restore dialog HTML if we replaced it with the inline confirm UI —
  // the static elements (#view-word etc.) must exist for the next openViewModal() call.
  if (viewModalDialogHtml) {
    viewModal.querySelector('.modal-dialog').innerHTML = viewModalDialogHtml;
  }
  viewModal.classList.remove('open');
  viewCardId = null;
  viewModalDialogHtml = null;
}

function navigateViewModal(direction) {
  const cards = getFilteredCards();
  cards.sort((a, b) => a.word.localeCompare(b.word));
  const idx = cards.findIndex((c) => c.id === viewCardId);
  if (idx === -1) return;
  const next = idx + direction;
  if (next >= 0 && next < cards.length) openViewModal(cards[next].id);
}

viewModal.addEventListener('click', (e) => {
  // Backdrop click
  if (e.target === viewModal) {
    if (viewModalDialogHtml) {
      cancelViewModalDelete();
      return;
    }
    closeViewModal();
    return;
  }

  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action } = btn.dataset;

  if (action === 'set-status') {
    const { id, status } = btn.dataset;
    storage.setStatus(id, status);
    document.getElementById('view-status-dots').innerHTML = statusDots(
      id,
      status
    );
    renderCardList();
    updateDevCount();
  } else if (action === 'view-edit') {
    const id = viewCardId;
    closeViewModal();
    startEdit(id);
  } else if (action === 'view-delete') {
    showViewModalDeleteConfirm();
  } else if (action === 'view-confirm-delete') {
    const id = viewCardId;
    closeViewModal();
    storage.deleteCard(id);
    renderAll();
  } else if (action === 'view-cancel-delete') {
    cancelViewModalDelete();
  }
});

// ─── INLINE DELETE CONFIRMATION ───────────────────────────────────────────────

function showInlineDeleteConfirm(id) {
  cancelInlineDelete(); // restore any card already in confirm state

  const card = storage.getCard(id);
  if (!card) return;

  const cardEl = cardList.querySelector(`[data-card-id="${id}"]`);
  if (!cardEl) return;

  deletingCardId = id;
  deletingCardOriginalHtml = cardEl.innerHTML;

  cardEl.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-2 py-2">
      <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">Delete "${escapeHtml(card.word)}"?</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 text-center">This cannot be undone.</p>
      <div class="flex gap-3 items-center mt-2">
        <button data-action="confirm-delete" data-id="${id}" class="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">Delete</button>
        <button data-action="cancel-delete" data-id="${id}" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  `;
}

function cancelInlineDelete() {
  if (!deletingCardId) return;
  const cardEl = cardList.querySelector(`[data-card-id="${deletingCardId}"]`);
  if (cardEl && deletingCardOriginalHtml !== null) {
    cardEl.innerHTML = deletingCardOriginalHtml;
  }
  deletingCardId = null;
  deletingCardOriginalHtml = null;
}

function showViewModalDeleteConfirm() {
  const card = storage.getCard(viewCardId);
  if (!card) return;

  const dialog = viewModal.querySelector('.modal-dialog');
  viewModalDialogHtml = dialog.innerHTML;

  dialog.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-2">
      <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">Delete "${escapeHtml(card.word)}"?</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 text-center">This cannot be undone.</p>
      <div class="flex gap-3 items-center mt-2">
        <button data-action="view-confirm-delete" class="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors">Delete</button>
        <button data-action="view-cancel-delete" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
      </div>
    </div>
  `;
}

function cancelViewModalDelete() {
  if (!viewModalDialogHtml) return;
  const dialog = viewModal.querySelector('.modal-dialog');
  dialog.innerHTML = viewModalDialogHtml;
  viewModalDialogHtml = null;
}

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderCardList();
});

filterSelect.addEventListener('change', (e) => {
  filterPos = e.target.value;
  renderCardList();
});

sortGroupSelect.addEventListener('change', (e) => {
  groupByStatus = e.target.value === 'status';
  renderCardList();
});

Object.entries(filterStatusBtns).forEach(([status, btn]) => {
  btn.addEventListener('click', () => {
    if (filterStatuses.has(status)) {
      if (filterStatuses.size === 1) return; // always keep at least one active
      filterStatuses.delete(status);
    } else {
      filterStatuses.add(status);
    }
    updateStatusFilterDots();
    renderCardList();
  });
});

Object.entries(reviewFilterBtns).forEach(([status, btn]) => {
  btn.addEventListener('click', () => {
    if (reviewFilterStatuses.has(status)) {
      if (reviewFilterStatuses.size === 1) return; // always keep at least one active
      reviewFilterStatuses.delete(status);
    } else {
      reviewFilterStatuses.add(status);
    }
    updateReviewFilterDots();
    studyIndex = 0;
    renderStudy();
  });
});

// ─── STUDY MODE ───────────────────────────────────────────────────────────────

function buildDeck() {
  const all = storage.getCards();
  studyDeck =
    reviewFilterStatuses.size === 0
      ? all
      : all.filter((c) => reviewFilterStatuses.has(c.status));
}

function renderStudy() {
  buildDeck();
  studyFlipped = false;
  updateReviewFilterDots();

  // Top row (filter + shuffle) visible whenever cards exist in storage
  const hasAnyCards = storage.getCards().length > 0;
  studyFilter.classList.toggle('hidden', !hasAnyCards);

  if (studyDeck.length === 0) {
    studyCounter.classList.add('hidden');
    studyCard.classList.add('hidden');
    studyStatusRow.classList.add('hidden');
    studyControls.classList.add('hidden');
    studyEmpty.classList.remove('hidden');
    return;
  }

  studyEmpty.classList.add('hidden');
  studyCounter.classList.remove('hidden');
  studyCard.classList.remove('hidden');
  studyStatusRow.classList.remove('hidden');
  studyControls.classList.remove('hidden');

  // Clamp index in case deck shrank (e.g. after marking last card as known)
  if (studyIndex >= studyDeck.length) studyIndex = studyDeck.length - 1;

  showStudyCard();
}

function showStudyCard() {
  const card = studyDeck[studyIndex];
  studyFront.querySelector('.study-word').textContent = card.word;
  studyFront.querySelector('.study-pos').textContent = card.partOfSpeech;
  studyBack.querySelector('.study-definition').textContent = card.definition;
  studyCounter.textContent = `${studyIndex + 1} / ${studyDeck.length}`;

  // Reset flip state
  studyFlipped = false;
  studyCardInner.classList.remove('flipped');

  updateStudyStatusDots(card.status);
}

// Flip the card when clicking on it
studyCard.addEventListener('click', () => {
  studyFlipped = !studyFlipped;
  studyCardInner.classList.toggle('flipped', studyFlipped);
});

prevBtn.addEventListener('click', () => {
  if (studyIndex > 0) {
    studyIndex--;
    showStudyCard();
  }
});

nextBtn.addEventListener('click', () => {
  if (studyIndex < studyDeck.length - 1) {
    studyIndex++;
    showStudyCard();
  }
});

shuffleBtn.addEventListener('click', () => {
  // Fisher-Yates shuffle
  for (let i = studyDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyDeck[i], studyDeck[j]] = [studyDeck[j], studyDeck[i]];
  }
  studyIndex = 0;
  showStudyCard();
});

Object.entries(studyStatusBtns).forEach(([status, btn]) => {
  btn.addEventListener('click', () => setCurrentCardStatus(status));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Duplicate modal: Escape = skip all (safe default, no data lost)
    if (duplicateModal.classList.contains('open')) {
      dupSkipAllBtn.click();
      return;
    }
    if (importResultModal.classList.contains('open')) {
      closeImportResultModal();
      return;
    }
    if (settingsModal.classList.contains('open')) {
      closeSettingsModal();
      return;
    }
    if (deletingCardId) {
      cancelInlineDelete();
      return;
    }
    if (cardModal.classList.contains('open')) {
      closeForm();
      return;
    }
    if (viewModal.classList.contains('open')) {
      if (viewModalDialogHtml) {
        cancelViewModalDelete();
        return;
      }
      closeViewModal();
      return;
    }
  }
  if (viewModal.classList.contains('open')) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateViewModal(-1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateViewModal(1);
    }
    return;
  }
  if (viewStudy.classList.contains('hidden')) return;
  if (document.activeElement.matches('input, textarea, select')) return;
  if (studyDeck.length === 0) return;

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (studyIndex > 0) {
      studyIndex--;
      showStudyCard();
    }
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (studyIndex < studyDeck.length - 1) {
      studyIndex++;
      showStudyCard();
    }
  } else if (e.key === ' ') {
    e.preventDefault();
    studyFlipped = !studyFlipped;
    studyCardInner.classList.toggle('flipped', studyFlipped);
  } else if (e.key === '1') {
    setCurrentCardStatus('new');
  } else if (e.key === '2') {
    setCurrentCardStatus('semi');
  } else if (e.key === '3') {
    setCurrentCardStatus('known');
  }
});

// ─── DEV TOOLS PANEL ─────────────────────────────────────────────────────────

devToggleBtn.addEventListener('click', () => {
  devPanel.classList.toggle('hidden');
  devToggleBtn.textContent = devPanel.classList.contains('hidden')
    ? 'Dev tools ▸'
    : 'Dev tools ▾';
});

function updateDevCount() {
  devCount.textContent = `${storage.getCards().length} card(s) in storage`;
}

devSeedBtn.addEventListener('click', () => {
  const added = seedSampleCards();
  renderAll();
  alert(`Added ${added} sample card(s).`);
});

devClearBtn.addEventListener('click', () => {
  if (clearData()) renderAll();
});

devLogBtn.addEventListener('click', () => {
  logState();
  alert('Card data logged to the browser console (F12 → Console tab).');
});

// ─── RENDER ALL ───────────────────────────────────────────────────────────────

// Call this after any data change to keep the screen in sync with storage.
function renderAll() {
  renderCardList();
  updateStatusFilterDots();
  updateDevCount();
  // Re-render study if it's the active tab
  if (viewStudy && !viewStudy.classList.contains('hidden')) {
    renderStudy();
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const STATUS_DOT_CONFIGS = {
  new: {
    active: 'w-4 h-4 rounded bg-red-400 transition-colors',
    inactive: 'w-4 h-4 rounded border border-red-400 transition-colors'
  },
  semi: {
    active: 'w-4 h-4 rounded bg-yellow-400 transition-colors',
    inactive: 'w-4 h-4 rounded border border-yellow-400 transition-colors'
  },
  known: {
    active: 'w-4 h-4 rounded bg-green-400 transition-colors',
    inactive: 'w-4 h-4 rounded border border-green-400 transition-colors'
  }
};

function updateStatusFilterDots() {
  Object.entries(filterStatusBtns).forEach(([status, btn]) => {
    btn.className = filterStatuses.has(status)
      ? STATUS_DOT_CONFIGS[status].active
      : STATUS_DOT_CONFIGS[status].inactive;
  });
}

function updateReviewFilterDots() {
  Object.entries(reviewFilterBtns).forEach(([status, btn]) => {
    btn.className = reviewFilterStatuses.has(status)
      ? STATUS_DOT_CONFIGS[status].active
      : STATUS_DOT_CONFIGS[status].inactive;
  });
}

// Generates the three traffic-light dot buttons for a card in the list.
// Active: solid fill. Inactive: transparent with a thin colored outline.
// All three colors are at the 400 level so they feel the same visual weight.
function statusDots(cardId, currentStatus) {
  const dots = [
    {
      status: 'new',
      active: 'bg-red-400',
      inactive: 'border border-red-400',
      label: 'New'
    },
    {
      status: 'semi',
      active: 'bg-yellow-400',
      inactive: 'border border-yellow-400',
      label: 'Learning'
    },
    {
      status: 'known',
      active: 'bg-green-400',
      inactive: 'border border-green-400',
      label: 'Known'
    }
  ];
  return dots
    .map(
      (d) =>
        `<button
      data-action="set-status"
      data-id="${cardId}"
      data-status="${d.status}"
      class="w-3.5 h-3.5 rounded cursor-pointer transition-colors ${currentStatus === d.status ? d.active : d.inactive}"
      title="${d.label}"
      aria-label="${d.label}"
    ></button>`
    )
    .join('');
}

// Sets status for the current study card and keeps both views in sync.
// If the new status is filtered out, auto-advances to the next card in the deck.
function setCurrentCardStatus(status) {
  storage.setStatus(studyDeck[studyIndex].id, status);
  renderCardList();
  updateDevCount();

  const filteredOut =
    reviewFilterStatuses.size > 0 && !reviewFilterStatuses.has(status);
  if (filteredOut) {
    renderStudy(); // rebuilds deck without this card, clamps index
  } else {
    updateStudyStatusDots(status);
  }
}

// Highlights the active dot in the status row — targets the inner span, not the button.
function updateStudyStatusDots(currentStatus) {
  Object.entries(studyStatusBtns).forEach(([status, btn]) => {
    btn.classList.toggle('status-active', status === currentStatus);
  });
}

// Validates a word against dictionary-appropriate characters.
// Allows letters (including accented), spaces (phrasal verbs), hyphens, apostrophes.
// Returns an error string, or null if valid.
function validateWord(word) {
  if (/^\d/.test(word)) return "Words can't start with a number.";
  if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ\s'\-]*$/.test(word))
    return 'Invalid format: words can only contain spaces, hyphens and apostrophes';
  return null;
}

// Escape HTML to prevent XSS when inserting user text into innerHTML
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── IMPORT / EXPORT ─────────────────────────────────────────────────────────

// Full list of valid parts of speech. Matches the dropdown options plus all uncommented ones.
const VALID_POS = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection'
];

const importBtn = document.getElementById('import-btn');
const importInput = document.getElementById('import-input');
const exportBtn = document.getElementById('export-btn');
const duplicateModal = document.getElementById('duplicate-modal');
const dupModalTitle = document.getElementById('dup-modal-title');
const dupList = document.getElementById('dup-list');
const dupSkipAllBtn = document.getElementById('dup-skip-all');
const dupConfirmBtn = document.getElementById('dup-confirm');
const importResultModal = document.getElementById('import-result-modal');
const importResultClose = document.getElementById('import-result-close');
const importResultDone = document.getElementById('import-result-done');
const importResultSummary = document.getElementById('import-result-summary');
const importResultErrors = document.getElementById('import-result-errors');
const importResultList = document.getElementById('import-result-list');

importBtn.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) handleImport(e.target.files);
  importInput.value = ''; // reset so the same file can be re-imported
});
exportBtn.addEventListener('click', handleExport);

importResultModal.addEventListener('click', (e) => {
  if (e.target === importResultModal) closeImportResultModal();
});
importResultClose.addEventListener('click', closeImportResultModal);
importResultDone.addEventListener('click', closeImportResultModal);

function closeDuplicateModal() {
  duplicateModal.classList.remove('open');
}
function closeImportResultModal() {
  importResultModal.classList.remove('open');
}

// Parses a .md file's content. Word comes from the filename (without .md extension).
// Returns { ok: true, filename, word, partOfSpeech, definition, status }
//      or { ok: false, filename, reason }
// Validates strictly against the word template: exactly "part of speech" and
// "definition" lines are required, "status" is the only allowed addition.
function parseMdFile(filename, text) {
  const word = filename.replace(/\.md$/i, '').trim();

  const wordErr = validateWord(word);
  if (wordErr) return { ok: false, filename, reason: wordErr };

  if (!text.trim())
    return {
      ok: false,
      filename,
      reason: 'Empty file: no valid properties found'
    };

  const invalid = {
    ok: false,
    filename,
    reason: 'Invalid format: check file syntax'
  };

  // Normalize line endings and strip trailing blank lines
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[lines.length - 1] === '') lines.pop();

  // Must open and close with ---
  if (lines[0] !== '---' || lines[lines.length - 1] !== '---') return invalid;

  // Lines between the --- delimiters
  const inner = lines.slice(1, -1);

  // Exactly 2 lines (template) or 3 lines (with optional status)
  if (inner.length < 2 || inner.length > 3) return invalid;

  // Line 1 must be "part of speech: ..."
  const posMatch = inner[0].match(/^part of speech:[ \t]*(.*)$/);
  if (!posMatch) return invalid;

  // Line 2 must be "definition: ..."
  const defMatch = inner[1].match(/^definition:[ \t]*(.*)$/);
  if (!defMatch) return invalid;

  // Line 3, if present, must be "status: ..."
  let rawStatus = null;
  if (inner.length === 3) {
    const statusMatch = inner[2].match(/^status:[ \t]*(.*)$/);
    if (!statusMatch) return invalid;
    rawStatus = statusMatch[1].trim();
  }

  const pos = posMatch[1].trim();
  const definition = defMatch[1].trim();

  // Collect empty required fields before giving up
  const missing = [];
  if (!pos) missing.push('part of speech');
  if (!definition) missing.push('definition');
  if (missing.length > 0)
    return {
      ok: false,
      filename,
      reason: 'Missing ' + missing.map((f) => `"${f}"`).join(' and ')
    };

  if (!VALID_POS.includes(pos.toLowerCase()))
    return {
      ok: false,
      filename,
      reason: `"${pos}" is not a valid part of speech`
    };

  if (definition.length > 200)
    return { ok: false, filename, reason: 'Definition exceeds 200 characters' };

  const validStatus = ['new', 'semi', 'known'].includes(rawStatus)
    ? rawStatus
    : 'new';
  return {
    ok: true,
    filename,
    word,
    partOfSpeech: pos.toLowerCase(),
    definition,
    status: validStatus
  };
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

async function handleImport(fileList) {
  // 1. Read all files in parallel before touching storage or the UI
  const reads = await Promise.all(
    Array.from(fileList).map(async (f) => {
      try {
        return { filename: f.name, text: await readFileAsText(f) };
      } catch {
        return { filename: f.name, text: null, readError: true };
      }
    })
  );

  // 2. Parse and bucket into valid / duplicates / errors
  const errors = [];
  const valid = [];
  const duplicates = [];

  for (const { filename, text, readError } of reads) {
    if (readError) {
      errors.push({ filename, reason: 'Could not read file' });
      continue;
    }
    const parsed = parseMdFile(filename, text);
    if (!parsed.ok) {
      errors.push({ filename: parsed.filename, reason: parsed.reason });
      continue;
    }
    const existing = storage.findDuplicate(parsed.word, parsed.partOfSpeech);
    if (existing) {
      duplicates.push({ parsed, existing });
    } else {
      valid.push(parsed);
    }
  }

  // 3. Resolve duplicates via modal if any exist
  let toOverwrite = [];
  let toSkip = [];
  if (duplicates.length > 0) {
    const result = await openDuplicateModal(duplicates);
    toOverwrite = result.toOverwrite;
    toSkip = result.toSkip;
  }

  // 4. One localStorage write per operation — not one call per card
  const added = storage.bulkAdd(valid);
  const updated = storage.bulkUpdate(
    toOverwrite.map(({ existing, parsed }) => ({
      id: existing.id,
      changes: {
        word: parsed.word,
        partOfSpeech: parsed.partOfSpeech,
        definition: parsed.definition,
        status: parsed.status
      }
    }))
  );

  renderAll();

  // Build per-file results in original file order
  const resultMap = new Map();
  for (const p of valid) resultMap.set(p.filename, { status: 'added' });
  for (const { parsed } of toOverwrite)
    resultMap.set(parsed.filename, { status: 'updated' });
  for (const { parsed } of toSkip)
    resultMap.set(parsed.filename, { status: 'skipped' });
  for (const e of errors)
    resultMap.set(e.filename, { status: 'failed', reason: e.reason });

  const results = reads.map((r) => ({
    filename: r.filename,
    ...resultMap.get(r.filename)
  }));
  openImportResultModal({ results });
}

// Opens the duplicate resolution modal and returns a Promise that resolves
// once the user clicks "Skip all" or "Confirm".
function openDuplicateModal(duplicates) {
  return new Promise((resolve) => {
    dupModalTitle.textContent = `${duplicates.length} duplicate word${duplicates.length === 1 ? '' : 's'} found`;

    dupList.innerHTML = duplicates
      .map(
        (dup, i) => `
      <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
        <input type="checkbox" checked data-dup-index="${i}" class="mt-0.5 accent-violet-600 cursor-pointer flex-none">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
            ${escapeHtml(dup.parsed.word)}
            <span class="font-normal text-gray-400 text-xs">(${escapeHtml(dup.parsed.partOfSpeech)})</span>
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500 truncate">Existing: ${escapeHtml(dup.existing.definition)}</span>
          <span class="text-xs text-gray-600 dark:text-gray-300 truncate">New: ${escapeHtml(dup.parsed.definition)}</span>
        </div>
      </label>
    `
      )
      .join('');

    duplicateModal.classList.add('open');

    function finish(overwriteIndices) {
      closeDuplicateModal();
      resolve({
        toOverwrite: overwriteIndices.map((i) => duplicates[i]),
        toSkip: duplicates.filter((_, i) => !overwriteIndices.includes(i))
      });
    }

    dupSkipAllBtn.onclick = () => finish([]);
    dupConfirmBtn.onclick = () => {
      const checked = [
        ...dupList.querySelectorAll('input[data-dup-index]:checked')
      ].map((el) => parseInt(el.dataset.dupIndex, 10));
      finish(checked);
    };
  });
}

function openImportResultModal({ results }) {
  const total = results.length;
  const counts = { added: 0, updated: 0, skipped: 0, failed: 0 };
  for (const r of results) counts[r.status]++;

  const breakdownParts = [];
  if (counts.added > 0)
    breakdownParts.push(
      `<span class="block text-green-600 dark:text-green-400">${counts.added} added</span>`
    );
  if (counts.updated > 0)
    breakdownParts.push(
      `<span class="block text-blue-500 dark:text-blue-400">${counts.updated} updated</span>`
    );
  if (counts.failed > 0)
    breakdownParts.push(
      `<span class="block text-red-500 dark:text-red-400">${counts.failed} failed</span>`
    );
  if (counts.skipped > 0)
    breakdownParts.push(
      `<span class="block text-gray-400 dark:text-gray-500">${counts.skipped} skipped</span>`
    );

  importResultSummary.innerHTML =
    `<span class="block font-medium mb-1">${total} file${total === 1 ? '' : 's'} processed</span>` +
    breakdownParts.join('');

  const cfg = {
    added: {
      icon: '✓',
      label: 'Added',
      iconCls: 'text-green-600 dark:text-green-400',
      labelCls: 'text-green-600 dark:text-green-400'
    },
    updated: {
      icon: '✓',
      label: 'Updated',
      iconCls: 'text-blue-500 dark:text-blue-400',
      labelCls: 'text-blue-500 dark:text-blue-400'
    },
    skipped: {
      icon: '—',
      label: 'Skipped',
      iconCls: 'text-gray-400 dark:text-gray-500',
      labelCls: 'text-gray-400 dark:text-gray-500'
    },
    failed: {
      icon: '✗',
      label: 'Failed',
      iconCls: 'text-red-500 dark:text-red-400',
      labelCls: 'text-red-500 dark:text-red-400'
    }
  };

  importResultList.innerHTML = [...results]
    .sort((a, b) => a.filename.localeCompare(b.filename))
    .map(({ filename, status, reason }) => {
      const { icon, label: cfgLabel, iconCls, labelCls } = cfg[status];
      const label = status === 'failed' ? reason : cfgLabel;
      return `<div class="flex items-start gap-2 py-1">
      <span class="flex-none font-bold text-xs mt-0.5 ${iconCls}">${icon}</span>
      <span class="min-w-0">
        <span class="block text-xs text-gray-700 dark:text-gray-300 break-words">${escapeHtml(filename)}</span>
        <span class="block text-xs ${labelCls}">${escapeHtml(label)}</span>
      </span>
    </div>`;
    })
    .join('');
  importResultErrors.classList.remove('hidden');

  importResultModal.classList.add('open');
}

function handleExport() {
  const cards = storage.getCards();
  if (cards.length === 0) {
    alert('No cards to export.');
    return;
  }

  const zip = new JSZip();
  cards.forEach((card) => {
    const content = `---\npart of speech: ${card.partOfSpeech}\ndefinition: ${card.definition}\nstatus: ${card.status}\n---\n`;
    // Replace characters that are invalid in filenames
    const filename = card.word.replace(/[<>:"/\\|?*]/g, '_') + '.md';
    zip.file(filename, content);
  });

  zip.generateAsync({ type: 'blob' }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date();
    const stamp =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    a.download = `vocab_export_${stamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

initTheme();
showTab('cards');
renderAll();
