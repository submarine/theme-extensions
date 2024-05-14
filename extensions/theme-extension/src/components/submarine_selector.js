/**
 * submarine_selector.js
 *
 * The base web component for Submarine. It rolls up common functionality such as detecting variant
 * selection changes on the product page (regardless of theme framework in use), the refreshing of
 * the component content when that variant or the selected selling plan changes, and the
 * maintenance of appropriate query parameters in the URL as selling plans change.
 */

// Return true if the current theme supports the `subscribe` method common to Shopify themes
// allowing the detection of variant changes.
const variantChangeSubscriptionSupported = () =>
  // eslint-disable-next-line no-undef
   !!window.subscribe && !!PUB_SUB_EVENTS && !!PUB_SUB_EVENTS.variantChange
;

// Define an alternative variant change subscription method that detects changes in the `variant`
// query parameter in the product page URL for when the `subscribe` method is not available.
const subscribeFallback = () => {
  const handleDocumentChange = () => {
    const currentUrl  = new URL(document.URL);
    const urlVariant = currentUrl.searchParams.get("variant");

    if(!!urlVariant && urlVariant !== this.productVariantId) {
      this.handleVariantChange(this.sectionId, {
        id: urlVariant
      });
    }
  }

  document.addEventListener("change", handleDocumentChange);

  return () => {
    document.removeEventListener("change", handleDocumentChange);
  };
};

// Attempt to determine the `id` attribute value of the product form related to a Submarine
// selector component. Achieves this by looking for `<form>` elements with known ID patterns,
// starting with the default product form ID pattern used by themes based on Shopify's Dawn.
const getValidProductFormId = (defaultProductFormId, sectionId) => [

    // the default form id pattern used by Dawn-based themes
    defaultProductFormId,

    // an alternate form id pattern used by Switch themes
    `ProductForm-${sectionId}`

  ].find(productFormId => !!document.getElementById(productFormId));

export default class SubmarineSelector extends HTMLElement {

  constructor() {
    super();

    // set initial internal attributes from data- attributes on the component
    this.sectionId = this.dataset.sectionId;
    this.productVariantId = this.dataset.productVariantId;
    this.sellingPlanId = this.dataset.sellingPlanId;
    this.defaultProductFormId = this.dataset.defaultProductFormId;
  }

  variantChangeUnsubscriber = undefined;

  connectedCallback() {
    document.addEventListener("DOMContentLoaded", () => {
      this.subscribeToVariantChange();
    });

    // listen to changes to selling plan input elements
    this.addEventListener("change", (event) => {
      if(event.target.name === "selling_plan") {
        this.handleSellingPlanChange(this.sectionId, {
          id: event.target.value
        });
      }
    });

    // trigger initial update of the url and product form id
    this.updateUrl();
    this.updateProductFormId();
  }

  disconnectedCallback() {
    if (this.variantChangeUnsubscriber) {
      this.variantChangeUnsubscriber();
    }
  }

  subscribeToVariantChange() {
    if(variantChangeSubscriptionSupported()) {
      // eslint-disable-next-line no-undef
      this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
        this.handleVariantChange(event.data.sectionId, event.data.variant);
      });
    } else {
      this.variantChangeUnsubscriber = subscribeFallback((sectionId, variantId) => {
        this.handleVariantChange(sectionId, { id: variantId });
      });
    }
  }

  handleVariantChange(sectionId, variant) {
    // do nothing if the change is not targeting this section
    if (sectionId !== this.sectionId) {
      return;
    }

    this.productVariantId = variant.id;

    this.updateUrl();
    this.updateComponent();
  }

  handleSellingPlanChange(sectionId, sellingPlan) {
    // do nothing if the change is not targeting this section
    if (sectionId !== this.sectionId) {
      return;
    }

    this.sellingPlanId = sellingPlan.id;

    this.updateUrl();
    this.updateComponent();
  }

  updateUrl() {
    const searchParams = new URLSearchParams(window.location.search);

    if(searchParams.get("selling_plan") || this.sellingPlanId) {
      searchParams.set("selling_plan", this.sellingPlanId);
      const newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState(null, "", newRelativePathQuery);
    }
  }

  updateComponent() {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("section_id", this.sectionId);
    searchParams.set("variant", this.productVariantId);
    searchParams.set("selling_plan", this.sellingPlanId);
    const newRelativePathQuery = `${window.location.pathname}?${searchParams.toString()}`;

    fetch(newRelativePathQuery).then(async response => {
      const responseText = await response.text();
      const responseDocument = new DOMParser().parseFromString(responseText, "text/html");
      const responseSelectorElement = responseDocument.querySelector(`${this.tagName}[data-section-id="${this.sectionId}"]`);
      this.innerHTML = responseSelectorElement.innerHTML;

      this.updateProductFormId();
    });
  }

  updateProductFormId() {
    const validProductFormId = getValidProductFormId(this.defaultProductFormId, this.sectionId);

    // if the default product form id is valid, we don't need to do anything
    if(validProductFormId === this.defaultProductFormId) {
      return;
    }

    // otherwise, update any form attribute references on inputs inside the component
    this.querySelectorAll(`input[form="${this.defaultProductFormId}"]`).forEach(input => {
      input.setAttribute('form', validProductFormId);
    });
  }
}
