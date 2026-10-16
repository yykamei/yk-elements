// @ts-check
import { afterAll, afterEach, expect, test, vi } from 'vitest';
import '../src/components/yk-audio.js';

// A short silent WAV so the internal audio has a real, loadable source; a bogus
// URL would fire a spurious error event during the tests.
const SILENT_WAV = (() => {
  const sampleRate = 8000;
  const samples = 80;
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const write = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, 'data');
  view.setUint32(40, samples, true);
  for (let i = 0; i < samples; i += 1) {
    view.setUint8(44 + i, 128);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
})();

afterAll(() => {
  URL.revokeObjectURL(SILENT_WAV);
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function makeAudio(attributes = {}) {
  const host = document.createElement('yk-audio');
  host.setAttribute('src', SILENT_WAV);
  for (const [name, value] of Object.entries(attributes)) {
    host.setAttribute(name, value);
  }
  document.body.appendChild(host);
  return host;
}

const audioOf = (host) => host.shadowRoot.querySelector('audio');
const playButtonOf = (host) => host.shadowRoot.querySelector('[part="play"]');
const timelineOf = (host) => host.shadowRoot.querySelector('[part="timeline"]');
const timeOf = (host) => host.shadowRoot.querySelector('[part="time"]');

const defineInstance = (target, name, value) => {
  Object.defineProperty(target, name, { configurable: true, get: () => value });
};

test('self-registers in the custom element registry', () => {
  expect(customElements.get('yk-audio')).toBeDefined();
});

test('adopts its stylesheet as a constructable CSSStyleSheet', () => {
  const host = makeAudio();

  expect(host.shadowRoot.adoptedStyleSheets.length).toBe(1);
  expect(host.shadowRoot.adoptedStyleSheets[0]).toBeInstanceOf(CSSStyleSheet);
});

test('mirrors the src attribute onto the internal audio', () => {
  const host = makeAudio();

  expect(audioOf(host).getAttribute('src')).toBe(SILENT_WAV);

  host.setAttribute('src', 'other.mp3');
  expect(audioOf(host).getAttribute('src')).toBe('other.mp3');

  host.removeAttribute('src');
  expect(audioOf(host).hasAttribute('src')).toBe(false);
});

test('exposes a src property backed by the attribute', () => {
  const host = makeAudio();

  host.src = 'clip.mp3';
  expect(host.getAttribute('src')).toBe('clip.mp3');

  host.src = null;
  expect(host.hasAttribute('src')).toBe(false);
});

test('disables the play button while there is no source', () => {
  const host = makeAudio();
  expect(playButtonOf(host).disabled).toBe(false);

  host.removeAttribute('src');
  expect(playButtonOf(host).disabled).toBe(true);
});

test('treats an empty source as no source', () => {
  const host = makeAudio({ src: '' });

  expect(audioOf(host).hasAttribute('src')).toBe(false);
  expect(playButtonOf(host).disabled).toBe(true);
});

test('play and pause delegate to the internal audio', () => {
  const host = makeAudio();
  const audio = audioOf(host);
  const play = vi.spyOn(audio, 'play').mockResolvedValue();
  const pause = vi.spyOn(audio, 'pause').mockImplementation(() => {});

  host.play();
  host.pause();

  expect(play).toHaveBeenCalledTimes(1);
  expect(pause).toHaveBeenCalledTimes(1);
});

test('the button plays while paused and pauses while playing', () => {
  const host = makeAudio();
  const audio = audioOf(host);
  const play = vi.spyOn(audio, 'play').mockResolvedValue();
  const pause = vi.spyOn(audio, 'pause').mockImplementation(() => {});

  playButtonOf(host).click();
  expect(play).toHaveBeenCalledTimes(1);

  defineInstance(audio, 'paused', false);
  playButtonOf(host).click();
  expect(pause).toHaveBeenCalledTimes(1);
});

test('reflects playback state and emits lifecycle events', () => {
  const host = makeAudio();
  const events = [];
  for (const type of ['yk-audio-play', 'yk-audio-pause', 'yk-audio-ended']) {
    host.addEventListener(type, () => events.push(type));
  }

  audioOf(host).dispatchEvent(new Event('play'));
  expect(host.hasAttribute('playing')).toBe(true);

  audioOf(host).dispatchEvent(new Event('pause'));
  expect(host.hasAttribute('playing')).toBe(false);

  audioOf(host).dispatchEvent(new Event('ended'));
  expect(events).toEqual(['yk-audio-play', 'yk-audio-pause', 'yk-audio-ended']);
});

test('reports a natural end as ended alone, not as a pause', () => {
  const host = makeAudio();
  const audio = audioOf(host);
  const events = [];
  for (const type of ['yk-audio-pause', 'yk-audio-ended']) {
    host.addEventListener(type, () => events.push(type));
  }

  audio.dispatchEvent(new Event('play'));
  defineInstance(audio, 'ended', true);
  // The platform fires pause and then ended at the end of playback.
  audio.dispatchEvent(new Event('pause'));
  audio.dispatchEvent(new Event('ended'));

  expect(events).toEqual(['yk-audio-ended']);
  expect(host.hasAttribute('playing')).toBe(false);
});

test('resets the playing state when the source changes', () => {
  const host = makeAudio();
  audioOf(host).dispatchEvent(new Event('play'));
  expect(host.hasAttribute('playing')).toBe(true);

  host.setAttribute('src', 'other.mp3');

  expect(host.hasAttribute('playing')).toBe(false);
  expect(playButtonOf(host).getAttribute('aria-label')).toBe('Play');
});

test('exposes the host as a group named by its aria-label', () => {
  const host = makeAudio({ 'aria-label': 'Pronunciation' });

  expect(host.getAttribute('role')).toBe('group');
  expect(host.getAttribute('aria-label')).toBe('Pronunciation');
});

test('keeps a caller-provided role', () => {
  const host = makeAudio({ role: 'region' });

  expect(host.getAttribute('role')).toBe('region');
});

test('updates the timeline and time display from the media state', () => {
  const host = makeAudio();
  const audio = audioOf(host);
  defineInstance(audio, 'duration', 90);
  defineInstance(audio, 'currentTime', 30);

  audio.dispatchEvent(new Event('durationchange'));

  expect(timelineOf(host).max).toBe('90');
  expect(timelineOf(host).value).toBe('30');
  expect(timelineOf(host).getAttribute('aria-valuetext')).toBe('0:30 of 1:30');
  expect(timeOf(host).textContent).toBe('0:30 / 1:30');
});

test('seeking moves the media current time', () => {
  const host = makeAudio();
  const audio = audioOf(host);
  defineInstance(audio, 'duration', 90);
  audio.dispatchEvent(new Event('durationchange'));
  let seeked = null;
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => 0,
    set: (value) => {
      seeked = value;
    },
  });

  timelineOf(host).value = '42';
  timelineOf(host).dispatchEvent(new Event('input', { bubbles: true }));

  expect(seeked).toBe(42);
});

