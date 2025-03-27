export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface UserProfile {
  name: string;
  phone?: string;
  address?: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
}
