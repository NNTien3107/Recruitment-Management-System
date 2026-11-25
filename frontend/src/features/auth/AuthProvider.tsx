import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { refreshAccessToken, setAccessToken, setSessionExpiredHandler } from '../../lib/api';
import { fetchMe, loginRequest, logoutRequest } from './auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';
import type { AuthUser } from './types';

type AuthState = Pick<AuthContextValue, 'status' | 'user'>;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  // Khôi phục phiên khi mở/tải lại trang: dùng cookie refresh_token để lấy access token mới
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshAccessToken();
        const user = await fetchMe();
        if (!cancelled) setState({ status: 'authenticated', user });
      } catch {
        setAccessToken(null);
        if (!cancelled) setState({ status: 'unauthenticated', user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh thất bại ở bất kỳ request nào: đưa người dùng về trạng thái chưa đăng nhập
  useEffect(() => {
    setSessionExpiredHandler(() => {
      queryClient.clear();
      setState({ status: 'unauthenticated', user: null });
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const { accessToken, user } = await loginRequest({ email, password });
    setAccessToken(accessToken);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Dù server lỗi vẫn đăng xuất phía client
    } finally {
      setAccessToken(null);
      queryClient.clear(); // xóa dữ liệu cache của người dùng trước
      setState({ status: 'unauthenticated', user: null });
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
