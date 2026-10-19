// Header components extracted from the Wokiee theme (assets/global.js), renamed to wk-* to coexist with Dawn
(() => {
/**
 * Returns an array of focusable HTML elements within a given container.
 * @param {HTMLElement} container - Target parent container.
 * @returns {HTMLElement[]}
 */
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}


const trapFocusHandlers = {};

/**
 * Traps keyboard focus within a specified container.
 * @param {HTMLElement} container - Container element to lock focus within.
 * @param {HTMLElement} [elementToFocus=container] - Element to receive initial focus.
 * @returns {void}
 */
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (event.target !== container && event.target !== last && event.target !== first) return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if (
    elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}
try {
  document.querySelector(':focus-visible');
} catch (e) {
  focusVisiblePolyfill();
}

/**
 * Enables polyfill fallback styling for focus-visible behavior.
 * @returns {void}
 */
function focusVisiblePolyfill() {
  const navKeys = [
    'ARROWUP',
    'ARROWDOWN',
    'ARROWLEFT',
    'ARROWRIGHT',
    'TAB',
    'ENTER',
    'SPACE',
    'ESCAPE',
    'HOME',
    'END',
    'PAGEUP',
    'PAGEDOWN',
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener('keydown', (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener('mousedown', (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    'focus',
    () => {
      if (currentFocusedElement) currentFocusedElement.classList.remove('focused');

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add('focused');
    },
    true
  );
}

/**
 * Pauses all active HTML5, YouTube, Vimeo, and model-viewer media playback.
 * @returns {void}
 */
function pauseAllMedia() {
  document.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  document.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  document.querySelectorAll('video').forEach((video) => video.pause());
  document.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

/**
 * Removes active focus trap event listeners and refocuses an element.
 * @param {HTMLElement|null} [elementToFocus=null] - Element to focus after removing trap.
 * @returns {void}
 */
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

/**
 * Handles Escape keyup event to close details elements.
 * @param {KeyboardEvent} event - Keyup keyboard event.
 * @returns {void}
 */
function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== 'ESCAPE') return;

  const openDetailsElement = event.target.closest('details[open]');
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector('summary');
  openDetailsElement.removeAttribute('open');
  summaryElement.setAttribute('aria-expanded', false);
  summaryElement.focus();
}

/**
 * Custom element to manage quantity inputs and validation rules.
 * @extends HTMLElement
 */

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Creates a throttled function to limit call rate.
 * @param {Function} fn - Target function.
 * @param {number} delay - Throttle interval in milliseconds.
 * @returns {Function}
 */
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

/**
 * Generates default fetch configuration options for AJAX requests.
 * @param {string} [type='json'] - Content response format type.
 * @returns {RequestInit}
 */
function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: `application/${type}` },
  };
}

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector('details');

    this.addEventListener('keyup', this.onKeyUp.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll('summary').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll('.popup-modal__toggle').forEach((summary) =>
      summary.addEventListener('click', this.onSummaryClick.bind(this))
    );
    this.querySelectorAll('.popup-modal__toggle__close').forEach((summary) =>
      summary.addEventListener('click', this.closeMenuDrawer.bind(this))
    );
    this.querySelectorAll('button:not(.localization-selector):not(.disclosure-selector):not(.popup-modal__toggle):not(.popup-modal__toggle__close)').forEach((button) =>
      button.addEventListener('click', this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== 'ESCAPE') return;

    const openDetailsElement = event.target.closest('details[open]');
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(event, this.mainDetailsToggle.querySelector('summary'))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {   
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.closest('details');
    const parentMenuElement = detailsElement.closest('.has-submenu');
    const isOpen = detailsElement.hasAttribute('open');
    if (detailsElement === this.mainDetailsToggle) {
      setTimeout(() => {
        if (isOpen) event.preventDefault();
        isOpen ? this.closeMenuDrawer(event, summaryElement) : this.openMenuDrawer(summaryElement);
  
        if (window.matchMedia('(max-width: 1024px)')) {
          document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
        }
      }, 100);
    } else {
      setTimeout(() => {
        detailsElement.classList.add('details-opened');
        setTimeout(() => {
          detailsElement.classList.add('menu-opening');
          summaryElement.setAttribute('aria-expanded', true);
          parentMenuElement && parentMenuElement.classList.add('submenu-open');
        }, 100);
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add('menu-opening');
    });
    summaryElement.setAttribute('aria-expanded', true);
    trapFocus(this.mainDetailsToggle, summaryElement);
  document.body.setAttribute('data-top', window.pageYOffset);
  document.body.style.top = `-${window.pageYOffset}px`;
    document.body.style.paddingRight = window.innerWidth > 1024 ? this.getScrollbarWidth() + 'px' : '';
  document.body.classList.add('overflow-hidden');
  }

  closeMenuDrawer(event, elementToFocus = false) {    
    if (event === undefined) return;
    var scrollPosition = document.body.getAttribute('data-top');
    document.body.style.removeProperty('top');
    document.body.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-top');
    document.body.style.paddingRight = '';
    this.mainDetailsToggle.classList.remove('menu-opening');
    this.mainDetailsToggle.querySelectorAll('details').forEach((details) => {
      setTimeout(() => {
        details.removeAttribute('open');
        details.classList.remove('details-opened');
        details.classList.remove('menu-opening');
      }, 200);
    });
    this.mainDetailsToggle.querySelectorAll('.submenu-open').forEach((submenu) => {
      submenu.classList.remove('submenu-open');
    });
    window.scrollTo({
      top: scrollPosition,
      behavior: "instant"
    });

    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent) elementToFocus?.setAttribute('aria-expanded', false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (this.mainDetailsToggle.hasAttribute('open') && !this.mainDetailsToggle.contains(document.activeElement))
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest('details');
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest('.submenu-open');
    parentMenuElement && parentMenuElement.classList.remove('submenu-open');
    detailsElement.classList.remove('menu-opening');
    detailsElement.querySelector('summary').setAttribute('aria-expanded', false);
    removeTrapFocus(detailsElement.querySelector('summary'));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.classList.remove('details-opened');
        detailsElement.removeAttribute('open');
        if (detailsElement.closest('details[open]')) {
          trapFocus(detailsElement.closest('details[open]'), detailsElement.querySelector('summary'));
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}
customElements.define('wk-menu-drawer', MenuDrawer);

/**
 * Custom web component for managing modal dialog windows.
 * @extends HTMLElement
 */
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('keyup', (event) => {
      if (event.code.toUpperCase() === 'ESCAPE') this.close();
    });
    if (this.classList.contains('media-modal')) {
      this.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse' && !event.target.closest('deferred-media, product-model')) this.close();
      });
    } else {
      this.addEventListener('click', (event) => {
        if (event.target === this) this.close();
      });
    }
  }
  connectedCallback() {
    if (this.moved) return;
    this.moved = true;
    (document.getElementById('wk-scope') || document.body).appendChild(this);
  }

  /**
   * Opens the modal window and manages page scroll lock.
   * @param {HTMLElement} opener - Trigger element.
   * @returns {void}
   */
  show(opener) {
    setTimeout(() => {
      this.classList.add('active');
      this.classList.add('animate');
    });

    if(!this.hasAttribute('data-webscroll')){
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
      document.body.classList.add('overflow-hidden');
    }

    this.openedBy = opener;
    const popup = this.querySelector('.template-popup');
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
    window.pauseAllMedia();
  }

  /**
   * Closes the modal window and restores page layout.
   * @returns {void}
   */
  close() {
    this.classList.remove('animate');
    setTimeout(() => {
      this.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
      document.body.style.paddingRight = '';
    }, 500);
    document.body.dispatchEvent(new CustomEvent('modalClosed'));
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }

  /**
   * Calculates current window scrollbar width.
   * @returns {number}
   */
  getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }
}
customElements.define('wk-modal-dialog', ModalDialog);

/**
 * Menu modal dialog wrapper component.
 * @extends ModalDialog
 */
class MenumodalDialog extends ModalDialog {
  constructor() {
    super();
  }
  connectedCallback() {
  }
}
customElements.define('wk-menumodal-dialog', MenumodalDialog);

/**
 * Trigger element responsible for locating and opening modals.
 * @extends HTMLElement
 */
class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector('button') || this.querySelector('a');

    if (!button) return;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const attr = this.getAttribute('data-modal');
      const modal = document.querySelector(attr);
      if (attr == "#PopupModal-quickview"){
        var href = this.getAttribute('data-handle');
        window.dispatchEvent(new CustomEvent('openQuickView', {detail: {href:href}}));
      }
      if (modal) modal.show(button);
    });
  }
}
customElements.define('wk-modal-opener', ModalOpener);

class GlobalTooltip extends HTMLElement {
  constructor() {
    super();
    if(!this.classList.contains('global__tooltip__static')){
      this.parentNode.addEventListener('mousemove', this.mousemove.bind(this))
    }
  }

  /**
   * Tracks cursor positions to adjust top and left properties.
   * @param {MouseEvent} e - Mouse event parameters.
   */
  mousemove(e){
    this.style.top = (e.offsetY - this.offsetHeight - 10)+'px';
    this.style.left = (e.offsetX - this.offsetWidth / 2)+'px';
  }
}
customElements.define('wk-global-tooltip', GlobalTooltip);

