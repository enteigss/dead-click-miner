/**
 * Dead Click Miner - Element Highlighter
 * Highlights elements on your Shopify store based on URL parameters
 * 
 * Installation:
 * 1. Upload this file to your theme's assets/ folder
 * 2. Add this line to your theme.liquid before </body>:
 *    {{ 'dead-click-highlighter.js' | asset_url | script_tag }}
 */

(function() {
  'use strict';
  
  // Only run if highlight_selector parameter exists
  const urlParams = new URLSearchParams(window.location.search);
  const highlightSelector = urlParams.get('highlight_selector');
  
  if (!highlightSelector) {
    return; // Exit early if no selector to highlight
  }
  
  console.log('Dead Click Miner: Looking for selector:', highlightSelector);
  
  // Inject CSS styles for highlighting
  function injectStyles() {
    const styleId = 'dead-click-highlighter-styles';
    
    // Don't inject if already exists
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .dead-click-highlight {
        animation: dead-click-flash 1s ease-in-out infinite !important;
        border: 3px solid #ff0000 !important;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
        position: relative !important;
        z-index: 9999 !important;
      }

      @keyframes dead-click-flash {
        0%, 100% { 
          border-color: #ff0000;
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
        }
        50% { 
          border-color: #ff6b6b;
          box-shadow: 0 0 30px rgba(255, 107, 107, 0.6);
        }
      }

      .dead-click-highlight::before {
        content: "🎯 Dead Click Element";
        position: absolute !important;
        top: -35px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background: #ff0000 !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        z-index: 10000 !important;
        white-space: nowrap !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      .dead-click-highlight::after {
        content: "";
        position: absolute !important;
        top: -5px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 0 !important;
        height: 0 !important;
        border-left: 6px solid transparent !important;
        border-right: 6px solid transparent !important;
        border-top: 6px solid #ff0000 !important;
        z-index: 10000 !important;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Highlight the target element
  function highlightElement() {
    try {
      const element = document.querySelector(highlightSelector);
      
      if (element) {
        // Inject styles first
        injectStyles();
        
        // Add highlight class
        element.classList.add('dead-click-highlight');
        
        // Store original styles to restore later
        const originalBorder = element.style.border;
        const originalBoxShadow = element.style.boxShadow;
        const originalZIndex = element.style.zIndex;
        const originalPosition = element.style.position;
        
        // Scroll element into view with some padding
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          });
        }, 100);
        
        // Remove highlight after 8 seconds
        setTimeout(() => {
          element.classList.remove('dead-click-highlight');
          
          // Clean up - remove injected styles if no other highlighted elements
          const highlightedElements = document.querySelectorAll('.dead-click-highlight');
          if (highlightedElements.length === 0) {
            const style = document.getElementById('dead-click-highlighter-styles');
            if (style) {
              style.remove();
            }
          }
        }, 8000);
        
        console.log('Dead Click Miner: Successfully highlighted element:', highlightSelector);
        
        // Optional: Show a notification
        showNotification('Element highlighted! This element received dead clicks.');
        
      } else {
        console.warn('Dead Click Miner: Element not found:', highlightSelector);
        showNotification('Element not found. It may have been removed or the selector changed.', 'warning');
      }
    } catch (error) {
      console.error('Dead Click Miner: Invalid selector:', highlightSelector, error);
      showNotification('Invalid CSS selector: ' + highlightSelector, 'error');
    }
  }
  
  // Show a temporary notification
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: ${type === 'error' ? '#ff4444' : type === 'warning' ? '#ff8800' : '#00aa44'} !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 6px !important;
      font-size: 14px !important;
      font-weight: bold !important;
      z-index: 99999 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      max-width: 300px !important;
    `;
    notification.textContent = '🎯 Dead Click Miner: ' + message;
    
    document.body.appendChild(notification);
    
    // Fade in
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'all 0.3s ease-out';
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
  
  // Run when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', highlightElement);
    } else {
      // DOM is already ready, run immediately
      highlightElement();
    }
  }
  
  // Initialize
  init();
  
})();