/**
 * nav-active.js
 * ─────────────────────────────────────────────────────────────────
 * Detects the current page URL and marks the matching nav links
 * with the `.active` class + `aria-current="page"` attribute.
 *
 * Works for BOTH the desktop navbar links (.nav-link) and the
 * mobile hamburger menu links (#mobile-menu a).
 *
 * Hover styles and active styles are kept separate in style.css.
 * ─────────────────────────────────────────────────────────────────
 */
(function () {
    'use strict';

    /**
     * Extract just the filename (e.g. "about.html") from a full URL
     * or relative path. Falls back to '' for root / index.
     */
    function getFilename(href) {
        if (!href) return '';
        try {
            // Build a full URL from the href so we can use URL API
            var url = new URL(href, window.location.href);
            // Get the last segment of the pathname (the filename)
            var parts = url.pathname.split('/').filter(Boolean);
            return parts.length ? parts[parts.length - 1] : '';
        } catch (e) {
            // Fallback: plain string split
            var plain = href.split(/[?#]/)[0];
            var segments = plain.split('/').filter(Boolean);
            return segments.length ? segments[segments.length - 1] : '';
        }
    }

    /**
     * The current page filename. 
     * Root "/" or empty → treat as "index.html".
     */
    function getCurrentFilename() {
        var parts = window.location.pathname.split('/').filter(Boolean);
        var name = parts.length ? parts[parts.length - 1] : '';
        return name || 'index.html';
    }

    /**
     * Apply or remove the active state on a single <a> element.
     * @param {HTMLAnchorElement} link
     * @param {string} currentFile  - current page filename
     */
    function applyActiveState(link, currentFile) {
        var linkFile = getFilename(link.getAttribute('href'));

        // Special case: href="#" or href="" → treat as index.html (Home)
        var href = link.getAttribute('href') || '';
        if (href === '#' || href === '' || href === './') {
            linkFile = 'index.html';
        }

        var isActive = (linkFile === currentFile);

        if (isActive) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        }
    }

    /**
     * Run after DOM is ready.
     */
    function init() {
        var currentFile = getCurrentFilename();

        // ── Desktop navbar links ──────────────────────────────────
        // All elements with class "nav-link" inside #navbar
        var desktopLinks = document.querySelectorAll('#navbar .nav-link');
        desktopLinks.forEach(function (link) {
            applyActiveState(link, currentFile);
        });

        // ── Mobile menu links ─────────────────────────────────────
        // All <a> tags inside #mobile-menu (excluding the Book Now button wrapper)
        var mobileLinks = document.querySelectorAll('#mobile-menu a:not(.mt-4)');
        mobileLinks.forEach(function (link) {
            applyActiveState(link, currentFile);
        });
    }

    // Run when DOM is fully parsed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already ready (script loaded after DOMContentLoaded)
        init();
    }
})();
