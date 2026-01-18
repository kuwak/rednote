
export interface ProductInfo {
  name: string;
  sellingPoints: string;
  features: string;
  category: string;
  tone: string;
  targetAudience: string;
}

export interface GeneratedCopy {
  title: string;
  content: string;
  tags: string[];
}

export interface ImageAnalysis {
  form: string;
  texture: string;
  light: string;
  atmosphere: string;
  style: string;
  composition: string;
  setting: string;
}

export interface QualityCheckItem {
  score: number;
  reason: string;
}

export interface QualityReport {
  subject: QualityCheckItem;
  function: QualityCheckItem;
  structure: QualityCheckItem;
  concept: QualityCheckItem;
}

export interface GeneratedImage {
  url: string;
  promptUsed: string;
  analysis: ImageAnalysis;
  qualityReport: QualityReport;
}

export interface AppState {
  llmApiKey: string;
  imgApiKey: string;
  hasKeys: boolean;
  step: 'input' | 'generating' | 'preview';
  productInfo: ProductInfo;
  generatedCopy: GeneratedCopy | null;
  generatedImage: GeneratedImage | null;
  isSettingsOpen: boolean;
  isLoading: boolean;
  loadingMessage: string;
  currentAnalysis?: ImageAnalysis; // Used for showing progress
}

export const ASPECT_RATIOS = {
  PORTRAIT: '3:4',
  SQUARE: '1:1',
} as const;

export type AspectRatio = typeof ASPECT_RATIOS[keyof typeof ASPECT_RATIOS];
