// app.js — UI LOGIC
// Reads and writes data only through storage.js — never touches localStorage directly.
// Organized into clear sections: Theme, Tabs, Form, List, Study, Dev Tools.

// ─── ICONS ────────────────────────────────────────────────────────────────────
// Inline SVGs — no external library needed. Feather-style line icons.

const ICON_EDIT = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
const ICON_DELETE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_MOON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const ICON_SUN = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

// ─── STATE ────────────────────────────────────────────────────────────────────

// editingId tracks which card is being edited (null when adding a new card)
let editingId = null;

// Study mode state
let studyDeck = [];
let studyIndex = 0;
let studyFlipped = false;
let includeKnown = false;

// Search/filter state
let searchQuery = "";
let filterPos = "";

// ─── DOM REFERENCES ───────────────────────────────────────────────────────────

const themeToggleBtn = document.getElementById("theme-toggle");
const tabCards = document.getElementById("tab-cards");
const tabStudy = document.getElementById("tab-study");
const viewCards = document.getElementById("view-cards");
const viewStudy = document.getElementById("view-study");

const addCardTrigger = document.getElementById("add-card-trigger");
const formWrapper = document.getElementById("form-wrapper");
const cardForm = document.getElementById("card-form");
const formTitle = document.getElementById("form-title");
const wordInput = document.getElementById("input-word");
const posSelect = document.getElementById("input-pos");
const definitionInput = document.getElementById("input-definition");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const searchInput = document.getElementById("search-input");
const filterSelect = document.getElementById("filter-pos");
const cardList = document.getElementById("card-list");
const emptyState = document.getElementById("empty-state");

const studyCard = document.getElementById("study-card");
const studyCardInner = document.getElementById("study-card-inner");
const studyFront = document.getElementById("study-front");
const studyBack = document.getElementById("study-back");
const studyCounter = document.getElementById("study-counter");
const studyEmpty = document.getElementById("study-empty");
const studyControls = document.getElementById("study-controls");
const prevBtn = document.getElementById("btn-prev");
const nextBtn = document.getElementById("btn-next");
const flipBtn = document.getElementById("btn-flip");
const shuffleBtn = document.getElementById("btn-shuffle");
const studyStatusRow = document.getElementById("study-status-row");
const studyStatusBtns = {
  new:   document.getElementById("btn-status-new"),
  semi:  document.getElementById("btn-status-semi"),
  known: document.getElementById("btn-status-known"),
};
const includeKnownToggle = document.getElementById("include-known");

const devPanel = document.getElementById("dev-panel");
const devToggleBtn = document.getElementById("dev-toggle");
const devSeedBtn = document.getElementById("dev-seed");
const devClearBtn = document.getElementById("dev-clear");
const devLogBtn = document.getElementById("dev-log");
const devCount = document.getElementById("dev-count");

// ─── THEME ────────────────────────────────────────────────────────────────────

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  themeToggleBtn.innerHTML = isDark ? ICON_SUN : ICON_MOON;
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) {
    applyTheme(saved === "dark");
  } else {
    // Default to the user's OS preference on first visit
    applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }
}

themeToggleBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggleBtn.innerHTML = isDark ? ICON_SUN : ICON_MOON;
});

// ─── TABS ─────────────────────────────────────────────────────────────────────

function showTab(tab) {
  const isCards = tab === "cards";
  viewCards.classList.toggle("hidden", !isCards);
  viewStudy.classList.toggle("hidden", isCards);
  tabCards.dataset.active = isCards ? "true" : "false";
  tabStudy.dataset.active = isCards ? "false" : "true";
  updateTabStyles();
  if (!isCards) renderStudy();
}

function updateTabStyles() {
  [tabCards, tabStudy].forEach((btn) => {
    const active = btn.dataset.active === "true";
    btn.classList.toggle("border-violet-600", active);
    btn.classList.toggle("text-violet-600", active);
    btn.classList.toggle("dark:text-violet-400", active);
    btn.classList.toggle("dark:border-violet-400", active);
    btn.classList.toggle("border-transparent", !active);
    btn.classList.toggle("text-gray-500", !active);
    btn.classList.toggle("dark:text-gray-400", !active);
  });
}

tabCards.addEventListener("click", () => showTab("cards"));
tabStudy.addEventListener("click", () => showTab("study"));

// ─── FORM (ADD / EDIT) ────────────────────────────────────────────────────────

