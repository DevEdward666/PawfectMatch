import { User } from './user.model';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  subject?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

export interface MessageForm {
  receiverId: number;
  subject?: string;
  content: string;
}

export interface MessageResponse {
  inbox: Message[];
  sent: Message[];
}