function isTouchDevice(){
  return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

document.querySelectorAll(".enable-scrollbar-js").forEach((item) => {
  item.addEventListener('mouseenter', function(e){
    var item = this.querySelector('.scrollbar-height-js');
    item.style.maxHeight = `${ window.innerHeight - item.getBoundingClientRect().top - 20}px`;
  }, false);
});

/** Custom desktop header element with interactive submenus. */
class headerDesktop extends HTMLElement {
  constructor() {
    super();

    document.querySelectorAll(".enable-scrollbar-megamenu-js").forEach((item) => {
      this.init(item);
      this.events(item);
    });

    var _this = this;
    _this.addEventListener('mousemove', mousemoveHeaderNavHandler, false);
    function mousemoveHeaderNavHandler(){
      _this.removeEventListener('mousemove', mousemoveHeaderNavHandler, false);
      _this.querySelectorAll(`wk-tag-image`).forEach((item) => {
        const img = item.querySelector('img');
        if(img.hasAttribute('data-main')){
          const size = item.getSize();
          if(!size) return;
          img.src = size;
          img.removeAttribute('loading')
        }
      });
    }

    if(this.querySelector('.header-phone-number__desktop__on-click')){
      this.querySelector('.header-phone-number__desktop__container').addEventListener('mouseleave', this.phoneMouseleaveHandler.bind(this), false);
      this.querySelector('.header-phone-number__desktop__on-click').addEventListener('click', this.phoneClickHandler.bind(this), false);
    }
  }

  /**
   * Deactivates phone toggle state on mouse leave.
   * @param {MouseEvent} e - Mouse event.
   */
  phoneMouseleaveHandler(e){
    e.preventDefault();
    e.target.querySelector('.header-phone-number__desktop__on-click').classList.remove('active');
  }

  /**
   * Toggles phone display activation state.
   * @param {MouseEvent} e - Mouse event.
   */
  phoneClickHandler(e){
    e.preventDefault();
    e.target.classList.toggle('active');
  }

  /**
   * Placeholder init method for megamenu elements.
   * @param {HTMLElement} item - Navigation item element.
   */
  init(item){
  }

  /**
   * Binds mouse events to megamenu elements.
   * @param {HTMLElement} item - Navigation item element.
   */
  events(item){
    item.addEventListener('mouseenter', this.mouseenterHandler.bind(this), false);
  }

  /**
   * Handles mouse enter events on megamenu element.
   * @param {MouseEvent} e - Mouse enter event.
   */
  mouseenterHandler(e){
    this.resizeMegamenu(e.currentTarget.nextElementSibling.querySelector('.scrollbar-height-megamenu-js'));
  }

  /**
   * Adjusts maximum height calculation for megamenu dropdown container.
   * @param {HTMLElement} item - Scrollable megamenu container.
   */
  resizeMegamenu(item){
    document.querySelector('.section-header').style.setProperty('--megamenu-bg-height', `${0}px`);
    if(item.closest('.header__section-background__boxed')){
      item.style.maxHeight = `${Math.round(window.innerHeight - item.getBoundingClientRect().top + 24 - (this.classList.contains('admin-select-menu-item')?64:40))}px`;
    }
    else{
      item.style.maxHeight = `${Math.round(window.innerHeight - item.getBoundingClientRect().top + 24 - (this.classList.contains('admin-select-menu-item')?24:0))}px`;
    }
    document.querySelector('.section-header').style.setProperty('--megamenu-bg-height', `${document.documentElement.scrollHeight - item.getBoundingClientRect().top + 23}px`);
  }
}
customElements.define('wk-header-desktop', headerDesktop);

/** Custom element injecting external search modal content. */
class externalSearchContent extends HTMLElement {
  constructor() {
    super();
    
    var html = document.querySelector('.header-modal-search__external-content');
    if(html){
      html.innerHTML = this.innerHTML;
    }
  }
}
customElements.define('wk-external-searchcontent', externalSearchContent);

/** Custom element dynamically constructing Shopify megamenu structure. */
class externalMegamenuContent extends HTMLElement {
  constructor() {
    super();
    this.init();
    Shopify.designMode&&window.addEventListener('reinit_megamenu', this.init.bind(this));
  }

  /** Initializes megamenu node structure and bindings. */
  init(){
    var item2 = document.querySelectorAll('[data-parent-megamenu] [data-megamenu-index]');
    if(item2.length){
      item2.forEach((elem) => {
        elem.remove();
      });
    }
    
    this.querySelectorAll('[data-name]').forEach((item) => {
      var name = item.getAttribute('data-name');
      var megamenu = document.querySelector(`[data-parent-megamenu=${name}]`);
      if(megamenu){
        Array.from(item.children).forEach((elem, index) => {
          if(elem.classList.contains('fake-links')){
            var el = elem.children[0];
            var style = el.hasAttribute('style')?el.getAttribute('style'):"";
            Array.from(megamenu.children)[index].setAttribute('style', style);
          }
          else{
            var elem2 = this.detach(elem);
            elem2.setAttribute('data-megamenu-index', index);
            if(elem2.children.length > 0){
              elem2.children[0].hasAttribute('style')&&elem2.setAttribute('style', elem2.children[0].getAttribute('style'));
            }
            megamenu.appendChild(elem2);
          }
        });
        megamenu.querySelectorAll('.fake-links').forEach((elem) => {
          elem.remove();
        });
        megamenu.querySelectorAll('[data-megamenu-index]').forEach((elem) => {
          var index = Number(elem.getAttribute('data-megamenu-index'));
          this.changeIndexPosition(megamenu, elem, index);
        });
        megamenu.querySelectorAll('[clip-path]').forEach((elem) => {
          var str = this.generateRandomString(10);
          var mainstr = elem.getAttribute('clip-path');
          mainstr = mainstr.replace(')', `${str})`);
          elem.setAttribute('clip-path', mainstr);
          elem.parentNode.querySelector('clipPath').setAttribute('id', mainstr.replace(')', '').replace('url(#', ''));
        });
        Shopify.designMode && document.querySelectorAll('.admin-select-menu-item').forEach((elem) => {
          elem.dispatchEvent(new Event('mouseenter', { bubbles: true }));
        });
      }
    })
  }

  /**
   * Generates a random string of specified length.
   * @param {number} length - Desired string length.
   * @returns {string} Generated random alphanumeric string.
   */
  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Detaches a DOM node, cloning it if inside Shopify design mode.
   * @param {Node} node - Target DOM node.
   * @returns {Node} Detached or cloned node.
   */
  detach(node) {
    if (Shopify.designMode) {
      return node.cloneNode(true);
    }
    else{
      return node.parentElement.removeChild(node);
    }
  }

  /**
   * Moves child node to a specified index within parent container.
   * @param {HTMLElement} parent - Parent container.
   * @param {HTMLElement} child - Target child element.
   * @param {number} targetIndex - Index to insert child into.
   */
  changeIndexPosition(parent, child, targetIndex){
    const children = Array.from(parent.children);
    if (targetIndex >= 0 && targetIndex < children.length) {
      const referenceNode = children[targetIndex];
      parent.insertBefore(child, referenceNode);
    }
  }
}
customElements.define('wk-external-megamenucontent', externalMegamenuContent);

/** Custom element for lazy loading and responsive resizing of images. */
class tagImage extends HTMLElement {
  constructor() {
    super();
    this.image = this.querySelector('img');
    if(!this.image.hasAttribute('data-main')) return;
    this.image_src = this.image.getAttribute('data-main');
    this.lastWidth = 0;
    this.resizeThrottle = null;
    this.init();
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeThrottle);
      this.resizeThrottle = setTimeout(() => this.resize(), 100);
    });
    window.addEventListener('reresizeimage', () => {
      clearTimeout(this.resizeThrottle);
      this.resizeThrottle = setTimeout(() => this.resize(), 100);
    });
    this.image.addEventListener('load', function() {
      this.getAttribute('src').indexOf('data:') == -1 && this.classList.add('image-loaded');
    });
  }

  /** Initializes IntersectionObserver for lazy image loading. */
  init() {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (!img.classList.contains('image-loaded')) {
            requestAnimationFrame(() => {
              const size = this.getSize();
              if (!size) return;
              img.src = size;
            });
          }
          observer.unobserve(img);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
    observer.observe(this.image);
  }

  /** Handles responsive image source updates on window resize. */
  resize() {
    if (!this.image.classList.contains('image-loaded')) return;
    const currentWidth = window.innerWidth;
    if (Math.abs(currentWidth - this.lastWidth) < 50) return;
    this.lastWidth = currentWidth;
    requestAnimationFrame(() => {
      const size = this.getSize();
      if (!size) return;
      this.image.setAttribute('src', size);
    });
  }

  /**
   * Calculates formatted image URL based on container width and DPR.
   * @param {number} [value] - Custom width value.
   * @returns {string|boolean} Formatted image URL string or false if width is 0.
   */
  getSize(value) {
    if (this._cachedSize && !value && this._cachedWidth === window.innerWidth) {
      return this._cachedSize;
    }
    let w;
    if (value) {
      w = value;
    } else {
      w = Math.round(this.offsetWidth || this.getBoundingClientRect().width);
    }
    if (w === 0) return false;
    const isRetina = window.devicePixelRatio >= 1.5;
    if (window.innerWidth > 1024) {
      w = isRetina ? w * 2 : w + 40;
    } else {
      w = isRetina ? w * 2 : w + 40;
    }
    const result = String(this.image_src).replace("width=50", `width=${w}`);
    if (!value) {
      this._cachedWidth = window.innerWidth;
      this._cachedSize = result;
    }
    return result;
  }

  /** Custom element callback clearing cached size properties. */
  attributeChangedCallback() {
    this._cachedSize = null;
    this._cachedWidth = null;
  }
}
customElements.define('wk-tag-image', tagImage);

