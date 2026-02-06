/**
 * Tab Scroll Pro - Background Service Worker
 * Handles tab switching logic and settings management
 */

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  scrollDirection: 'natural', // 'natural' or 'inverted'
  wrapAround: true,           // Wrap from last tab to first
  requireModifier: 'alt',     // 'none', 'alt', 'ctrl', 'shift'
  scrollSpeed: 1,             // Debounce factor
  showNotification: false     // Show tab switch notification
};

let settings = { ...DEFAULT_SETTINGS };
let lastScrollTime = 0;
const SCROLL_DEBOUNCE = 100; // ms

// Load settings on startup
chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
  settings = { ...DEFAULT_SETTINGS, ...stored };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    for (const key of Object.keys(changes)) {
      settings[key] = changes[key].newValue;
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scroll') {
    handleScroll(message.direction, sender.tab);
    sendResponse({ success: true });
  } else if (message.type === 'getSettings') {
    sendResponse(settings);
  }
  return true;
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'scroll-left') {
    handleScroll('left');
  } else if (command === 'scroll-right') {
    handleScroll('right');
  }
});

async function handleScroll(direction, currentTab = null) {
  if (!settings.enabled) return;

  // Debounce rapid scrolls
  const now = Date.now();
  if (now - lastScrollTime < SCROLL_DEBOUNCE * settings.scrollSpeed) {
    return;
  }
  lastScrollTime = now;

  try {
    // Get current window's tabs
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (tabs.length <= 1) return;

    // Find current active tab
    const activeTab = currentTab || tabs.find(t => t.active);
    if (!activeTab) return;

    const currentIndex = tabs.findIndex(t => t.id === activeTab.id);
    if (currentIndex === -1) return;

    // Calculate next tab index
    let nextIndex;
    const actualDirection = settings.scrollDirection === 'inverted' 
      ? (direction === 'left' ? 'right' : 'left') 
      : direction;

    if (actualDirection === 'left') {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = settings.wrapAround ? tabs.length - 1 : 0;
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= tabs.length) {
        nextIndex = settings.wrapAround ? 0 : tabs.length - 1;
      }
    }

    // Don't switch if we're already at the edge and wrap is disabled
    if (nextIndex === currentIndex) return;

    // Activate the next tab
    await chrome.tabs.update(tabs[nextIndex].id, { active: true });

  } catch (error) {
    console.error('Tab Scroll Pro: Error switching tabs', error);
  }
}

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set(DEFAULT_SETTINGS);
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'welcome.html' });
  }
});
