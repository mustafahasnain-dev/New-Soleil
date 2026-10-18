if (!customElements.get('main-product-custom')) {
  /**
   * Custom product page: gallery, variant selection, delivery estimate,
   * "complete the look" slider, dialogs and sticky add-to-bag bar.
   * @extends HTMLElement
   */
  class MainProductCustom extends HTMLElement {
    connectedCallback() {
      const json = this.querySelector('[data-mpc-json]');
      this.data = json ? JSON.parse(json.textContent) : { variants: [] };
      this.form = document.getElementById(this.dataset.formId);

      this.initVariants();
      this.initGallery();
      this.initQuantity();
      this.initDelivery();
      this.initLook();
      this.initDialogs();
      this.initSticky();
    }

    disconnectedCallback() {
      if (this.stickyObserver) this.stickyObserver.disconnect();
    }

    /* ---------------- Gallery ---------------- */
    initGallery() {
      this.track = this.querySelector('[data-mpc-track]');
      if (!this.track) return;
      this.slides = Array.from(this.track.children);
      this.thumbs = Array.from(this.querySelectorAll('.mpc-gallery__thumb'));
      this.thumbsWrap = this.querySelector('.mpc-gallery__thumbs');
      this.prevBtn = this.querySelector('[data-mpc-prev]');
      this.nextBtn = this.querySelector('[data-mpc-next]');
      this.progress = this.querySelector('[data-mpc-progress]');
      this.currentIndex = 0;

      this.thumbs.forEach((thumb) =>
        thumb.addEventListener('click', () => this.goTo(Number(thumb.dataset.index)))
      );
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.goTo(this.currentIndex - 1));
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.goTo(this.currentIndex + 1));

      let ticking = false;
      this.track.addEventListener(
        'scroll',
        () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const width = this.track.clientWidth || 1;
            this.setActive(Math.round(Math.abs(this.track.scrollLeft) / width));
          });
        },
        { passive: true }
      );

      this.track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') this.goTo(this.currentIndex + 1);
        if (event.key === 'ArrowLeft') this.goTo(this.currentIndex - 1);
      });

      // Lightbox
      this.lightbox = this.querySelector('[data-mpc-lightbox]');
      if (this.lightbox) {
        this.querySelectorAll('[data-mpc-zoom]').forEach((btn) =>
          btn.addEventListener('click', () => this.openLightbox(btn.dataset.mpcZoom))
        );
        this.lightbox
          .querySelector('[data-mpc-lightbox-close]')
          .addEventListener('click', () => this.lightbox.close());
        this.lightbox.addEventListener('click', (event) => {
          if (event.target.tagName === 'IMG') this.lightbox.close();
        });
      }

      // Start on the selected variant's image.
      const variant = this.currentVariant();
      if (variant && variant.media) this.goToMedia(variant.media, false);
      else this.setActive(0);
    }

    goTo(index, smooth = true) {
      if (!this.slides || !this.slides.length) return;
      const clamped = Math.max(0, Math.min(index, this.slides.length - 1));
      const dir = getComputedStyle(this.track).direction === 'rtl' ? -1 : 1;
      this.track.scrollTo({
        left: dir * clamped * this.track.clientWidth,
        behavior: smooth ? 'smooth' : 'auto',
      });
      this.setActive(clamped);
    }

    goToMedia(mediaId, smooth = true) {
      const slide = this.slides && this.slides.find((s) => s.dataset.mediaId === String(mediaId));
      if (slide) this.goTo(Number(slide.dataset.index), smooth);
    }

    setActive(index) {
      if (index === this.currentIndex && this._activeSet) return;
      this._activeSet = true;
      this.currentIndex = index;
      this.thumbs.forEach((thumb, i) => {
        const active = i === index;
        thumb.classList.toggle('is-active', active);
        if (active) {
          thumb.setAttribute('aria-current', 'true');
          this.scrollThumbIntoView(thumb);
        } else {
          thumb.removeAttribute('aria-current');
        }
      });
      if (this.prevBtn) this.prevBtn.disabled = index <= 0;
      if (this.nextBtn) this.nextBtn.disabled = index >= this.slides.length - 1;
      if (this.progress) this.progress.style.transform = `translateX(${index * 100}%)`;
    }

    scrollThumbIntoView(thumb) {
      const wrap = this.thumbsWrap;
      if (!wrap) return;
      const vertical = wrap.scrollHeight > wrap.clientHeight + 1;
      if (vertical) {
        const top = thumb.offsetTop - wrap.offsetTop - wrap.clientHeight / 2 + thumb.clientHeight / 2;
        wrap.scrollTo({ top, behavior: 'smooth' });
      } else if (wrap.scrollWidth > wrap.clientWidth + 1) {
        const left = thumb.offsetLeft - wrap.offsetLeft - wrap.clientWidth / 2 + thumb.clientWidth / 2;
        wrap.scrollTo({ left, behavior: 'smooth' });
      }
    }

    openLightbox(index) {
      this.lightbox.showModal();
      const item = this.lightbox.querySelector(`.mpc-lightbox__item[data-index="${index}"]`);
      if (item) item.scrollIntoView({ block: 'start' });
    }

    /* ---------------- Variants ---------------- */
    initVariants() {
      this.variantWrap = this.querySelector('[data-mpc-variants]');
      this.idInput = this.querySelector('[data-mpc-variant-id]');
      if (!this.variantWrap || this.data.singleVariant) return;

      this.fieldsets = Array.from(this.variantWrap.querySelectorAll('.mpc-option'));
      this.variantWrap.addEventListener('change', (event) => {
        if (!event.target.classList.contains('mpc-option__input')) return;
        this.onVariantChange();
      });
      this.updateAvailability();
    }

    selectedOptions() {
      return this.fieldsets.map((fs) => {
        const checked = fs.querySelector('.mpc-option__input:checked');
        return checked ? checked.value : null;
      });
    }

    currentVariant() {
      if (!this.data.variants.length) return null;
      if (this.data.singleVariant || !this.fieldsets) {
        const id = this.idInput ? Number(this.idInput.value) : this.data.variants[0].id;
        return this.data.variants.find((v) => v.id === id) || this.data.variants[0];
      }
      const selected = this.selectedOptions();
      return this.data.variants.find((v) => v.options.every((opt, i) => opt === selected[i])) || null;
    }

    onVariantChange() {
      const variant = this.currentVariant();
      this.updateAvailability();

      // Selected value labels (swatches)
      this.fieldsets.forEach((fs) => {
        const label = fs.querySelector('[data-mpc-selected-value]');
        const checked = fs.querySelector('.mpc-option__input:checked');
        if (label && checked) label.textContent = checked.value;
      });

      this.updateButtons(variant);
      if (!variant) return;

      if (this.idInput) {
        this.idInput.value = variant.id;
        this.idInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      this.setText('[data-mpc-price]', variant.price);
      this.setText('[data-mpc-installment]', variant.installment);
      const compare = this.querySelector('[data-mpc-compare]');
      if (compare) {
        compare.hidden = !variant.compare;
        compare.textContent = variant.compare || '';
      }
      const badge = this.querySelector('[data-mpc-sale-badge]');
      if (badge) badge.hidden = !variant.compare;

      const stickyVariant = this.querySelector('[data-mpc-sticky-variant]');
      if (stickyVariant) stickyVariant.textContent = ` – ${variant.title}`;

      if (variant.media) this.goToMedia(variant.media);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());

    }

    updateButtons(variant) {
      const buttons = this.querySelectorAll('[data-mpc-atc], [data-mpc-sticky-btn]');
      const atc = this.querySelector('[data-mpc-atc]');
      if (!atc) return;
      let label = atc.dataset.labelAdd;
      if (!variant) label = atc.dataset.labelUnavailable;
      else if (!variant.available) label = atc.dataset.labelSoldout;
      const disabled = !variant || !variant.available;

      buttons.forEach((btn) => {
        btn.disabled = disabled;
        if (disabled) btn.setAttribute('aria-disabled', 'true');
        else btn.removeAttribute('aria-disabled');
        const span = btn.querySelector('[data-mpc-atc-label]');
        if (span) span.textContent = label;
      });
    }

    /** Marks option values that have no available variant given the other selections. */
    updateAvailability() {
      const selected = this.selectedOptions();
      this.fieldsets.forEach((fs, position) => {
        fs.querySelectorAll('.mpc-option__input').forEach((input) => {
          const candidate = selected.slice();
          candidate[position] = input.value;
          const available = this.data.variants.some(
            (v) => v.available && v.options.every((opt, i) => opt === candidate[i])
          );
          input.classList.toggle('is-unavailable', !available);
        });
      });
    }

    setText(selector, value) {
      this.querySelectorAll(selector).forEach((el) => {
        el.textContent = value;
      });
    }

    /* ---------------- Quantity ---------------- */
    initQuantity() {
      const input = this.querySelector('.mpc-qty__input');
      if (!input) return;
      this.querySelectorAll('[data-mpc-qty]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const next = Math.max(1, (parseInt(input.value, 10) || 1) + Number(btn.dataset.mpcQty));
          input.value = next;
        })
      );
    }

    /* ---------------- Delivery estimate ---------------- */
    initDelivery() {
      const el = this.querySelector('[data-mpc-delivery]');
      if (!el) return;
      const skip = el.dataset.skip ? el.dataset.skip.split(',').map(Number) : [];
      const cutoff = Number(el.dataset.cutoff || 24);
      const base = new Date();
      if (base.getHours() >= cutoff) base.setDate(base.getDate() + 1);

      const addBusinessDays = (days) => {
        const date = new Date(base);
        let added = 0;
        while (added < days) {
          date.setDate(date.getDate() + 1);
          if (!skip.includes(date.getDay())) added += 1;
        }
        while (skip.includes(date.getDay())) date.setDate(date.getDate() + 1);
        return date;
      };

      const lang = document.documentElement.lang || 'en';
      const isEnglish = lang.toLowerCase().startsWith('en');
      const ordinal = (n) => {
        if (!isEnglish) return '';
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
      };
      const format = (date) => {
        const month = date.toLocaleString(lang, { month: 'short' }).replace('.', '');
        return `${date.getDate()}${ordinal(date.getDate())} ${month}`;
      };

      const min = Number(el.dataset.min || 0);
      const max = Math.max(min, Number(el.dataset.max || 0));
      el.querySelector('[data-mpc-delivery-from]').textContent = format(addBusinessDays(min));
      el.querySelector('[data-mpc-delivery-to]').textContent = format(addBusinessDays(max));
    }

    /* ---------------- Complete the look ---------------- */
    initLook() {
      const track = this.querySelector('[data-mpc-look-track]');
      if (!track) return;
      const prev = this.querySelector('[data-mpc-look-prev]');
      const next = this.querySelector('[data-mpc-look-next]');
      const update = () => {
        const max = track.scrollWidth - track.clientWidth - 2;
        const pos = Math.abs(track.scrollLeft);
        prev.disabled = pos <= 2;
        next.disabled = pos >= max;
      };
      const step = () => track.clientWidth * 0.8;
      prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
      next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      track.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }

    /* ---------------- Dialogs ---------------- */
    initDialogs() {
      this.querySelectorAll('[data-mpc-open-dialog]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const dialog = document.getElementById(btn.dataset.mpcOpenDialog);
          if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
        })
      );
      this.querySelectorAll('.mpc-dialog').forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
          if (event.target === dialog) dialog.close();
        });
        dialog.querySelectorAll('[data-mpc-close-dialog]').forEach((btn) =>
          btn.addEventListener('click', () => dialog.close())
        );
      });
    }

    /* ---------------- Sticky add to bag ---------------- */
    initSticky() {
      // Sticky info column: when it is taller than the viewport, pin it by its bottom edge instead.
      const info = this.querySelector('.mpc__info-inner--sticky');
      if (info && 'ResizeObserver' in window) {
        const place = () => {
          const offset = Math.min(24, window.innerHeight - info.offsetHeight - 24);
          info.style.top = `${offset}px`;
        };
        new ResizeObserver(place).observe(info);
        window.addEventListener('resize', place);
      }

      const sticky = this.querySelector('[data-mpc-sticky]');
      const atc = this.querySelector('[data-mpc-atc]');
      if (!sticky || !atc || !('IntersectionObserver' in window)) return;
      const stickyBtn = sticky.querySelector('[data-mpc-sticky-btn]');

      this.stickyObserver = new IntersectionObserver(([entry]) => {
        const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', show);
        sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (stickyBtn) stickyBtn.tabIndex = show ? 0 : -1;
      });
      this.stickyObserver.observe(atc);
    }
  }

  customElements.define('main-product-custom', MainProductCustom);
}
