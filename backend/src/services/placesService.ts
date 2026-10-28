import { config } from '../config/index.js';
import { Coordinates } from '../../../shared/types.js';

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
}

const BENGALURU_PLACES_DATABASE: PlaceSuggestion[] = [
  {
    placeId: 'blr-nexus-koramangala',
    name: 'PVR Cinemas, Nexus Mall Koramangala',
    address: 'Hosur Rd, Chikku Lakshmaiah Layout, Koramangala, Bengaluru, Karnataka 560095',
    coordinates: { lat: 12.9345, lng: 77.6111 }
  },
  {
    placeId: 'blr-ub-city',
    name: 'UB City Mall & The Collection',
    address: '24 Vittal Mallya Rd, KG Halli, Ashok Nagar, Bengaluru, Karnataka 560001',
    coordinates: { lat: 12.9716, lng: 77.5959 }
  },
  {
    placeId: 'blr-phoenix-whitefield',
    name: 'Phoenix Marketcity Whitefield',
    address: 'Whitefield Main Rd, Devasandra Industrial Estate, Mahadevapura, Bengaluru 560048',
    coordinates: { lat: 12.9972, lng: 77.6974 }
  },
  {
    placeId: 'blr-forum-south',
    name: 'Forum South Bangalore (Prestige Falcon City)',
    address: 'Anjanadri Layout, Konanakunte, Bengaluru, Karnataka 560062',
    coordinates: { lat: 12.8885, lng: 77.5707 }
  },
  {
    placeId: 'blr-indiranagar-100ft',
    name: 'Indiranagar 100 Feet Road Social & Cinema',
    address: '100 Feet Rd, HAL 2nd Stage, Doopanahalli, Indiranagar, Bengaluru 560008',
    coordinates: { lat: 12.9784, lng: 77.6408 }
  },
  {
    placeId: 'blr-ecity-infosys',
    name: 'Infosys Main Gate, Electronic City Phase 1',
    address: 'Electronic City, Bengaluru, Karnataka 560100',
    coordinates: { lat: 12.8452, lng: 77.6602 }
  },
  {
    placeId: 'blr-itpl-whitefield',
    name: 'International Tech Park (ITPL), Whitefield',
    address: 'ITPL Main Rd, Pattandur Agrahara, Whitefield, Bengaluru 560066',
    coordinates: { lat: 12.9850, lng: 77.7300 }
  },
  {
    placeId: 'blr-hsr-sector1',
    name: 'HSR Layout BDA Complex',
    address: 'Sector 1, HSR Layout, Bengaluru, Karnataka 560102',
    coordinates: { lat: 12.9116, lng: 77.6534 }
  }
];

export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.googleMaps.apiKey;
  }

  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return BENGALURU_PLACES_DATABASE.slice(0, 5);
    }

    if (this.apiKey) {
      try {
        return await this.fetchGooglePlacesAutocomplete(query);
      } catch (err: any) {
        console.warn(`[PlacesService] Live Google Places API failed (${err.message}). Using local curated places.`);
      }
    }

    // Curated local match
    const q = query.toLowerCase().trim();
    const results = BENGALURU_PLACES_DATABASE.filter(
      p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );

    return results.length > 0 ? results : BENGALURU_PLACES_DATABASE.slice(0, 4);
  }

  private async fetchGooglePlacesAutocomplete(query: string): Promise<PlaceSuggestion[]> {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey
      },
      body: JSON.stringify({
        input: query,
        locationBias: {
          circle: {
            center: { latitude: 12.9716, longitude: 77.5946 }, // Bengaluru center
            radius: 40000.0 // 40 km radius
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Places API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.suggestions || []).map((s: any, idx: number) => ({
      placeId: s.placePrediction?.placeId || `p-${idx}`,
      name: s.placePrediction?.structuredFormat?.mainText?.text || query,
      address: s.placePrediction?.structuredFormat?.secondaryText?.text || query,
      coordinates: { lat: 12.9716, lng: 77.5946 }
    }));
  }
}

export const placesService = new PlacesService();
