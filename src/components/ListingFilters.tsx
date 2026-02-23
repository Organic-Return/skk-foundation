'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ListingFiltersProps {
  // Current values from URL
  keyword?: string;
  status?: string;
  propertyType?: string;
  propertySubType?: string;
  selectedCities?: string[];
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
  // Show "Our Listings" checkbox (only when team data is available)
  showOurTeamFilter?: boolean;
}

export default function ListingFilters({
  keyword: initialKeyword,
  status: initialStatus,
  propertyType: initialPropertyType,
  propertySubType: initialPropertySubType,
  selectedCities: initialSelectedCities,
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
  showOurTeamFilter,
}: ListingFiltersProps) {
  const router = useRouter();

  // Local state for all filters
  const [keyword, setKeyword] = useState(initialKeyword || '');
  const [status, setStatus] = useState(initialStatus || '');
  const [propertyType, setPropertyType] = useState(initialPropertyType || '');
  const [propertySubType, setPropertySubType] = useState(initialPropertySubType || '');
  const [selectedCities, setSelectedCities] = useState<string[]>(initialSelectedCities || []);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(initialNeighborhood || '');
  const [minPrice, setMinPrice] = useState(initialMinPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice?.toString() || '');
  const [beds, setBeds] = useState(initialBeds?.toString() || '');
  const [baths, setBaths] = useState(initialBaths?.toString() || '');

  const [ourTeam, setOurTeam] = useState(initialOurTeam || false);

  const [neighborhoods, setNeighborhoods] = useState<string[]>(initialNeighborhoods);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // City dropdown state
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close city dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
        setCitySearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stable key for comparing selectedCities in effects
  const selectedCitiesKey = JSON.stringify(selectedCities);
  const initialSelectedCitiesKey = JSON.stringify(initialSelectedCities || []);

  // Sync state when URL params change (e.g., on back navigation)
  useEffect(() => {
    setKeyword(initialKeyword || '');
    setStatus(initialStatus || '');
    setPropertyType(initialPropertyType || '');
    setPropertySubType(initialPropertySubType || '');
    setSelectedCities(initialSelectedCities || []);
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
    initialSelectedCitiesKey,
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
    if (selectedCities.length > 0) params.set('city', selectedCities.join(','));
    if (selectedNeighborhood) params.set('neighborhood', selectedNeighborhood);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (beds) params.set('beds', beds);
    if (baths) params.set('baths', baths);
    if (ourTeam) params.set('ourTeam', 'true');

    const queryString = params.toString();
    router.push(queryString ? `/listings?${queryString}` : '/listings');
  }, [keyword, status, propertyType, propertySubType, selectedCitiesKey, selectedNeighborhood, minPrice, maxPrice, beds, baths, ourTeam, router]);

  // Fetch neighborhoods when selected cities change
  useEffect(() => {
    async function fetchNeighborhoods() {
      if (selectedCities.length === 0) {
        setNeighborhoods(initialNeighborhoods);
        return;
      }

      setLoadingNeighborhoods(true);
      try {
        const response = await fetch(`/api/neighborhoods?city=${encodeURIComponent(selectedCities.join(','))}`);
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
  }, [selectedCitiesKey, initialNeighborhoods, selectedNeighborhood]);

  // Auto-submit when select filters change (immediate)
  const handleSelectChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setter(e.target.value);
  };

  // Toggle a city in the multi-select
  const handleCityToggle = (city: string) => {
    setSelectedCities(prev => {
      if (prev.includes(city)) {
        return prev.filter(c => c !== city);
      } else {
        return [...prev, city];
      }
    });
    // Clear neighborhood when cities change
    setSelectedNeighborhood('');
  };

  // Auto-navigate on filter changes (except for text inputs which use debounce)
  useEffect(() => {
    // Skip on initial mount by checking if we're changing from initial values
    const isInitialState =
      status === (initialStatus || '') &&
      propertyType === (initialPropertyType || '') &&
      propertySubType === (initialPropertySubType || '') &&
      selectedCitiesKey === initialSelectedCitiesKey &&
      selectedNeighborhood === (initialNeighborhood || '') &&
      beds === (initialBeds?.toString() || '') &&
      baths === (initialBaths?.toString() || '') &&
      ourTeam === (initialOurTeam || false);

    if (!isInitialState) {
      navigateWithFilters();
    }
  }, [status, propertyType, propertySubType, selectedCitiesKey, selectedNeighborhood, beds, baths, ourTeam]);

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

  const hasFilters = keyword || status || propertyType || propertySubType || selectedCities.length > 0 || selectedNeighborhood || minPrice || maxPrice || beds || baths || ourTeam;

  const handleClearFilters = () => {
    setKeyword('');
    setStatus('');
    setPropertyType('');
    setPropertySubType('');
    setSelectedCities([]);
    setSelectedNeighborhood('');
    setMinPrice('');
    setMaxPrice('');
    setBeds('');
    setBaths('');
    setOurTeam(false);
    router.push('/listings');
  };

  // City dropdown label
  const cityButtonLabel = selectedCities.length === 0
    ? 'All Cities'
    : selectedCities.length === 1
      ? selectedCities[0]
      : `${selectedCities.length} Cities`;

  // Filter cities by search term
  const filteredDropdownCities = citySearch
    ? cities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  // Neighborhood placeholder text
  const neighborhoodPlaceholder = loadingNeighborhoods
    ? 'Loading...'
    : selectedCities.length === 1
      ? `Neighborhoods in ${selectedCities[0]}`
      : selectedCities.length > 1
        ? `Neighborhoods in ${selectedCities.length} cities`
        : 'All Neighborhoods';

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Keyword Search */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Search MLS# or address..."
        className="w-48 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Status Filter */}
      <select
        value={status}
        onChange={handleSelectChange(setStatus)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Property Type Filter (Main Types) */}
      <select
        value={propertyType}
        onChange={handleSelectChange(setPropertyType)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
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
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Subtypes</option>
        {propertySubTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* City Multi-Select Filter */}
      <div ref={cityDropdownRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setCityDropdownOpen(!cityDropdownOpen);
            if (!cityDropdownOpen) setCitySearch('');
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-left min-w-[140px] flex items-center justify-between gap-2"
        >
          <span className="truncate">{cityButtonLabel}</span>
          <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cityDropdownOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
          </svg>
        </button>

        {cityDropdownOpen && (
          <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            {/* Selected cities summary + clear */}
            {selectedCities.length > 0 && (
              <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">{selectedCities.length} selected</span>
                <button
                  type="button"
                  onClick={() => { setSelectedCities([]); setSelectedNeighborhood(''); }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              </div>
            )}
            {/* City checkboxes */}
            <div className="max-h-60 overflow-y-auto">
              {filteredDropdownCities.map((city) => (
                <label
                  key={city}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedCities.includes(city)}
                    onChange={() => handleCityToggle(city)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {city}
                </label>
              ))}
              {filteredDropdownCities.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">No cities found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Neighborhood Filter - Dynamic based on selected cities */}
      {neighborhoods.length > 0 ? (
        <select
          value={selectedNeighborhood}
          onChange={handleSelectChange(setSelectedNeighborhood)}
          disabled={loadingNeighborhoods}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">{neighborhoodPlaceholder}</option>
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
          placeholder={selectedCities.length > 0 ? `Search in ${selectedCities.length === 1 ? selectedCities[0] : selectedCities.length + ' cities'}...` : 'Search neighborhood...'}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      )}

      {/* Price Range */}
      <input
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        placeholder="Min Price"
        className="w-32 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        type="number"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        placeholder="Max Price"
        className="w-32 px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Beds/Baths */}
      <select
        value={beds}
        onChange={handleSelectChange(setBeds)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Any Beds</option>
        <option value="1">1+ Beds</option>
        <option value="2">2+ Beds</option>
        <option value="3">3+ Beds</option>
        <option value="4">4+ Beds</option>
        <option value="5">5+ Beds</option>
      </select>

      <select
        value={baths}
        onChange={handleSelectChange(setBaths)}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Any Baths</option>
        <option value="1">1+ Baths</option>
        <option value="2">2+ Baths</option>
        <option value="3">3+ Baths</option>
        <option value="4">4+ Baths</option>
      </select>

      {/* Our Listings Only checkbox */}
      {showOurTeamFilter && (
        <label className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ourTeam}
            onChange={(e) => setOurTeam(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Our Listings</span>
        </label>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-6 py-2 text-gray-600 font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
