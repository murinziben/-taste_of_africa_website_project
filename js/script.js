/* =========================================================
   TASTES OF AFRICA: SHARED JAVASCRIPT
   One file used by every page. Each feature lives in its own
   function and first checks that the elements it needs exist,
   so a page without (for example) a contact form never errors.

   Features
   1. Dark / light theme toggle (saved in localStorage)
   2. Mobile navigation menu
   3. Search overlay
   4. Favourites (saved in localStorage)
   5. Recipe filtering + search (recipes page)
   6. Ingredient scaler (recipe pages)
   7. Expand / collapse all cooking steps
   8. Contact form validation + personalised feedback
   9. Newsletter signup feedback
   10. Footer year
   ========================================================= */

/* Keys used to store data in the browser's localStorage */
const THEME_KEY = 'toa-theme';
const FAVORITES_KEY = 'toa-favorites';

/* ---------- Small helpers ---------- */

// Reads JSON safely from localStorage (returns a fallback if empty, broken or blocked)
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

// Writes JSON to localStorage (ignores errors, e.g. private browsing)
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    /* storage unavailable; the feature still works until the page reloads */
  }
}

/* ---------- 1. THEME (dark / light) ----------
   Applied immediately (before DOMContentLoaded) so the saved theme
   shows as early as possible. The theme is stored on <html data-theme>,
   and the CSS variables in style.css change with it. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(function (button) {
    const next = theme === 'dark' ? 'light' : 'dark';
    button.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    button.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  });
}

applyTheme(readStorage(THEME_KEY, 'dark'));

function initThemeToggle() {
  const toggles = document.querySelectorAll('.theme-toggle');
  if (toggles.length === 0) return;

  applyTheme(readStorage(THEME_KEY, 'dark')); // refresh button labels

  toggles.forEach(function (button) {
    button.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      writeStorage(THEME_KEY, next);
    });
  });
}

/* ---------- 2. MOBILE MENU ---------- */
function initMobileMenu() {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.nav');
  if (!menuButton || !nav) return;

  menuButton.addEventListener('click', function () {
    const isOpen = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });

  // Close the menu when Escape is pressed
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.focus();
    }
  });
}

/* ---------- 3. SEARCH OVERLAY ----------
   The overlay contains a normal <form method="get"> that sends the
   visitor to recipes.html?q=..., and the recipes page then reads "q". */
function initSearchOverlay() {
  const overlay = document.querySelector('.search-overlay');
  const openButton = document.querySelector('.search-open');
  if (!overlay || !openButton) return;

  const closeButton = overlay.querySelector('.search-close');
  const input = overlay.querySelector('input');

  function openSearch() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    input.focus();
  }

  function closeSearch() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    openButton.focus();
  }

  openButton.addEventListener('click', openSearch);
  closeButton.addEventListener('click', closeSearch);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !overlay.hidden) closeSearch();
  });

  // Clicking the dark background (not the panel) also closes it
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeSearch();
  });
}

/* ---------- 4. FAVOURITES ----------
   Every heart button has data-recipe-id="jollof-rice" (etc.).
   We keep an array of saved IDs in localStorage. */
function getFavorites() {
  const saved = readStorage(FAVORITES_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function updateFavoriteButtons() {
  const favorites = getFavorites();
  const buttons = document.querySelectorAll('.favorite[data-recipe-id]');

  buttons.forEach(function (button) {
    const id = button.dataset.recipeId;
    const name = button.dataset.recipeName || id;
    const isSaved = favorites.includes(id);

    button.classList.toggle('active', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', (isSaved ? 'Remove ' : 'Save ') + name + (isSaved ? ' from favourites' : ' to favourites'));

    // Large buttons on recipe pages also show a text label
    const label = button.querySelector('.favorite-label');
    if (label) label.textContent = isSaved ? 'Saved to favourites' : 'Save recipe';
  });

  // Update the "Saved (n)" counter on the recipes page, if there is one
  const counter = document.querySelector('.favorites-count');
  if (counter) counter.textContent = favorites.length;
}

function toggleFavorite(id) {
  let favorites = getFavorites();

  if (favorites.includes(id)) {
    // Already saved → remove it
    favorites = favorites.filter(function (savedId) { return savedId !== id; });
  } else {
    // Not saved yet → add it (includes() check above prevents duplicates)
    favorites.push(id);
  }

  writeStorage(FAVORITES_KEY, favorites);
  updateFavoriteButtons();
  // Let other features (like the "Saved" filter) know favourites changed
  document.dispatchEvent(new CustomEvent('favorites:change'));
}

function initFavorites() {
  const buttons = document.querySelectorAll('.favorite[data-recipe-id]');
  if (buttons.length === 0) return;

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      toggleFavorite(button.dataset.recipeId);
      // small "pop" animation
      button.classList.remove('pop');
      void button.offsetWidth; // restart the animation
      button.classList.add('pop');
    });
  });

  updateFavoriteButtons(); // restore saved state after a refresh
}

/* ---------- 5. RECIPE FILTERING + SEARCH ----------
   Filter buttons have data-filter="all | west | east | north | south | saved".
   Each recipe card has data-region and data-recipe-id. */
