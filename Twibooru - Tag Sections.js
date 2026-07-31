// ==UserScript==
// @name         Twibooru - Tag Sections
// @description  Groups tags into Watched, Spoiled, Hidden, and Other sections
// @namespace    http://tampermonkey.net/
// @version      2.11
// @author       PixelSpark987 - https://is.gd/PS987
// @homepage     https://github.com/PixelSpark987/Twibooru-Tag-Sections
// @downloadURL  https://raw.githubusercontent.com/PixelSpark987/Twibooru-Tag-Sections/refs/heads/main/Twibooru%20-%20Tag%20Sections.js
// @updateURL    https://raw.githubusercontent.com/PixelSpark987/Twibooru-Tag-Sections/refs/heads/main/Twibooru%20-%20Tag%20Sections.js
// @match        *://twibooru.org/*
// @match        *://*.twibooru.org/*
// @match        *://derpibooru.org/*
// @match        *://*.derpibooru.org/*
// @match        *://manebooru.art/*
// @match        *://*.manebooru.art/*
// @match        *://ponerpics.org/*
// @match        *://*.ponerpics.org/*
// @match        *://tantabus.ai/*
// @match        *://*.tantabus.ai/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Inject CSS for section headers, native tag spacing, and crisp inner-box context menu borders
    const style = document.createElement('style');
    style.textContent = `
        /* Mirror native tag container flex layout */
        .tm-tag-group {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            margin-bottom: 8px !important;
        }

        /* Force Philomena's native tag margins back onto every tag inside our groups */
        .tm-tag-group .tag {
            margin: 0 0.25em 0.25em 0 !important;
            position: relative !important;
        }

        .tm-tag-section {
            margin-bottom: 12px;
        }

        /* Elevate the active hovered tag above all adjacent tags */
        .tm-tag-group .tag.dropdown:hover,
        .tm-tag-group .tag.dropdown:focus-within {
            z-index: 9999 !important;
        }

        /* Force border to render strictly inside the box using border-box */
        .tm-tag-group .dropdown__content {
            box-sizing: border-box !important;
            margin-top: 0 !important;
            border: 1px solid rgba(255, 255, 255, 0.35) !important;
            outline: none !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
            z-index: 10000 !important;
        }

        /* Prevent pseudo-elements from drawing extra top border lines */
        .tm-tag-group .dropdown__content::before,
        .tm-tag-group .dropdown__content::after {
            display: none !important;
        }

        /* Hover bridge to keep dropdown active smoothly on transition */
        .tm-tag-group .tag.dropdown::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -6px;
            height: 8px;
            z-index: 9998;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);

    function createSection(id, title) {
        const section = document.createElement('div');
        section.id = id;
        section.className = 'tm-tag-section';
        section.innerHTML = `
            <h4 class="block__header block__header--sub" style="margin: 0 0 6px 0; font-weight: bold; font-size: 0.9em;">${title}</h4>
            <div class="tm-tag-group tagsauce tag-list"></div>
        `;
        return section;
    }

    function organizeTags() {
        const tagsauce = document.querySelector('.tagsauce') || document.querySelector('[id^="image_tags_and_source_"]')?.nextElementSibling;
        if (!tagsauce) return;

        const tags = Array.from(tagsauce.querySelectorAll('.tag.dropdown'));
        if (tags.length === 0) return;

        let watchedSection = document.getElementById('tm-watched-tags');
        let spoiledSection = document.getElementById('tm-spoiled-tags');
        let hiddenSection = document.getElementById('tm-hidden-tags');
        let unwatchedSection = document.getElementById('tm-unwatched-tags');

        if (!watchedSection) {
            watchedSection = createSection('tm-watched-tags', 'Watched Tags');
            spoiledSection = createSection('tm-spoiled-tags', 'Spoiled Tags');
            hiddenSection = createSection('tm-hidden-tags', 'Hidden Tags');
            unwatchedSection = createSection('tm-unwatched-tags', 'Other Tags');

            // Insert in order: Watched -> Spoiled -> Hidden -> Other
            tagsauce.prepend(unwatchedSection);
            tagsauce.prepend(hiddenSection);
            tagsauce.prepend(spoiledSection);
            tagsauce.prepend(watchedSection);
        }

        const watchedGroup = watchedSection.querySelector('.tm-tag-group');
        const spoiledGroup = spoiledSection.querySelector('.tm-tag-group');
        const hiddenGroup = hiddenSection.querySelector('.tm-tag-group');
        const unwatchedGroup = unwatchedSection.querySelector('.tm-tag-group');

        tags.forEach(tag => {
            const isWatched = tag.querySelector('.tag__state[title="Watched"]:not(.hidden)');
            const isSpoiled = tag.querySelector('.tag__state[title="Spoilered"]:not(.hidden), .tag__state[title="Spoiled"]:not(.hidden)');
            const isHidden = tag.querySelector('.tag__state[title="Hidden"]:not(.hidden)');

            if (isWatched) {
                watchedGroup.appendChild(tag);
            } else if (isSpoiled) {
                spoiledGroup.appendChild(tag);
            } else if (isHidden) {
                hiddenGroup.appendChild(tag);
            } else {
                unwatchedGroup.appendChild(tag);
            }
        });
    }

    // Run on initial page load
    organizeTags();

    // Listen for clicks on Watch/Unwatch/Spoiler/Hide dropdown buttons directly
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-tag-action]');
        if (link) {
            let attempts = 0;
            const interval = setInterval(() => {
                organizeTags();
                attempts++;
                if (attempts >= 20) {
                    clearInterval(interval);
                }
            }, 100);
        }
    });

    // Observer setup: Watch for DOM structure AND class attribute changes
    let isProcessing = false;
    const observer = new MutationObserver(() => {
        if (isProcessing) return;
        isProcessing = true;

        organizeTags();

        setTimeout(() => { isProcessing = false; }, 50);
    });

    const targetNode = document.querySelector('.js-tagsauce') || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
})();
