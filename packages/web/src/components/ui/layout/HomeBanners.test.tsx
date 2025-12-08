import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeBanners from './HomeBanners';

// Mock Swiper
vi.mock('swiper/react', () => ({
    Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
    SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>
}));

vi.mock('swiper/modules', () => ({
    Autoplay: {},
    Pagination: {},
    Navigation: {},
    EffectFade: {}
}));

vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));
vi.mock('swiper/css/navigation', () => ({}));
vi.mock('swiper/css/effect-fade', () => ({}));

describe('HomeBanners', () => {
    it('returns null for empty banners array', () => {
        const { container } = render(<HomeBanners banners={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('returns null when banners is undefined', () => {
        const { container } = render(<HomeBanners banners={undefined as any} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders banner images', () => {
        const banners = [
            { id: 1, imagen: 'https://example.com/banner1.jpg', marca: { id: 1, nombre: 'NVIDIA' } },
            { id: 2, imagen: 'https://example.com/banner2.jpg', marca: { id: 2, nombre: 'AMD' } }
        ];

        render(<HomeBanners banners={banners} />);

        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(2);
        expect(images[0]).toHaveAttribute('alt', 'Oferta NVIDIA');
        expect(images[1]).toHaveAttribute('alt', 'Oferta AMD');
    });

    it('links to brand products page', () => {
        const banners = [
            { id: 1, imagen: 'https://example.com/banner.jpg', marca: { id: 42, nombre: 'Corsair' } }
        ];

        render(<HomeBanners banners={banners} />);

        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/tienda/productos?marcaId=42');
    });

    it('shows brand name in button', () => {
        const banners = [
            { id: 1, imagen: 'https://example.com/banner.jpg', marca: { id: 1, nombre: 'Kingston' } }
        ];

        render(<HomeBanners banners={banners} />);

        expect(screen.getByText(/ver kingston/i)).toBeInTheDocument();
    });

    it('renders swiper slides for each banner', () => {
        const banners = [
            { id: 1, imagen: 'https://example.com/b1.jpg', marca: { id: 1, nombre: 'A' } },
            { id: 2, imagen: 'https://example.com/b2.jpg', marca: { id: 2, nombre: 'B' } },
            { id: 3, imagen: 'https://example.com/b3.jpg', marca: { id: 3, nombre: 'C' } }
        ];

        render(<HomeBanners banners={banners} />);

        const slides = screen.getAllByTestId('swiper-slide');
        expect(slides).toHaveLength(3);
    });
});