test('compact hides the timeline and time display', () => {
  const host = makeAudio({ compact: '' });

  expect(getComputedStyle(timelineOf(host)).display).toBe('none');
  expect(getComputedStyle(timeOf(host)).display).toBe('none');
});

test('shows the timeline and time display by default', () => {
  const host = makeAudio();

  expect(getComputedStyle(timelineOf(host)).display).not.toBe('none');
  expect(getComputedStyle(timeOf(host)).display).not.toBe('none');
});

test('sets the error state and emits yk-audio-error on a load failure', () => {
  const host = makeAudio();
  const errors = [];
  host.addEventListener('yk-audio-error', () => errors.push(1));

  audioOf(host).dispatchEvent(new Event('error'));

  expect(host.hasAttribute('error')).toBe(true);
  expect(errors.length).toBe(1);

  host.setAttribute('src', 'retry.mp3');
  expect(host.hasAttribute('error')).toBe(false);
});

test('names the controls and follows the playback state', () => {
  const host = makeAudio();

  expect(playButtonOf(host).getAttribute('aria-label')).toBe('Play');
  expect(timelineOf(host).getAttribute('aria-label')).toBe('Seek');

  audioOf(host).dispatchEvent(new Event('play'));
  expect(playButtonOf(host).getAttribute('aria-label')).toBe('Pause');
});

test('localizes the control names through the label slots', async () => {
  const host = document.createElement('yk-audio');
  host.setAttribute('src', SILENT_WAV);
  host.innerHTML = `
    <span slot="play-label">再生</span>
    <span slot="pause-label">一時停止</span>
    <span slot="seek-label">シーク</span>
  `;
  document.body.appendChild(host);
  await frame();

  expect(playButtonOf(host).getAttribute('aria-label')).toBe('再生');
  expect(timelineOf(host).getAttribute('aria-label')).toBe('シーク');

  audioOf(host).dispatchEvent(new Event('play'));
  expect(playButtonOf(host).getAttribute('aria-label')).toBe('一時停止');
});

test('restyles the button through the component tokens', () => {
  const host = makeAudio();
  host.style.setProperty('--yk-audio-button-bg', 'rgb(9, 8, 7)');
  host.style.setProperty('--yk-audio-button-size', '3rem');

  const style = getComputedStyle(playButtonOf(host));
  expect(style.backgroundColor).toBe('rgb(9, 8, 7)');
  expect(style.width).toBe('48px');
});
