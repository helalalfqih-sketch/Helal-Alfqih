# Indexes Store - Customer-First Intelligent Shopping Experience Upgrade

## Executive Summary & Architecture Overview

This document defines the production engineering roadmap for the **Customer-First Intelligent Shopping Experience Upgrade** on Indexes Store (`indexes_store`).

### Core Architecture & Production Constraints
1. **Preservation of Core Commerce**: All existing production capabilities (3D product presentation, cart, currency switcher, cash on delivery, WhatsApp order sharing, Firestore sync, account drawer, and order tracking) are fully preserved.
2. **Release 1 (Production Ready)**: Built and integrated directly into the live storefront without behind-flag blocking. Immediate value for customers on slow internet connections or weak networks.
3. **Releases 2 & 3 (Feature Flagged Inactive)**: Strictly defined with typed TS contracts, database schema hooks, and feature flags set to `false` (`RELEASE_2_INTELLIGENT_ASSISTANT = false`, `RELEASE_3_DIFFERENTIATED_EXP = false`).
4. **Resilience & Offline First**: Local-first storage (`localStorage`) backed by Firestore synchronization to ensure smooth performance even during connection drops.

---

## Release 1: Customer Convenience Foundation (Shipped & Active)

| Feature | Target Problem | Solution & UX Implementation | Technical Implementation File(s) |
| :--- | :--- | :--- | :--- |
| **1. Bandwidth Adaptive Lite Mode** | Slow/unstable network connections in Yemen | Auto-detects Network Information API (`effectiveType`, `saveData`). Automatically turns off WebGL 3D Globe scenes, heavy animations, and high-res media. | `src/lib/liteMode.ts`, `src/components/LiteModeToggle.tsx` |
| **2. Persistent Cart & Opaque Token Recovery** | Unintended cart resets or sharing cart across devices | Saves cart state locally and generates an opaque short token (`cart_token=...`). Allows customers to share or restore carts without requiring login. | `src/lib/persistentCart.ts`, `src/components/CartShareModal.tsx` |
| **3. Smart Yemen Address Book** | Incomplete addresses or wrong phone numbers leading to delivery failures | Normalized phone validation (9-digit Yemeni numbers starting with 77/78/73/71/70/01). Structured Governorates, District, Street, and Nearest Landmark. | `src/lib/yemenAddress.ts`, `src/components/SmartAddressBookModal.tsx` |
| **4. Verified Order Self-Service** | Order modification friction (changing delivery address or phone) | Editable status check (`received` or `processing`). Self-service address change, phone update, delivery notes, and reschedule. | `src/lib/orderSelfService.ts`, `src/components/OrderSelfServiceModal.tsx` |
| **5. Post-Purchase Customer Hub** | Lack of post-purchase clarity & warranty info | Live interactive order tracking stepper, reorder with stock/price revalidation, verified accessories, usage guides & warranty, support ticket submission. | `src/lib/orderSelfService.ts`, `src/components/PostPurchaseHubModal.tsx` |

---

## Release 2: Intelligent Shopping Assistant (Contract Spec - Flagged Inactive)

To enable Release 2, set `RELEASE_2_INTELLIGENT_ASSISTANT = true` in `src/lib/featureFlags.ts`.

### Typed Contracts & Interfaces (`src/types/releases.ts`)

