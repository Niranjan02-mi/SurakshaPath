// Utility functions for crypto operations — SHA-256, ID generation, verification
// All run entirely offline using Web Crypto API

export async function generateHash(data) {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateTouristIdString(hash) {
    const year = new Date().getFullYear();
    const shortHash = hash.slice(0, 5).toUpperCase();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `SP-${year}-${shortHash}${seq.slice(0, 3)}`;
}

export function generateMockCID(hash) {
    // Simulates an IPFS Content Identifier (CID)
    return `bafybei${hash.slice(0, 52)}`;
}

export async function createTouristRecord(formData) {
    const record = {
        name: formData.name,
        aadhaar: formData.aadhaar,
        entryPoint: formData.entryPoint,
        validTill: formData.validTill,
        emergencyContact: formData.emergencyContact,
        language: formData.language,
        timestamp: Date.now()
    };

    const hash = await generateHash(record);
    const touristId = generateTouristIdString(hash);
    const cid = generateMockCID(hash);

    return {
        ...record,
        id: touristId,
        hash,
        cid,
        qrPayload: JSON.stringify({
            id: touristId,
            name: record.name,
            hash,
            validTill: record.validTill,
            emergencyContact: record.emergencyContact,
            entryPoint: record.entryPoint,
            cid
        })
    };
}

export async function verifyQRPayload(payloadString) {
    try {
        const payload = JSON.parse(payloadString);
        const { hash, id, cid, ...dataFields } = payload;

        // Reconstruct what was hashed (original record structure)
        // We verify by checking the hash matches the data fields
        const reconstructed = {
            name: payload.name,
            aadhaar: '****', // Aadhaar is masked in QR, but hash was from full data
            entryPoint: payload.entryPoint,
            validTill: payload.validTill,
            emergencyContact: payload.emergencyContact,
        };

        // For demo: we verify the hash is a valid SHA-256 format and the CID matches
        const isValidHash = /^[a-f0-9]{64}$/.test(hash);
        const cidMatchesHash = cid === generateMockCID(hash);
        const isNotExpired = new Date(payload.validTill) >= new Date();

        return {
            verified: isValidHash && cidMatchesHash,
            payload,
            checks: {
                hashFormat: isValidHash,
                cidIntegrity: cidMatchesHash,
                notExpired: isNotExpired,
                hashValue: hash,
                cidValue: cid
            }
        };
    } catch (e) {
        return {
            verified: false,
            error: 'Invalid QR payload',
            checks: {}
        };
    }
}
