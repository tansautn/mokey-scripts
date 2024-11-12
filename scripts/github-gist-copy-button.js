// ==UserScript==
// @name         GitHub Gist Copy file content button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a "Copy" button next to the "Raw" button on GitHub to copy file contents to the clipboard
// @author       Zuko <tansautn@gmail.com>
// @match        https://*.github.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  function addCopyButtons() {
    // Find all "Raw" buttons on the page
    const rawButtons = document.querySelectorAll('a[data-view-component="true"][href*="/raw/"]');

    rawButtons.forEach((rawButton) => {
      // Check if "Copy" button already exists to avoid duplicate buttons
      if (rawButton.nextElementSibling && rawButton.nextElementSibling.classList.contains('copy-button')) {
        return;
      }

      // Locate the parent form and textarea
      const form = rawButton.closest('form');
      const textarea = form ? form.querySelector('textarea') : null;

      // Only add button if a textarea is found
      if (textarea) {
        const copyButton = document.createElement('button');
        copyButton.innerText = 'Copy file content';
        copyButton.style.marginLeft = '8px';
        copyButton.className = rawButton.className + ' copy-button';
        copyButton.style.marginLeft = '8px';


        // Click event to copy textarea content
        copyButton.addEventListener('click', (event) => {
          event.preventDefault();
          navigator.clipboard.writeText(textarea.value)
            .then(() => showNotification('Content copied to clipboard!'))
            .catch((err) => showNotification('Failed to copy content: ' + err, true));
        });

        // Insert the "Copy" button next to the "Raw" button
        rawButton.parentNode.insertBefore(copyButton, rawButton.nextSibling);
      }
    });
  }

  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.backgroundColor = isError ? '#ff4c4c' : '#4caf50';
    notification.style.color = '#fff';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.fontSize = '14px';
    notification.style.transition = 'opacity 0.3s ease';
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }


  // Observe the DOM for changes to dynamically add "Copy" buttons
  const observer = new MutationObserver(addCopyButtons);
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run to add copy buttons on page load
  addCopyButtons();
})();
