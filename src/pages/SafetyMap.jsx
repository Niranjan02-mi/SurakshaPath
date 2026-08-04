import React, { useEffect, useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, CircleF, MarkerF, InfoWindowF, Autocomplete } from '@react-google-maps/api';
import { ZONES, DEFAULT_CENTER, DEFAULT_ZOOM, NEARBY_ALERTS } from '../data/zones';
import { computeSafetyScore } from '../utils/anomalyEngine';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDDP_wskGXC4GpvBZU1jU0aLE4DVRiN54k';
const LIBRARIES = ['places', 'geometry'];

// Dark-themed map style
const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#17263c' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
];

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

function SafetyScoreRing({ score }) {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const color = score >= 70 ? '#2dd48c' : score >= 40 ? '#ffa502' : '#ff4757';

    return (
        <div className="safety-ring">
            <svg width="80" height="80">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke={color} strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                />
            </svg>
            <span className="score-value" style={{ color }}>{score}</span>
        </div>
    );
}

export default function SafetyMap() {
    const [userPos, setUserPos] = useState({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] });
    const [liveTrackers, setLiveTrackers] = useState([]);
    const [safetyScore, setSafetyScore] = useState(67);
    const [activeZone, setActiveZone] = useState(null);
    const [showUserPopup, setShowUserPopup] = useState(false);
    const [autocomplete, setAutocomplete] = useState(null);
    const [touristPlaces, setTouristPlaces] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const mapRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserPos(newPos);
                    setSafetyScore(computeSafetyScore(newPos.lat, newPos.lng, 0));
                },
                () => {
                    setSafetyScore(computeSafetyScore(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 0));
                }
            );
        }
    }, []);

    useEffect(() => {
        const fetchLiveTracking = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/tracking/live');
                if (res.ok) {
                    const data = await res.json();
                    setLiveTrackers(data);
                }
            } catch (err) {
                console.error('Error fetching live tracking:', err);
            }
        };

        fetchLiveTracking();
        const interval = setInterval(fetchLiveTracking, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchBhandardaraPlaces = useCallback((map) => {
        if (!window.google) return;
        const service = new window.google.maps.places.PlacesService(map);
        const request = {
            query: 'tourist attractions in Bhandardara, Maharashtra',
        };

        const hardcodedTreks = [
            { name: '🏔️ Kalsubai Peak (Trek)', geometry: { location: { lat: 19.6015, lng: 73.7095 } }, rating: 4.7, formatted_address: 'Kalsubai Harishchandragad Wildlife Sanctuary' },
            { name: '🏔️ Harishchandragad (Trek)', geometry: { location: { lat: 19.3878, lng: 73.7745 } }, rating: 4.8, formatted_address: 'Ahmednagar District, Maharashtra' },
            { name: '🧗 Sandhan Valley (Trek)', geometry: { location: { lat: 19.5297, lng: 73.7051 } }, rating: 4.7, formatted_address: 'Samrad Village, Maharashtra' },
            { name: '🏰 Ratangad Fort (Trek)', geometry: { location: { lat: 19.5074, lng: 73.7051 } }, rating: 4.8, formatted_address: 'Ratanwadi, Maharashtra' }
        ];

        service.textSearch(request, (results, status) => {
            console.log('Places API Search Status:', status);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                console.log('Places found:', results.length);
                setTouristPlaces([...results, ...hardcodedTreks]);
                if (results.length > 0) {
                    map.panTo(results[0].geometry.location);
                    map.setZoom(11);
                }
            } else {
                console.error('Places API failed with status:', status);
                // Fallback hardcoded Bhandardara locations if API key is restricted
                const fallbackPlaces = [
                    { name: '🌊 Arthur Lake', geometry: { location: { lat: 19.5393, lng: 73.7749 } }, rating: 4.5, formatted_address: 'Bhandardara, Maharashtra' },
                    { name: '🌊 Randha Falls', geometry: { location: { lat: 19.5539, lng: 73.7741 } }, rating: 4.6, formatted_address: 'Bhandardara, Maharashtra' },
                    { name: '🌊 Umbrella Fall', geometry: { location: { lat: 19.5444, lng: 73.7661 } }, rating: 4.4, formatted_address: 'Bhandardara, Maharashtra' },
                    { name: '🛕 Amruteshwar Temple', geometry: { location: { lat: 19.5097, lng: 73.7088 } }, rating: 4.8, formatted_address: 'Ratanwadi, Maharashtra' },
                    ...hardcodedTreks
                ];
                setTouristPlaces(fallbackPlaces);
                map.panTo({ lat: 19.5393, lng: 73.7749 });
                map.setZoom(11); // Slightly zoomed out to see all treks
            }
        });
    }, []);

    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
        fetchBhandardaraPlaces(map);
    }, [fetchBhandardaraPlaces]);

    const onSearchLoad = useCallback((ac) => {
        setAutocomplete(ac);
    }, []);

    const onPlaceChanged = useCallback(() => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setUserPos({ lat, lng });
                mapRef.current?.panTo({ lat, lng });
                mapRef.current?.setZoom(14);
                setSafetyScore(computeSafetyScore(lat, lng, 0));
            }
        }
    }, [autocomplete]);

    const severityBadge = (sev) => {
        const cls = sev === 'restricted' ? 'badge-danger' : sev === 'moderate' ? 'badge-warning' : 'badge-info';
        return <span className={`badge ${cls}`}>{sev}</span>;
    };

    if (loadError) {
        return (
            <div className="page">
                <div className="page-header"><h1>Live Safety Map</h1></div>
                <div className="retro-card" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--danger)' }}>
                    ⚠️ Failed to load Google Maps. Please check your internet connection and API key.
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Live Safety Map</h1>
                <span className="header-badge">Live</span>
            </div>

            {/* Map */}
            <div className="map-container" style={{ marginBottom: 'var(--space-lg)', border: 'var(--border-thick)', height: '400px', backgroundColor: 'var(--bg-secondary)', position: 'relative', zIndex: 1 }}>
                {isLoaded && (
                    <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%', maxWidth: '400px' }}>
                        <Autocomplete onLoad={onSearchLoad} onPlaceChanged={onPlaceChanged}>
                            <input
                                type="text"
                                placeholder="Search for a place..."
                                style={{
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    height: '44px',
                                    padding: '0 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#ffffff',
                                    color: '#000000',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    outline: 'none',
                                    textOverflow: 'ellipsis',
                                }}
                            />
                        </Autocomplete>
                    </div>
                )}
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={userPos}
                        zoom={DEFAULT_ZOOM}
                        onLoad={onMapLoad}
                        options={{
                            styles: MAP_STYLES,
                            disableDefaultUI: false,
                            zoomControl: true,
                            mapTypeControl: true,
                            streetViewControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        {/* Zone overlays */}
                        {ZONES.map(zone => (
                            <CircleF
                                key={zone.id}
                                center={{ lat: zone.center[0], lng: zone.center[1] }}
                                radius={zone.riskScore * 15000}
                                options={{
                                    strokeColor: zone.color,
                                    strokeWeight: 2,
                                    fillColor: zone.color,
                                    fillOpacity: 0.15,
                                    strokeOpacity: 0.8,
                                    clickable: true,
                                }}
                                onClick={() => setActiveZone(zone)}
                            />
                        ))}

                        {/* Bhandardara Tourist Places */}
                        {touristPlaces.map((place, index) => (
                            <MarkerF
                                key={index}
                                position={place.geometry.location}
                                onClick={() => setSelectedPlace(place)}
                                icon={{
                                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                }}
                            />
                        ))}

                        {/* Live LoRa/ESP-NOW Trackers */}
                        {liveTrackers.map((tracker) => (
                            <MarkerF
                                key={tracker.touristId}
                                position={{ lat: tracker.lat, lng: tracker.lng }}
                                icon={{
                                    url: tracker.sosStatus 
                                        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' 
                                        : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                                }}
                                onClick={() => {
                                    // simple click handler just to pan
                                    mapRef.current?.panTo({ lat: tracker.lat, lng: tracker.lng });
                                }}
                            />
                        ))}

                        {/* Tourist Place InfoWindow */}
                        {selectedPlace && (
                            <InfoWindowF
                                position={selectedPlace.geometry.location}
                                onCloseClick={() => setSelectedPlace(null)}
                            >
                                <div style={{ padding: '8px', maxWidth: '200px', color: '#000' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>{selectedPlace.name}</h4>
                                    {selectedPlace.formatted_address && (
                                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{selectedPlace.formatted_address}</p>
                                    )}
                                    {selectedPlace.rating && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                            <span>⭐ {selectedPlace.rating}</span>
                                            <span style={{ color: '#888' }}>({selectedPlace.user_ratings_total} reviews)</span>
                                        </div>
                                    )}
                                </div>
                            </InfoWindowF>
                        )}

                        {/* Zone info windows */}
                        {activeZone && (
                            <InfoWindowF
                                position={{ lat: activeZone.center[0], lng: activeZone.center[1] }}
                                onCloseClick={() => setActiveZone(null)}
                            >
                                <div style={{ color: '#333', fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                                    <strong>{activeZone.name}</strong><br />
                                    <span style={{ fontSize: '0.8rem' }}>{activeZone.description}</span><br />
                                    <span style={{ fontSize: '0.75rem', color: activeZone.color }}>
                                        Risk: {(activeZone.riskScore * 100).toFixed(0)}% · {activeZone.type}
                                    </span>
                                </div>
                            </InfoWindowF>
                        )}

                        {/* User marker */}
                        <MarkerF
                            position={userPos}
                            onClick={() => setShowUserPopup(true)}
                        />
                        {showUserPopup && (
                            <InfoWindowF
                                position={userPos}
                                onCloseClick={() => setShowUserPopup(false)}
                            >
                                <span style={{ color: '#333', fontWeight: 'bold' }}>📍 You are here</span>
                            </InfoWindowF>
                        )}

                        {/* Search Box Overlay */}
                        <Autocomplete onLoad={onSearchLoad} onPlaceChanged={onPlaceChanged}>
                            <input
                                type="text"
                                placeholder="Search places..."
                                style={{
                                    boxSizing: 'border-box',
                                    border: '2px solid var(--forest-green)',
                                    width: '280px',
                                    height: '40px',
                                    padding: '0 12px',
                                    borderRadius: '0',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    textOverflow: 'ellipses',
                                    position: 'absolute',
                                    left: '50%',
                                    marginLeft: '-140px',
                                    top: '10px',
                                    backgroundColor: 'var(--cream)',
                                    color: 'var(--forest-green)',
                                    fontFamily: 'var(--font-main)',
                                    fontWeight: '700'
                                }}
                            />
                        </Autocomplete>
                    </GoogleMap>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        ⏳ Loading Google Maps...
                    </div>
                )}
            </div>

            {/* Safety Score */}
            <div className="retro-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
                <SafetyScoreRing score={safetyScore} />
                <div>
                    <h3>Safety Score</h3>
                    <p className="text-secondary" style={{ marginTop: 'var(--space-xs)', fontSize: '0.85rem', fontWeight: 600 }}>
                        Based on your location, zone risk level, and time of day
                    </p>
                </div>
            </div>

            {/* Nearby Alerts */}
            <h3 style={{ marginBottom: 'var(--space-md)', fontFamily: 'var(--font-main)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--forest-green)' }}>Nearby Alerts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {NEARBY_ALERTS.map(alert => (
                    <div key={alert.id} className="retro-card" style={{ padding: 'var(--space-md)', marginBottom: '0' }}>
                        <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{alert.title}</h4>
                                <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{alert.distance}</span>
                            </div>
                            {severityBadge(alert.severity)}
                        </div>
                        <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{alert.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