function initRecipeFilter() {
  const grid = document.querySelector('.recipe-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (!grid || filterButtons.length === 0) return;

  const cards = grid.querySelectorAll('.recipe-card');
  const searchInput = document.querySelector('#recipe-search');
  const resultCount = document.querySelector('.result-count');
  const emptyState = document.querySelector('.empty-state');
  const clearButton = document.querySelector('.clear-filters');

  let activeFilter = 'all';

  // If the visitor came from the search overlay (?q=jollof), pre-fill the search
  const params = new URLSearchParams(window.location.search);
  if (searchInput && params.get('q')) searchInput.value = params.get('q');

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const favorites = getFavorites();
    let visibleCount = 0;

    // Loop over every card and decide whether to show or hide it
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'saved' && favorites.includes(card.dataset.recipeId)) ||
        card.dataset.region === activeFilter;
      const matchesSearch = card.textContent.toLowerCase().includes(query) ||
        (card.dataset.keywords || '').includes(query);

      const show = matchesFilter && matchesSearch;
      card.hidden = !show;
      if (show) visibleCount++;
    }

    if (resultCount) {
      resultCount.textContent = visibleCount + (visibleCount === 1 ? ' recipe' : ' recipes') + ' to explore';
    }
    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(function (other) {
        other.classList.toggle('active', other === button);
        other.setAttribute('aria-pressed', String(other === button));
      });
      applyFilters();
    });
  });

  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      filterButtons[0].click(); // the first button is "All regions"
    });
  }

  // Re-filter when a favourite is removed while the "Saved" filter is active
  document.addEventListener('favorites:change', applyFilters);

  applyFilters();
}

/* ---------- 6. INGREDIENT SCALER ----------
   Each scalable ingredient has <span class="qty" data-qty="2" data-unit="cups">.
   New amount = original amount × (new servings ÷ original servings). */
function formatQuantity(value) {
  // Show friendly kitchen fractions instead of long decimals
  const fractions = {
    0.13: '⅛', 0.17: '⅙', 0.25: '¼', 0.33: '⅓', 0.38: '⅜', 0.5: '½',
    0.63: '⅝', 0.67: '⅔', 0.75: '¾', 0.83: '⅚', 0.88: '⅞'
  };
  const whole = Math.floor(value);
  const decimal = Math.round((value - whole) * 100) / 100;

  if (decimal === 0) return String(whole);
  if (fractions[decimal]) return (whole > 0 ? whole : '') + fractions[decimal];
  // Fall back to one decimal place (e.g. 1.2)
  return String(Math.round(value * 10) / 10);
}

function initIngredientScaler() {
  const servingsInput = document.querySelector('#servings');
  if (!servingsInput) return;

  const baseServings = Number(servingsInput.dataset.baseServings) || 4;
  const quantities = document.querySelectorAll('.qty[data-qty]');
  const decreaseButton = document.querySelector('.servings-decrease');
  const increaseButton = document.querySelector('.servings-increase');
  const servingsLabel = document.querySelectorAll('.servings-label');
  const min = Number(servingsInput.min) || 1;
  const max = Number(servingsInput.max) || 20;

  function updateQuantities() {
    let servings = parseInt(servingsInput.value, 10);
    if (isNaN(servings)) return; // wait until the visitor types a number
    servings = Math.min(max, Math.max(min, servings));
    servingsInput.value = servings;

    const ratio = servings / baseServings;

    quantities.forEach(function (qty) {
      const original = parseFloat(qty.dataset.qty);
      const scaled = original * ratio;
      const unit = qty.dataset.unit || '';
      // Use the plural unit when there is more than one (e.g. "cup" → "cups")
      const plural = qty.dataset.unitPlural || unit;
      const unitText = unit ? ' ' + (scaled > 1 ? plural : unit) : '';
      qty.textContent = formatQuantity(scaled) + unitText;

      // brief highlight so visitors notice the change
      qty.classList.add('flash');
      setTimeout(function () { qty.classList.remove('flash'); }, 400);
    });

    servingsLabel.forEach(function (label) { label.textContent = servings; });
    if (decreaseButton) decreaseButton.disabled = servings <= min;
    if (increaseButton) increaseButton.disabled = servings >= max;
  }

  if (decreaseButton) {
    decreaseButton.addEventListener('click', function () {
      servingsInput.value = parseInt(servingsInput.value, 10) - 1;
      updateQuantities();
    });
  }
  if (increaseButton) {
    increaseButton.addEventListener('click', function () {
      servingsInput.value = parseInt(servingsInput.value, 10) + 1;
      updateQuantities();
    });
  }

  servingsInput.addEventListener('input', updateQuantities);
  // If the field is left empty, restore the original servings
  servingsInput.addEventListener('blur', function () {
    if (servingsInput.value === '') servingsInput.value = baseServings;
    updateQuantities();
  });

  updateQuantities();
}

