import api from './axios';

interface LoginResponse {
  success: boolean;
  token: string;
  userId: number;
  name: string;
  role: string;
  email: string;
  telephone: number;
}

export const authService = {
  login: (identifiant: String, mdp: String) =>
    api.post<LoginResponse>('/login-user', { identifiant, mdp }),

  register: (data: any) =>
    api.post('/register', data),
};
