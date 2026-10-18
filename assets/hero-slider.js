if (!customElements.get('hero-slider')) {
  /**
   * Hero image/video slider: swipeable track with arrows, indicators and auto-rotation.
   * @extends HTMLElement
   */
  customElements.define(
    'hero-slider',
    class HeroSlider extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-hero-track]');
        if (!this.track) return;
        this.slides = Array.from(this.track.children);
        this.dots = Array.from(this.querySelectorAll('[data-hero-dot]'));
        this.index = 0;
        this.delay = Number(this.dataset.autoplay || 0);
        this.syncVideos();
        if (this.slides.length < 2) return;

        const prev = this.querySelector('[data-hero-prev]');
        const next = this.querySelector('[data-hero-next]');
        if (prev) prev.addEventListener('click', () => this.goTo(this.index - 1, true));
        if (next) next.addEventListener('click', () => this.goTo(this.index + 1, true));
        this.dots.forEach((dot) =>
          dot.addEventListener('click', () => this.goTo(Number(dot.dataset.heroDot), true))
        );

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

        ['mouseenter', 'touchstart', 'focusin'].forEach((evt) =>
          this.addEventListener(evt, () => this.stop(), { passive: true })
        );
        ['mouseleave', 'touchend', 'focusout'].forEach((evt) =>
          this.addEventListener(evt, () => this.start(), { passive: true })
        );
        this.onVisibility = () => (document.hidden ? this.stop() : this.start());
        document.addEventListener('visibilitychange', this.onVisibility);

        // Theme editor: show the slide being edited and hold it there.
        this.addEventListener('shopify:block:select', (event) => {
          this.editing = true;
          this.stop();
          this.goTo(this.slides.indexOf(event.target));
        });
        this.addEventListener('shopify:block:deselect', () => {
          this.editing = false;
          this.start();
        });

        this.start();
      }

      disconnectedCallback() {
        this.stop();
        if (this.onVisibility) document.removeEventListener('visibilitychange', this.onVisibility);
      }

      goTo(index, byUser = false) {
        const count = this.slides.length;
        const target = ((index % count) + count) % count;
        const dir = getComputedStyle(this.track).direction === 'rtl' ? -1 : 1;
        this.track.scrollTo({ left: dir * target * this.track.clientWidth });
        this.setActive(target);
        if (byUser) {
          this.stop();
          this.start();
        }
      }

      setActive(index) {
        if (index === this.index) return;
        this.index = index;
        this.dots.forEach((dot, i) => {
          if (i === index) dot.setAttribute('aria-current', 'true');
          else dot.removeAttribute('aria-current');
        });
        this.syncVideos();
      }

      /** Plays the video of the visible slide (and viewport variant) and pauses the rest. */
      syncVideos() {
        this.slides.forEach((slide, i) => {
          slide.querySelectorAll('video').forEach((video) => {
            const visible = i === this.index && video.offsetParent !== null;
            if (visible) {
              video.muted = true;
              const played = video.play();
              if (played && played.catch) played.catch(() => {});
            } else {
              video.pause();
            }
          });
        });
      }

      start() {
        if (!this.delay || this.timer || this.editing) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.timer = setInterval(() => this.goTo(this.index + 1), this.delay);
      }

      stop() {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  );
}
