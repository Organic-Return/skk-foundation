export default function ListingsLoading() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter skeleton */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-4 pt-2 pb-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-36 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Property cards skeleton grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-52 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                <div className="flex gap-4 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
