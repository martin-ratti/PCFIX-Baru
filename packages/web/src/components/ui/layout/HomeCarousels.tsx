import React from 'react';
import { FlameIcon, ZapIcon, SparklesIcon } from '../../SharedIcons'; // 👇 Import
import Carousel from './Carousel';
import type { CarouselProduct } from '../../../types/product';

interface HomeCarouselsProps {
    featuredProducts: CarouselProduct[];
    saleProducts: CarouselProduct[];
    newArrivalsProducts: CarouselProduct[];
}

export default function HomeCarousels({ featuredProducts, saleProducts, newArrivalsProducts }: HomeCarouselsProps) {
    return (
        <>
            {featuredProducts.length > 0 && (
                <div className="space-y-4">
                    <Carousel products={featuredProducts}>
                        <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-3">
                            <FlameIcon className="w-8 h-8 text-orange-500" />
                            Destacados de la Semana
                        </h2>
                    </Carousel>
                </div>
            )}

            {saleProducts.length > 0 && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden mt-12">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                    <Carousel products={saleProducts}>
                        <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-3">
                            <ZapIcon className="w-8 h-8 text-yellow-500" />
                            Ofertas Relámpago
                        </h2>
                    </Carousel>
                </div>
            )}

            {newArrivalsProducts.length > 0 && (
                <div className="space-y-4 mt-12">
                    <Carousel products={newArrivalsProducts}>
                        <h2 className="text-3xl font-bold text-center mb-10 text-secondary flex items-center justify-center gap-3">
                            <SparklesIcon className="w-8 h-8 text-purple-500" />
                            Recién Llegados
                        </h2>
                    </Carousel>
                </div>
            )}
        </>
    );
}
