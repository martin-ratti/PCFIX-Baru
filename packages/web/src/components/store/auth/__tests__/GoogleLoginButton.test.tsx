import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import GoogleLoginButton from '../GoogleLoginButton';
import { useAuthStore } from '../../../../stores/authStore';
import { useToastStore } from '../../../../stores/toastStore';


vi.mock('../../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));


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
        
        
        const { container } = render(<GoogleLoginButton />);
        
        expect(container).toBeDefined();
    });
});
