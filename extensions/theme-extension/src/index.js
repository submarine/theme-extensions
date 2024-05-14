/**
 * index.js
 *
 * The entry point for Submarine theme extension components. These components are built using Web Components
 * (https://developer.mozilla.org/en-US/docs/Web/API/Web_components), following the general style and direction of
 * Shopify's Dawn theme.
 */

import CrowdfundingSelector from "./components/crowdfunding_selector";
import PresaleSelector from "./components/presale_selector";
import SubscriptionSelector from "./components/subscription_selector";

if (!customElements.get('crowdfunding-selector')) {
  customElements.define('crowdfunding-selector', CrowdfundingSelector);
}

if (!customElements.get('presale-selector')) {
  customElements.define('presale-selector', PresaleSelector);
}

if (!customElements.get('subscription-selector')) {
  customElements.define('subscription-selector', SubscriptionSelector);
}
