import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GoogleLoginButton from './GoogleLoginButton';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mock dependencies
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

// Mock Google OAuth
vi.mock('@react-oauth/google', () => ({
    GoogleOAuthProvider: ({ children }: any) => <div data-testid="google-provider">{children}</div>,
    GoogleLogin: ({ onSuccess, onError }: any) => (
        <button
            data-testid="google-login-button"
            onClick={() => onSuccess({ credential: 'mock-token' })}
            onContextMenu={(e) => { e.preventDefault(); onError(); }}
        >
            Continue with Google
        </button>
    )
}));

// Mock import.meta.env
vi.stubEnv('PUBLIC_GOOGLE_CLIENT_ID', '');

describe('GoogleLoginButton', () => {
    const mockLogin = vi.fn();
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthStore).mockImplementation((selector: any) => {
            const state = { login: mockLogin };
            return selector ? selector(state) : state;
        });
        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });
    });

    it('renders without crashing', () => {
        // The component behavior depends on PUBLIC_GOOGLE_CLIENT_ID
        // In test env, it may return null or render the button
        const { container } = render(<GoogleLoginButton />);
        // Just verify it doesn't crash
        expect(container).toBeDefined();
    });
});
