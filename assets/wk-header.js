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
})();
