import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import chatbotImg from '../assets/chatbot_styled.png';

const INITIAL_OPTIONS = [
    "Tell me about RentHub",
    "Browse available vehicles",
    "Rental policies & documents",
    "Advance & refund policy",
    "Track my booking",
    "Track Support",
    "Sponsor & partner program"
];

const Chatbot = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "👋 Hello! I am **Vahan Mitra**, your official digital concierge for RentHub. How can I assist you today? Feel free to ask me anything about our vehicles, rental policies, pricing, booking, refunds, or partner program!",
            sender: 'bot',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: INITIAL_OPTIONS
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (manualText = null) => {
        const textToSend = manualText || inputValue;
        if (!textToSend.trim()) return;

        const newUserMessage = {
            id: Date.now(),
            text: textToSend,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Update messages with user's input immediately
        setMessages(prev => [...prev, newUserMessage]);
        setInputValue("");
        setIsTyping(true);

        // --- EXPLICIT DIRECT SHORTCUTS ---
        const lowerText = textToSend.toLowerCase().trim();

        // 1. Direct redirect for password reset
        if (lowerText === "forgot password" || lowerText === "reset password") {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "I can help with that. Redirecting you to the password reset page...",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setTimeout(() => window.location.href = '/forgot-password', 1500);
            }, 500);
            setIsTyping(false);
            return;
        }

        // 2. Direct redirect for user profile
        if (lowerText === "my profile") {
            const token = localStorage.getItem('token');
            if (token) {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: "Great! Taking you to your profile now.",
                        sender: 'bot',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                    setTimeout(() => window.location.href = '/profile', 1000);
                }, 500);
            } else {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: "You need to log in to view your profile. Taking you to the login page...",
                        sender: 'bot',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);
                    setTimeout(() => window.location.href = '/login?redirect=/profile', 1500);
                }, 500);
            }
            setIsTyping(false);
            return;
        }

        // 3. Direct helpline trigger
        if (lowerText === "call support" || lowerText === "call helpline" || lowerText === "customer care number") {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "You can reach our 24/7 RentHub Support desk directly at **+91 9090598756**. Opening your phone dialer...",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setTimeout(() => window.location.href = 'tel:+919090598756', 1500);
            }, 500);
            setIsTyping(false);
            return;
        }

        // 4. Direct Track Support / Issue prompt
        const isTrackSupportPrompt = lowerText === "track support" ||
            lowerText === "🔍 track support" ||
            lowerText === "track issue" ||
            lowerText === "🔍 track issue" ||
            lowerText === "track an issue" ||
            lowerText === "track my issue" ||
            lowerText === "track ticket" ||
            lowerText === "support status" ||
            lowerText === "issue status";

        if (isTrackSupportPrompt) {
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: "🎫 **Track Support Request**\n\nPlease enter your **Issue ID** (e.g., `RH1702456789012` or just the numbers from your confirmation email) to check its live status and updates.",
                    sender: 'bot',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }, 400);
            setIsTyping(false);
            return;
        }

        // --- All other questions and prompts flow directly to Gemini AI ---
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: textToSend,
                    history: messages // Pass existing history to context
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error("Rate limit exceeded");
                }
                throw new Error(data.error || 'Failed to get response');
            }

            let replyText = data.reply;
            let actionMatch = null;
            let bookingDetails = null;

            // 1. Check for explicit ACTION format
            const actionRegex = /\|\|\| ACTION: BOOK_VEHICLE (.*?) \|\|\|/s;
            const match = replyText.match(actionRegex);

            if (match) {
                actionMatch = match;
            }

            // 2. Fallback: Check for JSON code block matching pattern
            if (!actionMatch) {
                const jsonRegex = /```json\s*({[\s\S]*?"action":\s*"BOOK_VEHICLE"[\s\S]*?})\s*```/s;
                const jsonMatch = replyText.match(jsonRegex);
                if (jsonMatch) {
                    actionMatch = jsonMatch;
                }
            }

            if (actionMatch) {
                try {
                    let jsonStr = actionMatch[1];
                    // Cleanup markdown if present
                    if (jsonStr.includes("```")) {
                        jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");
                    }

                    bookingDetails = JSON.parse(jsonStr);

                    // Remove the action part from the visible reply
                    if (match) {
                        replyText = replyText.replace(match[0], "").trim();
                    } else if (replyText.includes("```json")) {
                        // Strip JSON block
                        replyText = replyText.replace(/```json[\s\S]*?```/, "").trim();
                    }

                    // Trigger Redirect
                    setTimeout(() => {
                        setMessages(prev => [...prev, {
                            id: Date.now() + 2,
                            text: "Great! I have all the details. Redirecting you to the booking page now...",
                            sender: 'bot',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }]);

                        setTimeout(() => {
                            const vId = bookingDetails.vehicleId;
                            const vType = bookingDetails.type;
                            window.location.href = `/booking-form?vehicleId=${vId}&type=${vType}&startDate=${bookingDetails.startDate}&startTime=${bookingDetails.startTime}&duration=${bookingDetails.duration}`;
                        }, 2000);
                    }, 500);

                } catch (e) {
                    console.error("Failed to parse booking action", e);
                }
            }

            // 3. New Actions: TRACK and CANCEL
            if (!actionMatch) {
                // Regex for TRACK
                const trackRegex = /\|\|\| ACTION: TRACK_BOOKING (.*?) \|\|\|/s;
                const trackMatch = replyText.match(trackRegex);
                if (trackMatch) {
                    try {
                        let jsonStr = trackMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(trackMatch[0], "").trim();

                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2,
                                text: "Let's check the status for you. Redirecting...",
                                sender: 'bot',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setTimeout(() => {
                                window.location.href = `/track-booking?bookingId=${details.bookingId}`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse track action", e);
                    }
                }

                // Regex for CANCEL
                const cancelRegex = /\|\|\| ACTION: CANCEL_BOOKING (.*?) \|\|\|/s;
                const cancelMatch = replyText.match(cancelRegex);
                if (cancelMatch) {
                    try {
                        let jsonStr = cancelMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(cancelMatch[0], "").trim();

                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2,
                                text: `I'll take you to the cancellation page for Booking #${details.bookingId}. Please review the details there.`,
                                sender: 'bot',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setTimeout(() => {
                                window.location.href = `/track-booking?bookingId=${details.bookingId}&action=cancel`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse cancel action", e);
                    }
                }

                // Regex for TRACK ISSUE
                const trackIssueRegex = /\|\|\| ACTION: TRACK_ISSUE (.*?) \|\|\|/s;
                const trackIssueMatch = replyText.match(trackIssueRegex);
                if (trackIssueMatch) {
                    try {
                        let jsonStr = trackIssueMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(trackIssueMatch[0], "").trim();

                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2,
                                text: `Checking live tracking details for Issue #${details.issueId}...`,
                                sender: 'bot',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setTimeout(() => {
                                window.location.href = `/track-issue?id=${details.issueId}`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse track issue action", e);
                    }
                }

                // Regex for REGISTER
                const registerRegex = /\|\|\| ACTION: REGISTER_USER (.*?) \|\|\|/s;
                const registerMatch = replyText.match(registerRegex);
                if (registerMatch) {
                    try {
                        let jsonStr = registerMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(registerMatch[0], "").trim();

                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2,
                                text: `Got it! I've pre-filled the registration details and sent verification codes to your email and phone. Redirecting...`,
                                sender: 'bot',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setTimeout(() => {
                                const params = new URLSearchParams();
                                if (details.fullName) params.append('fullName', details.fullName);
                                if (details.email) params.append('email', details.email);
                                if (details.phoneNumber) params.append('phoneNumber', details.phoneNumber);
                                if (details.password) params.append('password', details.password);

                                window.location.href = `/register-user?${params.toString()}`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse register action", e);
                    }
                }

                // Regex for WEATHER CHECK
                const weatherRegex = /\|\|\| ACTION: CHECK_WEATHER (.*?) \|\|\|/s;
                const weatherMatch = replyText.match(weatherRegex);
                if (weatherMatch) {
                    try {
                        let jsonStr = weatherMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(weatherMatch[0], "").trim();

                        // Call weather API
                        fetch('/api/chatbot/weather', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ location: details.location })
                        })
                            .then(res => res.json())
                            .then(weatherData => {
                                setMessages(prev => [...prev, {
                                    id: Date.now() + 3,
                                    text: weatherData.reply || weatherData.error || "Unable to fetch weather information.",
                                    sender: 'bot',
                                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }]);
                            })
                            .catch(err => {
                                console.error("Weather API Error:", err);
                                setMessages(prev => [...prev, {
                                    id: Date.now() + 3,
                                    text: "Sorry, I couldn't fetch the weather information right now. Please try again later.",
                                    sender: 'bot',
                                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }]);
                            });
                    } catch (e) {
                        console.error("Failed to parse weather action", e);
                    }
                }

                // Regex for CALL SUPPORT
                const supportRegex = /\|\|\| ACTION: CALL_SUPPORT (.*?) \|\|\|/s;
                const supportMatch = replyText.match(supportRegex);
                if (supportMatch) {
                    try {
                        let jsonStr = supportMatch[1];
                        const details = JSON.parse(jsonStr);
                        replyText = replyText.replace(supportMatch[0], "").trim();

                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                id: Date.now() + 2,
                                text: "Connecting you to our support team...",
                                sender: 'bot',
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setTimeout(() => {
                                window.location.href = `tel:${details.number}`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse support action", e);
                    }
                }
            }


            const botResponse = {
                id: Date.now() + 1,
                text: replyText,
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                options: ["Track Support", "Track my booking", "Advance & refund policy", "Browse available vehicles"]
            };
            setMessages(prev => [...prev, botResponse]);

        } catch (error) {

            console.error('Chatbot API Error Details:', error); // Expanded logging
            const errorResponse = {
                id: Date.now() + 1,
                text: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment! (Error: " + error.message + ")",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                options: ["Retry", "Go back"]
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleOptionClick = (option) => {
        handleSend(option);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    // Note: The container class needs 'open' to animate visible
    return (
        <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
            {/* Header */}
            <div className="chatbot-header">
                <div className="chatbot-profile">
                    <div className="chatbot-avatar">
                        <img 
                            src="/renthub-logo.png" 
                            alt="RentHub Bot" 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                borderRadius: '50%', 
                                objectFit: 'cover',
                                border: '2px solid #00D8FF',
                                boxShadow: '0 0 10px rgba(0, 195, 255, 0.6)'
                            }} 
                        />
                    </div>
                    <div className="chatbot-info">
                        <h3>Vahan Mitra</h3>
                    </div>
                </div>
                <div className="chatbot-controls">
                    <div className="control-btn" onClick={onClose} title="Minimize">
                        <i className="fas fa-chevron-down"></i>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="chatbot-body">
                {messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div className={`message ${msg.sender}`}>
                            {msg.sender === 'bot' ? (
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                            <span className="message-time">{msg.time}</span>
                        </div>

                        {/* Options / Chips */}
                        {msg.options && (
                            <div className="options-container">
                                {msg.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        className="option-btn"
                                        onClick={() => handleOptionClick(opt)}
                                    >
                                        {opt} <i className="fas fa-chevron-right"></i>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Footer */}
            <div className="chatbot-footer">
                <input
                    type="text"
                    className="chatbot-input"
                    placeholder="Write a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="send-btn"
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim()}
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
