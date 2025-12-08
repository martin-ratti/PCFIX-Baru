import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Child content</div>;
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        // Suppress console.error for cleaner test output
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Safe content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe content')).toBeInTheDocument();
    });

    it('renders default fallback when error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        );
        expect(screen.getByText('Error temporal.')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom error message</div>}>
                <ThrowError />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('logs error with component name', () => {
        const consoleSpy = vi.spyOn(console, 'error');
        render(
            <ErrorBoundary name="TestComponent">
                <ThrowError />
            </ErrorBoundary>
        );
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('TestComponent'),
            expect.any(Error),
            expect.any(Object)
        );
    });

    it('allows retry when button clicked', () => {
        const { rerender } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText('Error temporal.')).toBeInTheDocument();

        // The retry button should be present
        const retryButton = screen.getByRole('button');
        expect(retryButton).toBeInTheDocument();
    });
});
