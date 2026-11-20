/* Product card hover actions: add to cart, wishlist, compare (snippets/card-actions.liquid). */
(() => {
  if (window.__cardActionsBound) return;
  window.__cardActionsBound = true;

  const KEYS = { wishlist: 'productDataWishlist', compare: 'productDataCompare' };
  const EVENTS = { wishlist: 'wishlistUpdated', compare: 'compareUpdated' };
  const LABELS = { wishlist: 'wishlist', compare: 'compare' };

  const read = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      return {};
    }
  };
  const write = (key, map) => {
    try {
      Object.keys(map).length ? localStorage.setItem(key, JSON.stringify(map)) : localStorage.removeItem(key);
    } catch (e) {}
  };

  let toastTimer;
  const toast = (html) => {
    let el = document.querySelector('.card-actions-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'card-actions-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  };

  const pageUrl = (type) => (window.cardActionPages && window.cardActionPages[type]) || '';

  // mark saved items as active on load and whenever the lists change elsewhere
  const syncStates = (type) => {
    const map = read(KEYS[type]);
    document.querySelectorAll(`[data-card-action="${type}"]`).forEach((btn) => {
      const on = Object.prototype.hasOwnProperty.call(map, btn.dataset.id);
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  const syncAll = () => {
    syncStates('wishlist');
    syncStates('compare');
  };

  const toggleList = (btn, type) => {
    const key = KEYS[type];
    const map = read(key);
    const id = btn.dataset.id;
    let added;
    if (Object.prototype.hasOwnProperty.call(map, id)) {
      delete map[id];
      added = false;
    } else {
      map[id] = btn.dataset.productHandle;
      added = true;
    }
    write(key, map);
    syncStates(type);
    window.dispatchEvent(new Event(EVENTS[type]));
    const link = pageUrl(type) ? ` <a href="${pageUrl(type)}">View</a>` : '';
    toast(added ? `Added to ${LABELS[type]}${link}` : `Removed from ${LABELS[type]}`);
  };

  // header cart counters (snippets/wk-cart-icon-bubble*.liquid); the bubble is only rendered when the cart has items
  const updateCartCount = () =>
    fetch(`${(window.routes && window.routes.cart_url) || '/cart'}.js`, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((cart) => {
        const count = cart.item_count;
        document.querySelectorAll('#wk-cart-icon-bubble-short, #wk-cart-icon-bubble--mobile-short').forEach((link) => {
          const el = link.querySelector('.header__button__bubble__count');
          if (el) el.textContent = count;
        });
        document.querySelectorAll('#wk-cart-icon-bubble, #wk-cart-icon-bubble--mobile').forEach((link) => {
          let bubble = link.querySelector('.cart-count-bubble');
          if (!count) {
            if (bubble) bubble.remove();
            return;
          }
          if (!bubble) {
            bubble = document.createElement('div');
            bubble.className = 'cart-count-bubble header__button__bubble';
            link.prepend(bubble);
          }
          bubble.innerHTML = `${count < 100 ? `<span class="body3-no-scale header__button__bubble__count" aria-hidden="true">${count}</span>` : ''}<span class="visually-hidden">${count} item${count === 1 ? '' : 's'} in cart</span>`;
          const icon = link.querySelector('.wk-cart-icon-bubble');
          if (icon) icon.classList.add('cart-icon-bubble_hide-tablet');
        });
      })
      .catch(() => {});

  const addToCart = (btn) => {
    if (btn.dataset.single !== 'true') {
      window.location.href = btn.dataset.url;
      return;
    }
    const cartDrawer = document.querySelector('cart-drawer');
    const body = { items: [{ id: Number(btn.dataset.variantId), quantity: 1 }] };
    if (cartDrawer && typeof cartDrawer.getSectionsToRender === 'function') {
      body.sections = cartDrawer.getSectionsToRender().map((s) => s.id);
      body.sections_url = window.location.pathname;
    }
    btn.classList.add('is-loading');
    fetch(`${(window.routes && window.routes.cart_add_url) || '/cart/add'}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.status) {
          toast(data.description || data.message || 'Could not add to cart');
          return;
        }
        if (cartDrawer && data.sections && typeof cartDrawer.renderContents === 'function') {
          cartDrawer.classList.remove('is-empty');
          cartDrawer.renderContents(Object.assign({ id: btn.dataset.variantId }, data));
        } else {
          toast(`Added to cart <a href="${(window.routes && window.routes.cart_url) || '/cart'}">View cart</a>`);
        }
        updateCartCount();
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, { source: 'card-actions', productVariantId: btn.dataset.variantId });
        }
      })
      .catch(() => toast('Could not add to cart'))
      .finally(() => btn.classList.remove('is-loading'));
  };

  document.addEventListener('click', (event) => {
    const btn = event.target.closest && event.target.closest('[data-card-action]');
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const type = btn.dataset.cardAction;
    if (type === 'cart') addToCart(btn);
    else toggleList(btn, type);
  });

  // keep the header counter in sync with every cart change (cart page quantity / remove, drawer, product form)
  const subscribeCart = () => {
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        if (!event || event.source !== 'card-actions') updateCartCount();
      });
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribeCart);
  else subscribeCart();

  window.addEventListener('wishlistUpdated', () => syncStates('wishlist'));
  window.addEventListener('compareUpdated', () => syncStates('compare'));
  window.addEventListener('storage', syncAll);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncAll);
  else syncAll();
  // cards loaded later (filters, toggles, infinite scroll)
  new MutationObserver(() => {
    clearTimeout(window.__cardActionsSync);
    window.__cardActionsSync = setTimeout(syncAll, 100);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
