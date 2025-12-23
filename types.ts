
export enum AppTab {
  LIVE_VOICE = 'LIVE_VOICE',
  IMAGE_LAB = 'IMAGE_LAB',
  VIDEO_CREATOR = 'VIDEO_CREATOR'
}

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
}

export interface ImageResult {
  url: string;
  prompt: string;
  timestamp: number;
}

export interface VideoResult {
  url: string;
  prompt: string;
  timestamp: number;
  operationId?: string;
}
