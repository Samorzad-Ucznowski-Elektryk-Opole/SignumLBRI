/**
 * Scroll Progress Indicator and Back to Top Button
 * Enhanced UX for modern landing page
 */

class ScrollEnhancer {
    constructor() {
        this.createScrollIndicator();
        this.createBackToTopButton();
        this.init();
    }

    createScrollIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = '<div class="scroll-progress"></div>';
        document.body.appendChild(indicator);

        this.progressBar = indicator.querySelector('.scroll-progress');
    }

    createBackToTopButton() {
        const button = document.createElement('button');
        button.className = 'fab back-to-top gpu-accelerated';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', 'Powrót na górę');
        button.style.opacity = '0';
        button.style.transform = 'translateY(100px)';
        
        button.addEventListener('click', this.scrollToTop);
        document.body.appendChild(button);

        this.backToTopButton = button;
    }

    init() {
        let ticking = false;

        const updateProgress = () => {
            const scrollTop = window.pageYOffset;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / documentHeight) * 100;

            // Update progress bar
            this.progressBar.style.transform = `scaleX(${progress / 100})`;

            // Show/hide back to top button
            if (scrollTop > 300) {
                this.backToTopButton.style.opacity = '1';
                this.backToTopButton.style.transform = 'translateY(0)';
            } else {
                this.backToTopButton.style.opacity = '0';
                this.backToTopButton.style.transform = 'translateY(100px)';
            }

            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateProgress);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ScrollEnhancer();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollEnhancer;
}
