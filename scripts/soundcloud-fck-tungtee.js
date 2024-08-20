/*
 *          M""""""""`M            dP
 *          Mmmmmm   .M            88
 *          MMMMP  .MMM  dP    dP  88  .dP   .d8888b.
 *          MMP  .MMMMM  88    88  88888"    88'  `88
 *          M' .MMMMMMM  88.  .88  88  `8b.  88.  .88
 *          M         M  `88888P'  dP   `YP  `88888P'
 *          MMMMMMMMMMM    -*-  Created by Zuko  -*-
 *
 *          * * * * * * * * * * * * * * * * * * * * *
 *          * -    - -   F.R.E.E.M.I.N.D   - -    - *
 *          * -  Copyright © 2024 (Z) Programing  - *
 *          *    -  -  All Rights Reserved  -  -    *
 *          * * * * * * * * * * * * * * * * * * * * *
 */

// ==UserScript==
// @name         Soundcloud Fuck TungTee
// @namespace    http://tampermonkey.net/
// @version      2024-08-20
// @description  Removing annoying tracks from "Tùng Tee - 0967671***"
// @author       Zuko <tansautn@gmail.com>
// @match        https://soundcloud.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=soundcloud.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function removeUnwantedItems() {
        const items = document.querySelectorAll('li.soundList__item');
        items.forEach(item => {
            const link = item.querySelector('a.soundTitle__username[href="/djtungte1995"]');
            if (link) {
                item.remove();
            }
        });
    }
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('li.soundList__item')) {
                        const link = node.querySelector('a.soundTitle__username[href="/djtungte1995"]');
                        if (link) {
                            node.remove();
                        }
                    }
                    else if (node.nodeType === Node.ELEMENT_NODE) {
                        removeUnwantedItems();
                    }
                });
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    removeUnwantedItems();
})();
