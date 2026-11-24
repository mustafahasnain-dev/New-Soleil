/**
 * Custom element that manages predictive live search functionality with keyboard navigation and caching.
 * @extends HTMLElement
 */
class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.cachedResults = {};
    this.input = this.querySelector('input[type="search"]');
    if(this.querySelector('[data-predictive-search]')){
      this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
      this.predictiveSearchStatus = this.querySelector('.predictive-search-status');
    }
    else{
      this.predictiveSearchResults = this.closest('.search-parent-js').querySelector('[data-predictive-search]');
      this.predictiveSearchStatus = this.closest('.search-parent-js').querySelector('.predictive-search-status');
    }

    this.allPredictiveSearchInstances = document.querySelectorAll('wk-predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    document.querySelector('.predictive-search__loading-state.hide') && document.querySelector('.predictive-search__loading-state.hide').classList.remove('hide');

    this.setupEventListeners();
  }

  /* Desktop: results render in a page-level panel attached to <body>, outside the (transparent) header,
     so header styles cannot hide or clip them. Mobile keeps the in-header dropdown. */
  isDesktop() {
    return window.matchMedia('(min-width: 1025px)').matches && !this.closest('.search-parent-js');
  }

  getPanel() {
    if (PredictiveSearch.panel) return PredictiveSearch.panel;
    const panel = document.createElement('div');
    panel.id = 'SearchPanel';
    panel.className = 'sp-panel';
    panel.hidden = true;
    panel.innerHTML = '<div class="sp-panel__dim"></div><div class="sp-panel__box"><button type="button" class="sp-panel__close" aria-label="Close">&times;</button><div class="sp-panel__inner" data-sp-results></div></div>';
    document.body.appendChild(panel);
    // keep focus in the input when clicking inside the panel (links still navigate)
    panel.querySelector('.sp-panel__box').addEventListener('mousedown', (e) => {
      if (!e.target.closest('a')) e.preventDefault();
    });
    PredictiveSearch.panel = panel;
    return panel;
  }

  getRoot() {
    return this.isDesktop() && PredictiveSearch.panelOwner === this ? this.getPanel() : this;
  }

  positionPanel() {
    const panel = this.getPanel();
    const header = this.closest('.header__main') || this.closest('header') || this;
    const top = Math.max(0, header.getBoundingClientRect().bottom);
    panel.style.setProperty('--sp-top', top + 'px');
  }

  bindPanel() {
    const panel = this.getPanel();
    PredictiveSearch.panelOwner = this;
    panel.querySelector('.sp-panel__close').onclick = () => this.close();
    panel.querySelector('.sp-panel__dim').onclick = () => this.close();
    if (!this._panelListeners) {
      this._panelListeners = true;
      const reposition = () => { if (this.isOpen && PredictiveSearch.panelOwner === this) this.positionPanel(); };
      window.addEventListener('scroll', reposition, { passive: true });
      window.addEventListener('resize', () => {
        if (!this.isDesktop() && PredictiveSearch.panelOwner === this) this.close();
        reposition();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); });
    }
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
    this.input.addEventListener('input', debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  /**
   * Gets trimmed search input value.
   * @returns {string}
   */
  getQuery() {
    return this.input.value.trim();
  }

  onChange(e) {
    this.searchTerm = this.getQuery();

    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(this.searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length || this.getRoot().querySelector('[aria-selected="true"] a')) event.preventDefault();
  }

  onFocus() {
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      this.onChange();
    } else if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    if(this.classList.contains('static') && this.querySelector('.field__input').value != "" ) return false;
    setTimeout(() => {
      const active = document.activeElement;
      if (this.contains(active)) return;
      if (PredictiveSearch.panel && PredictiveSearch.panelOwner === this && PredictiveSearch.panel.contains(active)) return;
      this.close();
    })
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up')
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    if (
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown'
    ) {
      event.preventDefault();
    }
  }

  /**
   * Navigates active suggestion options via arrow keys.
   * @param {'up'|'down'} direction
   */
  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const root = this.getRoot();
    const selectedElement = root.querySelector('[aria-selected="true"]');
    const allVisibleElements = Array.from(
      root.querySelectorAll("li, button.predictive-search__item")
    ).filter((element) => element.offsetParent !== null);
    let activeElementIndex = 0;

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;

    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }

    this.statusElement.textContent = "";

    if (!moveUp && selectedElement) {
      activeElementIndex =
        selectedElementIndex === allVisibleElements.length - 1
          ? 0
          : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex =
        selectedElementIndex === 0
          ? allVisibleElements.length - 1
          : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];

    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedOption = this.getRoot().querySelector(
      '[aria-selected="true"] a, button[aria-selected="true"]'
    );

    if (selectedOption) selectedOption.click();
  }

  /**
   * Fetches search results via AJAX with caching support.
   * @param {string} searchTerm
   */
  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(/s+/g, "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&resources[options][fields]=title,product_type,tag,variants.title,vendor&section_id=wk-predictive-search`, {
      signal: this.abortController.signal }
    )
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-wk-predictive-search').innerHTML;
        this.allPredictiveSearchInstances.forEach(
          (predictiveSearchInstance) => {
            predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
          }
        );
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          return;
        }
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.predictiveSearchStatus;
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');

    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute('aria-hidden', 'true');
    }, 1000);
  }

  /**
   * Renders results HTML and opens the dropdown container.
   * @param {string} resultsMarkup
   */
  renderSearchResults(resultsMarkup) {
    if (this.isDesktop()) {
      this.bindPanel();
      this.getPanel().querySelector('[data-sp-results]').innerHTML = resultsMarkup;
    } else {
      this.predictiveSearchResults.innerHTML = resultsMarkup;
    }
    this.setAttribute('results', true);

    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    var count_value = false;
    if(this.getRoot().querySelector('[data-predictive-search-live-region-count-value]')){
      count_value = this.getRoot().querySelector('[data-predictive-search-live-region-count-value]');
    }
    else{
      count_value = this.closest('.search-parent-js').querySelector('[data-predictive-search-live-region-count-value]');
    }
    if (count_value) this.setLiveRegionText(count_value.textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight = window.innerHeight - this.getBoundingClientRect().bottom - 50;
    return this.resultsMaxHeight;
  }

  /** Opens the search dropdown menu. */
  open() {
    if (this.isDesktop() && PredictiveSearch.panelOwner === this) {
      this.positionPanel();
      this.getPanel().hidden = false;
      document.documentElement.classList.add('sp-open');
    } else if(!this.closest('.search-parent-js')){
      this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    }
    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  /**
   * Closes the search dropdown menu.
   * @param {boolean} [clearSearchTerm=false]
   */
  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
    }
    const selected = this.getRoot().querySelector('[aria-selected="true"]');
    if (PredictiveSearch.panel && PredictiveSearch.panelOwner === this) {
      PredictiveSearch.panel.hidden = true;
      document.documentElement.classList.remove('sp-open');
    }

    if (selected) selected.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('loading');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false
    this.predictiveSearchResults.removeAttribute('style');
  }
}

customElements.define('wk-predictive-search', PredictiveSearch);