/** Base class handling media button actions and LocalStorage synchronization. */
class mediaButtonsEvent extends HTMLElement {
  constructor() {
    super();
    this.events();
    this.links_inited = false;
  }

  /**
   * Checks LocalStorage and updates component state.
   * @param {string} key - LocalStorage key name.
   * @param {string} id - Item identifier.
   */
  init(key, id){
    const existingData = localStorage.getItem(key);
    let dataMap = {};
    if (existingData) {
      dataMap = JSON.parse(existingData);
      if(dataMap.hasOwnProperty(id) && !this.classList.contains('delete-item-button')){
        this.classList.add('active');
      }
    }
  }

  /** Registers element event listeners. */
  events(){
    this.addEventListener("click", this.clickEvent.bind(this));
  }

  /**
   * Toggles active class and invokes click handler.
   * @param {Event} e - Click event.
   */
  clickEvent(e){
    if(this.classList.contains('active')){
      this.classList.remove('active')
    }
    else{
      this.classList.add('active')
    }
    this.clickEventHandler(e);
  }

  /**
   * Syncs item state changes with LocalStorage.
   * @param {Event} e - Event object.
   * @param {string} key - LocalStorage key.
   */
  clickEventHandlerMain(e, key){
    const id = this.getAttribute('data-id');
    const productHandle = this.getAttribute('data-product-handle');
    const existingData = localStorage.getItem(key);
    let dataMap = {};
    if (existingData) {
      dataMap = JSON.parse(existingData);
      if(dataMap.hasOwnProperty(id)){
        delete dataMap[id];
        this.deactivateAnotherSameItems(id);
        if(this.classList.contains('delete-item-button')){
          this.deleteItem();
        }
      }
      else{
        dataMap[id] = productHandle;
        this.activateAnotherSameItems(id);
      }
    }
    else{
      dataMap[id] = productHandle;
      this.activateAnotherSameItems(id);
    }
    Object.keys(dataMap).length === 0?localStorage.removeItem(key):localStorage.setItem(key, JSON.stringify(dataMap));
  }

  /**
   * Validates saved items against server and updates item counter UI.
   * @param {string} key - LocalStorage key name.
   */
  initBubble(key){
    const existingData = localStorage.getItem(key);
    if (existingData && this.links_inited == false) {
      const dataMap = JSON.parse(existingData);
      var handles = '';
      for (let key in dataMap) {
        if (dataMap.hasOwnProperty(key)) {
          handles += dataMap[key] + '||';
        }
      }
      fetch(`${window.routes.all_products_collection_url}?view=wi_co_alive_links&sort_by=${handles}`)
      .then((response) => response.text())
      .then((responseText) => {
        if(responseText == ""){
          this.firstElementChild.innerHTML = Object.keys(dataMap).length;
        }
        else{
          const filteredData = Object.fromEntries(
            Object.entries(dataMap).filter(([key, value]) => 
              !responseText.includes(value)
            )
          );
          if(Object.keys(filteredData).length === 0){
            localStorage.removeItem(key);
            this.firstElementChild.innerHTML = this.hasAttribute('class')?'':0;
          }
          else{
            localStorage.setItem(key, JSON.stringify(filteredData));
            this.firstElementChild.innerHTML = Object.keys(filteredData).length;
          }
        }
      });
      this.links_inited = true;
    }
    else if (existingData) {
      const dataMap = JSON.parse(existingData);
      this.firstElementChild.innerHTML = Object.keys(dataMap).length;
    }
    else{
      this.firstElementChild.innerHTML = this.hasAttribute('class')?'':0;
    }
  }
}


/** Custom component displaying total wishlist count badge. */
class wishlistBubble extends mediaButtonsEvent {
  constructor() {
    super();
    this.init();
    window.addEventListener('wishlistUpdated', this.init.bind(this));
  }

  /** Initializes badge count state. */
  init(){
    this.initBubble('productDataWishlist');
  }
}
customElements.define('wk-wishlist-bubble', wishlistBubble);

class compareBubble extends mediaButtonsEvent {
  constructor() {
    super();
    this.init();
    window.addEventListener('compareUpdated', this.init.bind(this));
  }

  /** Initializes compare bubble count. */
  init(){
    this.initBubble('productDataCompare');
  }
}
customElements.define('wk-compare-bubble', compareBubble);

!(!!navigator.platform.match(/iPhone|iPod|iPad/) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)) && document.documentElement.classList.add('apple-device');

/**
 * Dynamically resizes megamenu submenus.
 * @extends HTMLElement
 */
class megamenuSize extends HTMLElement {
  constructor() {
    super();
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  /** Recalculates and sets megamenu widths. */
  resize(){
    var _width = this.querySelector(".vertical-menu__items").offsetWidth,
        _full_width = this.parentNode.offsetWidth;
    this.querySelectorAll('.submenu-design__megamenu').forEach((item) => {
      item.style.width = `${Math.round(_full_width - _width - 5)}px`;
    });
  }
}
customElements.define('wk-megamenu-size', megamenuSize);

/**
 * Manages sticky header behavior on scroll and window resize.
 * @extends HTMLElement
 */
class StickyHeader extends HTMLElement {
  constructor() {
    super();
    this._handleScroll = this._handleScroll.bind(this);
    this._handleResize = this._handleResize.bind(this);
    this._handleIntersection = this._handleIntersection.bind(this);
    this.currentScrollTop = 0;
    this.rafId = null;
    this.isIntersecting = false;
    this.top_bar_height = 0;
    this.headerHeight = 0;
  }

  connectedCallback() {
    this.header = this.parentNode.querySelector('header');
    this.section_header = this.closest('.section-header');
    this.top_bar = this.header.querySelector('.header__top-bar');
    
    this._initObserver();
    this.init();
    this.update();
    
    window.addEventListener('resize', this._handleResize, { passive: true });
    window.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('scroll', this._handleScroll);
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /** Initializes IntersectionObserver for header bounds. */
  _initObserver() {
    this.observer = new IntersectionObserver(this._handleIntersection, {
      rootMargin: '-1px 0px 0px 0px',
      threshold: [0, 1]
    });
    this.observer.observe(this.section_header);
  }

  /** @param {IntersectionObserverEntry[]} entries */
  _handleIntersection(entries) {
    const entry = entries[0];
    this.isIntersecting = entry.isIntersecting;
  }

  /** Throttles scroll execution using requestAnimationFrame. */
  _handleScroll() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.update();
      this.rafId = null;
    });
  }

  /** Throttles resize execution using requestAnimationFrame. */
  _handleResize() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => {
      this.init();
      this.update();
      this.rafId = null;
    });
  }

  /** Computes header dimensions and sets CSS parameters. */
  init() {
    this.classList.add('stickyinit');
    this.classList.remove('stickyinit');
    this.top_bar_height = this.top_bar ? this.top_bar.offsetHeight : 0;

    const _header = this.header.querySelector('.header');
    const sectionName = this.parentNode.querySelector('[data-section-name]')?.getAttribute('data-section-name');
    
    if (sectionName === "header-layout-tiles") {
      this.top_bar_height += _header.offsetHeight;
    }
    
    if (_header.classList.contains('bottom-menu-to')) {
      const headingHeight = _header.querySelector('.header__heading')?.offsetHeight || 0;
      const iconsHeight = _header.querySelector('.header__icons')?.offsetHeight || 0;
      this.top_bar_height += Math.max(headingHeight, iconsHeight) + 10;
    }

    const isDesktop = window.innerWidth > 1024;
    const suffix = isDesktop ? '__desktop' : '__mobile';
    const isEnabled = [...this.classList].some(cls => cls.includes(suffix));
    if (isEnabled) {
      this.headerHeight = this.section_header.offsetHeight;
      if (isDesktop) {
        this.headerHeight -= (this.top_bar_height || 0);
      }
    }

    if(isDesktop){
      isEnabled && this.section_header.style.setProperty("top", `${this.top_bar_height * -1 - 1}px`);
    }
    else{
      this.section_header.style.setProperty("top", `0px`);
    }

    if (this.classList.contains("sticky-header-scroll")) {
      this.section_header.style.setProperty("--top-offset", `${this.section_header.offsetHeight * -1 - 50}px`);
    }

    this.classList.add('sticky-header__inited');
  }

  /** Updates sticky state CSS classes depending on scroll position. */
  update() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const threshold = this.section_header.offsetTop + this.top_bar_height;
    const root = document.documentElement;

    if (this.classList.contains("sticky-header-scroll")) {
      if (threshold <= scrollTop && this.currentScrollTop >= scrollTop) {
        this.classList.add('sticky-active');
        root.style.setProperty('--header-height', `${this.headerHeight}px`);
      } else {
        this.classList.remove('sticky-active');
        root.style.setProperty('--header-height', `0px`);
      }
    } else {
      if (threshold < scrollTop) {
        this.classList.add('sticky-active');
        root.style.setProperty('--header-height', `${this.headerHeight}px`);
      } else {
        this.classList.remove('sticky-active');
        root.style.setProperty('--header-height', `0px`);
      }
    }
    this.classList.toggle('sticky-activated', threshold < scrollTop || this.headerHeight < scrollTop  );

    this.currentScrollTop = scrollTop;
  }
}
if (document.readyState === 'complete') {
  customElements.define('wk-sticky-header', StickyHeader);
}
else{
  window.addEventListener('load', () => {
    customElements.define('wk-sticky-header', StickyHeader);
  });
}

