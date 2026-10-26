/**
 * Audio player for a clip, used to hear a target or an example sentence.
 *
 * The `src` attribute points at the clip, mirrored onto an internal `<audio>`.
 * The default face is a play/pause button, a seek timeline, and a time display;
 * the `compact` attribute hides the timeline and the times, leaving the button
 * for a tap-to-play control. Playback state is reflected as the `playing`
 * attribute and failures as the `error` attribute, and the `play()`, `pause()`
 * methods plus the `yk-audio-play`, `yk-audio-pause`, `yk-audio-ended`, and
 * `yk-audio-error` events let a page coordinate several players; reaching the
 * end emits `yk-audio-ended` alone, and changing `src` resets the state without
 * an event. The host is exposed as a group, so its `aria-label` names the
 * player and several clips can be told apart; the button and timeline
 * accessible names localize through the `play-label`, `pause-label`, and
 * `seek-label` slots.
 *
 * ```html
 * <script type="module" src="./index.js"></script>
 * <yk-audio src="https://example.com/price.mp3" aria-label="Pronunciation"></yk-audio>
 * <yk-audio src="https://example.com/sentence.mp3" compact>
 *   <span slot="play-label">再生</span>
 *   <span slot="pause-label">一時停止</span>
 * </yk-audio>
 * ```
 */
import { ensureShadow } from '../dsd.js';
import sheet from './yk-audio.css' with { type: 'css' };

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
};

class YKAudio extends HTMLElement {
  static observedAttributes = ['src'];

  #audio;

  #play;

  #timeline;

  #time;

  constructor() {
    super();
    const shadowRoot = ensureShadow(this, {
      styles: [sheet],
      render: (root) => {
        root.innerHTML = `
      <button part="play" type="button">
        <svg part="play-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 3l8 5-8 5z" fill="currentColor" />
        </svg>
        <svg part="pause-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5 3h2v10H5zM9 3h2v10H9z" fill="currentColor" />
        </svg>
      </button>
      <input part="timeline" type="range" min="0" max="0" value="0" step="any">
      <span part="time"></span>
      <audio preload="metadata"></audio>
      <slot name="play-label" hidden>Play</slot>
      <slot name="pause-label" hidden>Pause</slot>
      <slot name="seek-label" hidden>Seek</slot>
    `;
      },
    });
    this.#audio = shadowRoot.querySelector('audio');
    this.#play = shadowRoot.querySelector('[part="play"]');
    this.#timeline = shadowRoot.querySelector('[part="timeline"]');
    this.#time = shadowRoot.querySelector('[part="time"]');

    this.#play.addEventListener('click', () => this.#toggle());
    this.#timeline.addEventListener('input', () => {
      this.#audio.currentTime = Number(this.#timeline.value);
    });
    this.#audio.addEventListener('play', () => this.#setPlaying(true));
    this.#audio.addEventListener('pause', () => {
      // The platform fires a pause at the end of playback too; that one is
      // reported as `ended` alone, so it is ignored here.
      if (this.#audio.ended) return;
      this.#setPlaying(false);
    });
    this.#audio.addEventListener('ended', () => {
      this.toggleAttribute('playing', false);
      this.#nameControls();
      this.#emit('yk-audio-ended');
    });
    this.#audio.addEventListener('timeupdate', () => this.#syncTime());
    this.#audio.addEventListener('durationchange', () => this.#syncDuration());
    this.#audio.addEventListener('error', () => this.#onError());

    for (const name of ['play', 'pause', 'seek']) {
      const slot = shadowRoot.querySelector(`slot[name="${name}-label"]`);
      slot.addEventListener('slotchange', () => this.#nameControls());
    }
    this.#nameControls();
    this.#syncSrc();
    this.#syncTime();
    this.#syncDuration();
  }

  connectedCallback() {
    // A custom element constructor must not add attributes, so the group role
    // (which lets the caller's aria-label name the player) is applied here.
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }
  }

  attributeChangedCallback(name) {
    if (name === 'src') this.#syncSrc();
  }

  get src() {
    return this.getAttribute('src') ?? '';
  }

  set src(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('src');
    } else {
      this.setAttribute('src', value);
    }
  }

  play() {
    return this.#audio.play();
  }

  pause() {
    this.#audio.pause();
  }

  #toggle() {
    if (this.#audio.paused) {
      // A rejected play() (e.g. blocked autoplay) is not a media error, so it
      // is swallowed here; a real load failure surfaces as the error event.
      this.play().catch(() => {});
    } else {
      this.pause();
    }
  }

  #setPlaying(playing) {
    this.toggleAttribute('playing', playing);
    this.#emit(playing ? 'yk-audio-play' : 'yk-audio-pause');
    this.#nameControls();
  }

  #onError() {
    this.toggleAttribute('playing', false);
    this.toggleAttribute('error', true);
    this.#nameControls();
    this.#emit('yk-audio-error');
  }

  #emit(type) {
    this.dispatchEvent(
      new CustomEvent(type, { bubbles: true, composed: true }),
    );
  }

  #syncSrc() {
    const src = this.getAttribute('src');
    if (!src) {
      this.#audio.removeAttribute('src');
    } else {
      this.#audio.setAttribute('src', src);
    }
    // A load stops playback without firing a pause, so reset the reflected
    // state here instead of leaving a stale `playing`.
    this.toggleAttribute('playing', false);
    this.#nameControls();
    this.toggleAttribute('error', false);
    // Without a source there is nothing to play, so the control is inert.
    this.#play.disabled = !src;
  }

  #syncTime() {
    const duration = this.#audio.duration;
    const current = this.#audio.currentTime;
    this.#timeline.value = String(current);
    this.#timeline.setAttribute(
      'aria-valuetext',
      `${formatTime(current)} of ${formatTime(duration)}`,
    );
    this.#time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  #syncDuration() {
    const duration = Number.isFinite(this.#audio.duration)
      ? this.#audio.duration
      : 0;
    this.#timeline.max = String(duration);
    this.#syncTime();
  }

  #nameControls() {
    this.#play.setAttribute(
      'aria-label',
      this.hasAttribute('playing')
        ? this.#slotText('pause')
        : this.#slotText('play'),
    );
    this.#timeline.setAttribute('aria-label', this.#slotText('seek'));
  }

  #slotText(name) {
    const slot = this.shadowRoot.querySelector(`slot[name="${name}-label"]`);
    const assigned = slot.assignedNodes().find((node) => node.textContent);
    return (assigned?.textContent ?? slot.textContent).trim();
  }
}

if (!customElements.get('yk-audio')) {
  customElements.define('yk-audio', YKAudio);
}
