import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

interface Brand { id: number; nombre: string; }
interface Banner { id: number; imagen: string; marca: Brand; }

interface HomeBannersProps { banners: Banner[]; }

export default function HomeBanners({ banners }: HomeBannersProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <section className="w-full mb-12">
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl group">
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          effect={'fade'}
          loop={true}
          speed={1000}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true
          }}
          navigation={true}
          className="w-full h-[250px] md:h-[400px] lg:h-[500px]"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id} className="relative bg-gray-900">
              <a
                href={`/tienda/productos?marcaId=${banner.marca.id}`}
                className="block w-full h-full relative"
              >
                <img
                  src={banner.imagen}
                  alt={`Oferta ${banner.marca.nombre}`}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                <div className="absolute bottom-8 left-6 md:bottom-12 md:left-12 z-10">
                  <span className="bg-primary/90 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2 text-sm md:text-base transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-500">
                    Ver {banner.marca.nombre}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </a>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}