```typescript
export interface VisualSearchRequest {
  mediaType: 'image' | 'video_frame' | 'camera';
  mediaDataUrl?: string;
  fileSizeBytes?: number;
  consentGiven: boolean;
}

export interface VisualSearchResult {
  confidence: 'exact' | 'likely' | 'similar' | 'no_match';
  matchingAttributes: string[];
  candidateProducts: Product[];
  explanationAr: string;
}

export interface VoiceOrderDraftRequest {
  audioBlobUrl?: string;
  transcriptionAr?: string;
}

export interface VoiceOrderDraftResult {
  transcriptionAr: string;
  detectedProducts: { product: Product; quantity: number; confidence: number }[];
  detectedGovernorate?: string;
  requiresCustomerConfirmation: boolean;
}

export interface BudgetCartRequest {
  maxBudgetYER: number;
  shoppingPurpose: 'personal' | 'gift' | 'family' | 'work';
  recipientsCount: number;
  requiredCategories: string[];
  includeShippingInBudget: boolean;
}

export interface BudgetCartResult {
  recommendedProducts: Product[];
  subtotalYER: number;
  shippingYER: number;
  totalYER: number;
  remainingBudgetYER: number;
  explanationAr: string;
}

export interface ProductQARequest {
  productId: string;
  questionAr: string;
}

export interface ProductQAResult {
  answerAr: string;
  sourceLabel: 'verified_spec' | 'warranty_policy' | 'shipping_rule' | 'unavailable_info';
  isGrounded: boolean;
  canEscalateToHuman: boolean;
}

export interface UseCaseComparisonRequest {
  productIds: string[];
  intendedUse: string;
  primaryPreference: 'durability' | 'battery' | 'price' | 'luxury' | 'portability';
}

export interface UseCaseComparisonResult {
  bestFitProductId: string;
  tradeoffsAr: { productId: string; advantages: string[]; limitations: string[] }[];
}
```

---

## Release 3: Differentiated Experience (Contract Spec - Flagged Inactive)

To enable Release 3, set `RELEASE_3_DIFFERENTIATED_EXP = true` in `src/lib/featureFlags.ts`.

### Typed Contracts & Interfaces (`src/types/releases.ts`)

```typescript
export interface PersonalizedVideoConfig {
  productId: string;
  useCase: 'home' | 'car' | 'gift' | 'daily_use' | 'problem_solving';
  aspectRatio: '9:16' | '16:9';
  approvedVideoUrl?: string;
}

export interface GroupShoppingRoom {
  roomId: string;
  creatorName: string;
  activeItems: { product: Product; votes: number; suggestedBy: string }[];
  expiresAt: string;
}

export interface GiftOrderConfig {
  hidePriceFromRecipient: boolean;
  greetingCardMessageAr?: string;
  giftWrappingType?: 'royal_box' | 'velvet_ribbon' | 'classic';
  recipientAddressLink?: string;
  scheduledDeliveryDate?: string;
}

export interface ProductTrustPassport {
  productId: string;
  verifiedSpecs: Record<string, string>;
  packageContents: string[];
  lastPriceUpdate: string;
  warrantyPolicyAr: string;
  returnPolicyAr: string;
  isMediaOriginalVerified: boolean;
}

export interface SpacePreviewConfig {
  productId: string;
  roomPhotoUrl?: string;
  verifiedDimensionsCm: { width: number; height: number; depth?: number };
  disclaimerAr: string;
}
```

---

## Security, Data Integrity & Resilience Matrix

1. **Firestore Security Rules**:
   - `orders`: Public create allowed for Guest checkout. Read allowed with order ID or token. Update allowed only for editable fields when status is `received` or `processing`.
   - `order_change_requests`: Append-only collection for customer self-service requests.
   - `customer_support_requests`: Append-only collection for support tickets.
2. **Input Normalization & Sanitization**:
   - Phone numbers sanitized with `validateYemenPhone()` to strip country codes (`+967`, `00967`) and enforce 9-digit Yemeni phone validation.
   - Address fields stripped of HTML/script tags before Firestore persistence.
3. **Cart Token Expiry & Revalidation**:
   - Shared cart tokens expire after 14 days. Re-indexing against real-time product inventory prevents out-of-stock items or outdated prices from causing invalid checkout states.

---

## Branching & Pull Request Strategy

- **PR 1 (Merged - Release 1)**: `feat/customer-convenience-foundation`
  - Lite Mode Network Toggle
  - Persistent Cart & Token Recovery
  - Smart Yemen Address Book
  - Verified Order Self-Service & Post-Purchase Customer Hub
- **PR 2 (Feature Flagged - Release 2)**: `feat/intelligent-shopping-assistant`
  - Visual Search, Voice Order Draft, Budget Cart Optimizer, Grounded Q&A
- **PR 3 (Feature Flagged - Release 3)**: `feat/differentiated-shopping-experience`
  - Personalized Videos, Group Shopping Rooms, Gift Order, Trust Passports, Space Preview
