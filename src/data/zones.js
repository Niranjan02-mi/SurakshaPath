// Geo-fence zone data for Northeast India demo
// Each zone has coordinates, risk score, and type

export const ZONES = [
    {
        id: 'kaziranga',
        name: 'Kaziranga Forest Zone',
        type: 'restricted',
        riskScore: 0.85,
        color: '#ff4757',
        bounds: { north: 26.70, south: 26.50, east: 93.60, west: 93.30 },
        center: [26.60, 93.45],
        description: 'Dense forest — one-horned rhino habitat. Restricted after dark.'
    },
    {
        id: 'loktak',
        name: 'Loktak Lake Trail',
        type: 'moderate',
        riskScore: 0.65,
        color: '#ffa502',
        bounds: { north: 24.60, south: 24.45, east: 93.85, west: 93.70 },
        center: [24.53, 93.78],
        description: 'Floating islands. Fog-heavy mornings. Boat capsize risk.'
    },
    {
        id: 'tawang',
        name: 'Tawang Alpine Zone',
        type: 'restricted',
        riskScore: 0.75,
        color: '#ff6348',
        bounds: { north: 27.65, south: 27.50, east: 91.95, west: 91.75 },
        center: [27.58, 91.85],
        description: 'High altitude (3000m+). Landslide-prone. Limited connectivity.'
    },
    {
        id: 'shillong',
        name: 'Shillong City Area',
        type: 'safe',
        riskScore: 0.2,
        color: '#2dd48c',
        bounds: { north: 25.60, south: 25.55, east: 91.90, west: 91.85 },
        center: [25.5788, 91.8933],
        description: 'Urban area with good connectivity and infrastructure.'
    },
    {
        id: 'cherrapunji',
        name: 'Cherrapunji Trek Zone',
        type: 'moderate',
        riskScore: 0.55,
        color: '#ffa502',
        bounds: { north: 25.32, south: 25.24, east: 91.76, west: 91.68 },
        center: [25.28, 91.72],
        description: 'Heavy rainfall zone. Slippery trails. Flash flood risk.'
    },
    {
        id: 'manas',
        name: 'Manas National Park',
        type: 'restricted',
        riskScore: 0.80,
        color: '#ff4757',
        bounds: { north: 26.80, south: 26.60, east: 91.10, west: 90.80 },
        center: [26.70, 90.95],
        description: 'Tiger reserve. Elephant corridors. Strictly regulated entry.'
    }
];

export const DEFAULT_CENTER = [25.5788, 91.8933]; // Shillong
export const DEFAULT_ZOOM = 7;

export const NEARBY_ALERTS = [
    {
        id: 1,
        type: 'road_closure',
        title: 'Road closure',
        distance: '1.2 km',
        severity: 'moderate',
        description: 'NH6 blocked due to landslide near Sohra'
    },
    {
        id: 2,
        type: 'geo_fence',
        title: 'Geo-fence ahead',
        distance: '3.5 km',
        severity: 'restricted',
        description: 'Entering Kaziranga restricted zone — permit required'
    },
    {
        id: 3,
        type: 'weather',
        title: 'Heavy rain alert',
        distance: '5 km',
        severity: 'warning',
        description: 'IMD warning: Very heavy rainfall expected in next 6 hours'
    }
];
