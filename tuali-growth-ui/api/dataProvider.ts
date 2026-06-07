import { UserProfile } from './authContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export const login = async (email: string, password: string): Promise<UserProfile> => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err: any = new Error('Credenciales incorrectas');
    err.response = { status: res.status };
    throw err;
  }

  return res.json();
};
