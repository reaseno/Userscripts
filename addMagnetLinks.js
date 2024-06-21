// ==UserScript==
// @name           Magnet Links for BT4G and Limetorrents
// @version        20240622
// @author         reaseno
// @description    Adds magnet links to BT4G and Limetorrents
// @icon           http://bt4gprx.com/favicon.ico
// @homepage       https://greasyfork.org/en/scripts/469976/
// @namespace      https://greasyfork.org/users/781194
// @match          *://bt4gprx.com/*
// @match          *://www.limetorrents.lol/search/all/*
// @run-at         document-idle
// @compatible     chrome
// @license        GPL3
// @noframes
// ==/UserScript==

"use strict";

const style = document.createElement("style");
style.textContent = `
    .magnet-link-img {
        cursor: pointer;
        margin: 0px 5px 2px;
        border-radius: 50%;
        vertical-align: bottom;
        height: 20px;
        transition: filter 0.2s ease;
    }
`;
document.head.appendChild(style);

const hostname = location.hostname;

function getSearchResultLinks() {
    if (hostname === "bt4gprx.com") {
        return document.querySelectorAll('a[href*="/magnet/"]:not([href^="magnet:"])');
    } else if (hostname === "www.limetorrents.lol") {
        return document.querySelectorAll('a[href*="//itorrents.org/torrent/"]');
    }
}

/**
 * @param {String} tag Elements HTML Tag
 * @param {String|RegExp} regex Regular expression or string for text search
 * @param {Number} index Item Index
 * @returns {Object|null} Node or null if not found
 */
function getElementByText(tag, regex, item = 0) {
    if (typeof regex === "string") {
        regex = new RegExp(regex);
    }

    const elements = document.getElementsByTagName(tag);
    let count = 0;

    for (let i = 0; i < elements.length; i++) {
        if (regex.test(elements[i].textContent)) {
            if (count === item) {
                return elements[i];
            }
            count++;
        }
    }

    return null;
}

function insertMagnetLink(link, hash) {
    const magnetLink = `magnet:?xt=urn:btih:${hash}`;
    const newLink = document.createElement("a");
    newLink.classList.add("magnet-link");
    newLink.href = magnetLink;
    newLink.addEventListener("click", function () {
        imgElement.style.filter = "grayscale(100%) opacity(0.7)";
    });

    const imgElement = document.createElement("img");
    imgElement.src = magnetImage;
    imgElement.classList.add("magnet-link-img");

    newLink.appendChild(imgElement);
    link.parentNode.insertBefore(newLink, link);
}

function extractHashFromUrl(href) {
    const hashRegex = /(^|\/|&|-|\.|\?|=|:)([a-fA-F0-9]{40})/;
    const matches = href.match(hashRegex);
    return matches ? matches[2] : null;
}

async function processLinksInSearchResults() {
    const links = Array.from(getSearchResultLinks());
    const promises = links.map(async (link) => {
        if (hostname === "bt4gprx.com") {
            await processLinksInSearchResultsBt4g(link);
        } else if (hostname === "www.limetorrents.lol") {
            await processLinksInSearchResultsLimeTorrents(link);
        }
    });

    await Promise.all(promises);

    // Add amount of magnet links into text
    const numLinks = links.length;
    const magnetLinkAllSpan = document.querySelector(".magnet-link-all-span");
    if (numLinks > 0 && magnetLinkAllSpan) {
        magnetLinkAllSpan.innerHTML = `Open all <b>${numLinks}</b> loaded magnet links`;
    }

    // Remove spam elements
    setTimeout(() => {
        links.forEach((link) => {
            const title = link.title;
            if (title.includes("Downloader.exe") || title.includes("Downloader.dmg")) {
                link.parentElement.parentElement.style.display = "none";
            }
        });
    }, 100);
}

