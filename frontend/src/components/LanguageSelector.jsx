import React, { useEffect, useState } from 'react';
import './GoogleTranslate.css';

const LanguageSelector = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('user_lang') || 'en');

    useEffect(() => {
        // Function to trigger Google Translate
        const triggerTranslate = (langCode) => {
            const googleCombo = document.querySelector('.goog-te-combo');
            if (googleCombo) {
                googleCombo.value = langCode;
                // Dispatch multiple events to ensure it catches across different browsers/versions
                googleCombo.dispatchEvent(new Event('change', { bubbles: true }));
                googleCombo.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        // If a language is saved, try to apply it after script load
        // Retry logic: Run more frequently and for a bit longer just in case
        const intervalId = setInterval(() => {
            const googleCombo = document.querySelector('.goog-te-combo');
            if (googleCombo) {
                const currentLang = localStorage.getItem('user_lang') || 'en';
                // Only trigger if value is different to avoid loops, but initial check usually needs it
                if (googleCombo.value !== currentLang) {
                    triggerTranslate(currentLang);
                }
                // We don't clear interval immediately effectively because sometimes the script re-renders or delayed init
                // But for performance, we should clear once successfully found and set, 
                // OR we check if the value actually stuck.

                if (googleCombo.value === currentLang) {
                    clearInterval(intervalId);
                }
            }
        }, 500); // Check every 500ms

        // Stop checking after 10 seconds to avoid infinite loop if script blocked
        const timeoutId = setTimeout(() => clearInterval(intervalId), 10000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    const handleChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        localStorage.setItem('user_lang', newLang);

        const googleCombo = document.querySelector('.goog-te-combo');
        if (googleCombo) {
            googleCombo.value = newLang;
            googleCombo.dispatchEvent(new Event('change', { bubbles: true }));
        }
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
