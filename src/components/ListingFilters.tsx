'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ListingFiltersProps {
  // Current values from URL
  keyword?: string;
  status?: string;
  propertyType?: string;
  propertySubType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  ourTeam?: boolean;
  // Available options
  statuses: string[];
  propertyTypes: string[];
  propertySubTypes: string[];
  cities: string[];
  initialNeighborhoods: string[];
  hasTeamMembers?: boolean;
}

export default function ListingFilters({
  keyword: initialKeyword,
  status: initialStatus,
  propertyType: initialPropertyType,
  propertySubType: initialPropertySubType,
  city: initialCity,
  neighborhood: initialNeighborhood,
  minPrice: initialMinPrice,
  maxPrice: initialMaxPrice,
  beds: initialBeds,
  baths: initialBaths,
  ourTeam: initialOurTeam,
  statuses,
  propertyTypes,
  propertySubTypes,
  cities,
  initialNeighborhoods,
  hasTeamMembers = false,
}: ListingFiltersProps) {
  const router = useRouter();

  // Local state for all filters
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [propertyType, setPropertyType] = useState(initialPropertyType || '');
  const [propertySubType, setPropertySubType] = useState(initialPropertySubType || '');
  const [selectedCity, setSelectedCity] = useState(initialCity || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [beds, setBeds] = useState(initialBeds?.toString() || '');
  const [baths, setBaths] = useState(initialBaths?.toString() || '');
  const [ourTeam, setOurTeam] = useState(initialOurTeam || false);

  const [neighborhoods, setNeighborhoods] = useState<string[]>(initialNeighborhoods);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when URL params change (e.g., on back navigation)
  useEffect(() => {
    setKeyword(initialKeyword || '');
    setStatus(initialStatus || '');
    setPropertyType(initialPropertyType || '');
    setPropertySubType(initialPropertySubType || '');
    setSelectedCity(initialCity || '');
    setSelectedNeighborhood(initialNeighborhood || '');
    setMinPrice(initialMinPrice?.toString() || '');
    setMaxPrice(initialMaxPrice?.toString() || '');
    setBeds(initialBeds?.toString() || '');
    setBaths(initialBaths?.toString() || '');
    setOurTeam(initialOurTeam || false);
  }, [
    initialKeyword,
    initialStatus,
    initialPropertyType,
    initialPropertySubType,
    initialCity,
    initialNeighborhood,
    initialMinPrice,
    initialMaxPrice,
    initialBeds,
    initialBaths,
    initialOurTeam,
  ]);

  // Build URL and navigate
  const navigateWithFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (keyword) params.set('q', keyword);
    if (status) params.set('status', status);
    if (propertyType) params.set('type', propertyType);
    if (propertySubType) params.set('subtype', propertySubType);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);
    if (ourTeam) params.set('ourTeam', 'true');

    const queryString = params.toString();
    router.push(queryString ? `/listings?${queryString}` : '/listings');
  }, [keyword, status, propertyType, propertySubType, selectedCity, selectedNeighborhood, minPrice, maxPrice, beds, baths, ourTeam, router]);

  // Fetch neighborhoods when city changes
  useEffect(() => {
    async function fetchNeighborhoods() {
      if (!selectedCity) {
        setNeighborhoods(initialNeighborhoods);
        return;
      }

      setLoadingNeighborhoods(true);
      try {
        const response = await fetch(`/api/neighborhoods?city=${encodeURIComponent(selectedCity)}`);
        const data = await response.json();
        setNeighborhoods(data.neighborhoods || []);
        // Clear neighborhood selection if it's not in the new list
        if (selectedNeighborhood && !data.neighborhoods?.includes(selectedNeighborhood)) {
          setSelectedNeighborhood('');
        }
      } catch (error) {
        console.error('Error fetching neighborhoods:', error);
        setNeighborhoods([]);
      } finally {
        setLoadingNeighborhoods(false);
      }
    }

    fetchNeighborhoods();
  }, [selectedCity, initialNeighborhoods, selectedNeighborhood]);

  // Auto-submit when select filters change (immediate)
  const handleSelectChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
  };

  // For city, we need to handle it specially to trigger navigation after neighborhoods load
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    // Clear neighborhood when city changes
    setSelectedNeighborhood('');
  };

  // Auto-navigate on filter changes (except for text inputs which use debounce)
  useEffect(() => {
    // Skip on initial mount by checking if we're changing from initial values
    const isInitialState =
      status === (initialStatus || '') &&
      propertyType === (initialPropertyType || '') &&
      propertySubType === (initialPropertySubType || '') &&
      selectedCity === (initialCity || '') &&
      selectedNeighborhood === (initialNeighborhood || '') &&
      beds === (initialBeds?.toString() || '') &&
      baths === (initialBaths?.toString() || '') &&
      ourTeam === (initialOurTeam || false);

    if (!isInitialState) {
      navigateWithFilters();
    }
  }, [status, propertyType, propertySubType, selectedCity, selectedNeighborhood, beds, baths, ourTeam]);

  // Debounced navigation for text inputs (keyword, price)
  useEffect(() => {
    const isInitialKeyword = keyword === (initialKeyword || '');
    const isInitialMinPrice = minPrice === (initialMinPrice?.toString() || '');
    const isInitialMaxPrice = maxPrice === (initialMaxPrice?.toString() || '');

    if (isInitialKeyword && isInitialMinPrice && isInitialMaxPrice) return;

    const timer = setTimeout(() => {
      navigateWithFilters();
    }, 500); // 500ms debounce for text inputs

    return () => clearTimeout(timer);
  }, [keyword, minPrice, maxPrice]);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowAdvanced(false);
      }
    }

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAdvanced]);

  const hasFilters = keyword || status || propertyType || propertySubType || selectedCity || selectedNeighborhood || minPrice || maxPrice || beds || baths || ourTeam;

  const advancedFilterCount = [status, selectedNeighborhood, ourTeam, beds, baths].filter(Boolean).length;

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPropertyType('');
    setPropertySubType('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setMinPrice('');
    setMaxPrice('');
    setBeds('');
    setBaths('');
    setOurTeam(false);
    router.push('/listings');
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Keyword Search */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search MLS# or address..."
        className="w-48 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Property Type Filter (Main Types) */}
      <select
        value={propertyType}
        onChange={handleSelectChange(setPropertyType)}
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Types</option>
        {propertyTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Property SubType Filter */}
      <select
        value={propertySubType}
        onChange={handleSelectChange(setPropertySubType)}
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Subtypes</option>
        {propertySubTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* City Filter */}
      <select
        value={selectedCity}
        onChange={handleCityChange}
        className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Cities</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Price Range */}
      <input
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        placeholder="Min Price"
        className="w-32 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        placeholder="Max Price"
        className="w-32 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Advanced Search Button */}
      <div className="relative" ref={modalRef}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-1 border rounded text-sm font-medium transition-colors flex items-center gap-2 ${
            advancedFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Advanced
          {advancedFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {advancedFilterCount}
            </span>
          )}
        </button>

        {/* Advanced Search Modal */}
        {showAdvanced && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Search</h3>
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Our Properties Only */}
              {hasTeamMembers && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ourTeam}
                    onChange={(e) => setOurTeam(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Our Properties Only</span>
                </label>
              )}

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={handleSelectChange(setStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Neighborhood Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Neighborhood</label>
                {neighborhoods.length > 0 ? (
                  <select
                    value={selectedNeighborhood}
                    onChange={handleSelectChange(setSelectedNeighborhood)}
                    disabled={loadingNeighborhoods}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingNeighborhoods ? 'Loading...' : selectedCity ? `Neighborhoods in ${selectedCity}` : 'All Neighborhoods'}
                    </option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedNeighborhood}
                    onChange={(e) => setSelectedNeighborhood(e.target.value)}
                    placeholder={selectedCity ? `Search in ${selectedCity}...` : 'Search neighborhood...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>

              {/* Beds/Baths */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Beds</label>
                  <select
                    value={beds}
                    onChange={handleSelectChange(setBeds)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Baths</label>
                  <select
                    value={baths}
                    onChange={handleSelectChange(setBaths)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-3 py-1 text-gray-600 text-sm font-medium border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
