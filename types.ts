
export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  WEB = 'WEB',
  SUMMARY = 'SUMMARY',
  VIDEO = 'VIDEO'
}

export interface StoryboardItem {
  imageUrl: string;
  caption: string;
}

export interface GeneratedContent {
  id: string;
  originalText: string;
  summary: string;
  imageUrl?: string;
  videoStoryboard?: StoryboardItem[];
  webHtml?: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface OSMUState {
  isGenerating: boolean;
  currentTask: string;
  messages: ChatMessage[];
  currentResult: GeneratedContent | null;
  history: GeneratedContent[];
}
