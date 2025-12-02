import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import ProductCard from '../products/ProductCard';

// Definimos la interfaz localmente para no depender de mock-data
// y la hacemos compatible con lo que espera ProductCard
export interface CarouselProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null; // Aceptamos null explícitamente
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
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-secondary">{title}</h2>
      <div className="relative px-12">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          loop={true}
          navigation={true} 
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-16"
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