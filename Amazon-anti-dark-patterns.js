// ==UserScript==
// @name           Amazon Anti Dark Patterns
// @name:de        Amazon Anti Dark Patterns
// @version        20230624
// @author         reaseno
// @description    Is intended to prevent additional charges such as accidental subscriptions, as Amazon provokes this.
// @description:de Soll Zusatzkosten wie versehentliche Abonnements verhindern, da Amazon dies provoziert.
// @homepage       https://greasyfork.org/en/scripts/427663/
// @namespace      https://greasyfork.org/users/781194
// @match          https://www.amazon.de/*
// @exclude        /(.*=.*amazon|.*amazon.*\/signin.*).*$
// @icon           https://icons.duckduckgo.com/ip2/amazon.de.ico
// @grant          GM_addStyle
// @run-at         document-start
// @compatible     chrome
// @license        GPL License
// @noframes
// ==/UserScript==

// CSS
GM_addStyle(`
  /* amazon visa */
  div#sc-new-upsell, div#percolate-ui-ilm_div,
  /* buy now button */
  div#buyNow_feature_div,
  /* premium delivery checkbox in product details */
  div#bbop,
  /* premium commerical in checkout */
  table.adStripe2
  {
      display: none;
  }
  /* emphasize needed amount left: text */
  #gutterCartViewForm div.a-alert-content {
      font-size: 15px;
  }
  /* emphasize needed amount left: price */
  #gutterCartViewForm span.a-color-price.sc-white-space-nowrap {
      font-size: 30px;
      display: block;
      margin: 10px;
  }
`);

// check if amount is enough for amazon free delivery
const totalCostObserver = new MutationObserver(() => {
  console.log("delivery check");
  const buyButton = document.querySelector("#sc-buy-box-ptc-button-announce > div > div.sc-without-multicart");
  const alertInfobox = document.querySelector("#gutterCartViewForm div.a-box.a-alert-inline.a-alert-inline-info");
  if (alertInfobox !== null) {
    buyButton.parentElement.parentElement.parentElement.parentElement.style.display = "none";
  }
});

// check Buybox changes in product details
const buyBoxObserver = new MutationObserver(() => {
  console.log("buybox check");

  // auto select "Einmalige Lieferung" instead of Spar-Abo
  // Test: https://www.amazon.de/tesafilm-transparent-Office-Box-Rollen-19mm/dp/B000KJOC1O
  document
    .evaluate('//*[contains(text(),"Einmalige Lieferung")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    .snapshotItem(0)
    ?.parentElement.parentElement.parentElement.click();

  if (
    document
      .evaluate('//*[contains(text(),"Exklusives Prime-Angebot")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      .snapshotItem(0)
  ) {
    document
      .evaluate('//*[contains(text(),"Exklusives Prime-Angebot")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      .snapshotItem(0)
      ?.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.querySelectorAll("h5")[1]
      .click();
  }
});

// check if insurance offer is blended in
const insuranceObserver = new MutationObserver(() => {
  console.log("insurance check");
  if (document.querySelector("#attach-warranty-pane").style !== "none") {
    const noThanksButton = document
      .evaluate('//span[contains(text(),"Nein, danke")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      .snapshotItem(0);
    if (noThanksButton !== null) {
      noThanksButton.click();
    }
  }
});

// check if insurance offer is blended in
const primeShippingOffers = new MutationObserver(() => {
  // console.log("prime offer shipping");
  const skipFeeableShippingOffer1 = document.evaluate(
    '//span[contains(text(),"Premiumversand mit")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < skipFeeableShippingOffer1.snapshotLength; i++) {
    skipFeeableShippingOffer1.snapshotItem(i).parentNode.parentNode.style.display = "none";
  }
  const skipFeeableShippingOffer2 = document.evaluate(
    '//span[contains(text(),"€ Premiumversand")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < skipFeeableShippingOffer2.snapshotLength; i++) {
    skipFeeableShippingOffer2.snapshotItem(i).parentNode.parentNode.style.display = "none";
  }
  const skipPrimeOffer = document.evaluate(
    '//span[contains(text(),"Amazon Prime verfügbar")]',
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < skipPrimeOffer.snapshotLength; i++) {
    skipPrimeOffer.snapshotItem(i).style.display = "none";
  }
});

// check for prime offer modal
const primeOfferModal = new MutationObserver(() => {
  const skipPrimeOffer = document
    .evaluate('//h3[contains(text(),"Exklusives Angebot:")]', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    .snapshotItem(0);
  if (skipPrimeOffer) {
    // hides prime modal
    GM_addStyle(`
        div#a-popover-lgtbox, .a-modal-scroller.a-declarative {
          opacity: 0 !important;
        }
      `);

    primeOfferModal.disconnect();

    function clickUntilAbsent(attempts = 0) {
      const modal = document.querySelector("body > div.a-modal-scroller.a-declarative");

      if (modal.style.visibility !== "hidden") {
        console.log("prime modal skipped");
        modal.click();
        if (attempts < 5) {
          setTimeout(clickUntilAbsent(attempts + 1), 500);
        }
      }
    }

    setTimeout(() => {
      clickUntilAbsent();
    }, 500);
  }
});

function main() {
  // product details: check Buybox changes
  if (document.querySelector("div#desktop_buybox")) {
    buyBoxObserver.observe(document.querySelector("div#desktop_buybox"), {
      childList: true,
      subtree: true,
    });
  }
  // product details: check if insurance offer is blended in
  if (window.location.href.match(/\/dp\//) || window.location.href.match(/\/gp\//)) {
    if (document.querySelector("div#attach-warranty-pane")) {
      insuranceObserver.observe(document.querySelector("div#attach-warranty-pane"), {
        attributeFilter: ["style"],
      });
    }
  }
  // cart: check if amount is enough for free amazon delivery
  if (window.location.href.match(/\/cart\/view.html/i)) {
    totalCostObserver.observe(document.querySelector("div#proceed-to-checkout-desktop-container"), {
      childList: true,
      subtree: true,
    });
  }
  // checkout: prime offer & shipping
  if (
    /amazon.de\/gp\/buy\/primeinterstitial\/handlers\/display.html/.test(window.location.href) ||
    /amazon.de\/gp\/buy\/spc\/handlers\/display.html/.test(window.location.href)
  ) {
    console.log("checkout shipping");
    // remove prime offer
    GM_addStyle(`
      div#osu-prime-recommendations, div.prime-ad-banner-content
      {
      display: none !important;
    }
    `);

    primeShippingOffers.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
    });
    primeOfferModal.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
    });
  }
}

document.addEventListener("DOMContentLoaded", main);

// interesting helper elements:
// https://greasyfork.org/en/scripts/419641-amazon-clean-ui/code
