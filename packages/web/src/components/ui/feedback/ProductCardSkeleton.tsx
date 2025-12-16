import React from 'react';
import Skeleton from './Skeleton';

export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-full flex flex-col">
            {/* Image Placeholder */}
            <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
            </div>

            {/* Content */}
            <div className="space-y-3 flex-1 flex flex-col">
                {/* Brand */}
                <Skeleton variant="text" className="w-1/3 h-3" />

                {/* Title */}
                <Skeleton variant="text" className="w-full h-5" />
                <Skeleton variant="text" className="w-2/3 h-5" />

                {/* Price Section */}
                <div className="mt-auto space-y-2 pt-2">
                    <Skeleton variant="text" className="w-1/2 h-7" />
                    <Skeleton variant="rectangular" className="w-full h-10 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