/**
 * Handles unwrapping fixed header containers depending on device conditions.
 * @extends HTMLElement
 */
class fixedHeaderGroup extends HTMLElement {
  constructor() {
    super();

    if(this.querySelector('[data-section-name="header-layout-tiles"]')){
      this.unwrap(this);
      return;
    }
    if(this.querySelector('[data-section-name="header-layout-vertical"]')){
      this.unwrap(this);
      return;
    }

    this.desktop = this.hasAttribute('data-transparent-desktop');
    this.mobile = this.hasAttribute('data-transparent-mobile');
    window.addEventListener('resize', this.resize.bind(this), false);
    this.resize();
  }

  /** Checks viewport size and triggers unwrapping when condition matches. */
  resize(){
    if(window.innerWidth > 1024){
      if(!this.desktop && document.querySelector('wk-fixed-headergroup')){
        this.unwrap(this);
      }
    }
    else{
      if(!this.mobile && document.querySelector('wk-fixed-headergroup')){
        this.unwrap(this);
      }
    }
  }

  /**
   * Unwraps target wrapper by lifting child nodes to parent level.
   * @param {HTMLElement} wrapper
   */
  unwrap(wrapper) {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
  }
}
customElements.define('wk-fixed-headergroup', fixedHeaderGroup);

/**
 * Calculates dynamic threshold for free delivery display bar.
 * @extends HTMLElement
 */
class freeDeliveryBar extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.threshold = this.getAttribute("data-price-max");
    this.threshold = Math.round(this.threshold * (Shopify.currency.rate || 1));
    this.style.setProperty('--max-length', this.threshold);
    var _threshold = Number(getComputedStyle(this).getPropertyValue('--length'));

    if(_threshold >= this.threshold){
      this.querySelector('.free-delivery-bar__toolbar__full').classList.remove('hide')
    }
    else{
      var pr1 = this.getAttribute("data-price-current").replace(',', '.');
      var pr2 = this.getAttribute("data-price-max-real");
      pr2 = Math.round(pr2 * (Shopify.currency.rate || 1));
      var dataSymbol = this.getAttribute("data-symbol");
      var val = Number(pr2 - pr1);
      val = val != Math.round(val) ? val.toFixed(2) : val;
      this.querySelector('.free-delivery-bar__toolbar__text__current .fshbar').innerHTML = dataSymbol.replace(0, val);
      this.querySelector('.free-delivery-bar__toolbar__text__current').classList.remove('hide');
    }
  }
}
if (document.readyState === 'complete') {
  customElements.define('wk-free-delivery-bar', freeDeliveryBar);
}
else{
  window.addEventListener('load', () => {
    customElements.define('wk-free-delivery-bar', freeDeliveryBar);
  });
}

/**
 * Handles promo header banner display with cookie persistence.
 * @extends HTMLElement
 */
class PromoHeader extends HTMLElement {
  constructor() {
    super();
    this.time_next = this.getAttribute('data-next-start');//minutes
    this.space_name = "wk-promo-header";
  }

  connectedCallback() {
    if(this.getCookie(this.space_name) && !Shopify.designMode && this.time_next > 0){
      return false;
    }
    this.parentNode.classList.add('show');
    this.querySelector('.popup-modal__toggle').addEventListener('click', this.closeHandler.bind(this));
  }

  /** @param {Event} e */
  closeHandler(e){
    e.preventDefault();
    this.parentNode.classList.remove('show');
    if(!Shopify.designMode && this.time_next > 0){
      this.setCookie(this.space_name,"close",this.time_next);
    }
  }

  /**
   * Sets browser cookie.
   * @param {string} name
   * @param {string} value
   * @param {number} minutes
   */
  setCookie(name,value,minutes) {
    var expires = "";
    if (minutes) {
      var date = new Date();
      date.setTime(date.getTime() + (minutes*60*1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  }

  /**
   * Retrieves cookie value by name.
   * @param {string} name
   * @returns {Array|boolean}
   */
  getCookie(name){
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) {
        var arr = c.substring(nameEQ.length,c.length);
        return arr.split(' ');
      }
    }
    return false;
  }
  disconnectedCallback() {
  }
}
customElements.define('wk-promo-header', PromoHeader);

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.init();
  }
  init() {
    this.input = this.querySelector('input');
    this.changeEvent = new Event('change', { bubbles: true });
    this.input.addEventListener('change', this.onInputChange.bind(this));
    this.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    var _max = event.target.max;
    this.validateQtyRules();
    this.input.value = Math.max(Math.min(event.target.value, _max), 1);
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    if (event.target.name === 'plus') {
      if (parseInt(this.input.dataset.min) > parseInt(this.input.step) && this.input.value == 0) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);

    if (this.input.dataset.min === previousValue && event.target.name === 'minus') {
      this.input.value = parseInt(this.input.min);
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle('disabled', parseInt(value) <= parseInt(this.input.min));
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle('disabled', value >= max);
    }
  }
}
customElements.define('wk-quantity-input', QuantityInput);

class ComplementaryProducts extends HTMLElement {
  observer = undefined;
  constructor() {
    super();
  }
  connectedCallback() {
    if(this.classList.contains('ignore-js')) return;
    this.initializeRecommendations(this.dataset.productId);
  }
  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
  initializeRecommendations(productId) {
    this.observer?.unobserve(this);
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        observer.unobserve(this);
        this.loadRecommendations(productId);
      },
      { rootMargin: '0px 0px 400px 0px' }
    );
    this.observer.observe(this);
  }
  loadRecommendations(productId) {
    if (!this.isConnected) return;
    fetch(`${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`)
      .then((response) => response.text())
      .then((text) => {
        if (!this.isConnected) return;
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, "text/html");
        var recommendations = doc.querySelector('wk-complementary-products');
        if (recommendations?.innerHTML.trim().length) {
          this.innerHTML = recommendations.innerHTML;
          this.closest('cart-drawer')&&this.closest('cart-drawer').updateRecommendations(this);
        }
        this.closest('cart-notification')&&this.closest('cart-notification').updateRecommendations(this);
      })
      .catch((e) => {
        console.error(e);
      });
  }

}
customElements.define('wk-complementary-products', ComplementaryProducts);