async function processLinksInSearchResultsBt4g(link) {
    try {
        const response = await fetch(link.href);
        const html = await response.text();

        // Find magnet links
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Skip if magnet link exists
        const magnetLink = link.getAttribute("data-magnet-added");
        if (magnetLink === "true") {
            return;
        }

        const downloadLink = doc.querySelector('a[href^="//downloadtorrentfile.com/hash/"]');
        if (downloadLink) {
            const hash = extractHashFromUrl(downloadLink.href.split("/").pop().split("?")[0]);
            if (hash) {
                insertMagnetLink(link, hash);
                link.setAttribute("data-magnet-added", "true");
            }
        }
    } catch (error) {
        console.error("Error getting magnet link:", error);
    }
}

function processLinksInSearchResultsLimeTorrents(link) {
    // Skip if magnet link exists
    const magnetLink = link.getAttribute("data-magnet-added");
    if (magnetLink === "true") {
        return;
    }

    const hash = extractHashFromUrl(link.href.split("/").pop().split("?")[0]);
    if (hash) {
        insertMagnetLink(link, hash);
        link.setAttribute("data-magnet-added", "true");
        // Hide unnecessary element
        link.style.display = "none";
    }
}

function addClickAllMagnetLinks() {
    // only needed if document-start
    // const openAllMagnetLinks = document.querySelector(".magnet-link-all-span");
    // if (openAllMagnetLinks) {
    //     return;
    // }

    let itemsFoundElement;
    if (hostname === "bt4gprx.com") {
        itemsFoundElement = getElementByText("span", /Found\ [0-9].*\ items\ for\ .*/i);
    } else if (hostname === "www.limetorrents.lol") {
        itemsFoundElement = getElementByText("h2", "Search Results");
    }

    const targetElement = itemsFoundElement?.parentElement?.children[1];
    if (targetElement) {
        const openAllMagnetLinksSpan = document.createElement("span");
        openAllMagnetLinksSpan.innerHTML = "Open all <b>0</b> loaded magnet links";
        openAllMagnetLinksSpan.classList.add("magnet-link-all-span");
        openAllMagnetLinksSpan.style.marginLeft = "10px";

        const openAllMagnetLinksImg = document.createElement("img");
        openAllMagnetLinksImg.src = magnetImage;
        openAllMagnetLinksImg.classList.add("magnet-link-img");
        openAllMagnetLinksImg.style.cssText = "cursor:pointer;vertical-align:sub;";

        targetElement.parentNode.insertBefore(openAllMagnetLinksSpan, targetElement.nextSibling);
        openAllMagnetLinksSpan.parentNode.insertBefore(openAllMagnetLinksImg, openAllMagnetLinksSpan.nextSibling);

        openAllMagnetLinksImg.addEventListener("click", () => {
            const addedMagnetLinks = document.querySelectorAll("a.magnet-link");
            if (addedMagnetLinks.length > 0) {
                openAllMagnetLinksImg.style.filter = "grayscale(100%) opacity(0.7)";
                addedMagnetLinks.forEach((link, index) => {
                    setTimeout(() => {
                        link.click();
                    }, index * 100);
                });
            } else {
                openAllMagnetLinksSpan.textContent = "No magnet links found";
            }
        });

        // for a fixed position and more space, remove superfluous information
        if (hostname === "bt4gprx.com") {
            itemsFoundElement.innerHTML = itemsFoundElement.innerHTML.replace(/(\ items)\ for\ .*/, "$1");
        } else if (hostname === "www.limetorrents.lol") {
            itemsFoundElement.textContent = "";
        }
    }
}

function observeSearchResults() {
    const observer = new MutationObserver(() => {
        observer.disconnect();
        setTimeout(() => {
            processLinksInSearchResults().then(() => {
                observeSearchResults();
            });
        }, 500);
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
    });
}

function main() {
    // search results page
    if (window.location.href.match(/\/search/)) {
        addClickAllMagnetLinks();
        observeSearchResults();
        processLinksInSearchResults();
    }

    // BT4G only: torrent detail page
    if (window.location.href.match(/\/magnet/)) {
        const link = document.querySelector('a[href*="/hash/"]:not([href^="magnet:"])');
        const hash = extractHashFromUrl(link.href || "");
        if (hash) {
            insertMagnetLink(link, hash);
        }
    }
}

let magnetImage =
    "data:image/png;base64,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";

main();
