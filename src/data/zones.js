// Geo-fence zone data for Northeast India demo
// Each zone has coordinates, risk score, and type

export const ZONES = [
    {
        id: 'taj-mahal',
        name: 'Taj Mahal Complex',
        type: 'safe',
        riskScore: 0.15,
        color: '#2dd48c',
        bounds: { north: 27.18, south: 27.17, east: 78.05, west: 78.04 },
        center: [27.1751, 78.0421],
        description: 'Iconic monument. High tourist footfall. Safe zone.'
    },
    {
        id: 'goa-baga',
        name: 'Baga Beach Area',
        type: 'moderate',
        riskScore: 0.45,
        color: '#ffa502',
        bounds: { north: 15.56, south: 15.54, east: 73.76, west: 73.74 },
        center: [15.5523, 73.7517],
        description: 'Coastal zone. Strong undercurrents during monsoon.'
    },
    {
        id: 'ladakh-pangong',
        name: 'Pangong Tso',
        type: 'restricted',
        riskScore: 0.85,
        color: '#ff4757',
        bounds: { north: 33.90, south: 33.70, east: 78.60, west: 78.40 },
        center: [33.7595, 78.6674],
        description: 'High altitude (>4300m). Oxygen depletion risk. Border region.'
    },
    {
        id: 'kerala-alleppey',
        name: 'Alleppey Backwaters',
        type: 'safe',
        riskScore: 0.25,
        color: '#2dd48c',
        bounds: { north: 9.55, south: 9.45, east: 76.40, west: 76.30 },
        center: [9.4981, 76.3388],
        description: 'Houseboat routes. Navigable waters. Safe for tourists.'
    },
    {
        id: 'jaisalmer',
        name: 'Sam Sand Dunes',
        type: 'moderate',
        riskScore: 0.60,
        color: '#ffa502',
        bounds: { north: 26.90, south: 26.70, east: 70.60, west: 70.40 },
        center: [26.8200, 70.5200],
        description: 'Desert zone. Extreme heat during day. Easy to lose orientation.'
    },
    {
        id: 'varanasi-ghats',
        name: 'Dashashwamedh Ghat',
        type: 'moderate',
        riskScore: 0.50,
        color: '#ffa502',
        bounds: { north: 25.32, south: 25.30, east: 83.01, west: 83.00 },
        center: [25.3076, 83.0062],
        description: 'Overcrowded at river banks. Fast river currents.'
    },
    {
        id: 'ranthambore',
        name: 'Ranthambore Tiger Reserve',
        type: 'restricted',
        riskScore: 0.90,
        color: '#ff4757',
        bounds: { north: 26.10, south: 25.90, east: 76.60, west: 76.40 },
        center: [26.0173, 76.5026],
        description: 'Core forest area. Wildlife threat. Strictly regulated.'
    },
    {
        id: 'kaziranga',
        name: 'Kaziranga Forest Zone',
        type: 'restricted',
        riskScore: 0.85,
        color: '#ff4757',
        bounds: { north: 26.70, south: 26.50, east: 93.60, west: 93.30 },
        center: [26.60, 93.45],
        description: 'Dense forest — rhino habitat. Restricted after dark.'
    }
];

export const DEFAULT_CENTER = [22.9, 79.2]; // Central India Overview
export const DEFAULT_ZOOM = 4.5;

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