class wokieeSwiper extends HTMLElement {
  constructor() {
    super();
    this.swiper = false;
    this.classList.add('swiper-buttons-initialized');
    this.mouseEnterHandler = this.mouseEnterHandler.bind(this);
    this.setProductImages = this.setProductImages.bind(this);
    this.startHandler = this.start.bind(this);
    this.productCard = this.closest('.product-card');
    if(typeof Swiper === "function"){
      this.start();
    }
    else{
      this.isTouchDevice()||this.productCard === null?window.addEventListener('swiperLoaded', this.startHandler):window.addEventListener('swiperLoaded', this.mouseEnterHandler);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.loadSwiper.bind(this));
    } else {
      this.loadSwiper();
    }
  }

  /**
   * Loads the Swiper library script asynchronously if not present.
   */
  loadSwiper(){
    if(!document.querySelector('.swiperjs')){
      let script = document.createElement('script');
      script.classList.add('swiperjs')
      script.src = this.getAttribute('data-script');
      script.onload = () => {
        window.dispatchEvent(new CustomEvent('swiperLoaded'))
      };
      document.head.append(script);
    }
    else{
      Shopify.designMode&&setTimeout(this.start.bind(this), 100);
    }
  }

  /**
   * Checks if the current device supports touch events.
   * @returns {boolean}
   */
  isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  }

  mouseEnterHandler(){
    window.removeEventListener('swiperLoaded', this.mouseEnterHandler);
    this.productCard.addEventListener("mouseover", this.setProductImages);
  }

  /**
   * Lazy loads secondary images for product slides upon hover.
   */
  setProductImages(){
    var _this = this;
    window.removeEventListener('swiperLoaded', this.startHandler)
    this.productCard&&this.productCard.removeEventListener("mouseover", this.setProductImages);
    this.querySelectorAll(`.swiper-slide:not(:first-child) wk-tag-image`).forEach((item) => {
      const img = item.querySelector('img');
      if(img.hasAttribute('data-main')){
        const size = item.getSize(_this.offsetWidth);
        if(!size) return;
        img.src = size;
        img.removeAttribute('loading');
      }
    });
    this.startHandler();
  }

  /**
   * Reads dataset configuration and initializes slider settings and video handlers.
   */
  start(){
    this.gutter = this.getAttribute('data-gutter');
    this.gutter_mobile = this.getAttribute('data-gutter-mobile');
    this.video_autoplay = this.getAttribute('data-autoplay') == "true" ? true : false;
    this.xl = Number(this.getAttribute('data-grid').split(',')[0]);
    this.sm = Number(this.getAttribute('data-grid').split(',')[1]);
    this.md = Number(this.getAttribute('data-grid').split(',')[2]);
    this.lg = Number(this.getAttribute('data-grid').split(',')[3]);
    this.xxl = Number(this.getAttribute('data-grid').split(',')[4]);

    if(this.classList.contains('swiper-nested')){
      setTimeout(this.init.bind(this), 300)
    }
    else{
      this.init();
    }

    if(!this.video_autoplay || Shopify.designMode) return;

    this.stopslider = false;
    var _this = this;
    this.addEventListener('mouseleave',this.mouseleave.bind(this));
	  this.querySelectorAll("video").forEach((item) => {
      var timeUpdateHandler = (event) => {
        if (event.target.currentTime >= event.target.duration - 0.3 || _this.stopslider && event.target.currentTime <= 0.02) {
          event.target.removeEventListener('timeupdate', timeUpdateHandler);
          _this.goToNextSlide();
        }
        _this.stopslider = true;
      }
      item.addEventListener('play', (event) => {
        _this.swiper.autoplay.stop();
        event.target.addEventListener('timeupdate', timeUpdateHandler);
        _this.stopslider = false;
      });
      
    })
    this.querySelectorAll(".banner__block-media").forEach((item) => {
      item.addEventListener('youtubeOnPlayerStateChange', (event) => {
        if(event.detail.state == 0){
          this.goToNextSlide();
        }
        if(event.detail.state != 1){
          return;
        }
        _this.swiper.autoplay.stop();
        var duration = Math.round((event.detail.getDuration-event.detail.getCurrentTime)*1000);
        clearTimeout(_this.slider);
        _this.slider = setTimeout(_this.goToNextSlide.bind(_this),duration);
        this.stopslider = true;
      });
	  })
  }

  mouseleave(){
    if(this.stopslider){
      this.stopslider = false;
      this.swiper.autoplay.stop();
      this.swiper.autoplay.start();
    }
  }

  /**
   * Navigates to the next slide and resumes autoplay.
   */
  goToNextSlide(){
    this.stopslider = false;
    this.swiper.autoplay.start();
    this.swiper.slideNext();
  }

  /**
   * Navigates to a specific slide by index.
   * @param {number} index
   * @param {number} [delay=0]
   */
  selectSlide(index, delay){
    delay = delay || 0;
    this.swiper.slideTo(index, delay);
  }

  resizeHandler(){
    setTimeout(this.initPaginationCss.bind(this), 100)
  }

  /**
   * Updates CSS custom properties for pagination styling based on viewport width.
   */
  initPaginationCss(){
    if(!this.querySelector('.swiper-pagination')) return;
    var length = this.querySelector('.swiper-pagination').children.length;
    this.style.setProperty('--pagination-count', length);
    var bullets = this.querySelectorAll('.swiper-pagination-bullet');
    const isMobile = window.innerWidth <= 576;
    if(bullets.length > 28 && isMobile){
      this.style.cssText = `
        --swiper-pagination-bullet-size: 4px;
        --swiper-pagination-bullet-width: 4px;
        --swiper-pagination-bullet-height: 4px;
        --swiper-pagination-bullet-horizontal-gap: 2px;
        --pagination-item-width: 8px;
      `;
    }
    else if(!isMobile){
      this.style.cssText = `
        --swiper-pagination-bullet-size: 8px;
        --swiper-pagination-bullet-width: 8px;
        --swiper-pagination-bullet-height: 8px;
        --swiper-pagination-bullet-horizontal-gap: 4px;
        --pagination-item-width: 16px;
      `;
    }
  }

  init(){
    var autoplay = this.video_autoplay;
    if(autoplay){
      autoplay= {
        delay:Number(this.getAttribute('data-autoplay-delay')),
        pauseOnMouseEnter:true,
        disableOnInteraction:false
      }
    }
    else{
      autoplay = false;
    }

    this.configureSwiper();
    this.swiper.on('afterInit', this.afterInit.bind(this));
    this.swiper.on('slidesLengthChange', this.slideUpdate.bind(this));
    this.swiper.init();
    this.initSwiper();

    this.scroll_down = true;
    autoplay && document.addEventListener('scroll', this.documentScrollHandler.bind(this));
  }

  initSwiper(){
    typeof Swiper === "function"&&this.swiper.init();
  }

  /**
   * Configures Swiper options and creates a new Swiper instance.
   */
  configureSwiper(){
    try {
      var autoplay = this.video_autoplay;
      if(autoplay){
        autoplay= {
          delay:Number(this.getAttribute('data-autoplay-delay')),
          pauseOnMouseEnter:true,
          disableOnInteraction:false
        }
      }
      else{
        autoplay = false;
      }
      var effect = this.hasAttribute('data-effect') ? this.getAttribute('data-effect') : 'slide',
          autoheight = this.hasAttribute('data-autoheight') ? true : false,
          allowtouchmove = this.hasAttribute('data-allowtouchmove') ? false : true,
          nested = this.classList.contains('swiper-nested'),
          loop = this.classList.contains('swiper-loop')?true:nested,
          speed = this.hasAttribute('data-speed') ? this.getAttribute('data-speed') : 300;
      this.swiper = new Swiper(this, {
        init: false,
        slidesPerView: this.xl,
        autoplay: autoplay,
        rewind: true,
        effect: effect,
        autoHeight: autoheight,
        allowTouchMove: allowtouchmove,
        simulateTouch:true,
        slidesPerGroupAuto:this.xl,
        slidesPerGroup:this.xl,
        spaceBetween: this.gutter_mobile,
        nested:nested,
        loop:loop,
        speed:speed,
        breakpoints: {
          577: {
            slidesPerView: this.sm,
            slidesPerGroupAuto:this.sm,
            slidesPerGroup:this.sm,
            spaceBetween: this.gutter
          },
          1025: {
            slidesPerView: this.md,
            slidesPerGroupAuto:this.md,
            slidesPerGroup:this.md,
            spaceBetween: this.gutter
          },
          1361: {
            slidesPerView: this.lg,
            slidesPerGroupAuto:this.lg,
            slidesPerGroup:this.lg,
            spaceBetween: this.gutter
          },
          1441: {
            slidesPerView: this.xxl,
            slidesPerGroupAuto:this.xxl,
            slidesPerGroup:this.xxl,
            spaceBetween: this.gutter
          }
        },
        pagination: {
          el: this.nextElementSibling&&this.nextElementSibling.querySelector('.swiper-pagination')||this.querySelector('.swiper-pagination'),
          clickable: true
        },
        navigation: {
          nextEl: this.nextElementSibling&&this.nextElementSibling.querySelector('[class*="-swiper-button-next"')||this.querySelector('.internal-swiper-button-next')||this.querySelector('.internal-swiper-custom-button-next'),
          prevEl: this.nextElementSibling&&this.nextElementSibling.querySelector('[class*="-swiper-button-prev"')||this.querySelector('.internal-swiper-button-prev')||this.querySelector('.internal-swiper-custom-button-prev')
        }
      });
      this.swiper.on('slideChange', this.slideChange.bind(this));
      this.swiper.on('slideChangeTransitionStart', this.slideChangeTransitionStart.bind(this));
      this.swiper.on('slideChangeTransitionEnd', this.slideChangeTransitionEnd.bind(this));
    } 
    catch(err) {

    }
  }

  /**
   * Pauses autoplay when the slider scrolls out of the viewport.
   */
  documentScrollHandler(e){
    var window_y = window.scrollY,
        offset_top = this.parentNode.offsetTop,
        object_bottom_position = this.offsetHeight + offset_top;

    if(window_y > object_bottom_position - 100){
      this.swiper.autoplay.stop(); 
      this.scroll_down = false;
    }
    else{
      !this.scroll_down && this.swiper.autoplay.start();
      this.scroll_down = true;
    }
  }

  afterInit(){
    var _this = this;
    setTimeout(function(){
      _this.classList.add('swiper-initialized-custom');
    }, 100)
    
    this.dispatchEvent(new CustomEvent('slide_inited'));
    if(this.querySelector('.swiper-pagination')){
      window.addEventListener('resize', this.resizeHandler.bind(this));
      this.initPaginationCss();
    }
  }

  /**
   * Destroys the current Swiper instance.
   */
  destroy(){
    this.swiper&&this.swiper.destroy();
  }

  /**
   * Handles media playback state on slide transition.
   * @param {Object} e - Swiper event object.
   */
  slideChange(e){
    clearTimeout(this.slider);
    this.querySelectorAll('video-js').forEach(item => {
      var index = Number(Array.prototype.indexOf.call(item.closest('.swiper-wrapper').children, item.closest('.swiper-slide')));
      e.activeIndex == index?item.dispatchEvent(new CustomEvent('playVideo')):item.dispatchEvent(new CustomEvent('stopVideo'));
    });
    this.querySelectorAll('video-youtube-js').forEach(item => {
      var index = Number(Array.prototype.indexOf.call(item.closest('.swiper-wrapper').children, item.closest('.swiper-slide')));
      e.activeIndex == index?item.dispatchEvent(new CustomEvent('playVideo')):item.dispatchEvent(new CustomEvent('stopVideo'));
      e.activeIndex == index?item.dispatchEvent(new CustomEvent('playVideo')):false;
    });
    this.querySelectorAll('deferred-media').forEach(item => {
      item.dispatchEvent(new CustomEvent('stopVideo'));
    });
    this.dispatchEvent(new CustomEvent('slide_changed_custom'));
  }

  slideChangeTransitionStart(){
  }
  slideChangeTransitionEnd(){
  } 
  slideUpdate(){
    setTimeout(this.initPaginationCss.bind(this), 100)
  }

  /**
   * Gets active slide index.
   * @returns {number}
   */
  getActiveSlide(){
    return this.swiper.activeIndex;
  }
}
if (document.readyState === 'complete') {
  customElements.define('wk-swiper-slider', wokieeSwiper);
}
else{
  window.addEventListener('load', () => {
    customElements.define('wk-swiper-slider', wokieeSwiper);
  });
}

class cardVariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('change', this.onVariantChange);
  }

  /**
   * Main handler executed when a variant selector state changes.
   */
  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantStatuses();
    this.removeErrorMessage();
    
    if (!this.currentVariant) {
      this.setUnavailable();
    } else {
      this.renderProductInfo();
    }
  }

  removeErrorMessage() {
    var _product = this.closest('.product-card, .product-card-small'),
        productForm = _product.querySelector('product-form');
    if (productForm) productForm.handleErrorMessage();
  }

  /**
   * Fetches variant specific card markup and updates prices, badges, images, and buttons.
   */
  renderProductInfo() {
    const requestedVariantId = this.currentVariant.id;
    const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
    fetch(
      `${this.dataset.url}?variant=${requestedVariantId}&view=card-ajax`
    )
    .then((response) => response.text())
    .then((responseText) => {
      const html = new DOMParser().parseFromString(responseText, 'text/html');
      this.setHtmlInfo('price', html);

      var main_product = this.closest('.product-card, .product-card-small'),
          qtv = main_product.querySelector(`#Quantity-${this.getAttribute('data-product')}`);
      if(qtv){
        qtv.value = 1;
        qtv.setAttribute('max', html.getElementById(`max`).getAttribute('max'));
      }

      var card_form = main_product.querySelector(`#form-${this.getAttribute('data-product')}`);
      if(card_form){
        var button = card_form.querySelector('.quick-add__submit');
        var content = html.querySelector(`.${button.getAttribute('data-type')}`).innerHTML;
        button.querySelector('.btn__top-text').innerHTML = content;
        button.querySelector('.btn__bottom-text').innerHTML = content;
        if(html.getElementById(`button`).hasAttribute('disabled')){
          button.setAttribute('disabled', 'disabled');
          button.setAttribute('aria-disabled', true);
        }
        else{
          button.removeAttribute('disabled');
          button.removeAttribute('aria-disabled');
        }
      }

      var bd_co = main_product.querySelector('.badges__container');
      if(bd_co){
        if(html.querySelector(`.badges-item__sale`)){
          if(!bd_co.classList.contains('hide__badges-item__sale') && !bd_co.querySelector('.badges-item__sale')){
            bd_co.prepend(html.querySelector(`.badges-item__sale`));
          };
          bd_co.querySelector('.badges-item__sale')&&bd_co.querySelector('.badges-item__sale').classList.remove('hide');
          if(bd_co.querySelector('.badges-item__sale__counter')){
            bd_co.querySelector('.badges-item__sale__counter').innerHTML = html.querySelector('.badges-item__sale__counter').innerHTML;
          }
        }
        else{
          bd_co.querySelector('.badges-item__sale')&&bd_co.querySelector('.badges-item__sale').classList.add('hide');
        }
      }

      if(main_product.querySelectorAll('wk-compare-button').length){
        main_product.querySelectorAll('wk-compare-button').forEach((item) => {
          item.classList.remove('hide');
          item.setAttribute('data-id', requestedVariantId);
        });
        window.dispatchEvent(new CustomEvent('compareIdChanged'));
      }
      
      if(html.querySelector('#image')){
        if(main_product.querySelector('.swiper')){
          var src = main_product.querySelector(`.swiper .swiper-slide [data-main*="${html.querySelector('#image img').getAttribute('data-src')}"]`),
              ind = src.closest('[data-swiper-slide-index]').getAttribute('data-swiper-slide-index'),
              delay = 0;
          main_product.querySelector('.swiper').selectSlide(ind, delay);
        }
        else{
          if(main_product.querySelector('.product-card__image-secondary')){
            main_product.querySelector('.product-card__image-secondary').parentNode.innerHTML = html.querySelector('#image').innerHTML;
          }
          else{
            main_product.querySelector('.product-card__image-main img').setAttribute('src', html.querySelector('#image img').getAttribute('src'));
          }
          
          var aspect_ratio = html.querySelector('#image img').getAttribute('data-ratio');
          main_product.querySelector('.product-card__image-main').parentNode.style.setProperty('--aspect-ratio', aspect_ratio);
        }
      }

      if(main_product.querySelector('input[name="id"]'))main_product.querySelector('input[name="id"]').value = html.querySelector('input[name="id"]').value;

      requestedVariantId
    });
  }

  /**
   * Updates availability state/classes for input options based on selected variants.
   */
  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(':checked').value === variant.option1
    );
    const inputWrappers = this.querySelectorAll('.product-form__input');

    inputWrappers.forEach((option, index) => {
      if (index === 0) return;
      const optionInputs = [...option.querySelectorAll('input[type="radio"], option')];
      const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
      const availableOptionInputsValue = selectedOptionOneVariants
        .filter((variant) => variant.available && variant[`option${index}`] === previousOptionSelected)
        .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(optionInputs, availableOptionInputsValue);
    });
  }

  setInputAvailability(listOfOptions, listOfAvailableOptions) {
    listOfOptions.forEach((input) => {
      if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
        input.classList.remove('disabled');
      } else {
        input.classList.add('disabled');
      }

      if(input.hasAttribute('data-option-text')){
        var t = input.getAttribute('data-option-text');
        if (listOfAvailableOptions.includes(input.getAttribute('value'))) {
          if (input.text.includes(t)) {
            input.text = input.text.replace(` ${t}`, '');
          }
        } else {
          if (!input.text.includes(t)) {
            input.text += ` ${t}`;
          }
        }
      }
    });
  }

  setHtmlInfo(val,html){
    var main_product = this.closest('.product-card, .product-card-small'),
        item = main_product.querySelector(`#${val}-${this.getAttribute('data-product')}`);
    if(!item) return;
    item.classList.remove('hide');
    const item_source = html.getElementById(`${val}`);
    if (item){
      item.classList.remove('hidden');
      if (item_source) item.innerHTML = item_source.innerHTML;
    }
  }

  /**
   * Reads currently selected options from select elements or radio button fieldsets.
   */
  updateOptions() {
    if(this.querySelector('select')){
      this.querySelectorAll('.option-empty').forEach((item) => {
        var _p = item.parentNode;
        item.remove();
      });
      this.options = Array.from(this.querySelectorAll('select'), (select) => select.value);
    }
    else{
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));

      this.querySelectorAll('fieldset').forEach((item) => {
        if(!item.querySelector('input:checked')){
          item.querySelector('input:first-child').checked = true;
        }
      });
      
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
  }

  /**
   * Matches currently selected options against variant data to find active variant ID.
   * @returns {boolean|undefined}
   */
  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
    if(this.currentVariant.available || !this.classList.contains('hide_soldout_variants')) return true;

    if(this.options[2] != ""){
      this.currentVariant = this.getVariantData().find(item => 
        item['option1'] === this.options[0] && item['option2'] === this.options[1] && item.available === true
      );
      if (typeof this.currentVariant === 'undefined') {
        this.currentVariant = this.getVariantData().find(item => 
          item['option1'] === this.options[0] && item.available === true
        );
      }
    }
    else{
      this.currentVariant = this.getVariantData().find(item => 
        item['option1'] === this.options[0] && item.available === true
      );
    }
    this.querySelectorAll('fieldset').forEach((item, index) => {
      var i = index + 1,
          val = this.currentVariant[`option${i}`];
      item.querySelector(`input[value="${val}"]`).checked = true;
    });
    this.querySelectorAll('select').forEach((item, index) => {
      var i = index + 1;
      item.value = this.currentVariant[`option${i}`];
    });
  }

  /**
   * Retrieves and parses variant JSON data from script tag.
   * @returns {Array<Object>}
   */
  getVariantData() {
    this.variantData = this.variantData || JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  /**
   * Disables product controls when selected variant is unavailable.
   */
  setUnavailable(){
    var main_product = this.closest('.product-card, .product-card-small'),
        card_form = main_product.querySelector(`#form-${this.getAttribute('data-product')}`);
    if(card_form){
      var button = card_form.querySelector('.quick-add__submit');
      button.setAttribute('disabled', 'disabled');
      button.setAttribute('aria-disabled', true);
      if(!card_form.querySelector('wk-quantity-input')){
        button.querySelector('.btn__top-text').innerHTML = window.variantStrings.unavailable;
        button.querySelector('.btn__bottom-text').innerHTML = window.variantStrings.unavailable;
      }
    }

    var price = main_product.querySelector(`#price-${this.getAttribute('data-product')}`);
    price&&price.classList.add('hide');

    main_product.querySelector('.badges-item__sale')&&_product.querySelector('.badges-item__sale').classList.add('hide');
    main_product.querySelectorAll('wk-compare-button').forEach((item) => {
      item.classList.add('hide');
    });
  }
}
customElements.define('wk-card-variant-selects', cardVariantSelects);

class ToggleAnimation extends HTMLElement {
  constructor() {
    super();
    if (this.classList.contains('admin-panel--no-js')) return;
    this.ACCORDION_CLASS = 'chm-toggle--accordion';
    this.TOGGLE_CLASS = 'chm-toggle';
    this.CONTENT_CLASS = 'chm-toggle__content';
    this.observer = null;
    this.init();
  }

