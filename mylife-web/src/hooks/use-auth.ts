'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { api } from '@/lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, ApiResponse, UpdateProfileRequest, ChangePasswordRequest } from '@/types/api';

const TOKEN_KEY = 'mylife_token';
const USER_KEY = 'mylife_user';

function extractMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}

export function useAuth() {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (token && raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', request);
    const auth = data.data;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth));
    setUser(auth);
    router.push('/finance/dashboard');
    return auth;
  }, [router]);

  const register = useCallback(async (request: RegisterRequest) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', request);
    const auth = data.data;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth));
    setUser(auth);
    router.push('/finance/dashboard');
    return auth;
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(async (request: UpdateProfileRequest) => {
    const { data } = await api.patch<ApiResponse<AuthResponse>>('/auth/profile', request);
    const auth = data.data;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth));
    setUser(auth);
    return auth;
  }, []);

  const changePassword = useCallback(async (request: ChangePasswordRequest) => {
    await api.patch<ApiResponse<void>>('/auth/password', request);
  }, []);

  return { user, loading, login, register, logout, updateProfile, changePassword, extractMessage };
}
