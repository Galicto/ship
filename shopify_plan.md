# Shopify Integration Strategy

## The Goal
The user has a custom HTML/CSS/JS single-page dropshipping storefront. They want to integrate it into their Shopify account (`mavis-1773032239.myshopify.com`) so that the "Add to Cart" and "Checkout" actions actually process through their Shopify backend, inventory, and payment gateways.

## Two Main Approaches

### Approach 1: Convert HTML/CSS to a Custom Shopify Theme (.liquid)
**Pros:** 
- Fully native Shopify experience.
- The user's exact design becomes the whole website.
- Product data (price, images) is dynamically pulled from the backend.

**Cons:** 
- Requires converting the static HTML to Liquid templates (`theme.liquid`, `index.liquid`, `product.liquid`).
- Can be complex to set up without Shopify CLI installed locally and authenticated to the user's store.
- Requires uploading the theme zip.

### Approach 2: Use Shopify Buy Button (Headless/Static Approach)
**Pros:**
- We keep the current `HTML/CSS/JS` files exactly as they are.
- We replace our custom JavaScript cart/checkout logic with the Shopify Buy Button JS SDK.
- When users click "Add to Cart", it opens the official Shopify slide-out cart.
- Very fast to implement.
- Perfect for single-product landing pages (like this one).

**Cons:**
- Product pricing and images in the HTML are still static unless fetched via the Storefront API.
- User needs to generate a Buy Button script from their Shopify admin.

## Recommended Path: Shopify JavaScript Buy SDK (Storefront API)
The most robust "headless" way to make a static HTML site work with Shopify without needing the user to give us their password or install the CLI is to use the **Shopify JavaScript Buy SDK (`shopify-buy`)**.

1. We include the SDK via CDN.
2. We ask the user to provide their **Storefront Access Token**.
3. We fetch the product data (price, title) dynamically on load.
4. We wire up the "Add to Cart" and checkout buttons to use the SDK's `checkout.create()` and `checkout.addLineItems()`.
5. We redirect the user to the native Shopify web checkout url.

OR

The simplest path if the user doesn't know how to get a Storefront API token: **Shopify Buy Button embed code.**

Let me ask the user how they want to proceed.
