/**
 * Modern Interactive JavaScript for Landing Page
 * Enhanced user experience with animations and interactions
 */

class ModernLandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupParticles();
        this.setupIntersectionObserver();
        this.setupBookHover();
        this.setupStatsCounter();
        this.setupFloatingElements();
        this.setupSmoothScrolling();
        this.setupTypewriter();
        this.setupParallaxEffects();
    }

    setupParticles() {
        const particlesContainer = document.querySelector('.particles-container');
        if (!particlesContainer) return;

        // Create floating particles
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];
        const shapes = ['circle', 'square', 'triangle'];
        
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = `particle absolute opacity-70 pointer-events-none`;
            
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 4;
            
            particle.style.cssText = `
                left: ${Math.random() * 100}vw;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${shape === 'circle' ? '50%' : shape === 'triangle' ? '0' : '2px'};
                ${shape === 'triangle' ? `
                    width: 0;
                    height: 0;
                    background: transparent;
                    border-left: ${size/2}px solid transparent;
                    border-right: ${size/2}px solid transparent;
                    border-bottom: ${size}px solid ${color};
                ` : ''}
                box-shadow: 0 0 20px ${color}40;
                animation: particle-float ${15 + Math.random() * 10}s linear infinite;
            `;
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 25000);
        }, 800);
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    
                    // Special effects for different sections
                    if (entry.target.classList.contains('feature-card')) {
                        this.animateFeatureCard(entry.target);
                    }
                    
                    if (entry.target.classList.contains('stat-item')) {
                        this.animateStatNumber(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements
        document.querySelectorAll('.feature-card, .stat-item, .cta-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupBookHover() {
        const books = document.querySelectorAll('.book');
        
        books.forEach(book => {
            book.addEventListener('mouseenter', () => {
                book.style.transform = `
                    translateZ(50px) 
                    rotateY(-10deg) 
                    scale(1.05) 
                    rotateX(5deg)
                `;
                
                // Add glow effect
                book.style.filter = 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.5))';
            });
            
            book.addEventListener('mouseleave', () => {
                book.style.transform = book.dataset.originalTransform || '';
                book.style.filter = '';
            });
            
            // Store original transform
            book.dataset.originalTransform = getComputedStyle(book).transform;
        });
    }

    setupStatsCounter() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.textContent.replace(/\D/g, ''));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            };
            
            // Start animation when visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(stat);
        });
    }

    setupFloatingElements() {
        const floatingElements = document.querySelectorAll('.floating-ui');
        
        floatingElements.forEach((element, index) => {
            // Add random delay and duration
            element.style.animationDelay = `${index * 0.5}s`;
            element.style.animationDuration = `${3 + (index % 3)}s`;
            
            // Add hover interaction
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-20px) scale(1.1)';
                element.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = '';
            });
        });
    }

    setupSmoothScrolling() {
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupTypewriter() {
        const typewriterElements = document.querySelectorAll('.typewriter-text');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '3px solid #3b82f6';
            
            let i = 0;
            const typeSpeed = 100;
            
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, typeSpeed);
                } else {
                    // Remove cursor after typing
                    setTimeout(() => {
                        element.style.borderRight = 'none';
                    }, 1000);
                }
            };
            
            // Start typing when visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(typeWriter, 500);
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    setupParallaxEffects() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax-element');
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
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

    animateFeatureCard(card) {
        const icon = card.querySelector('.feature-icon');
        if (icon) {
            icon.style.transform = 'scale(1.2) rotate(10deg)';
            setTimeout(() => {
                icon.style.transform = '';
            }, 300);
        }
    }

    animateStatNumber(statItem) {
        const number = statItem.querySelector('.stat-number');
        if (number) {
            number.style.transform = 'scale(1.2)';
            number.style.color = '#3b82f6';
            setTimeout(() => {
                number.style.transform = '';
                number.style.color = '';
            }, 500);
        }
    }
}

// Mouse movement parallax effect
class MouseParallax {
    constructor() {
        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    init() {
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
            
            this.updateParallax();
        });
    }

    updateParallax() {
        const elements = document.querySelectorAll('.mouse-parallax');
        
        elements.forEach(element => {
            const speed = element.dataset.speed || 1;
            const x = this.mouse.x * 20 * speed;
            const y = this.mouse.y * 20 * speed;
            
            element.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    }
}

// Enhanced CTA Button Effects
class CTAEnhancer {
    constructor() {
        this.init();
    }

    init() {
        const ctaButtons = document.querySelectorAll('.cta-primary');
        
        ctaButtons.forEach(button => {
            this.addRippleEffect(button);
            this.addMagneticEffect(button);
        });
    }

    addRippleEffect(button) {
        button.addEventListener('click', (e) => {
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            button.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        // Add ripple animation CSS
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    addMagneticEffect(button) {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            button.style.transform = `translateX(${x * 0.1}px) translateY(${y * 0.1}px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    }
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
    new ModernLandingPage();
    new MouseParallax();
    new CTAEnhancer();
    
    // Add CSS for fade-in animation
    const style = document.createElement('style');
    style.textContent = `
        .animate-fade-in {
            animation: fadeInUp 0.8s ease-out forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModernLandingPage, MouseParallax, CTAEnhancer };
}
