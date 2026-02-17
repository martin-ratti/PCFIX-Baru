import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Carousel from '../Carousel';

// Mock Swiper
vi.mock('swiper/react', () => ({
    Swiper: ({ children }: any) => <div data-testid="swiper">{children}</div>,
    SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>
}));

vi.mock('swiper/modules', () => ({
    Navigation: {},
    Pagination: {},
    Autoplay: {}
}));

vi.mock('swiper/css', () => ({}));
vi.mock('swiper/css/navigation', () => ({}));
vi.mock('swiper/css/pagination', () => ({}));

// Mock ProductCard
vi.mock('../../../store/product/ProductCard', () => ({
    default: ({ product }: any) => <div data-testid="product-card">{product.name}</div>
}));

describe('Carousel', () => {
    const mockProducts = [
        { id: '1', name: 'SSD 500GB', price: 50000, imageUrl: '', imageAlt: 'SSD', stock: 10, slug: 'ssd-500gb' },
        { id: '2', name: 'RAM 16GB', price: 80000, imageUrl: '', imageAlt: 'RAM', stock: 5, slug: 'ram-16gb' }
    ];

    it('renders carousel title', () => {
        render(
            <Carousel products={mockProducts}>
                <h1>Productos Destacados</h1>
            </Carousel>
        );

        expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
    });

    it('renders product cards for each product', () => {
        render(<Carousel products={mockProducts}><h2 >Test</h2></Carousel>);

        expect(screen.getByText('SSD 500GB')).toBeInTheDocument();
        expect(screen.getByText('RAM 16GB')).toBeInTheDocument();
    });

    it('renders swiper slides for each product', () => {
        render(<Carousel products={mockProducts}><h2>Test</h2></Carousel>);

        const slides = screen.getAllByTestId('swiper-slide');
        expect(slides).toHaveLength(2);
    });
});
