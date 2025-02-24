export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  skills: Skill[];
  availability: Availability[];
  experience: ExperienceLevel;
  interests: string[];
  bio: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  connections: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  createdAt: string;
}

export interface Message {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  content: string;
  createdAt: string;
}

export interface TeamRequest {
  receiverPhoto: any;
  id: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: any;
  acceptedAt?: any;
  rejectedAt?: any;
}
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Skill {
  name: string;
  level: SkillLevel;
  category: SkillCategory;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type SkillCategory = 
  | 'frontend' 
  | 'backend' 
  | 'mobile' 
  | 'design' 
  | 'product' 
  | 'business' 
  | 'data';

export interface Availability {
  day: string;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}
