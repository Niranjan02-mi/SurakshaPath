// localStorage wrapper for tourist data persistence

const TOURIST_KEY = 'surakshapath_tourist';
const SETTINGS_KEY = 'surakshapath_settings';
const LOCATION_KEY = 'surakshapath_last_location';

export function saveTourist(touristRecord) {
    localStorage.setItem(TOURIST_KEY, JSON.stringify(touristRecord));
}

export function getTourist() {
    try {
        return JSON.parse(localStorage.getItem(TOURIST_KEY));
    } catch {
        return null;
    }
}

export function clearTourist() {
    localStorage.removeItem(TOURIST_KEY);
}

export function hasTourist() {
    return !!localStorage.getItem(TOURIST_KEY);
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { language: 'en' };
    } catch {
        return { language: 'en' };
    }
}

export function saveLastLocation(location) {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({
        ...location,
        savedAt: Date.now()
    }));
}

export function getLastLocation() {
    try {
        return JSON.parse(localStorage.getItem(LOCATION_KEY));
    } catch {
        return null;
    }
}
