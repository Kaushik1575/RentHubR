import React, { useEffect, useState } from 'react';
import './GoogleTranslate.css';

const LanguageSelector = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('user_lang') || 'en');

    // Helper to interact with Google Translate's hidden dropdown
    const applyLanguage = (langCode) => {
        const googleCombo = document.querySelector('.goog-te-combo');
        if (googleCombo) {
            googleCombo.value = langCode;
            googleCombo.dispatchEvent(new Event('change', { bubbles: true }));
            googleCombo.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };

    useEffect(() => {
        // Initial sync: Try to apply the saved language repeatedly until Google Translate loads
        const intervalId = setInterval(() => {
            const googleCombo = document.querySelector('.goog-te-combo');
            if (googleCombo) {
                const currentLang = localStorage.getItem('user_lang') || 'en';
                if (googleCombo.value !== currentLang) {
                    applyLanguage(currentLang);
                } else {
                    // Stop checking once securely set
                    clearInterval(intervalId);
                }
            }
        }, 1000);

        // Stop checking after 20 seconds
        const timeoutId = setTimeout(() => clearInterval(intervalId), 20000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    const handleChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        localStorage.setItem('user_lang', newLang);

        // Update Google Translate cookie
        // Format: /source/target or /auto/target
        // We assume source is 'en' based on our config
        document.cookie = `googtrans=/en/${newLang}; path=/; domain=${window.location.hostname}`;
        document.cookie = `googtrans=/en/${newLang}; path=/;`; // Fallback for localhost without specialized domain handling

        // Force reload to ensure translation applies cleanly
        window.location.reload();
    };

    return (
        <div className="language-selector-container">
            <select
                className="language-select"
                value={selectedLanguage}
                onChange={handleChange}
                aria-label="Select Language"
            >
                <option value="en">English (English)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="or">Odia (ଓଡ଼ିଆ)</option>
            </select>
        </div>
    );
};

export default LanguageSelector;
