// Basic JavaScript for SignumLBRI
console.log('SignumLBRI main.js loaded');

// Basic functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM content loaded');
  
  // Initialize any basic functionality
  initializeNavigation();
});

function initializeNavigation() {
  // Basic navigation setup
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      console.log('Navigation clicked:', this.href);
    });
  });
}
