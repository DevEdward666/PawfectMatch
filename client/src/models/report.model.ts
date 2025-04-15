import { User } from './user.model';


export interface ReportData {
  report:Report,
  reporter:Reporter
}
export interface Reporter {
  email:string,
  id:number,
  name:string,
}
export interface Report {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved';
  location?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: Partial<User>;
  responses?: ReportResponse[];
}

export interface ReportForm {
  title: string;
  description: string;
  location?: string;
  image?: File;
}

export interface ReportResponse {
  id: number;
  reportId: number;
  userId: number;
  response: string;
  createdAt: string;
  user?: Partial<User>;
}

export interface ReportResponseForm {
  response: string;
}