// public/collector.js
(function() {
  console.log("Collector 2 script launched.")
  const params = new URLSearchParams(window.location.search);
  
  // Check if we are in preview mode
  if (params.has('dead_click_preview')) {
    // --- DISPLAY MODE ---
    console.log("Dead Click Miner: Preview Mode Activated.");
    document.addEventListener('DOMContentLoaded', activatePreviewMode);
  } else {
    // --- COLLECTION MODE ---
    // (This is your existing click tracking logic)
    initializeCollectionMode();
  }

  function activatePreviewMode() {
    console.log("Activating preview mode.");
    const storeUrl = window.location.hostname;
    const pagePath = window.location.pathname;
    
    // Fetch click data for the current page

    // Auto-detect API URL based on environment
    const isDev = false;
    const apiBaseUrl = isDev ? 'https://rankings-ellen-commands-mac.trycloudflare.com' : 'https://dead-click-miner.vercel.app';
    const apiUrl = `${apiBaseUrl}/api/insights/preview`;
    const fullUrl = `${apiUrl}?path=${encodeURIComponent(pagePath)}&store=${encodeURIComponent(storeUrl)}`;
    
    console.log('Dead Click Miner Debug:', {
      storeUrl,
      pagePath,
      isDev,
      apiBaseUrl,
      fullUrl
    });
    
    fetch(fullUrl)
      .then(res => {
        console.log('API Response status:', res.status, res.statusText);
        return res.json();
      })
      .then(data => {
        console.log('API Response data:', data);
        console.log('Element stats count:', data.element_stats?.length || 0);
        console.log('Click positions count:', data.click_positions?.length || 0);
        
        // Handle element stats (for highlighting)
        data.element_stats.forEach(stat => {
          const element = document.querySelector(stat.selector);
          if (element) {
            element.style.outline = '3px solid red';
            element.style.position = 'relative';
            
            // Add click count badge
            const badge = document.createElement('div');
            badge.innerHTML = `${stat.click_count} clicks`;
            badge.style.cssText = `
              position: absolute;
              top: -25px;
              right: -10px;
              background: red;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: bold;
              z-index: 99999;
              pointer-events: none;
            `;
            element.appendChild(badge);
          }
        });
        
        // Handle click positions (for dots)
        console.log('Processing click positions...');
        
        // Store click data globally for resize handling
        window.deadClickData = data.click_positions;
        
        // Function to position dots
        function positionDots() {
          // Remove existing dots
          document.querySelectorAll('.dead-click-dot').forEach(dot => dot.remove());
          
          window.deadClickData.forEach((click, index) => {
            console.log(`Click ${index + 1}:`, click);
            
            // Find the target element for this click
            const targetElement = document.querySelector(click.selector);
            if (!targetElement) {
              console.warn(`Target element not found for selector: ${click.selector}`);
              return;
            }
            
            // Get element position and size
            const rect = targetElement.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            // Calculate absolute position from element-relative coordinates
            const absoluteX = rect.left + scrollX + (click.x * rect.width);
            const absoluteY = rect.top + scrollY + (click.y * rect.height);
            
            const dot = document.createElement('div');
            dot.className = 'dead-click-dot';
            dot.style.cssText = `
              position: absolute !important;
              width: 16px !important;
              height: 16px !important;
              background: red !important;
              border-radius: 50% !important;
              border: 2px solid white !important;
              box-shadow: 0 0 10px rgba(255, 0, 0, 0.8) !important;
              z-index: 2147483647 !important;
              pointer-events: none !important;
              left: ${absoluteX - 8}px !important;
              top: ${absoluteY - 8}px !important;
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
            `;

            document.body.appendChild(dot);
          });
        }
        
        // Initial positioning
        positionDots();
        
        // Reposition on window resize
        window.addEventListener('resize', positionDots);
      })
      .catch(error => {
        console.error('Failed to load preview data:', error);
      });
      
    // Ensure navigation within the site stays in preview mode
    preservePreviewMode();
  }

  function preservePreviewMode() {
    document.querySelectorAll('a').forEach(link => {
      try {
        const url = new URL(link.href);
        if (url.hostname === window.location.hostname) { // Only modify internal links
          url.searchParams.set('dead_click_preview', 'true');
          link.href = url.toString();
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  }

  function initializeCollectionMode() {
    console.log("Activating collection mode.");
    
    // Auto-detect API URL based on environment
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1');
    const apiBaseUrl = isDev ? 'http://localhost:3000' : 'https://dead-click-miner.vercel.app';
    
    document.addEventListener('click', function(event) {
    console.log("Event triggered.");
    let element = event.target;
    // Check if the element or its parents are clickable
    if (element.closest('a, button, input[type="submit"], input[type="button"]')) {
    return; // It's a valid, clickable element
    }

    // Capture click coordinates
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Normalize coordinates
    const normalizedX = x / element.offsetWidth;
    const normalizedY = y / element.offsetHeight;

    // If we got here, it's likely a dead click
    const data = {
        store_url: window.location.hostname,
        page_path: window.location.pathname,
        target_selector: getCssSelector(element), // You'll need a function for this
        click_x: Math.round(normalizedX * 10000) / 10000,
        click_y: Math.round(normalizedY * 10000) / 10000
    };

    const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true
    }

    // Send the data to your API
    const trackingUrl = `${apiBaseUrl}/api/track`;
  
    fetch(trackingUrl, fetchOptions)
        .then(response => {
          if (response && response.ok) {
            console.log('Dead click tracked successfully');
          }
        })
        .catch(error => console.error('Dead Click Miner Error:', error));
    }, true);
  }

  function getCssSelector(el) {
    if (el.id) {
        return `${el.tagName.toLowerCase()}#${el.id}`;
    }
  
    if (el.className) {
        return `${el.tagName.toLowerCase()}.${el.className.split(' ').join('.')}`;
    }
  
    let selector = el.tagName.toLowerCase();
    let parent = el.parentElement;
  
    if (parent) {
        let index = Array.from(parent.children).indexOf(el) + 1;
        selector = `${getCssSelector(parent)} > ${selector}:nth-child(${index})`;
    }
  
    return selector;
    }

})();