import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GuestGuard from '../GuestGuard';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';

// Mocks
vi.mock('../../../stores/authStore', () => ({
    useAuthStore: vi.fn()
}));

vi.mock('../../../stores/toastStore', () => ({
    useToastStore: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

describe('GuestGuard', () => {
    const mockAddToast = vi.fn();
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        vi.mocked(useToastStore).mockImplementation((selector: any) => {
            const state = { addToast: mockAddToast };
            return selector ? selector(state) : state;
        });

        Object.defineProperty(window, 'location', {
            value: { replace: mockReplace },
            writable: true
        });
    });

    afterEach(() => {
        localStorage.clear();
    });

    it('renders children when user is not authenticated (guest)', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: null,
            isAuthenticated: false
        } as any);

        render(<GuestGuard><div>Login Form</div></GuestGuard>);

        await waitFor(() => {
            expect(screen.getByText('Login Form')).toBeInTheDocument();
        });
    });

    it('shows toast when user is authenticated', async () => {
        vi.mocked(useAuthStore).mockReturnValue({
            user: { id: 1, nombre: 'Juan', role: 'USER' },
            isAuthenticated: true
        } as any);

        render(<GuestGuard><div>Login Form</div></GuestGuard>);

        // Should show toast message
        expect(mockAddToast).toHaveBeenCalledWith(
            expect.stringContaining('Juan'),
            'info'
        );
    });
});
