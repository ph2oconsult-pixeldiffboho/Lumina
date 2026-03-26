export type Track = 'foundations' | 'expeditions';

export interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  track: Track;
  content: string;
  parentGuide: string;
  activity: string;
  keyConcept: string;
  artifactIcon?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  childName?: string;
  childAge?: number;
  currentTrack?: Track;
  completedModules: string[];
  linkedFamilyId?: string;
}

export interface Progress {
  userId: string;
  moduleId: string;
  status: 'in-progress' | 'completed';
  lastUpdated: string;
  moduleTitle?: string;
  keyConcept?: string;
  reflections?: string;
}
