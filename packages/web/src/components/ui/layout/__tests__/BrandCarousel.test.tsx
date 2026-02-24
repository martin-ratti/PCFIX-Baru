import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrandCarousel from '../BrandCarousel';


vi.mock('swiper/react', () => ({
    Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
    SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>
}));

vi.mock('swiper/modules', () => ({
    Autoplay: {}
}));

vi.mock('swiper/css', () => ({}));

describe('BrandCarousel', () => {
    it('returns null for empty brands array', () => {
        const { container } = render(<BrandCarousel brands={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when brands is undefined', () => {
        const { container } = render(<BrandCarousel brands={undefined as any} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders section title', () => {
        const brands = [
            { id: 1, nombre: 'NVIDIA', logo: 'https://example.com/nvidia.png' }
        ];

        render(<BrandCarousel brands={brands} />);

        expect(screen.getByText(/nuestras marcas oficiales/i)).toBeInTheDocument();
    });

    it('renders brand logos with images', () => {
        const brands = [
            { id: 1, nombre: 'NVIDIA', logo: 'https://example.com/nvidia.png' },
            { id: 2, nombre: 'AMD', logo: 'https://example.com/amd.png' }
        ];

        render(<BrandCarousel brands={brands} />);

        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('alt', 'NVIDIA');
        expect(images[1]).toHaveAttribute('alt', 'AMD');
    });

    it('renders brand name when logo is null', () => {
        const brands = [
            { id: 1, nombre: 'Kingston', logo: null }
        ];

        render(<BrandCarousel brands={brands} />);

        expect(screen.getByText('Kingston')).toBeInTheDocument();
    });

    it('links to products filtered by brand', () => {
        const brands = [
            { id: 42, nombre: 'Corsair', logo: null }
        ];

        render(<BrandCarousel brands={brands} />);

        
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/tienda/productos?marcaId=42');
    });
});
