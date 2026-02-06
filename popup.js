/**
 * Tab Scroll Pro - Popup Script
 * Handles settings UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    enabled: document.getElementById('enabled'),
    requireModifier: document.getElementById('requireModifier'),
    scrollDirection: document.getElementById('scrollDirection'),
    wrapAround: document.getElementById('wrapAround'),
    status: document.getElementById('status'),
    rateLink: document.getElementById('rateLink')
  };

  // Default settings
  const DEFAULT_SETTINGS = {
    enabled: true,
    scrollDirection: 'natural',
    wrapAround: true,
    requireModifier: 'alt',
    scrollSpeed: 1,
    showNotification: false
  };

  // Load settings
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    elements.enabled.checked = settings.enabled;
    elements.requireModifier.value = settings.requireModifier;
    elements.scrollDirection.value = settings.scrollDirection;
    elements.wrapAround.checked = settings.wrapAround;
    updateStatus(settings.enabled);
  });

  // Save settings on change
  elements.enabled.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.sync.set({ enabled });
    updateStatus(enabled);
  });

  elements.requireModifier.addEventListener('change', (e) => {
    chrome.storage.sync.set({ requireModifier: e.target.value });
  });

  elements.scrollDirection.addEventListener('change', (e) => {
    chrome.storage.sync.set({ scrollDirection: e.target.value });
  });

  elements.wrapAround.addEventListener('change', (e) => {
    chrome.storage.sync.set({ wrapAround: e.target.checked });
  });

  // Update status indicator
  function updateStatus(enabled) {
    if (enabled) {
      elements.status.textContent = '✓ Extension is active';
      elements.status.classList.remove('disabled');
    } else {
      elements.status.textContent = '✗ Extension is disabled';
      elements.status.classList.add('disabled');
    }
  }

  // Rate link - will update when extension is published
  elements.rateLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Get extension ID dynamically
    const extensionId = chrome.runtime.id;
    const storeUrl = `https://chromewebstore.google.com/detail/${extensionId}`;
    chrome.tabs.create({ url: storeUrl });
  });
});
