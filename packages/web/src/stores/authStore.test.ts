import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from './authStore';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('authStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state
        useAuthStore.setState({
            token: null,
            user: null,
            isAuthenticated: false
        });
    });

    describe('login', () => {
        it('should set user and token on login', () => {
            const { result } = renderHook(() => useAuthStore());

            const testUser = { id: 1, email: 'test@test.com', role: 'USER', nombre: 'Test' };
            const testToken = 'test-jwt-token';

            act(() => {
                result.current.login(testToken, testUser);
            });

            expect(result.current.token).toBe(testToken);
            expect(result.current.user).toEqual(testUser);
            expect(result.current.isAuthenticated).toBe(true);
        });
    });

    describe('logout', () => {
        it('should clear user and token on logout', () => {
            const { result } = renderHook(() => useAuthStore());

            // First login
            act(() => {
                result.current.login('token', { id: 1, email: 'test@test.com', role: 'USER' });
            });

            // Then logout
            act(() => {
                result.current.logout();
            });

            expect(result.current.token).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.isAuthenticated).toBe(false);
        });

        it('should remove auth-storage from localStorage', () => {
            const { result } = renderHook(() => useAuthStore());

            act(() => {
                result.current.logout();
            });

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-storage');
        });
    });

    describe('initial state', () => {
        it('should start unauthenticated', () => {
            const { result } = renderHook(() => useAuthStore());

            expect(result.current.isAuthenticated).toBe(false);
            expect(result.current.token).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });
});
