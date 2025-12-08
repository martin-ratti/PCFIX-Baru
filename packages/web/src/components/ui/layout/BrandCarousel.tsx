import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

interface Brand {
  id: number;
  nombre: string;
  logo: string | null;
}

interface BrandCarouselProps {
  brands: Brand[];
}

export default function BrandCarousel({ brands }: BrandCarouselProps) {

  if (!brands || brands.length === 0) return null;

  return (
    <section className="py-12 bg-white border-t border-gray-200 mb-0">
      <div className="container mx-auto px-6">
        <h2 className="text-xl font-bold text-center mb-8 text-gray-400 uppercase tracking-widest">
          Nuestras Marcas Oficiales
        </h2>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={40}

          slidesPerView={Math.min(brands.length, 3)}
          loop={brands.length > 3}
          speed={4000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          breakpoints={{
            640: { slidesPerView: Math.min(brands.length, 4), spaceBetween: 50 },
            768: { slidesPerView: Math.min(brands.length, 5), spaceBetween: 60 },
            1024: { slidesPerView: Math.min(brands.length, 6), spaceBetween: 80 },
          }}
          className="brand-swiper-container"
        >
          {brands.map((brand) => (
            <SwiperSlide key={brand.id} className="flex items-center justify-center h-24">
              <a
                href={`/tienda/productos?marcaId=${brand.id}`}
                className="group w-full h-full flex items-center justify-center transition-all duration-300 opacity-60 hover:opacity-100"
                title={`Ver productos de ${brand.nombre}`}
              >
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.nombre}
                    className="max-h-14 w-auto object-contain mx-auto filter grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-400 group-hover:text-primary transition-colors">
                    {brand.nombre}
                  </span>
                )}
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}