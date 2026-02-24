import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';


const mockToasts = [
    { id: '1', message: 'Success message', type: 'success' as const },
    { id: '2', message: 'Error message', type: 'error' as const }
];

vi.mock('../../../../stores/toastStore', () => ({
    useToastStore: vi.fn(() => ({
        toasts: mockToasts,
        removeToast: vi.fn()
    }))
}));

import ToastContainer from '../ToastContainer';

describe('ToastContainer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders toasts from store', () => {
        render(<ToastContainer />);
        expect(screen.getByText('Success message')).toBeInTheDocument();
        expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('renders container with correct positioning classes', () => {
        const { container } = render(<ToastContainer />);
        const toastContainer = container.firstChild as HTMLElement;
        expect(toastContainer).toHaveClass('fixed');
        expect(toastContainer).toHaveClass('top-24');
    });
});
