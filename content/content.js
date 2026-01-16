// Content script for AI Resume Optimizer
// This script runs on all pages to enable text selection capture

(function() {
  'use strict';

  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelection') {
      const selection = window.getSelection().toString().trim();
      sendResponse({ selection });
    }
    return true;
  });

  // Optional: Add visual feedback when text is selected
  let selectionIndicator = null;

  function createSelectionIndicator() {
    if (selectionIndicator) return;

    selectionIndicator = document.createElement('div');
    selectionIndicator.id = 'ai-resume-selection-indicator';
    selectionIndicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      z-index: 999999;
      display: none;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
    `;
    selectionIndicator.innerHTML = `
      <span style="font-size: 16px;">✂️</span>
      <span>Text selected! Click to capture for resume optimization</span>
    `;

    selectionIndicator.addEventListener('click', async () => {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        try {
          await chrome.runtime.sendMessage({
            action: 'captureJobDescription',
            text: selection
          });
          showCapturedFeedback();
        } catch (error) {
          console.error('Error sending selection:', error);
        }
      }
    });

    selectionIndicator.addEventListener('mouseenter', () => {
      selectionIndicator.style.transform = 'scale(1.02)';
    });

    selectionIndicator.addEventListener('mouseleave', () => {
      selectionIndicator.style.transform = 'scale(1)';
    });

    document.body.appendChild(selectionIndicator);
  }

  function showCapturedFeedback() {
    if (!selectionIndicator) return;

    selectionIndicator.innerHTML = `
      <span style="font-size: 16px;">✓</span>
      <span>Captured! Open extension to optimize.</span>
    `;
    selectionIndicator.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

    setTimeout(() => {
      hideSelectionIndicator();
      // Reset style for next time
      setTimeout(() => {
        if (selectionIndicator) {
          selectionIndicator.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
          selectionIndicator.innerHTML = `
            <span style="font-size: 16px;">✂️</span>
            <span>Text selected! Click to capture for resume optimization</span>
          `;
        }
      }, 300);
    }, 2000);
  }

  function showSelectionIndicator() {
    if (!selectionIndicator) createSelectionIndicator();
    selectionIndicator.style.display = 'flex';
    selectionIndicator.style.opacity = '1';
  }

  function hideSelectionIndicator() {
    if (selectionIndicator) {
      selectionIndicator.style.opacity = '0';
      setTimeout(() => {
        if (selectionIndicator) {
          selectionIndicator.style.display = 'none';
        }
      }, 200);
    }
  }

  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Handle selection changes
  const handleSelectionChange = debounce(() => {
    const selection = window.getSelection().toString().trim();

    // Only show indicator if selection is substantial (likely a job description)
    if (selection.length > 50) {
      showSelectionIndicator();
    } else {
      hideSelectionIndicator();
    }
  }, 300);

  // Listen for selection changes
  document.addEventListener('selectionchange', handleSelectionChange);

  // Hide indicator when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (selectionIndicator && !selectionIndicator.contains(e.target)) {
      const selection = window.getSelection().toString().trim();
      if (selection.length < 50) {
        hideSelectionIndicator();
      }
    }
  });

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (selectionIndicator) {
      selectionIndicator.remove();
      selectionIndicator = null;
    }
  });
})();
