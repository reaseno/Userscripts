// ==UserScript==
// @name           BT4G Add Magnet Links
// @version        20230702
// @author         reaseno
// @description    Adds magnet links to the search list of BT4G
// @icon           http://bt4gprx.com/favicon.ico
// @homepage       https://greasyfork.org/en/scripts/469976/
// @namespace      https://greasyfork.org/users/781194
// @match          *://bt4gprx.com/*
// @run-at         document-start
// @compatible     chrome
// @license        GPL3
// @noframes
// ==/UserScript==

"use strict";

function createMagnetLink(link, hash) {
    const magnetLink = "magnet:?xt=urn:btih:" + hash;

    const newElement = document.createElement("a");
    newElement.setAttribute("href", magnetLink);

    const imgElement = document.createElement("img");
    imgElement.setAttribute("src", "https://cdn.jsdelivr.net/gh/zxf10608/JavaScript/icon/magnet00.png");
    imgElement.setAttribute("class", "magnet");
    imgElement.setAttribute("target", "_self");
    imgElement.setAttribute(
        "style",
        "cursor:pointer;margin:0px 5px 2px;border-radius:50%;vertical-align:middle;height:20px!important;width:20px!important;"
    );

    newElement.appendChild(imgElement);
    link.parentNode.insertBefore(newElement, link);
}

function getHashFromHref(href) {
    const reg = /(^|\/|&|-|\.|\?|=|:)([a-fA-F0-9]{40})/;
    const matches = href.match(reg);
    return matches ? matches[2] : null;
}

// ----------------------------------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------------------------------

// search page
if (window.location.href.match(/\/search/)) {
    const links = document.querySelectorAll('a[href*="/magnet/"]:not([href^="magnet:"])');
    links.forEach((link) => {
        fetch(link.href)
            .then((response) => response.text())
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const downloadLink = doc.querySelector('a[href^="//downloadtorrentfile.com/hash/"]');
                if (downloadLink) {
                    const hash = getHashFromHref(downloadLink.href.split("/").pop().split("?")[0]);
                    if (hash) {
                        createMagnetLink(link, hash);
                    }
                }
            })
            .catch((error) => {
                console.error("Error getting magnet link:", error);
            });
    });

    // remove spam elements
    setTimeout(() => {
        // first element is not relevant and creates an error
        const mainObjects = [].slice.call(document.querySelectorAll("body > main > div > div:nth-child(4) > div > div"), 1);

        for (let mainObject of mainObjects) {
            if (mainObject.childNodes[1].innerText.match("Downloader.exe")) {
                mainObject.style = "display:none";
            }
        }
    }, 100);
}

// details page
if (window.location.href.match(/\/magnet/)) {
    const links = document.querySelectorAll('a:not([href^="magnet:"])');
    links.forEach((link) => {
        const hash = getHashFromHref(link.getAttribute("href") || "");
        if (hash) {
            createMagnetLink(link, hash);
        }
    });
}
