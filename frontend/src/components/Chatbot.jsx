import React, { useState, useEffect, useRef } from 'react';
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

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newUserMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputValue("");
        setIsTyping(true);

        // Simulate Bot Response
        setTimeout(() => {
            const botResponse = {
                id: Date.now() + 1,
                text: "Thanks for reaching out! Our team is currently enhancing my AI brain. For urgent queries, please use the Contact page or WhatsApp us!",
                sender: 'bot',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
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
                        {msg.text}
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
