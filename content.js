/**
 * Tab Scroll Pro - Content Script
 * Detects mouse wheel events when hovering over the tab bar area
 */

(function() {
  'use strict';

  let settings = null;
  let isEnabled = true;

  // Load settings
  chrome.runtime.sendMessage({ type: 'getSettings' }, (response) => {
    if (response) {
      settings = response;
      isEnabled = response.enabled;
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.enabled) {
        isEnabled = changes.enabled.newValue;
      }
      // Update local settings cache
      for (const key of Object.keys(changes)) {
        if (settings) {
          settings[key] = changes[key].newValue;
        }
      }
    }
  });

  // Track mouse position
  let mouseY = 0;
  let mouseNearTop = false;
  const TAB_BAR_HEIGHT = 50; // Approximate height of Chrome's tab bar area

  document.addEventListener('mousemove', (e) => {
    mouseY = e.clientY;
    // Check if mouse is in the very top area (near tab bar)
    // Note: Content scripts can't actually detect the tab bar, but we can detect
    // when the user is at the very top of the page
    mouseNearTop = e.screenY < 100 && window.screenY === 0;
  }, { passive: true });

  // Handle wheel events
  document.addEventListener('wheel', (e) => {
    if (!isEnabled || !settings) return;

    // Check modifier key requirement
    const modifierPressed = checkModifier(e, settings.requireModifier);
    if (!modifierPressed) return;

    // Prevent default scrolling when modifier is pressed
    e.preventDefault();

    // Determine scroll direction
    const direction = e.deltaY > 0 ? 'right' : 'left';

    // Send message to background script
    chrome.runtime.sendMessage({ 
      type: 'scroll', 
      direction: direction 
    }).catch(() => {
      // Extension context may be invalidated, ignore
    });

  }, { passive: false });

  function checkModifier(event, required) {
    switch (required) {
      case 'none':
        return true;
      case 'alt':
        return event.altKey;
      case 'ctrl':
        return event.ctrlKey || event.metaKey;
      case 'shift':
        return event.shiftKey;
      default:
        return event.altKey; // Default to Alt
    }
  }

})();
