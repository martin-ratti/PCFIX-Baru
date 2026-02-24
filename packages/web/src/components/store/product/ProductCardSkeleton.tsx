

export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
            
            <div className="aspect-square bg-gray-200" />

            
            <div className="p-4 space-y-3">
                
                <div className="h-4 w-16 bg-gray-200 rounded-full" />

                
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>

                
                <div className="h-6 bg-gray-200 rounded w-24 mt-2" />

                
                <div className="h-10 bg-gray-200 rounded-xl w-full mt-4" />
            </div>
        </div>
    );
}