  /**
   * Binds event handlers and initializes state observers.
   */
  init() {
    this.clickEventHandler = this.clickEventHandler.bind(this);
    this.resizeHandler = this.resizeHandler.bind(this);
    this.handleMutations = this.handleMutations.bind(this);
    this.setupObserver();
    this.updateToggles();
    setTimeout(this.resizeHandler, 500);
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Configures DOM observer to detect structure changes.
   */
  setupObserver() {
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Handles observed DOM mutations.
   * @param {MutationRecord[]} mutationsList - Array of mutations.
   */
  handleMutations(mutationsList) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        this.updateToggles();
      }
    }
  }

  /**
   * Re-evaluates target summary toggles.
   */
  updateToggles() {
    if (this.boxes) {
      this.boxes.forEach(box => {
        box.removeEventListener('click', this.clickEventHandler);
      });
    }
    this.boxes = this.querySelectorAll('summary');
    if (this.boxes.length) {
      this.bindEvents();
    }
  }

  /**
   * Binds click listeners to summary elements.
   */
  bindEvents() {
    this.boxes.forEach(box => {
      box.addEventListener('click', this.clickEventHandler);
    });
  }

  /**
   * Handles toggle click interactions.
   * @param {MouseEvent} event - Click event object.
   */
  clickEventHandler(event) {
    event.preventDefault();
    const details = event.target.closest(`.${this.TOGGLE_CLASS}`);
    if (!details) return;

    if (details.hasAttribute('open')) {
      this.closeToggle(details);
    } else {
      this.openToggle(details);
    }

    if (this.classList.contains(this.ACCORDION_CLASS)) {
      this.closeOtherToggles(details);
    }
  }

  /**
   * Opens target toggle.
   * @param {HTMLElement} details - Toggle element.
   */
  openToggle(details) {
    details.setAttribute('open', '');
    setTimeout(() => {
      this.resizeHandler();
      details.classList.add('toggle-opening');
      setTimeout(() => details.classList.add('toggle-opening-auto'), 400);
    }, 0);
  }

  /**
   * Closes target toggle.
   * @param {HTMLElement} details - Toggle element.
   */
  closeToggle(details) {
    const transitionTime = this.getTransitionTime(details);
    details.classList.remove('toggle-opening', 'toggle-opening-auto');
    setTimeout(() => details.removeAttribute('open'), transitionTime);
  }

  /**
   * Closes open sibling toggles in accordion mode.
   * @param {HTMLElement} currentToggle - Currently active toggle.
   */
  closeOtherToggles(currentToggle) {
    const openToggles = this.querySelectorAll('[open]');
    openToggles.forEach(toggle => {
      if (toggle !== currentToggle) {
        setTimeout(() => this.closeToggle(toggle), 10);
      }
    });
  }

  /**
   * Recalculates height dimensions and CSS variable properties.
   */
  resizeHandler() {
    const openContent = this.querySelectorAll('[open] .chm-toggle__content');
    openContent.forEach(content => {
      const toggle = content.closest('.chm-toggle');
      if (!toggle) return;
      toggle.classList.remove('toggle-opening-auto');
      toggle.style.setProperty('--duration-inline', `${this.getSpeed()}ms`);
      toggle.setAttribute('data-speed', this.getSpeed());
      content.style.setProperty('--scroll-height', `${content.scrollHeight + 1}px`);
      setTimeout(() => toggle.classList.add('toggle-opening-auto'), 400);
    });
  }

  /**
   * Gets animation duration for target element.
   * @param {HTMLElement} element - Target container element.
   * @returns {number} Speed value in ms.
   */
  getTransitionTime(element) {
    return element.hasAttribute('data-speed') ? Number(element.getAttribute('data-speed')) + 100 : 400;
  }

  /**
   * Returns base duration rate.
   * @returns {number} Default duration in ms.
   */
  getSpeed() {
    return 300;
  }

  /**
   * Cleans up observers and listeners when unmounted.
   */
  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('resize', this.resizeHandler);
    
    if (this.boxes) {
      this.boxes.forEach(box => {
        box.removeEventListener('click', this.clickEventHandler);
      });
    }
  }
}
customElements.define('wk-toggle-component', ToggleAnimation);

class termsCheckboxHandler extends HTMLElement {
  constructor() {
    super();
    this.querySelector('input').addEventListener("change", this.changeHandler.bind(this), false);
  }

  /**
   * Toggles checked class based on input state.
   * @param {Event} event - Input change event.
   */
  changeHandler(event){
    event.target.checked ? this.classList.add('checked') : this.classList.remove('checked');
  }
}
customElements.define('wk-terms-and-condition-checkbox', termsCheckboxHandler);

class wishlistButton extends mediaButtonsEvent {
  constructor() {
    super();
    this.init('productDataWishlist', this.getAttribute('data-id'));
  }

  /**
   * Handles wishlist toggle click events.
   * @param {Event} e - Click event.
   */
  clickEventHandler(e){
    this.clickEventHandlerMain(e, 'productDataWishlist');
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new CustomEvent('wishlistUpdated', {detail: {target: e.currentTarget}}));
  }

  /**
   * Activates other wishlist buttons matching the same ID.
   * @param {string} id - Product ID.
   */
  activateAnotherSameItems(id){
    document.querySelectorAll(`wk-wishlist-button[data-id="${id}"]`).forEach((item) => {
      item.classList.add('active');
    });
  }

  /**
   * Deactivates other wishlist buttons matching the same ID.
   * @param {string} id - Product ID.
   */
  deactivateAnotherSameItems(id){
    document.querySelectorAll(`wk-wishlist-button[data-id="${id}"]`).forEach((item) => {
      item.classList.remove('active');
    });
  }

  /** Removes item card element from the DOM with animation. */
  deleteItem(){
    var item = this.closest('.product-card');
    item.classList.add('delete-item');
    setTimeout(function(){item.remove()}, 300);
  }
}
customElements.define('wk-wishlist-button', wishlistButton);

class compareButton extends mediaButtonsEvent {
  constructor() {
    super();
    this.parent = this.closest('.wokiee-compare');
    this.init('productDataCompare', this.getAttribute('data-id'));
    window.addEventListener('compareIdChanged', this.compareIdChanged.bind(this));
  }

  /**
   * Handles click events for comparing products.
   * @param {Event} e
   */
  clickEventHandler(e){
    this.clickEventHandlerMain(e, 'productDataCompare');
    window.dispatchEvent(new CustomEvent('compareUpdated', {detail: {target: e.currentTarget}}));
  }

  /**
   * Activates matching compare items by ID.
   * @param {string} id
   */
  activateAnotherSameItems(id){
    document.querySelectorAll(`wk-compare-button[data-id="${id}"]`).forEach((item) => {
      item.classList.add('active');
    });
  }

  /**
   * Deactivates matching compare items by ID.
   * @param {string} id
   */
  deactivateAnotherSameItems(id){
    document.querySelectorAll(`wk-compare-button[data-id="${id}"]`).forEach((item) => {
      item.classList.remove('active');
    });
  }

  /** Resets button state on compare ID change. */
  compareIdChanged(){
    this.classList.remove('active');
    this.init('productDataCompare', this.getAttribute('data-id'));
  }

  /** Removes an item from the comparison list. */
  deleteItem(){
    var item_value = this.closest('[data-item]').getAttribute('data-item');
    this.parent.querySelectorAll(`[data-item="${item_value}"]`).forEach((item) => {
      item.classList.add('delete-item');
    });
    var _this = this;
    setTimeout(function(){
      _this.parent.querySelectorAll(`[data-item="${item_value}"]`).forEach((item) => {
        item.remove()
      });
      _this.parent.querySelector('.wokiee-compare__count__number').innerHTML = _this.parent.querySelectorAll('.wokiee-compare__container')[0].children.length;
      window.dispatchEvent(new CustomEvent('compareItemDeleted'));
    }, 300);
  }
}
customElements.define('wk-compare-button', compareButton);

/**
 * Button component to remove a specific line item from the cart.
 * @extends HTMLElement
 */
class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('wk-cart-items') || this.closest('wk-cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('wk-cart-remove-button', CartRemoveButton);

/**
 * Component for managing cart items, quantity changes, and dynamic updates.
 * @extends HTMLElement
 */
class CartItems extends HTMLElement {
  constructor() {
    super();
    this.cart_icon = document.querySelector('#wk-cart-icon-bubble-short')?'wk-cart-icon-bubble-short':'wk-cart-icon-bubble';
    this.cart_icon_mobile = document.querySelector('#wk-cart-icon-bubble--mobile-short')?'wk-cart-icon-bubble--mobile-short':'wk-cart-icon-bubble--mobile';
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'wk-cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  /**
   * Validates quantity input and triggers item update.
   * @param {Event} event
   */
  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    event.target.setCustomValidity('');
    event.target.reportValidity();
    this.updateQuantity(
      index,
      inputValue,
      document.activeElement.getAttribute('name'),
      event.target.dataset.quantityVariantId
    );
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  /** Fetches updated cart sections when an external cart change occurs. */
  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      /*fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['wk-cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });*/
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('wk-cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  /** @returns {Array<{id: string, section: string, selector: string}>} Configuration of sections to re-render. */
  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: this.cart_icon,
        section: this.cart_icon,
        selector: '.shopify-section',
      },
      {
        id: this.cart_icon_mobile,
        section: this.cart_icon_mobile,
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents'
      },
    ];
  }

  /**
   * Updates line item quantity via API request and re-renders cart components.
   * @param {number|string} line - Line item index.
   * @param {number} quantity - New target quantity.
   * @param {string} [name] - Target input name for focus recovery.
   * @param {string} [variantId] - Variant ID.
   */
  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        const quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');
        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');
        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);
        this.getSectionsToRender().forEach((section) => {
          const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          const new_html = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
          const new_obj = new DOMParser().parseFromString(parsedState.sections[section.section], 'text/html').querySelector(section.selector);
          if(new_obj.matches('wk-drawer-inner')){
            var cart_drawer = elementToReplace.closest('cart-drawer');
            elementToReplace.innerHTML = new_obj.innerHTML;
            const isEmpty = new_obj.querySelector('.drawer__inner-empty');
            if (isEmpty) {
              cart_drawer.clearAdditionalProducts();
            }else{
              cart_drawer.setUpdRecom();
            }
          }
          else{
            elementToReplace.innerHTML = new_html;
          }
          if(section.id == this.cart_icon && document.querySelector('.footer-sticky-nav__item__icon .cart-count-bubble')){
            const parser = new DOMParser();
            const bubble = parser.parseFromString(this.getSectionInnerHTML(parsedState.sections[section.id], section.selector), 'text/html');
            var ib = bubble.querySelector('.cart-count-bubble')?bubble.querySelector('.cart-count-bubble').innerHTML : '' ;
            document.querySelector('.footer-sticky-nav__item__icon .cart-count-bubble').innerHTML = ib;
          }
        });
        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);
        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'wk-cart-items', cartData: parsedState, variantId: variantId });

        var freedelivery = parsedState.sections[Object.keys(parsedState.sections)[0]];
        if(document.getElementById('cart-page-free-delivery')){
          freedelivery = freedelivery.split('<div id="cart-page-free-delivery" class="wk-free-delivery-bar">').pop();
          freedelivery = freedelivery.split('<div class="free-delivery-bar__end hide"></div>').shift();
          if(document.getElementById('cart-page-free-delivery')) document.getElementById('cart-page-free-delivery').innerHTML = freedelivery;
          if(document.getElementById('product-page-free-delivery')) document.getElementById('product-page-free-delivery').innerHTML = freedelivery;
        }
      })
      .catch(() => {
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading-overlay`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading-overlay`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));
  }
}

