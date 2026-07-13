export type SpotProvider = "ndbc" | "openmeteo";

export type Spot = {
  id: string;
  name: string;
  region: string;
  country: "US" | "BR";
  lat: number;
  lon: number;
  provider: SpotProvider;
  buoy?: string;
  tideStation?: string;
  faces: string;
  break: string;
  notes: string;
};

export const SPOTS: Spot[] = [
  // --- New York ---
  {
    id: "rockaway",
    name: "Rockaway Beach",
    region: "Queens, NY",
    country: "US",
    lat: 40.5834,
    lon: -73.8371,
    provider: "ndbc",
    buoy: "44065",
    tideStation: "8531680",
    faces: "S",
    break: "beach",
    notes: "NYC's home break. Consistent S/SE swells. 90th St jetty setups.",
  },
  {
    id: "longbeach",
    name: "Long Beach",
    region: "Nassau, NY",
    country: "US",
    lat: 40.5885,
    lon: -73.6579,
    provider: "ndbc",
    buoy: "44065",
    tideStation: "8531680",
    faces: "S",
    break: "beach",
    notes: "Long stretch of jetty peaks. Works most swells with side wind.",
  },
  {
    id: "lido",
    name: "Lido Beach",
    region: "Nassau, NY",
    country: "US",
    lat: 40.5895,
    lon: -73.6187,
    provider: "ndbc",
    buoy: "44025",
    tideStation: "8531680",
    faces: "S",
    break: "beach",
    notes: "Less crowd than Long Beach. Better on mid tide.",
  },
  {
    id: "gilgo",
    name: "Gilgo Beach",
    region: "Suffolk, NY",
    country: "US",
    lat: 40.6216,
    lon: -73.3888,
    provider: "ndbc",
    buoy: "44025",
    tideStation: "8531680",
    faces: "S",
    break: "beach",
    notes: "Wide open beach breaks. Great for NW wind offshore.",
  },
  {
    id: "fireisland",
    name: "Fire Island",
    region: "Suffolk, NY",
    country: "US",
    lat: 40.6501,
    lon: -73.1518,
    provider: "ndbc",
    buoy: "44025",
    tideStation: "8531680",
    faces: "S",
    break: "beach",
    notes: "Less crowded than Long Island proper. Barrier island exposure.",
  },
  {
    id: "montauk",
    name: "Ditch Plains",
    region: "Montauk, NY",
    country: "US",
    lat: 41.0407,
    lon: -71.9337,
    provider: "ndbc",
    buoy: "44097",
    tideStation: "8510560",
    faces: "SE",
    break: "reef/point",
    notes: "The Hamptons' classic point/reef. Best on S/SE groundswell.",
  },
  // --- Florianópolis ---
  {
    id: "joaquina",
    name: "Praia da Joaquina",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.6289,
    lon: -48.4519,
    provider: "openmeteo",
    faces: "E/SE",
    break: "beach",
    notes: "Floripa's classic. Powerful E/SE swells. Best on offshore W wind.",
  },
  {
    id: "praiamole",
    name: "Praia Mole",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.6031,
    lon: -48.4234,
    provider: "openmeteo",
    faces: "E",
    break: "beach",
    notes: "Popular cove. Works on smaller days. Watch for the shorebreak.",
  },
  {
    id: "campeche",
    name: "Praia do Campeche",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.6772,
    lon: -48.4802,
    provider: "openmeteo",
    faces: "E/SE",
    break: "beach",
    notes: "Long stretch, multiple peaks. Consistent for all levels.",
  },
  {
    id: "matadeiro",
    name: "Praia do Matadeiro",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.7539,
    lon: -48.5081,
    provider: "openmeteo",
    faces: "S/SE",
    break: "beach/point",
    notes: "South-facing crescent. Cleans up when north wind blows.",
  },
  {
    id: "barradalagoa",
    name: "Barra da Lagoa",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.5769,
    lon: -48.4267,
    provider: "openmeteo",
    faces: "E",
    break: "beach",
    notes: "River-mouth banks. Great on mid to high tide.",
  },
  {
    id: "brava",
    name: "Praia Brava",
    region: "Florianópolis, BR",
    country: "BR",
    lat: -27.4136,
    lon: -48.4022,
    provider: "openmeteo",
    faces: "E/NE",
    break: "beach",
    notes: "North of the island. Handles size, catches NE swells too.",
  },
];

export function getSpot(id: string): Spot | undefined {
  return SPOTS.find((s) => s.id === id);
}
