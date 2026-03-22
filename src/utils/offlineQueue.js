// Offline alert queue — stores alerts in localStorage, dispatches when online

const QUEUE_KEY = 'surakshapath_alert_queue';
const DISPATCH_LOG_KEY = 'surakshapath_dispatch_log';

export function queueAlert(alert) {
    const queue = getQueuedAlerts();
    const newAlert = {
        ...alert,
        id: `ALT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        queuedAt: new Date().toISOString(),
        status: 'queued',
        dispatched: false
    };
    queue.push(newAlert);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // Try to flush immediately if online
    if (navigator.onLine) {
        flushQueue();
    }

    return newAlert;
}

export function getQueuedAlerts() {
    try {
        return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function getPendingAlerts() {
    return getQueuedAlerts().filter(a => !a.dispatched);
}

export function getDispatchedAlerts() {
    return getQueuedAlerts().filter(a => a.dispatched);
}

export function flushQueue() {
    const queue = getQueuedAlerts();
    const updated = queue.map(alert => {
        if (!alert.dispatched) {
            return {
                ...alert,
                dispatched: true,
                dispatchedAt: new Date().toISOString(),
                status: 'sent'
            };
        }
        return alert;
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));

    // Log dispatch
    const log = JSON.parse(localStorage.getItem(DISPATCH_LOG_KEY) || '[]');
    const newDispatches = updated.filter(a => a.dispatchedAt && !log.find(l => l.id === a.id));
    log.push(...newDispatches.map(a => ({ id: a.id, dispatchedAt: a.dispatchedAt })));
    localStorage.setItem(DISPATCH_LOG_KEY, JSON.stringify(log));

    return updated;
}

export function clearQueue() {
    localStorage.setItem(QUEUE_KEY, '[]');
}

export function getQueueStats() {
    const all = getQueuedAlerts();
    return {
        total: all.length,
        pending: all.filter(a => !a.dispatched).length,
        dispatched: all.filter(a => a.dispatched).length
    };
}

// Listen for online event to auto-flush
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[SurakshaPath] Connection restored — flushing alert queue...');
        const flushed = flushQueue();
        const dispatched = flushed.filter(a => a.status === 'sent');
        if (dispatched.length > 0) {
            console.log(`[SurakshaPath] Dispatched ${dispatched.length} queued alerts`);
        }
    });
}