customElements.define('wk-cart-items', CartItems);

if (!customElements.get('wk-cart-note')) {
  /**
   * Cart note component handling debounced note updates via API.
   * @extends HTMLElement
   */
  customElements.define(
    'wk-cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

/**
 * Interactive cart drawer component managing visibility, accessibility, and content rendering.
 * @extends HTMLElement
 */
class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.cart_icon = document.querySelector('#wk-cart-icon-bubble-short')?'wk-cart-icon-bubble-short':'wk-cart-icon-bubble';
    this.cart_icon_mobile = document.querySelector('#wk-cart-icon-bubble--mobile-short')?'wk-cart-icon-bubble--mobile-short':'wk-cart-icon-bubble--mobile';
    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.setHeaderCartIconAccessibility();
    this.updRecom = true;
    this.opened = false;
  }
  setUpdRecom(){
    this.updRecom = true;
  }
  
  /** Sets accessibility attributes and click/keydown listeners for cart header icons. */
  setHeaderCartIconAccessibility() {
    document.querySelectorAll(`[id*="wk-cart-icon-bubble"]`).forEach((cartLink) => {
      cartLink.setAttribute('role', 'button');
      cartLink.setAttribute('aria-haspopup', 'dialog');
      cartLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.open(cartLink);
      });
      cartLink.addEventListener('keydown', (event) => {
        if (event.code.toUpperCase() === 'SPACE') {
          event.preventDefault();
          this.open(cartLink);
        }
      });
    })
  }

  /**
   * Opens the cart drawer and traps focus inside it.
   * @param {HTMLElement} [triggeredBy] - Element that triggered opening.
   */
  open(triggeredBy) {
    this.opened = true;
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    setTimeout(() => {
      this.classList.add('active');
      this.classList.add('animate');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    if(document.querySelectorAll('.popup-modal.active').length == 0){
      document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
      document.body.classList.add('overflow-hidden');
    }

    this.openComplementary(1500);
  }
  openComplementary(delay){
    delay = delay || 500;
    const desk = this.querySelector('.dcomp__desk-js');
    const currentWidth = window.innerWidth;
    if (!desk || currentWidth <= 576) {
        return false;
    }
    this.animateTimeout&&clearTimeout(this.animateTimeout);
    this.animateTimeout = setTimeout(() => {
      const compProducts = desk.querySelector('wk-complementary-products');
      if (compProducts && compProducts.children.length > 0) {
        desk.classList.add('animate');
      }
      this.animateTimeout = null;
    }, delay);
  }
  clearAdditionalProducts(){
    const deskJs = this.querySelector('.dcomp__desk-js');
    const container = deskJs?.querySelector('.drawer__footer-content__left__content');
    if (container) {
      deskJs.classList.remove('animate');
      setTimeout(() => {container.replaceChildren();}, 500);
    }
  }

  /**
   * Updates complementary product recommendations inside the drawer layout.
   * @param {HTMLElement} complementaryProducts
   */
  updateRecommendations(complementaryProducts){
    const desk = this.querySelector('.dcomp__desk-js');
    const currentWidth = window.innerWidth;
    if (!desk) {
      return false;
    }
    if (currentWidth <= 576) {
      complementaryProducts.closest('.dcomp__mobile').classList.remove('hide');
      return false;
    }
    const productId = complementaryProducts.getAttribute('data-product-id');
    const container = this.querySelector(`.dcomp__desk .drawer__footer-content__left__content`);
    if(this.updRecom == true){
      container.innerHTML = "";
      this.updRecom = false;
    }
    if (container) {
      if (complementaryProducts.children.length > 0) {
        const oldparent = complementaryProducts.closest('.drawer__footer-content__left');
        const parentIndex = Array.from(oldparent.parentNode.children).indexOf(oldparent);
        const duplicate = complementaryProducts.closest('.drawer__footer-content__left__content').cloneNode(true);
        duplicate.querySelector('wk-complementary-products').classList.add('ignore-js');
        const wrapper = document.createElement('div');
        wrapper.className = 'drawer__footer-content__left__item';
        wrapper.setAttribute('data-dcomp', `dcomp-${productId}`); 
        wrapper.setAttribute('data-index', `${parentIndex}`);
        wrapper.append(...duplicate.children);
        const existingItems = Array.from(container.children);
        const referenceNode = existingItems.find(item => {
          return parseInt(item.getAttribute('data-index')) > parentIndex;
        });
        if (referenceNode) {
          container.insertBefore(wrapper, referenceNode);
        } else {
          container.append(wrapper);
        }
        this.opened && this.openComplementary();
      }
    }
  }

  /** Closes the cart drawer and restores scrolling focus. */
  close() {
    this.classList.remove('animate');
    setTimeout(() => {
      this.classList.remove('active');
      if(document.querySelectorAll('.popup-modal.active').length == 0){
        document.body.classList.remove('overflow-hidden');
        document.body.style.paddingRight = '';
      }
    }, 500);
    removeTrapFocus(this.activeElement);
    this.querySelector('.dcomp__desk-js')&&this.querySelector('.dcomp__desk-js').classList.remove('animate');
    this.opened = false;
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  /**
   * Renders sections dynamically using parsed HTML state from cart response.
   * @param {Object} parsedState
   */
  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    const currentWidth = window.innerWidth;
    this.updRecom = true;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      if(sectionElement){
        if(sectionElement.querySelector('.dcomp__desk.animate') && currentWidth > 576){
          const cur_obj = sectionElement.querySelector('wk-drawer-inner');
          const new_obj = new DOMParser().parseFromString(parsedState.sections[section.id], 'text/html').querySelector('wk-drawer-inner');
          cur_obj.replaceWith(new_obj);
        }
        else{
          sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        }
      }
      if(section.id == 'wk-cart-free-delivery' && document.querySelector('#product-page-free-delivery')){
        document.querySelector('#product-page-free-delivery').innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
      if(section.id == this.cart_icon && document.querySelector('.footer-sticky-nav__item__icon .cart-count-bubble')){
        const parser = new DOMParser();
        const bubble = parser.parseFromString(this.getSectionInnerHTML(parsedState.sections[section.id], section.selector), 'text/html');
        var ib = bubble.querySelector('.cart-count-bubble')?bubble.querySelector('.cart-count-bubble').innerHTML : '' ;
        document.querySelector('.footer-sticky-nav__item__icon .cart-count-bubble').innerHTML = ib;
      }
    });

    setTimeout(() => {
      this.open();
    });
  }
  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  /** @returns {Array<{id: string, selector?: string}>} List of sections to update on cart render. */
  getSectionsToRender() {
    return [
      {
        id: 'wk-cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: this.cart_icon,
      },
      {
        id: this.cart_icon_mobile
      },
      {
        id: 'wk-cart-free-delivery'
      }
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
  getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }
}
customElements.define('cart-drawer', CartDrawer);

/**
 * Handles cart items rendering target section configuration specifically inside the drawer.
 * @extends CartItems
 */
class CartDrawerItems extends CartItems {
  /** @returns {Array<{id: string, section: string, selector: string}>} */
  getSectionsToRender() {
    this.cart_icon = document.querySelector('#wk-cart-icon-bubble-short')?'wk-cart-icon-bubble-short':'wk-cart-icon-bubble';
    this.cart_icon_mobile = document.querySelector('#wk-cart-icon-bubble--mobile-short')?'wk-cart-icon-bubble--mobile-short':'wk-cart-icon-bubble--mobile';
    return [
      {
        id: 'CartDrawer',
        section: 'wk-cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: this.cart_icon,
        section: this.cart_icon,
        selector: '.shopify-section',
      },
      {
        id: this.cart_icon_mobile,
        section: this.cart_icon_mobile,
        selector: '.shopify-section'
      }
    ];
  }
}

customElements.define('wk-cart-drawer-items', CartDrawerItems);
})();
