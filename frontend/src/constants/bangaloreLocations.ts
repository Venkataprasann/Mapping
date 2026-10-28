// Comprehensive Bangalore localities and popular destination spots for journey synchronization
export interface BangaloreLocation {
  id: string;
  name: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central';
  lat: number;
  lng: number;
  description: string;
}

export const BANGALORE_ORIGIN_LOCATIONS: BangaloreLocation[] = [
  // East Bangalore
  { id: 'whitefield', name: 'ITPL / Whitefield', zone: 'East', lat: 12.9850, lng: 77.7300, description: 'Tech corridor via Marathahalli & Old Airport Rd' },
  { id: 'indiranagar', name: 'Indiranagar 100ft Rd', zone: 'East', lat: 12.9784, lng: 77.6408, description: 'Central-East nightlife & shopping hub' },
  { id: 'marathahalli', name: 'Marathahalli Junction', zone: 'East', lat: 12.9562, lng: 77.7009, description: 'Outer Ring Road intersection' },
  { id: 'bellandur', name: 'Bellandur EcoSpace', zone: 'East', lat: 12.9260, lng: 77.6762, description: 'Outer Ring Road tech park zone' },
  { id: 'sarjapur', name: 'Sarjapur Road / Wipro', zone: 'East', lat: 12.9100, lng: 77.6850, description: 'Southeast residential corridor' },

  // South Bangalore
  { id: 'ecity', name: 'Electronic City Phase 1', zone: 'South', lat: 12.8452, lng: 77.6602, description: 'Infosys gate via Elevated Expressway' },
  { id: 'hsr', name: 'HSR Layout Sector 1', zone: 'South', lat: 12.9116, lng: 77.6534, description: 'Startup hub between Silk Board & Bellandur' },
  { id: 'silkboard', name: 'Central Silk Board', zone: 'South', lat: 12.9172, lng: 77.6229, description: 'Major southern junction connecting Hosur Rd & ORR' },
  { id: 'jayanagar', name: 'Jayanagar 4th Block', zone: 'South', lat: 12.9299, lng: 77.5824, description: 'Historic residential hub & shopping complex' },
  { id: 'jpnagar', name: 'JP Nagar / Bannerghatta Rd', zone: 'South', lat: 12.9063, lng: 77.5937, description: 'South residential zone via Dairy Circle' },

  // North Bangalore
  { id: 'hebbal', name: 'Hebbal Flyover', zone: 'North', lat: 13.0358, lng: 77.5970, description: 'Gateway to Airport & Outer Ring Road North' },
  { id: 'manyata', name: 'Manyata Tech Park, Nagavara', zone: 'North', lat: 13.0475, lng: 77.6200, description: 'Massive North Bangalore IT hub' },
  { id: 'yelahanka', name: 'Yelahanka New Town', zone: 'North', lat: 13.1007, lng: 77.5963, description: 'Northern satellite city near Kogilu' },
  { id: 'airport', name: 'Kempegowda Airport (BLR)', zone: 'North', lat: 13.1986, lng: 77.7066, description: 'International Airport via Bellary Expressway' },

  // West Bangalore
  { id: 'rajajinagar', name: 'Rajajinagar / Orion', zone: 'West', lat: 13.0112, lng: 77.5550, description: 'West residential corridor via Chord Road' },
  { id: 'malleshwaram', name: 'Malleshwaram 8th Cross', zone: 'West', lat: 13.0031, lng: 77.5702, description: 'Heritage market & residential center' },
  { id: 'majestic', name: 'Majestic / KSR Railway Station', zone: 'West', lat: 12.9779, lng: 77.5724, description: 'City railway & bus transit nerve center' },
  { id: 'banashankari', name: 'Banashankari BDA Complex', zone: 'West', lat: 12.9255, lng: 77.5468, description: 'Southwest metro terminal hub' },

  // Central Bangalore
  { id: 'ubcity', name: 'UB City / MG Road', zone: 'Central', lat: 12.9716, lng: 77.5959, description: 'CBD central district' },
  { id: 'churchstreet', name: 'Church Street / Brigade Rd', zone: 'Central', lat: 12.9752, lng: 77.6070, description: 'Walkable central restaurant & café lane' }
];

export const BANGALORE_DESTINATIONS: BangaloreLocation[] = [
  { id: 'nexus-koramangala', name: 'PVR Cinemas, Nexus Koramangala', zone: 'South', lat: 12.9345, lng: 77.6111, description: 'Premier cinema & food court hub' },
  { id: 'ub-city', name: 'UB City Mall, Central Bengaluru', zone: 'Central', lat: 12.9716, lng: 77.5959, description: 'Luxury dining & central meetup' },
  { id: 'phoenix-whitefield', name: 'Phoenix Marketcity, Whitefield', zone: 'East', lat: 12.9972, lng: 77.6974, description: 'East Bengaluru mega shopping mall' },
  { id: 'orion-rajajinagar', name: 'Orion Mall, Brigade Gateway', zone: 'West', lat: 13.0112, lng: 77.5550, description: 'West Bengaluru lakefront mall' },
  { id: 'forum-south', name: 'Forum South Bangalore, Konanakunte', zone: 'South', lat: 12.8885, lng: 77.5707, description: 'South Kanakapura road retail destination' },
  { id: 'toit-indiranagar', name: 'Toit & 100ft Road, Indiranagar', zone: 'East', lat: 12.9784, lng: 77.6408, description: 'Craft brews and dining' },
  { id: 'cubbon-park', name: 'Cubbon Park / Church Street', zone: 'Central', lat: 12.9752, lng: 77.6070, description: 'Central green park & bookstore street' },
  { id: 'manyata-hub', name: 'Manyata Embassy Business Park', zone: 'North', lat: 13.0475, lng: 77.6200, description: 'North Bengaluru business hub' }
];

