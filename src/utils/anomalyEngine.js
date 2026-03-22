// Rule-based AI anomaly engine v0.1
// Detects: stationary > 2 hours in high-risk zone, night movement in restricted zone, etc.

import { ZONES } from '../data/zones';

export function detectAnomaly(locationData) {
    const {
        lat,
        lng,
        speed = 0,
        timeSinceLastMove = 0, // in seconds
        timestamp = Date.now()
    } = locationData;

    const zone = getZoneForLocation(lat, lng);
    const hour = new Date(timestamp).getHours();
    const isNight = hour >= 22 || hour <= 5;

    const anomalies = [];

    // Rule 1: Stationary > 2 hours in forest / high-risk zone
    if (timeSinceLastMove > 7200 && zone && zone.riskScore > 0.6) {
        anomalies.push({
            type: 'STATIONARY_HIGH_RISK',
            severity: 'high',
            score: Math.min(1, (timeSinceLastMove / 7200) * zone.riskScore),
            reason: `No movement for ${formatDuration(timeSinceLastMove)} in ${zone.name}`,
            zone: zone.name,
            riskScore: zone.riskScore
        });
    }

    // Rule 2: Night movement in restricted zone
    if (isNight && speed > 0 && zone && zone.type === 'restricted') {
        anomalies.push({
            type: 'NIGHT_RESTRICTED',
            severity: 'medium',
            score: 0.7,
            reason: `Movement detected in restricted zone "${zone.name}" during night hours`,
            zone: zone.name,
            riskScore: zone.riskScore
        });
    }

    // Rule 3: Stationary > 4 hours anywhere
    if (timeSinceLastMove > 14400) {
        anomalies.push({
            type: 'EXTENDED_STATIONARY',
            severity: 'medium',
            score: 0.6,
            reason: `No movement for ${formatDuration(timeSinceLastMove)}`,
            zone: zone?.name || 'Unknown area',
            riskScore: zone?.riskScore || 0.3
        });
    }

    const isAnomaly = anomalies.length > 0;
    const topAnomaly = anomalies.sort((a, b) => b.score - a.score)[0];

    return {
        isAnomaly,
        anomalies,
        topAnomaly: topAnomaly || null,
        score: topAnomaly?.score || 0,
        timestamp: new Date(timestamp).toISOString()
    };
}

function getZoneForLocation(lat, lng) {
    // Simple point-in-polygon check for demo zones
    for (const zone of ZONES) {
        if (isPointInZone(lat, lng, zone)) {
            return zone;
        }
    }
    return { name: 'Open area', riskScore: 0.2, type: 'safe' };
}

function isPointInZone(lat, lng, zone) {
    // Simplified bounding box check for demo
    const { bounds } = zone;
    if (!bounds) return false;
    return lat >= bounds.south && lat <= bounds.north &&
        lng >= bounds.west && lng <= bounds.east;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

export function computeSafetyScore(lat, lng, timeSinceLastMove = 0) {
    const zone = getZoneForLocation(lat, lng);
    let score = 100;

    // Zone risk reduces score
    score -= zone.riskScore * 30;

    // Long stationary time reduces score
    if (timeSinceLastMove > 3600) {
        score -= Math.min(30, (timeSinceLastMove / 7200) * 30);
    }

    // Night time reduces score slightly
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 5) {
        score -= 10;
    }

    return Math.max(0, Math.round(score));
}
