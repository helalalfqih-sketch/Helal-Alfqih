import { Product } from "@/components/storefront/types";

// ==========================================
// RELEASE 2: INTELLIGENT ASSISTANT CONTRACTS
// ==========================================

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

// ==========================================
// RELEASE 3: DIFFERENTIATED EXPERIENCE SPEC
// ==========================================

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
