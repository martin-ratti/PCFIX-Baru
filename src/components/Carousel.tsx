import React, { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Product } from '../data/mock-data';
import ProductCard from './ProductCard';

interface CarouselProps {
  title: string;
  products: Product[];
}

export default function Carousel({ title, products }: CarouselProps) {
  const navigationClasses = useMemo(() => {
    const randomSuffix = Math.random().toString(36).substring(7);
    return {
      prevEl: `swiper-button-prev-${randomSuffix}`,
      nextEl: `swiper-button-next-${randomSuffix}`,
    };
  }, []);

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-secondary">{title}</h2>
      <div className="relative px-12">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          navigation={{
            nextEl: `.${navigationClasses.nextEl}`,
            prevEl: `.${navigationClasses.prevEl}`,
          }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          // CAMBIO: Aumenta el padding-bottom
          className="pb-24" // De pb-12 a pb-24 para más espacio
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
        
        {/* Botones de Navegación Personalizados */}
        <div className={`absolute top-1/2 -translate-y-1/2 left-0 z-10 cursor-pointer p-2 rounded-full bg-accent text-primary shadow-lg hover:bg-opacity-80 transition-all ${navigationClasses.prevEl}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>
        <div className={`absolute top-1/2 -translate-y-1/2 right-0 z-10 cursor-pointer p-2 rounded-full bg-accent text-primary shadow-lg hover:bg-opacity-80 transition-all ${navigationClasses.nextEl}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </section>
  );
}