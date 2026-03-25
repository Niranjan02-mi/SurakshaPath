export async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    // Remove any extra whitespace from multiline strings for better caching
    const cleanText = text.trim();
    if (!cleanText) return text;

    const cacheKey = `tr_${targetLang}_${cleanText}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
        return cached;
    }

    const apiKey = import.meta.env.VITE_TRANSLATE_API_KEY;
    if (!apiKey) {
        console.warn('Translate API key missing, returning original text');
        return text;
    }

    try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: cleanText,
                target: targetLang,
                format: 'text', // Prevent returning HTML escapes for simple strings
            })
        });

        if (!res.ok) {
            console.error('Translation network request failed', res.statusText);
            return text;
        }

        const data = await res.json();
        
        if (data && data.data && data.data.translations && data.data.translations.length > 0) {
            const translated = data.data.translations[0].translatedText;
            sessionStorage.setItem(cacheKey, translated);
            return translated;
        }

        return text;
    } catch (e) {
        console.error('Translation failed', e);
        return text;
    }
}
