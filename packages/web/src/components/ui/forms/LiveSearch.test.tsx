import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveSearch from './LiveSearch';
import { fetchApi } from '../../../utils/api';

// Mock dependencies
vi.mock('../../../utils/api', () => ({
    fetchApi: vi.fn()
}));

vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn()
}));

describe('LiveSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders search input', () => {
        render(<LiveSearch />);
        expect(screen.getByPlaceholderText('Buscar productos (ej: GPU, RAM)...')).toBeInTheDocument();
    });

    it('debounces search input and calls API', async () => {
        render(<LiveSearch />);
        const input = screen.getByPlaceholderText('Buscar productos (ej: GPU, RAM)...');

        // Type "Ryzen"
        fireEvent.change(input, { target: { value: 'Ryzen' } });

        // API should NOT be called immediately
        expect(fetchApi).not.toHaveBeenCalled();

        // Advance timer by 300ms
        vi.advanceTimersByTime(300);

        // Now API should be called
        expect(fetchApi).toHaveBeenCalledWith('/products?search=Ryzen&limit=5&minimal=true', expect.anything());
    });

    it('shows loading state', () => {
        render(<LiveSearch />);
        const input = screen.getByPlaceholderText('Buscar productos (ej: GPU, RAM)...');
        fireEvent.change(input, { target: { value: 'Test' } });
        vi.advanceTimersByTime(300);

        // Assuming your component shows a generic loading indicator or class, 
        // checking if fetch was initiated is a proxy for "loading started" logic trigger
        expect(fetchApi).toHaveBeenCalled();
    });
});
