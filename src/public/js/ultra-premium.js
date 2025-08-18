/**
 * Ultra Premium Interactive System for SignumLBRI 2025
 * Next-generation user experience with advanced effects
 */

class UltraPremiumExperience {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.isLoaded = false;
        this.init();
    }

    async init() {
        await this.preloadEffects();
        this.setupAdvancedParticles();
        this.setupMagneticElements();
        this.setupAdvancedHover();
        this.setupParallaxLayers();
        this.setupRealtime3D();
        this.setupSoundEffects();
        this.setupPerformanceMonitoring();
        this.isLoaded = true;
    }

    async preloadEffects() {
        // Preload critical animations
        return new Promise(resolve => {
            const preloader = document.createElement('div');
            preloader.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                backdrop-filter: blur(20px);
            `;
            preloader.innerHTML = `
                <div class="text-lg mb-4">🚀 Ładowanie Premium Experience</div>
                <div class="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" style="width: 100%;"></div>
                </div>
            `;
            document.body.appendChild(preloader);
            
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => preloader.remove(), 300);
                resolve();
            }, 1500);
        });
    }

    setupAdvancedParticles() {
        const particlesContainer = document.querySelector('.particles-container');
        if (!particlesContainer) return;

        // Advanced particle types
        const particleTypes = [
            { type: 'star', symbol: '✨', colors: ['#ffd700', '#fff8dc', '#ffeb3b'] },
            { type: 'dot', symbol: '•', colors: ['#3b82f6', '#8b5cf6', '#ec4899'] },
            { type: 'diamond', symbol: '♦', colors: ['#06b6d4', '#10b981', '#f59e0b'] },
            { type: 'heart', symbol: '♥', colors: ['#ef4444', '#f97316', '#84cc16'] }
        ];

        const createAdvancedParticle = () => {
            const particle = document.createElement('div');
            const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            const color = type.colors[Math.floor(Math.random() * type.colors.length)];
            const size = Math.random() * 12 + 6;
            const duration = Math.random() * 15 + 10;

            particle.className = 'ultra-particle absolute pointer-events-none';
            particle.innerHTML = type.symbol;
            particle.style.cssText = `
                left: ${Math.random() * 100}vw;
                font-size: ${size}px;
                color: ${color};
                text-shadow: 0 0 ${size}px ${color}80;
                animation: ultra-particle-flow ${duration}s linear infinite;
                filter: blur(0.5px) brightness(1.2);
                z-index: 1;
            `;

            particlesContainer.appendChild(particle);
            setTimeout(() => particle.remove(), duration * 1000);
        };

        // Create particles continuously
        setInterval(createAdvancedParticle, 300);
    }

    setupMagneticElements() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            // Magnetic effect for buttons
            document.querySelectorAll('.ultra-btn-primary').forEach(btn => {
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(e.clientX - centerX, 2) + 
                    Math.pow(e.clientY - centerY, 2)
                );

                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    const x = (e.clientX - centerX) * force * 0.2;
                    const y = (e.clientY - centerY) * force * 0.2;
                    
                    btn.style.transform = `translate(${x}px, ${y}px) scale(${1 + force * 0.1})`;
                    btn.style.boxShadow = `0 ${15 + force * 10}px ${30 + force * 20}px rgba(59, 130, 246, ${0.3 + force * 0.2})`;
                } else {
                    btn.style.transform = '';
                    btn.style.boxShadow = '';
                }
            });

            // Update CSS custom properties for mouse-following effects
            document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
            document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        });
    }

    setupAdvancedHover() {
        // Enhanced book hover with realistic physics
        document.querySelectorAll('.ultra-book').forEach((book, index) => {
            book.addEventListener('mouseenter', (e) => {
                const rect = book.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                const rotateX = (y - 0.5) * 30; // Max 15deg tilt
                const rotateY = (x - 0.5) * -20; // Max 10deg rotation
                
                book.style.transform = `
                    translateZ(100px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    scale(1.1)
                `;
                book.style.filter = `
                    drop-shadow(0 40px 80px rgba(0, 0, 0, 0.4))
                    brightness(1.15)
                    saturate(1.3)
                    contrast(1.1)
                `;
                
                // Add reading light effect
                book.style.background = `
                    radial-gradient(circle at ${x * 100}% ${y * 100}%, 
                        rgba(255, 255, 255, 0.1) 0%, 
                        transparent 50%),
                    ${getComputedStyle(book).background}
                `;
            });

            book.addEventListener('mousemove', (e) => {
                const rect = book.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                const rotateX = (y - 0.5) * 20;
                const rotateY = (x - 0.5) * -15;
                
                book.style.transform = `
                    translateZ(100px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg) 
                    scale(1.1)
                `;
            });

            book.addEventListener('mouseleave', () => {
                book.style.transform = book.dataset.originalTransform || '';
                book.style.filter = '';
                book.style.background = '';
            });
        });
    }

    setupParallaxLayers() {
        let ticking = false;

        const updateParallax = () => {
            const scrollY = window.pageYOffset;
            
            // Multi-layer parallax
            document.querySelectorAll('.ultra-floating').forEach((element, index) => {
                const speed = 0.5 + (index * 0.2);
                const y = -(scrollY * speed);
                element.style.transform = `translateY(${y}px)`;
            });

            // Background parallax
            const heroBackground = document.querySelector('.ultra-hero-bg');
            if (heroBackground) {
                const y = -(scrollY * 0.3);
                heroBackground.style.transform = `translateY(${y}px) scale(1.1)`;
            }

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    setupRealtime3D() {
        // Real-time 3D transformations based on mouse position
        document.addEventListener('mousemove', (e) => {
            const books = document.querySelectorAll('.ultra-book');
            const features = document.querySelectorAll('.ultra-feature');
            
            const mouseXPercent = (e.clientX / window.innerWidth) * 2 - 1;
            const mouseYPercent = (e.clientY / window.innerHeight) * 2 - 1;

            // 3D tilt for book stack
            books.forEach((book, index) => {
                if (!book.matches(':hover')) {
                    const intensity = (index + 1) * 5;
                    book.style.transform = `
                        ${book.dataset.originalTransform || ''}
                        rotateX(${mouseYPercent * intensity}deg) 
                        rotateY(${mouseXPercent * intensity}deg)
                    `;
                }
            });

            // Subtle 3D effect for feature cards
            features.forEach((feature, index) => {
                if (!feature.matches(':hover')) {
                    const intensity = 3;
                    feature.style.transform = `
                        rotateX(${mouseYPercent * intensity}deg) 
                        rotateY(${mouseXPercent * intensity}deg)
                    `;
                }
            });
        });
    }

    setupSoundEffects() {
        // Web Audio API for subtle sound effects
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const createTone = (frequency, duration, volume = 0.1) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        };

        // Subtle sound on hover
        document.querySelectorAll('.ultra-btn-primary').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                createTone(800, 0.1, 0.05);
            });
            
            btn.addEventListener('click', () => {
                createTone(1000, 0.2, 0.08);
            });
        });

        document.querySelectorAll('.ultra-feature').forEach(feature => {
            feature.addEventListener('mouseenter', () => {
                createTone(600, 0.1, 0.03);
            });
        });
    }

    setupPerformanceMonitoring() {
        let fps = 0;
        let lastTime = performance.now();

        const measureFPS = (currentTime) => {
            fps = Math.round(1000 / (currentTime - lastTime));
            lastTime = currentTime;
            
            // Adjust quality based on performance
            if (fps < 30) {
                document.body.classList.add('reduce-effects');
            } else {
                document.body.classList.remove('reduce-effects');
            }
            
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    // Destroy and cleanup method
    destroy() {
        document.querySelectorAll('.ultra-particle').forEach(p => p.remove());
        this.isLoaded = false;
    }
}

// Enhanced Loading Experience
class PremiumLoader {
    constructor() {
        this.createLoadingScreen();
    }

    createLoadingScreen() {
        const loader = document.createElement('div');
        loader.id = 'premium-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="logo-animation">
                    <h1 class="ultra-title">SignumLBRI</h1>
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <p class="loading-text">Przygotowujemy najlepsze doświadczenie...</p>
                </div>
                <div class="loader-books">
                    <div class="book-loader book1"></div>
                    <div class="book-loader book2"></div>
                    <div class="book-loader book3"></div>
                </div>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 1;
            transition: opacity 0.5s ease;
        `;

        document.body.appendChild(loader);
        
        setTimeout(() => this.hideLoader(), 2000);
    }

    hideLoader() {
        const loader = document.getElementById('premium-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only run on home page
    if (document.querySelector('.ultra-hero-bg')) {
        new PremiumLoader();
        
        setTimeout(() => {
            new UltraPremiumExperience();
        }, 1000);
    }
});

// CSS for performance adjustments
const style = document.createElement('style');
style.textContent = `
    .reduce-effects .ultra-particle {
        display: none !important;
    }
    
    .reduce-effects .ultra-book {
        transition-duration: 0.2s !important;
    }
    
    .reduce-effects .ultra-feature {
        transition-duration: 0.3s !important;
    }
    
    #premium-loader .loader-content {
        text-align: center;
    }
    
    #premium-loader .loading-bar {
        width: 200px;
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        margin: 1rem auto;
        overflow: hidden;
    }
    
    #premium-loader .loading-progress {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 2px;
        animation: loading-progress 2s ease-in-out;
    }
    
    @keyframes loading-progress {
        0% { width: 0%; }
        100% { width: 100%; }
    }
    
    #premium-loader .book-loader {
        width: 60px;
        height: 80px;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-radius: 4px;
        margin: 0 10px;
        display: inline-block;
        animation: book-dance 1s ease-in-out infinite alternate;
    }
    
    .book-loader.book1 { animation-delay: 0s; }
    .book-loader.book2 { animation-delay: 0.2s; }
    .book-loader.book3 { animation-delay: 0.4s; }
    
    @keyframes book-dance {
        0% { transform: translateY(0px) rotateZ(0deg); }
        100% { transform: translateY(-10px) rotateZ(2deg); }
    }
`;
document.head.appendChild(style);

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UltraPremiumExperience, PremiumLoader };
}
