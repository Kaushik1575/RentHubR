import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [scene, setScene] = useState(0);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('renthub_splash_muted') === 'true';
  });
  const [visibleChecks, setVisibleChecks] = useState([]);
  
  const isMutedRef = useRef(isMuted);
  const audioContext = useRef({});

  // Sync ref with state so timeouts read latest value
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Setup Audio Elements
  useEffect(() => {
    // Placeholders - replace these with actual files in your public folder
    audioContext.current = {
      ambient: new Audio('/assets/sounds/ambient.mp3'),
      ignition: new Audio('/assets/sounds/ignition.mp3'),
      whoosh: new Audio('/assets/sounds/whoosh.mp3'),
      reveal: new Audio('/assets/sounds/reveal.mp3'),
      ready: new Audio('/assets/sounds/ready.mp3'),
    };
    
    Object.values(audioContext.current).forEach(audio => {
      audio.volume = 0.4;
    });

    return () => {
      Object.values(audioContext.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  const playSound = (name) => {
    if (!isMutedRef.current && audioContext.current[name]) {
      audioContext.current[name].play().catch(() => {
        // Silently fail if autoplay blocked
      });
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('renthub_splash_muted', String(next));
    if (next) {
      Object.values(audioContext.current).forEach(audio => {
        audio.pause();
      });
    }
  };

  // Timeline Orchestration
  useEffect(() => {
    const timeline = [
      { time: 10, scene: 1, sound: 'ambient' },     // 0s: Complete darkness
      { time: 600, scene: 2, sound: 'ignition' },   // 0.6s: Headlights slowly reveal
      { time: 2000, scene: 3, sound: 'whoosh' },    // 2.0s: Vehicle drives slowly
      { time: 6000, scene: 4, sound: 'reveal' },    // 6.0s: Logo Reveal
      { time: 6500, scene: 5, sound: 'ready' },     // 6.5s: Brand Identity + Checklist
      { time: 7000, scene: 6 },                     // 7.0s: Homepage Transition Start
      { time: 7800, scene: 7 }                      // 7.8s: Complete
    ];

    const timeouts = timeline.map(({ time, scene: s, sound }) =>
      setTimeout(() => {
        if (s === 7) {
          onComplete();
        } else {
          setScene(s);
          if (sound) playSound(sound);
        }
      }, time)
    );

    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  // Loading Checklist Orchestration
  useEffect(() => {
    if (scene === 5) {
      const messages = [
        "Initializing RentHub",
        "Loading Vehicles",
        "Connecting Google Maps",
        "Starting AI Assistant",
        "Preparing Experience",
        "Ready"
      ];
      
      const interval = setInterval(() => {
        setVisibleChecks(prev => {
          if (prev.length < messages.length) {
            return [...prev, messages[prev.length]];
          }
          clearInterval(interval);
          return prev;
        });
      }, 100); // Fast cascade of checks

      return () => clearInterval(interval);
    }
  }, [scene]);

  // Tiny Particles for Scene 1
  const particles = Array.from({ length: 30 }).map((_, i) => (
    <motion.div
      key={i}
      className="tiny-particle"
      initial={{ 
        x: (Math.random() - 0.5) * window.innerWidth,
        y: (Math.random() - 0.5) * window.innerHeight,
        opacity: 0 
      }}
      animate={{ 
        y: [(Math.random() - 0.5) * window.innerHeight, (Math.random() - 0.5) * window.innerHeight - 50],
        opacity: scene >= 1 ? [0, 0.6, 0] : 0 
      }}
      transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
    />
  ));

  return (
    <AnimatePresence>
      {scene < 7 && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 1 }}
          animate={{ opacity: scene === 6 ? 0 : 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {/* Mute/Unmute Toggle */}
          <button className="sound-toggle-btn" onClick={toggleMute} aria-label="Toggle Sound">
            {isMuted ? (
              <>
                <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                Unmute
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                Mute
              </>
            )}
          </button>

          {/* Cinematic Camera Wrapper */}
          <motion.div
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 4, ease: "easeOut" }}
          >
            {/* Scene 1: Ambient Glow and Particles */}
            <motion.div
              className="ambient-glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: scene >= 1 ? 1 : 0 }}
              transition={{ delay: 0.3, duration: 1.5, ease: "easeOut" }}
            />
            {particles}

            {/* Realistic Road Surface (Stationary) */}
            <motion.div
              style={{
                position: 'absolute',
                top: 'calc(50% + 50px)', /* Aligned under the car wheels */
                left: '-10vw',
                width: '120vw',
                height: '1px',
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                boxShadow: '0 2px 15px rgba(0,195,255,0.4)',
                zIndex: 0
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: scene >= 2 && scene < 4 ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {/* High-Speed Particles/Lines (Active during drive) */}
            <AnimatePresence>
              {scene === 3 && (
                <motion.div
                  style={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={`speedline-${i}`}
                      style={{
                        position: 'absolute',
                        left: '120%',
                        top: `${Math.random() * 100}%`,
                        width: `${Math.random() * 200 + 50}px`,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(0,195,255,0.6), #fff)',
                        filter: 'blur(1px)',
                        zIndex: 0
                      }}
                      animate={{
                        x: ['0vw', '-150vw']
                      }}
                      transition={{
                        duration: Math.random() * 0.4 + 0.2,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 0.5
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scene 2 & 3: Car Entrance with Attached Headlights */}
            <motion.div
              style={{ position: 'absolute', top: '50%', y: '-50%', left: 0, width: '500px', height: '100px', pointerEvents: 'none' }}
              initial={{ x: '-150%' }}
              animate={{ 
                x: scene >= 3 && scene < 4 ? '110vw' : scene >= 4 ? '200vw' : '-150%'
              }}
              transition={{ duration: 4.0, ease: "easeInOut" }}
            >
              {/* Light Trail (Active in Scene 3) */}
              <motion.div 
                className="light-trail"
                initial={{ opacity: 0 }}
                animate={{ opacity: scene === 3 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Electrical sparks along the trail */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="trail-spark"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      width: `${Math.random() * 4 + 2}px`,
                      height: `${Math.random() * 4 + 2}px`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: Math.random() * 0.3 + 0.1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                ))}
              </motion.div>

              {/* Headlight Attached to Front of Car (Active from Scene 2) */}
              <motion.div
                className="headlight-wrapper"
                style={{ position: 'absolute', right: '-40px', top: '65px', zIndex: 2 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: scene >= 2 && scene < 4 ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              >
                <div className="light-beam right-beam" />
                <div className="headlight-flare" />
                <div className="headlight-core" />
              </motion.div>

              <motion.div
                className="ground-reflection"
                initial={{ opacity: 0 }}
                animate={{ opacity: scene >= 2 && scene < 4 ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />

              {/* Ultra-Premium Supercar Silhouette */}
              <motion.svg 
                className="sports-car-svg" 
                viewBox="0 0 400 120" 
                xmlns="http://www.w3.org/2000/svg"
                animate={{ y: scene === 3 ? [0, -2, 0, -1, 0, -2, 0] : 0 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ zIndex: 5, position: 'relative' }}
              >
                {/* Brake Glows */}
                <circle cx="85" cy="90" r="14" fill="rgba(255,50,0,0.6)" filter="blur(4px)" />
                <circle cx="310" cy="90" r="14" fill="rgba(255,50,0,0.6)" filter="blur(4px)" />

                {/* Car Body (Sleek Supercar) */}
                <path d="M 20 85 C 15 85 15 75 20 70 L 30 65 L 45 50 C 70 30 110 25 150 20 L 200 20 C 250 20 290 35 340 50 L 375 65 C 385 70 385 85 375 85 Z" fill="#0A0A0C" stroke="#00C3FF" strokeWidth="2" />
                
                {/* Windows */}
                <path d="M 120 30 C 145 25 190 25 210 28 L 260 42 C 265 45 260 48 250 48 L 130 48 C 115 48 105 45 120 30 Z" fill="#00C3FF" opacity="0.3" />

                {/* Spoiler / Aero */}
                <path d="M 20 65 L 10 55 L 30 55 Z" fill="#0A0A0C" stroke="#00C3FF" strokeWidth="1.5" />

                {/* Front Splitter */}
                <path d="M 370 85 L 390 85 L 385 80 Z" fill="#0A0A0C" stroke="#00C3FF" strokeWidth="1.5" />

                {/* Wheels */}
                <motion.circle cx="85" cy="90" r="18" fill="#030303" stroke="#00C3FF" strokeWidth="2.5" className="wheel"
                  style={{ transformOrigin: '85px 90px' }}
                  animate={{ rotate: scene >= 3 ? 1080 : 0 }} transition={{ duration: 4.0, ease: "easeInOut" }}
                />
                <motion.circle cx="310" cy="90" r="18" fill="#030303" stroke="#00C3FF" strokeWidth="2.5" className="wheel"
                  style={{ transformOrigin: '310px 90px' }}
                  animate={{ rotate: scene >= 3 ? 1080 : 0 }} transition={{ duration: 4.0, ease: "easeInOut" }}
                />

                {/* Rims/Spokes */}
                <motion.circle cx="85" cy="90" r="7" fill="#00C3FF" className="wheel" 
                  style={{ transformOrigin: '85px 90px' }}
                  animate={{ rotate: scene >= 3 ? -1080 : 0 }} transition={{ duration: 4.0, ease: "easeInOut" }} />
                <motion.circle cx="310" cy="90" r="7" fill="#00C3FF" className="wheel" 
                  style={{ transformOrigin: '310px 90px' }}
                  animate={{ rotate: scene >= 3 ? -1080 : 0 }} transition={{ duration: 4.0, ease: "easeInOut" }} />
              </motion.svg>
            </motion.div>

            {/* Scene 4 & 5: Logo Reveal & Shrink */}
            <motion.div
              style={{ position: 'absolute', top: '35%', y: '-50%' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: scene >= 4 ? 1 : 0,
                scale: scene >= 4 ? 1 : 0.9 
              }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              <motion.h1 
                className="splash-logo"
                animate={{ scale: scene >= 4 ? [1, 1.03, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                RentHub
              </motion.h1>
            </motion.div>

            {/* Scene 5: Brand Tagline and Loading Checklist */}
            <motion.div
              className="tagline-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: scene >= 5 ? 1 : 0,
                y: scene >= 5 ? 0 : 20 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <span className="tagline-primary">Smart Mobility</span>
              <span className="tagline-secondary">Delivered To Your Door</span>

              {/* Checklist Array */}
              <div className="loading-checklist">
                {visibleChecks.map((text, idx) => (
                  <motion.div 
                    key={idx} 
                    className="checklist-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="check-icon">✓</span> {text}
                  </motion.div>
                ))}
                
                {/* Progress Bar */}
                <div className="progress-track">
                  <motion.div 
                    className="progress-fill"
                    initial={{ width: "0%" }}
                    animate={{ width: visibleChecks.length > 0 ? `${(visibleChecks.length / 6) * 100}%` : "0%" }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
