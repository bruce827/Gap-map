export interface ApiError {
  error: string;
  status?: number;
}

export interface AppConfig {
  amapKey: string;
  amapSecurityCode: string;
}

export interface CityPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface City {
  id: string;
  name: string;
  province: string | null;
  rank: number | null;
  lat: number | null;
  lng: number | null;
  district: string | null;
  price: number | null;
  comfort_days: number | null;
  green_rate: number | null;
}

export interface HomePageData {
  config: AppConfig;
  cities: City[];
}
