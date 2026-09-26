"use strict";

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const playButton = document.querySelector('#play-pair');
const playLabel = playButton.querySelector('span');
const playerStatus = document.querySelector('#player-status');
let playRequest = 0;

function activeVideos() {
  return [...document.querySelectorAll('.task-panel:not([hidden]) video')];
}
function updatePlaybackLabel() {
  const playing = activeVideos().some(video => !video.paused && !video.ended);
  playLabel.textContent = playing ? 'Pause both' : 'Play both';
  playButton.querySelector('svg').innerHTML = playing
    ? '<path d="M6 4h3v12H6zM12 4h3v12h-3z"/>'
    : '<path d="m7 4 9 6-9 6Z"/>';
}
function selectTask(selected, focus = false) {
  playRequest += 1;
  document.querySelectorAll('video').forEach(video => video.pause());
  tabs.forEach(tab => {
    const isSelected = tab === selected;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
  });
  panels.forEach(panel => { panel.hidden = panel.id !== selected.getAttribute('aria-controls'); });
  activeVideos().forEach(video => { video.preload = 'metadata'; });
  playerStatus.textContent = '';
  updatePlaybackLabel();
  if (focus) selected.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTask(tab));
  tab.addEventListener('keydown', event => {
    const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    let next;
    if (offset !== undefined) next = (index + offset + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectTask(tabs[next], true);
  });
});
async function playPair(restart = false) {
  const videos = activeVideos();
  const request = ++playRequest;
  playerStatus.textContent = '';
  if (restart || videos.some(video => video.ended)) videos.forEach(video => { video.currentTime = 0; });
  // Shared playback starts independent recordings; it does not align task time.
  const results = await Promise.allSettled(videos.map(video => video.play()));
  if (request !== playRequest) {
    videos.filter(video => video.closest('.task-panel').hidden || document.hidden).forEach(video => video.pause());
    return;
  }
  if (results.some(result => result.status === 'rejected')) {
    playerStatus.textContent = "Playback could not start for both clips. Use each video's controls to retry.";
  }
  updatePlaybackLabel();
}
playButton.addEventListener('click', () => {
  const videos = activeVideos();
  if (videos.some(video => !video.paused && !video.ended)) {
    playRequest += 1;
    videos.forEach(video => video.pause());
    updatePlaybackLabel();
  } else void playPair();
});
document.querySelector('#restart-pair').addEventListener('click', () => void playPair(true));
document.querySelectorAll('video').forEach(video => {
  ['play', 'pause', 'ended'].forEach(event => video.addEventListener(event, updatePlaybackLabel));
  video.addEventListener('play', () => {
    if (video.closest('.task-panel').hidden || document.hidden) video.pause();
  });
  video.addEventListener('error', () => {
    if (!video.closest('.task-panel').hidden) playerStatus.textContent = 'A video could not be loaded. Please reload the page or open the video directly.';
  });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    playRequest += 1;
    document.querySelectorAll('video').forEach(video => video.pause());
  }
});
// Keep native controls as a no-JavaScript fallback; enhance each clip independently.
const playIcon = '<svg class="play-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="m7 4 9 6-9 6Z"/></svg>';
const pauseIcon = '<svg class="play-icon" aria-hidden="true" viewBox="0 0 20 20"><path d="M6 4h3v12H6zM12 4h3v12h-3z"/></svg>';
const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
document.querySelectorAll('.video-figure').forEach(figure => {
  const video = figure.querySelector('video');
  const policy = figure.querySelector('h4').childNodes[0].textContent.trim();
  const task = document.getElementById(figure.closest('.task-panel').getAttribute('aria-labelledby')).querySelector('.task-name').textContent;
  const label = `${task}, ${policy}`;
  const controls = document.createElement('div');
  controls.className = 'clip-controls';
  controls.innerHTML = `<button type="button" class="clip-toggle">${playIcon}</button><input type="range" min="0" max="1" step="0.1" value="0" disabled><span class="clip-time">0:00 / —</span><button type="button" class="clip-fullscreen"><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/></svg></button>`;
  video.after(controls);
  const toggle = controls.querySelector('.clip-toggle');
  const seek = controls.querySelector('input');
  const time = controls.querySelector('.clip-time');
  const fullscreen = controls.querySelector('.clip-fullscreen');
  toggle.setAttribute('aria-label', `Play ${label}`);
  seek.setAttribute('aria-label', `Seek ${label}`);
  fullscreen.setAttribute('aria-label', `Full screen ${label}`);
  async function toggleClip() {
    if (!video.paused && !video.ended) video.pause();
    else {
      try { await video.play(); }
      catch { playerStatus.textContent = 'This clip could not start. Please try again.'; }
    }
  }
  toggle.addEventListener('click', toggleClip);
  video.addEventListener('click', toggleClip);
  function updateControls() {
    const playing = !video.paused && !video.ended;
    toggle.innerHTML = playing ? pauseIcon : playIcon;
    toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${label}`);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    seek.disabled = !duration;
    seek.max = duration || 1;
    seek.value = video.currentTime;
    seek.style.setProperty('--progress', `${duration ? video.currentTime / duration * 100 : 0}%`);
    seek.setAttribute('aria-valuetext', `${formatTime(video.currentTime)} of ${duration ? formatTime(duration) : 'unknown duration'}`);
    time.textContent = `${formatTime(video.currentTime)} / ${duration ? formatTime(duration) : '—'}`;
  }
  ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked'].forEach(event => video.addEventListener(event, updateControls));
  seek.addEventListener('input', () => { video.currentTime = Number(seek.value); updateControls(); });
  if (!document.fullscreenEnabled && !video.webkitEnterFullscreen) fullscreen.hidden = true;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (figure.requestFullscreen && document.fullscreenEnabled) await figure.requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { playerStatus.textContent = 'Full screen is unavailable in this browser.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.setAttribute('aria-label', `${document.fullscreenElement === figure ? 'Exit full screen' : 'Full screen'} ${label}`);
  });
  video.controls = false;
});
selectTask(tabs.find(tab => tab.getAttribute('aria-selected') === 'true'));

const navToggle = document.querySelector('.nav-toggle');
const primaryNav = document.querySelector('#primary-nav');
function closeNavigation() {
  navToggle.setAttribute('aria-expanded', 'false');
  primaryNav.classList.remove('is-open');
}
navToggle.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(open));
  primaryNav.classList.toggle('is-open', open);
});
primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
    closeNavigation();
    navToggle.focus();
  }
});
const navSections = [...primaryNav.querySelectorAll('a[href^="#"]')].map(link => ({ link, section: document.querySelector(link.hash) }));
let navFramePending = false;
function updateNavigation() {
  let active;
  navSections.forEach(item => {
    const rect = item.section.getBoundingClientRect();
    if (rect.top <= 145 && rect.bottom > 145) active = item;
  });
  navSections.forEach(item => {
    if (item === active) item.link.setAttribute('aria-current', 'location');
    else item.link.removeAttribute('aria-current');
  });
  navFramePending = false;
}
window.addEventListener('scroll', () => {
  if (!navFramePending) { navFramePending = true; requestAnimationFrame(updateNavigation); }
}, { passive: true });
updateNavigation();
const figureDialog = document.querySelector('#figure-dialog');
const zoomButton = document.querySelector('#figure-zoom');
const imageWrap = document.querySelector('.dialog-image-wrap');
imageWrap.tabIndex = 0;
imageWrap.setAttribute('aria-label', 'Figure image; scroll to explore when zoomed');
zoomButton.addEventListener('click', () => {
  const zoomed = imageWrap.classList.toggle('is-zoomed');
  zoomButton.setAttribute('aria-pressed', String(zoomed));
  zoomButton.textContent = zoomed ? 'Fit to view' : 'Zoom in';
  imageWrap.scrollTo(0, 0);
});
document.querySelectorAll('[data-figure]').forEach(button => {
  button.addEventListener('click', () => {
    const img = document.querySelector('#dialog-image');
    img.src = button.dataset.figure;
    img.alt = button.querySelector('img').alt;
    document.querySelector('#dialog-caption').textContent = button.dataset.caption;
    document.querySelector('#figure-original').href = button.dataset.figure;
    imageWrap.classList.remove('is-zoomed');
    zoomButton.setAttribute('aria-pressed', 'false');
    zoomButton.textContent = 'Zoom in';
    imageWrap.scrollTo(0, 0);
    figureDialog.showModal();
  });
});
document.querySelector('#close-figure').addEventListener('click', () => figureDialog.close());
figureDialog.addEventListener('click', event => {
  const rect = figureDialog.getBoundingClientRect();
  if (event.target === figureDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) figureDialog.close();
});
document.querySelector('#copy-citation').addEventListener('click', async event => {
  const button = event.currentTarget;
  const code = document.querySelector('#bibtex');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = 'Copied';
    status.textContent = 'BibTeX copied to clipboard.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = 'Select & copy';
    status.textContent = "Automatic copy is unavailable. The citation is selected; use your device's copy command.";
  }
  window.setTimeout(() => { button.textContent = 'Copy BibTeX'; }, 2200);
});