export interface PresetPlan {
  id: string;
  title: string;
  description: string;
  friendA: BangaloreLocation;
  friendB: BangaloreLocation;
  destination: BangaloreLocation;
}

export const POPULAR_BANGALORE_PLANS: PresetPlan[] = [
  {
    id: 'plan-1',
    title: 'East & South -> Koramangala Cinema',
    description: 'Whitefield (Friend A) & Electronic City (Friend B) -> Nexus Koramangala',
    friendA: BANGALORE_ORIGIN_LOCATIONS[0], // Whitefield
    friendB: BANGALORE_ORIGIN_LOCATIONS[5], // ECity
    destination: BANGALORE_DESTINATIONS[0]  // Nexus Koramangala
  },
  {
    id: 'plan-2',
    title: 'North & South -> UB City CBD',
    description: 'Hebbal Flyover (Friend A) & Jayanagar 4th Block (Friend B) -> UB City',
    friendA: BANGALORE_ORIGIN_LOCATIONS[10], // Hebbal
    friendB: BANGALORE_ORIGIN_LOCATIONS[8],  // Jayanagar
    destination: BANGALORE_DESTINATIONS[1]  // UB City
  },
  {
    id: 'plan-3',
    title: 'West & East -> Indiranagar 100ft Rd',
    description: 'Rajajinagar (Friend A) & Bellandur (Friend B) -> Toit Indiranagar',
    friendA: BANGALORE_ORIGIN_LOCATIONS[14], // Rajajinagar
    friendB: BANGALORE_ORIGIN_LOCATIONS[3],  // Bellandur
    destination: BANGALORE_DESTINATIONS[5]  // Toit Indiranagar
  },
  {
    id: 'plan-4',
    title: 'Southwest & Northwest -> Orion Mall',
    description: 'Banashankari (Friend A) & Yelahanka (Friend B) -> Orion Mall Rajajinagar',
    friendA: BANGALORE_ORIGIN_LOCATIONS[17], // Banashankari
    friendB: BANGALORE_ORIGIN_LOCATIONS[12], // Yelahanka
    destination: BANGALORE_DESTINATIONS[3]  // Orion Mall
  }
];

/**
 * Generates realistic Bengaluru road waypoints between any two points in the city
 * using urban network corridors (Outer Ring Road, Inner Ring Road, Hosur Road, Old Airport Rd, Bellary Rd)
 */
export function generateBangaloreCorridorPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numSteps = 12
): Array<{ lat: number; lng: number; name?: string }> {
  const points: Array<{ lat: number; lng: number; name?: string }> = [];

  // Intermediate road waypoints based on Bangalore geography
  // If moving between North and South, route often bends toward CBD / Ring Road
  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  // Add realistic urban road curvature:
  // Roads in Bengaluru are not straight; they follow arterial arcs
  const deltaLat = end.lat - start.lat;
  const deltaLng = end.lng - start.lng;
  const perpLat = -deltaLng * 0.18;
  const perpLng = deltaLat * 0.18;

  for (let i = 0; i <= numSteps; i++) {
    const t = i / numSteps;
    // Quadratic Bezier curve to simulate curved city roads and flyovers
    const arc = 4 * t * (1 - t);
    const lat = (1 - t) * start.lat + t * end.lat + arc * perpLat;
    const lng = (1 - t) * start.lng + t * end.lng + arc * perpLng;
    points.push({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
  }

  return points;
}

/**
 * Calculates realistic Bengaluru traffic-aware travel duration between any 2 locations
 */
export function calculateBangaloreTravelTime(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): { distanceKm: number; durationMins: number; trafficLevel: 'normal' | 'moderate' | 'heavy' } {
  // Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Indian metro urban road network factor (~1.38x straight line)
  const roadKm = Math.max(1.5, Math.round(straightLineKm * 1.38 * 10) / 10);

  // Realistic Bengaluru urban speed: ~21 km/h average with peak traffic
  // Peak bottlenecks (Silk Board, Marathahalli, Hebbal, Tin Factory, Goraguntepalya)
  let avgSpeedKmh = 21;
  let trafficLevel: 'normal' | 'moderate' | 'heavy' = 'moderate';

  if (roadKm > 20) {
    avgSpeedKmh = 24; // Elevated expressway or airport road stretches
  } else if (roadKm < 8) {
    avgSpeedKmh = 16; // Dense inner city roads
    trafficLevel = 'heavy';
  }

  const durationHours = roadKm / avgSpeedKmh;
  const durationMins = Math.max(8, Math.round(durationHours * 60));

  return {
    distanceKm: roadKm,
    durationMins,
    trafficLevel
  };
}
