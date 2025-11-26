export enum ToolType {
  SCENE_CREATOR = 'SCENE_CREATOR',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
  CHARACTER_GEN = 'CHARACTER_GEN',
  VIDEO_GENERATOR = 'VIDEO_GENERATOR',
  VOICE_GENERATOR = 'VOICE_GENERATOR',
  RESEARCH_AGENT = 'RESEARCH_AGENT',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  PODCAST_GEN = 'PODCAST_GEN',
  SEQUENCER = 'SEQUENCER',
}

export interface NodeData {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  title: string;
  width: number;
  // Content stored by the tool (e.g., prompt text)
  content?: any; 
  // Output produced by the tool (e.g., image URL, video URL)
  outputData?: any;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface GeneratedContent {
  type: 'image' | 'video' | 'text' | 'audio' | 'research';
  data: string; // URL or text content
  metadata?: any;
}

export type NodeStatus = 'idle' | 'loading' | 'success' | 'error';