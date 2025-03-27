import { User } from './user.model';

export interface Report {
  id: number;
  userId: number;
  title: string;
  description: string;
  location?: string;
  imageUrl?: string;
  status: 'pending' | 'reviewing' | 'resolved';
  createdAt: string;
  updatedAt: string;
  reporter?: Partial<User>;
  responses?: ReportResponse[];
  responseCount?: number;
}

export interface ReportForm {
  title: string;
  description: string;
  location?: string;
}

export interface ReportResponse {
  id: number;
  reportId: number;
  adminId: number;
  response: string;
  createdAt: string;
  admin?: Partial<User>;
}

export interface ReportResponseForm {
  response: string;
}
