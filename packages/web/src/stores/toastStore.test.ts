import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToastStore } from './toastStore';

describe('toastStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useToastStore.setState({ toasts: [] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('addToast', () => {
        it('should add a toast with default type "info"', () => {
            const { result } = renderHook(() => useToastStore());

            act(() => {
                result.current.addToast('Test message');
            });

            expect(result.current.toasts).toHaveLength(1);
            expect(result.current.toasts[0].message).toBe('Test message');
            expect(result.current.toasts[0].type).toBe('info');
        });

        it('should add a toast with specified type', () => {
            const { result } = renderHook(() => useToastStore());

            act(() => {
                result.current.addToast('Error occurred', 'error');
            });

            expect(result.current.toasts[0].type).toBe('error');
        });

        it('should add multiple toasts', () => {
            const { result } = renderHook(() => useToastStore());

            act(() => {
                result.current.addToast('First', 'info');
                result.current.addToast('Second', 'success');
                result.current.addToast('Third', 'error');
            });

            expect(result.current.toasts).toHaveLength(3);
        });

        it('should auto-remove toast after 3 seconds', () => {
            const { result } = renderHook(() => useToastStore());

            act(() => {
                result.current.addToast('Temporary');
            });

            expect(result.current.toasts).toHaveLength(1);

            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.toasts).toHaveLength(0);
        });
    });

    describe('removeToast', () => {
        it('should remove specific toast by id', () => {
            const { result } = renderHook(() => useToastStore());

            act(() => {
                result.current.addToast('First');
                result.current.addToast('Second');
            });

            const firstId = result.current.toasts[0].id;

            act(() => {
                result.current.removeToast(firstId);
            });

            expect(result.current.toasts).toHaveLength(1);
            expect(result.current.toasts[0].message).toBe('Second');
        });
    });
});
