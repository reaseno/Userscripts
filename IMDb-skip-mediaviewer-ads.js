// ==UserScript==
// @name           IMDb: skip media viewer advertisements
// @version        20231001
// @author         reaseno
// @description    Skips advertisments in the media viewer.
// @icon           http://imdb.com/favicon.ico
// @homepage       https://greasyfork.org/en/scripts/476492
// @namespace      https://greasyfork.org/users/781194
// @match          *://www.imdb.com/*/mediaviewer/*
// @run-at         document-start
// @compatible     chrome
// @license        GPL3
// @noframes
// ==/UserScript==

"use strict";

// Initialize variables to track the previous action
let previousAction = null; // Values: "previous", "next", or null (initial state)
const previousButton = document.querySelector("div.media-viewer__page-left");
const nextButton = document.querySelector("div.media-viewer__page-right");

// Function to perform the navigation action
function skipAdvertisement() {
    const actionBar = document.querySelector("div[data-testid=action-bar]");

    if (actionBar && !/\d/.test(actionBar.innerText)) {
        console.log("Advertisement detected");
        console.log(previousAction);

        if (previousAction === "previous" && previousButton) {
            previousButton.click();
        } else if (previousAction === "next" && nextButton) {
            nextButton.click();
        }
    }
}

// Create a MutationObserver to watch for changes in the action bar
const observer = new MutationObserver(function (mutationsList) {
    for (let mutation of mutationsList) {
        if (mutation.type === "childList" || mutation.type === "characterData") {
            // Call the navigateMediaViewer function when the action bar changes
            skipAdvertisement();
        }
    }
});

// Start observing changes in the action bar
const actionBar = document.querySelector("div[data-testid=action-bar]");
if (actionBar) {
    observer.observe(actionBar, { attributes: true, childList: true, characterData: true });
}

// Listen for keydown events to track cursor direction
window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft") {
        previousAction = "previous";
    } else if (event.key === "ArrowRight") {
        previousAction = "next";
    }
});

// Listen for click events on the previous and next buttons
previousButton?.addEventListener("click", function () {
    previousAction = "previous";
});

nextButton?.addEventListener("click", function () {
    previousAction = "next";
});

// Call navigateMediaViewer initially (in case the page is already in the desired state)
skipAdvertisement();
