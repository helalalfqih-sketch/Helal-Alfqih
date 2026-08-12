export interface DesignTokens {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorSurface2: string;
  colorTextPrimary: string;
  colorTextSecondary: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  shadowLevel: 'none' | 'subtle' | 'medium' | 'high' | 'cosmic';
  glassBlur: number; // in px
  fontScale: 'compact' | 'standard' | 'large';
  spacingScale: 'tight' | 'balanced' | 'spacious';
  mobileSafeAreaBottom: number; // in px
}

export interface ProductUniverse3DTokens {
  particleDensity: number; // e.g. 1000 - 5000
  planetSize: number; // 1.5 - 3.5
  atmosphereIntensity: number; // 0.1 - 1.0
  orbitCount: number; // 1 - 4
  orbitColor: string;
  orbitSpeed: number; // 0.1 - 1.0
  productNodeSize: number; // 12 - 24
  cameraDistance: number; // 4 - 12
  bloomIntensity: number; // 0 - 1.5
  qualityTier: 'auto' | 'high' | 'medium' | 'low';
}

export interface MotionTokens {
  buttonFeedbackMs: number; // 100 - 150
  drawerTransitionMs: number; // 180 - 240
  productFocusMs: number; // 350 - 650
  categoryTransitionMs: number; // 400 - 700
  reducedMotion: boolean;
  liteMode: boolean;
}

export interface FeatureVisibility {
  showHeroCarousel: boolean;
  showUniversePreview: boolean;
  showBestOffers: boolean;
  showDiscoveryStrip: boolean;
  showRecentlyViewed: boolean;
  showTrustBar: boolean;
  showFloatingWhatsapp: boolean;
}

export interface DraftConfig {
  schemaVersion: string;
  draftId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  locale: 'ar' | 'en';
  designTokens: DesignTokens;
  universe3D: ProductUniverse3DTokens;
  motion: MotionTokens;
  featureVisibility: FeatureVisibility;
  sectionOrder: string[];
  customCopy: Record<string, string>; // Section keys -> text
}

export interface DraftVersion {
  versionId: string;
  versionName: string;
  timestamp: string;
  author: string;
  description: string;
  config: DraftConfig;
  snapshotUrl?: string;
  qualityPassed: boolean;
}

export type DevicePreset = 'mobile-sm' | 'mobile-std' | 'mobile-lg' | 'tablet' | 'desktop' | 'desktop-lg';

export interface DeviceViewport {
  id: DevicePreset;
  label: string;
  width: number;
  height: number;
  iconName: string;
}

export interface QualityGuardianRule {
  id: string;
  title: string;
  category: 'contrast' | 'touch-target' | 'overflow' | 'performance' | 'locked-zone' | 'a11y';
  status: 'pass' | 'warning' | 'fail';
  message: string;
  component?: string;
}

export interface AuditFinding {
  id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  component: string;
  title: string;
  reproductionSteps: string;
  customerImpact: string;
  confidence: number; // 0 - 100
  suggestedFix: string;
  autoFixAvailable: boolean;
}

export interface InboxSuggestion {
  id: string;
  category: 'Conversion' | 'Mobile Usability' | 'Performance' | 'Accessibility' | 'Product Universe' | 'Trust';
  title: string;
  evidence: string;
  severity: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  expectedBenefit: string;
  risk: string;
  applied: boolean;
  draftChanges?: Partial<DraftConfig>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  goal: string;
  proposedBy: 'AI' | 'Owner';
  approved: boolean;
  rejectionReason?: string;
}