function openForm() {
  formWrapper.classList.add("open");
  addCardTrigger.classList.add("hidden");
  wordInput.focus();
}

function closeForm() {
  formWrapper.classList.remove("open");
  addCardTrigger.classList.remove("hidden");
  resetForm();
}

function resetForm() {
  editingId = null;
  cardForm.reset();
  formTitle.textContent = "Add a card";
  submitBtn.textContent = "Add card";
}

function startEdit(id) {
  const card = storage.getCard(id);
  if (!card) return;
  editingId = id;
  wordInput.value = card.word;
  posSelect.value = card.partOfSpeech;
  definitionInput.value = card.definition;
  formTitle.textContent = "Edit card";
  submitBtn.textContent = "Save changes";
  openForm();
  // Scroll form into view on mobile
  formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
}

addCardTrigger.addEventListener("click", openForm);
cancelEditBtn.addEventListener("click", closeForm);

cardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const word = wordInput.value.trim();
  const partOfSpeech = posSelect.value;
  const definition = definitionInput.value.trim();

  if (!word || !partOfSpeech || !definition) return;

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
    const matchesSearch = card.word.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = !filterPos || card.partOfSpeech === filterPos;
    return matchesSearch && matchesPos;
  });
}

function renderCardList() {
  const total = storage.getCards().length;
  searchInput.placeholder = `Search ${total} word${total === 1 ? "" : "s"}…`;

  const cards = getFilteredCards();
  cardList.innerHTML = "";

  if (cards.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  cards.forEach((card) => {
    const el = document.createElement("div");
    el.className =
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all";

    el.innerHTML = `
      <div class="grid gap-x-3 gap-y-1 items-center" style="grid-template-columns: 1fr auto">
        <span class="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">${escapeHtml(card.word)}</span>
        <div class="flex gap-1.5 justify-end">${statusDots(card.id, card.status)}</div>
        <span class="text-xs italic text-gray-400/70 dark:text-gray-500/70">${escapeHtml(card.partOfSpeech)}</span>
        <div class="flex gap-2 justify-end">
          <button data-action="edit" data-id="${card.id}" class="text-gray-300 dark:text-gray-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors" aria-label="Edit">${ICON_EDIT}</button>
          <button data-action="delete" data-id="${card.id}" class="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors" aria-label="Delete">${ICON_DELETE}</button>
        </div>
      </div>
      <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">${escapeHtml(card.definition)}</p>
    `;

    cardList.appendChild(el);
  });
}

// Handle edit/delete clicks via event delegation — one listener for all cards
cardList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, id } = btn.dataset;

  if (action === "edit") {
    startEdit(id);
  } else if (action === "delete") {
    if (confirm("Delete this card? This cannot be undone.")) {
      storage.deleteCard(id);
      renderAll();
    }
  } else if (action === "set-status") {
    storage.setStatus(id, btn.dataset.status);
    renderAll();
  }
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderCardList();
});

filterSelect.addEventListener("change", (e) => {
  filterPos = e.target.value;
  renderCardList();
});

// ─── STUDY MODE ───────────────────────────────────────────────────────────────

function buildDeck() {
  const all = storage.getCards();
  studyDeck = includeKnown ? all : all.filter((c) => c.status !== "known");
}

function renderStudy() {
  buildDeck();
  studyFlipped = false;

  if (studyDeck.length === 0) {
    studyCard.classList.add("hidden");
    studyStatusRow.classList.add("hidden");
    studyStatusRow.classList.remove("flex");
    studyControls.classList.add("hidden");
    studyCounter.textContent = "";
    studyEmpty.classList.remove("hidden");
    return;
  }

  studyEmpty.classList.add("hidden");
  studyCard.classList.remove("hidden");
  studyStatusRow.classList.remove("hidden");
  studyStatusRow.classList.add("flex");
  studyControls.classList.remove("hidden");

  // Clamp index in case deck shrank (e.g. after marking last card as known)
  if (studyIndex >= studyDeck.length) studyIndex = studyDeck.length - 1;

  showStudyCard();
}

function showStudyCard() {
  const card = studyDeck[studyIndex];
  studyFront.querySelector(".study-word").textContent = card.word;
  studyFront.querySelector(".study-pos").textContent = card.partOfSpeech;
  studyBack.querySelector(".study-definition").textContent = card.definition;
  studyCounter.textContent = `${studyIndex + 1} / ${studyDeck.length}`;

  // Reset flip state
  studyFlipped = false;
  studyCardInner.classList.remove("flipped");

  updateStudyStatusDots(card.status);
}

