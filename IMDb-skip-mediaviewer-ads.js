// ==UserScript==
// @name           IMDb: skip media viewer advertisements
// @version        20231001
// @author         reaseno
// @description    Skips advertisements in the media viewer.
// @icon           http://imdb.com/favicon.ico
// @homepage       https://greasyfork.org/en/scripts/476492
// @namespace      https://greasyfork.org/users/781194
// @match          *://www.imdb.com/*/mediaviewer/*
// @grant          GM_addStyle
// @compatible     chrome
// @license        GPL3
// @noframes
// ==/UserScript==

"use strict";

GM_addStyle(`
    .sc-857a727e-10.bLFLMI {
        display: none;
    }
`);

// to track the previous action
let previousAction = null; // Values: "previous", "next", or null (initial state)
const previousButton = document.querySelector("div.media-viewer__page-left");
const nextButton = document.querySelector("div.media-viewer__page-right");

// Function to perform the advertisement action
function handleAdvertisement() {
    const actionBar = document.querySelector("div[data-testid=action-bar]");

    // if advertisement
    if (actionBar && !/\d/.test(actionBar.innerText)) {
        console.log("Advertisement detected");

        if (previousAction === "previous") {
            // next/prev button not clickable if not visible
            const event = new KeyboardEvent("keydown", {
                key: "ArrowLeft",
                keyCode: 37,
                which: 37,
                bubbles: true,
            });
            document.dispatchEvent(event);
        } else if (previousAction === "next") {
            // next/prev button not clickable if not visible
            const event = new KeyboardEvent("keydown", {
                key: "ArrowRight",
                keyCode: 39,
                which: 39,
                bubbles: true,
            });
            document.dispatchEvent(event);
        }
    }
}

// Create a MutationObserver to watch for changes in the action bar
const observer = new MutationObserver(() => {
    // ensures that keyboard event is handled first, otherwise wrong direction when changing direction over an ad
    setTimeout(() => {
        handleAdvertisement();
    }, 1);
});

// Start observing changes in the action bar
const actionBar = document.querySelector("div[data-testid=action-bar]");
if (actionBar) {
    observer.observe(actionBar, { childList: true, characterData: true });
}

// Listen for keydown events to track cursor direction
window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
        previousAction = "previous";
        // console.log(`event: ${previousAction}`);
    } else if (event.key === "ArrowRight") {
        previousAction = "next";
        // console.log(`event: ${previousAction}`);
    }
});

// Listen for click events on the previous and next buttons
previousButton?.addEventListener("click", function () {
    previousAction = "previous";
});

nextButton?.addEventListener("click", function () {
    previousAction = "next";
});
