import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import chatbotImg from '../assets/chatbot_styled.png';

const Chatbot = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! 👋 I'm RentHub Assistant. How can I help you find the perfect ride today?", sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
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

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const newUserMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Update messages with user's input immediately
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInputValue("");
        setIsTyping(true);

        try {
            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: newUserMessage.text,
                    history: messages // Pass existing history to context
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    // Specific meaningful error for rate limiting
                    const errorResponse = {
                        id: Date.now() + 1,
                        text: "I'm receiving too many messages right now. Please give me a minute to catch my breath!",
                        sender: 'bot',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setMessages(prev => [...prev, errorResponse]);
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
                                // Redirect to Track Booking since it handles ID lookup, or My Bookings
                                // Using Track Booking as it's public/easy
                                window.location.href = `/track-booking?bookingId=${details.bookingId}&action=cancel`;
                            }, 1500);
                        }, 500);
                    } catch (e) {
                        console.error("Failed to parse cancel action", e);
                    }
                }
            }

            const botResponse = {
                id: Date.now() + 1,
                text: replyText,
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botResponse]);

        } catch (error) {
            console.error('Chatbot API Error:', error);
            const errorResponse = {
                id: Date.now() + 1,
                text: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment!",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
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
                        <img src={chatbotImg} alt="Bot" />
                        <div className="online-status"></div>
                    </div>
                    <div className="chatbot-info">
                        <h3>Bike Rental Assistant</h3>
                        <p>Online</p>
                    </div>
                </div>
                <div className="chatbot-controls">
                    <button className="control-btn" onClick={onClose} title="Minimize">
                        <i className="fas fa-minus"></i>
                    </button>
                    <button className="control-btn" onClick={onClose} title="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="chatbot-body">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.sender}`}>
                        {/* Render Markdown for bot messages, plain text for user messages to avoid XSS issues/weird format */}
                        {msg.sender === 'bot' ? (
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                        ) : (
                            msg.text
                        )}
                        <span className="message-time">{msg.time}</span>
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
                    placeholder="Ask about bikes, pricing, booking..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                >
                    <i className="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
