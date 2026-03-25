import React, { useState, useEffect } from 'react';
import { getTourist } from '../utils/storage';
import { translateText } from '../utils/translate';

// Global cache listener mechanism so we can update existing 
// components right when the language changes in localStorage.
// Note: In a larger app, using a React Context block might be 
// safer, but this keeps the prototype lightweight.

export function getAppLanguage() {
    return getTourist()?.language || 'en';
}

export default function T({ children }) {
    const [translated, setTranslated] = useState(children);

    useEffect(() => {
        // Only run translation if the child is a simple string.
        // We cannot reliably map complex React node trees in this prototype.
        if (typeof children !== 'string') {
            setTranslated(children);
            return;
        }

        let isMounted = true;
        const targetLang = getAppLanguage();
        
        if (targetLang === 'en') {
            if (isMounted) setTranslated(children);
            return;
        }

        translateText(children, targetLang).then((result) => {
            if (isMounted) {
                setTranslated(result);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [children]);

    return <>{translated}</>;
}