// Flip the card when clicking on it
studyCard.addEventListener("click", () => {
  studyFlipped = !studyFlipped;
  studyCardInner.classList.toggle("flipped", studyFlipped);
});

flipBtn.addEventListener("click", () => {
  studyFlipped = !studyFlipped;
  studyCardInner.classList.toggle("flipped", studyFlipped);
});

prevBtn.addEventListener("click", () => {
  if (studyIndex > 0) {
    studyIndex--;
    showStudyCard();
  }
});

nextBtn.addEventListener("click", () => {
  if (studyIndex < studyDeck.length - 1) {
    studyIndex++;
    showStudyCard();
  }
});

shuffleBtn.addEventListener("click", () => {
  // Fisher-Yates shuffle
  for (let i = studyDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [studyDeck[i], studyDeck[j]] = [studyDeck[j], studyDeck[i]];
  }
  studyIndex = 0;
  showStudyCard();
});

Object.entries(studyStatusBtns).forEach(([status, btn]) => {
  btn.addEventListener("click", () => {
    storage.setStatus(studyDeck[studyIndex].id, status);
    updateStudyStatusDots(status);
  });
});

includeKnownToggle.addEventListener("change", () => {
  includeKnown = includeKnownToggle.checked;
  studyIndex = 0;
  renderStudy();
});

// ─── DEV TOOLS PANEL ─────────────────────────────────────────────────────────

devToggleBtn.addEventListener("click", () => {
  devPanel.classList.toggle("hidden");
  devToggleBtn.textContent = devPanel.classList.contains("hidden")
    ? "Dev tools ▸"
    : "Dev tools ▾";
});

function updateDevCount() {
  devCount.textContent = `${storage.getCards().length} card(s) in storage`;
}

devSeedBtn.addEventListener("click", () => {
  const added = seedSampleCards();
  renderAll();
  alert(`Added ${added} sample card(s).`);
});

devClearBtn.addEventListener("click", () => {
  if (clearData()) renderAll();
});

devLogBtn.addEventListener("click", () => {
  logState();
  alert("Card data logged to the browser console (F12 → Console tab).");
});

// ─── RENDER ALL ───────────────────────────────────────────────────────────────

// Call this after any data change to keep the screen in sync with storage.
function renderAll() {
  renderCardList();
  updateDevCount();
  // Re-render study if it's the active tab
  if (viewStudy && !viewStudy.classList.contains("hidden")) {
    renderStudy();
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Generates the three traffic-light dot buttons for a card in the list.
// Active: solid fill. Inactive: transparent with a thin colored outline.
// All three colors are at the 400 level so they feel the same visual weight.
function statusDots(cardId, currentStatus) {
  const dots = [
    { status: "new",   active: "bg-red-400",    inactive: "border border-red-400",    label: "New" },
    { status: "semi",  active: "bg-yellow-400",  inactive: "border border-yellow-400", label: "Learning" },
    { status: "known", active: "bg-green-400",   inactive: "border border-green-400",  label: "Known" },
  ];
  return dots.map((d) =>
    `<button
      data-action="set-status"
      data-id="${cardId}"
      data-status="${d.status}"
      class="w-3 h-3 rounded cursor-pointer transition-colors ${currentStatus === d.status ? d.active : d.inactive}"
      title="${d.label}"
      aria-label="${d.label}"
    ></button>`
  ).join("");
}

// Highlights the active status dot in the study mode controls.
function updateStudyStatusDots(currentStatus) {
  const base = "w-4 h-4 rounded cursor-pointer transition-colors";
  const configs = {
    new:   { active: `${base} bg-red-400`,    inactive: `${base} border border-red-400` },
    semi:  { active: `${base} bg-yellow-400`, inactive: `${base} border border-yellow-400` },
    known: { active: `${base} bg-green-400`,  inactive: `${base} border border-green-400` },
  };
  Object.entries(studyStatusBtns).forEach(([status, btn]) => {
    btn.className = currentStatus === status ? configs[status].active : configs[status].inactive;
  });
}

// Escape HTML to prevent XSS when inserting user text into innerHTML
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

initTheme();
showTab("cards");
renderAll();
