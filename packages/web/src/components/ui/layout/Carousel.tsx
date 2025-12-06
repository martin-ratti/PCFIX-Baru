import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import ProductCard from '../../store/product/ProductCard';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface CarouselProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null; 
  imageUrl: string;
  imageAlt: string;
  stock: number;
  slug: string;
  description?: string;
}

interface CarouselProps {
  title: string;
  products: CarouselProduct[];
}

export default function Carousel({ title, products }: CarouselProps) {
  const shouldLoop = products.length >= 4;

  if (!products || products.length === 0) return null;

  return (
    <section className="mb-16 relative">
      <h2 className="text-3xl font-bold text-center mb-10 text-secondary">{title}</h2>
      
      <style>{`
        .swiper-pagination-bullet {
          background-color: #cbd5e1;
          opacity: 1;
          width: 10px;
          height: 10px;
          transition: all 0.3s ease;
          margin: 0 6px !important;
        }
        .swiper-pagination-bullet-active {
          background-color: #2563eb;
          width: 30px;
          border-radius: 6px;
        }
        .swiper-button-next, .swiper-button-prev {
          color: #1e293b;
          background-color: rgba(255, 255, 255, 0.9);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover {
          background-color: #ffffff;
          transform: scale(1.1);
          color: #2563eb;
        }
        .swiper-button-next::after, .swiper-button-prev::after { font-size: 18px; font-weight: bold; }
        .swiper { padding: 10px 10px 50px 10px !important; }
      `}</style>

      <div className="relative px-4 md:px-12">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={shouldLoop}
          navigation={true} 
          pagination={{ clickable: true, dynamicBullets: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-12"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <ProductCard 
                product={product} 
                disableTransition={true} // 👈 CORRECCIÓN CRÍTICA
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}