/* ---------- 7. EXPAND / COLLAPSE ALL STEPS ---------- */
function initStepControls() {
  const expandAll = document.querySelector('.expand-all');
  const collapseAll = document.querySelector('.collapse-all');
  const steps = document.querySelectorAll('.steps details');
  if (steps.length === 0) return;

  if (expandAll) expandAll.addEventListener('click', function () {
    steps.forEach(function (step) { step.open = true; });
  });
  if (collapseAll) collapseAll.addEventListener('click', function () {
    steps.forEach(function (step) { step.open = false; });
  });
}

/* ---------- 8. CONTACT FORM VALIDATION ---------- */
function showError(input, message) {
  const error = document.querySelector('#' + input.id + '-error');
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

function initContactForm() {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const countryInput = form.querySelector('#country');
  const messageInput = form.querySelector('#message');
  const charCount = form.querySelector('.char-count');
  const thanks = document.querySelector('#form-success');
  const MIN_MESSAGE = 20; // the message must be MORE than 20 characters

  // Live character counter for the message
  function updateCount() {
    if (!charCount) return;
    const length = messageInput.value.trim().length;
    charCount.textContent = length + ' / more than ' + MIN_MESSAGE + ' characters';
    charCount.classList.toggle('ok', length > MIN_MESSAGE);
  }
  messageInput.addEventListener('input', function () {
    updateCount();
    if (messageInput.getAttribute('aria-invalid') === 'true' && messageInput.value.trim().length > MIN_MESSAGE) {
      showError(messageInput, '');
    }
  });
  updateCount();

  // Each check returns true when the field is valid
  function validateName() {
    const value = nameInput.value.trim();
    if (value.length < 2) { showError(nameInput, 'Please enter your name (at least 2 letters).'); return false; }
    showError(nameInput, ''); return true;
  }
  function validateEmail() {
    const value = emailInput.value.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!pattern.test(value)) { showError(emailInput, 'Please enter a valid email, e.g. you@example.com.'); return false; }
    showError(emailInput, ''); return true;
  }
  function validateCountry() {
    if (countryInput.value.trim() === '') { showError(countryInput, 'Please tell us where you are writing from.'); return false; }
    showError(countryInput, ''); return true;
  }
  function validateMessage() {
    const length = messageInput.value.trim().length;
    if (length <= MIN_MESSAGE) {
      showError(messageInput, 'Your message must be more than ' + MIN_MESSAGE + ' characters (currently ' + length + ').');
      return false;
    }
    showError(messageInput, ''); return true;
  }

  // Validate a field when the visitor leaves it
  nameInput.addEventListener('blur', validateName);
  emailInput.addEventListener('blur', validateEmail);
  countryInput.addEventListener('blur', validateCountry);

  form.addEventListener('submit', function (event) {
    event.preventDefault(); // stop the browser from reloading the page

    const results = [validateName(), validateEmail(), validateCountry(), validateMessage()];
    const allValid = results.every(Boolean);

    if (!allValid) {
      // Move focus to the first field with a problem
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Success: hide the form and show a personalised message
    const firstName = nameInput.value.trim().split(' ')[0];
    thanks.querySelector('.thanks-name').textContent = firstName;
    thanks.querySelector('.thanks-country').textContent = countryInput.value.trim();
    thanks.querySelector('.thanks-email').textContent = emailInput.value.trim();

    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  });

  // "Send another message" resets everything
  const resetButton = document.querySelector('.send-another');
  if (resetButton) {
    resetButton.addEventListener('click', function () {
      form.reset();
      updateCount();
      thanks.hidden = true;
      form.hidden = false;
      nameInput.focus();
    });
  }
}

/* ---------- 9. NEWSLETTER ---------- */
function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  const input = form.querySelector('input[type="email"]');
  const feedback = form.querySelector('.newsletter-feedback');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      feedback.textContent = 'Please enter a valid email address.';
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    input.setAttribute('aria-invalid', 'false');
    feedback.textContent = 'Asante! ' + email + ' is on the list for our monthly recipe letter.';
    form.reset();
  });
}

/* ---------- 10. VIDEO HELP NOTE ----------
   YouTube refuses to play embedded videos when a page is opened
   directly as a file (address starts with file://). In that case we
   add a short note under each video explaining how to open the site
   through a web server (Live Server or GitHub Pages) instead. */
function initVideoNotice() {
  if (window.location.protocol !== 'file:') return;
  const frames = document.querySelectorAll('.video-frame');
  frames.forEach(function (frame) {
    const note = document.createElement('p');
    note.className = 'video-note';
    note.textContent = 'Video not playing? YouTube blocks videos on pages opened as files. ' +
      'Open this site with VS Code Live Server or via its GitHub Pages link and the video plays right here.';
    frame.insertAdjacentElement('afterend', note);
  });
}

/* ---------- 11. FOOTER YEAR ---------- */
function initFooterYear() {
  const year = document.querySelector('.current-year');
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- START EVERYTHING once the HTML has loaded ---------- */
document.addEventListener('DOMContentLoaded', function () {
  initThemeToggle();
  initMobileMenu();
  initSearchOverlay();
  initFavorites();
  initRecipeFilter();
  initIngredientScaler();
  initStepControls();
  initContactForm();
  initNewsletter();
  initVideoNotice();
  initFooterYear();
});
