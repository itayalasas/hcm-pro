import { useState, useEffect } from 'react';
import { MapPin, Globe } from 'lucide-react';
import Autocomplete from './Autocomplete';

interface Country {
  iso2: string;
  iso3: string;
  country: string;
  cities: string[];
}

interface CountryCitySelectorProps {
  selectedCountry?: string;
  selectedCity?: string;
  selectedCountryISO3?: string;
  onCountryChange: (country: string, iso3: string) => void;
  onCityChange: (city: string) => void;
  error?: string;
}

export default function CountryCitySelector({
  selectedCountry,
  selectedCity,
  selectedCountryISO3,
  onCountryChange,
  onCityChange,
  error
}: CountryCitySelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentCountryData, setCurrentCountryData] = useState<Country | null>(null);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    console.log('=== useEffect for currentCountryData ===');
    console.log('selectedCountry:', selectedCountry);
    console.log('countries.length:', countries.length);
    if (selectedCountry && countries.length > 0) {
      console.log('Looking for country:', selectedCountry);
      console.log('Available countries:', countries.map(c => c.country));
      const countryData = countries.find(c => c.country === selectedCountry);
      console.log('Found countryData:', countryData);
      setCurrentCountryData(countryData || null);
    } else {
      setCurrentCountryData(null);
    }
  }, [selectedCountry, countries]);

  const loadCountries = async () => {
    try {
      const apiUrl = import.meta.env.VITE_COUNTRIES_API_URL;
      const apiKey = import.meta.env.VITE_COUNTRIES_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error('Configuración de API de países no encontrada');
      }

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Integration-Key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar países: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.msg || 'Error al cargar países');
      }

      setCountries(result.data || []);
      setApiError(null);
    } catch (error) {
      console.error('Error loading countries:', error);
      setApiError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country: string, _option?: any) => {
    console.log('=== handleCountrySelect ===');
    console.log('country parameter:', country);
    console.log('countries array length:', countries.length);
    const countryData = countries.find(c => c.country === country);
    console.log('found countryData:', countryData);
    if (countryData) {
      console.log('calling onCountryChange with:', country, countryData.iso3);
      setCurrentCountryData(countryData);
      onCountryChange(country, countryData.iso3);
      onCityChange('');
    }
  };

  const handleCitySelect = (city: string, _option?: any) => {
    onCityChange(city);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-pulse">
          <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
          <div className="h-11 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <label className="block text-sm font-medium text-slate-700 mb-2">Ciudad</label>
          <div className="h-11 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">
          Error al cargar países: {apiError}
        </p>
      </div>
    );
  }

  const countryNames = countries.map(c => c.country);
  const cityNames = currentCountryData?.cities || [];

  console.log('=== CountryCitySelector Render ===');
  console.log('selectedCountry:', selectedCountry);
  console.log('selectedCountryISO3:', selectedCountryISO3);
  console.log('currentCountryData:', currentCountryData);
  console.log('cityNames.length:', cityNames.length);
  console.log('disabled condition:', !selectedCountry || cityNames.length === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Globe className="w-4 h-4 inline mr-1" />
          País *
        </label>
        <Autocomplete
          options={countryNames}
          value={selectedCountry || ''}
          onChange={handleCountrySelect}
          placeholder="Escribe para buscar país..."
          error={error}
        />
        {selectedCountryISO3 && (
          <p className="text-xs text-slate-500 mt-1">Código: {selectedCountryISO3}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Ciudad *
        </label>
        <Autocomplete
          options={cityNames}
          value={selectedCity || ''}
          onChange={handleCitySelect}
          placeholder={selectedCountry ? "Escribe para buscar ciudad..." : "Primero selecciona un país"}
          disabled={!selectedCountry || cityNames.length === 0}
          error={error}
        />
        {currentCountryData && cityNames.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">No hay ciudades disponibles para este país</p>
        )}
      </div>
    </div>
  );
}
