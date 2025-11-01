import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import type { Product } from '../data/mock-data';
import ProductCard from './ProductCard';

interface CarouselProps {
  title: string;
  products: Product[];
}

export default function Carousel({ title, products }: CarouselProps) {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-secondary">{title}</h2>
      {/* El contenedor relativo ahora tiene padding para las flechas */}
      <div className="relative px-12">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          // CAMBIO: Usamos la configuración de navegación simple
          navigation={true} 
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-16" // Aumentamos un poco el padding para los puntos
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="h-auto">
              <ProductCard product={product} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}