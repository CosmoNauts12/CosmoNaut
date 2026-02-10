// Create animated stars
function createStars() {
    const starsContainer = document.querySelector('.stars-container');
    if (!starsContainer) return;

    // Clear existing stars
    starsContainer.innerHTML = '';

    // Create three layers of stars
    const layers = [
        { count: 100, className: 'star-layer-1', size: 2, speed: 3 },
        { count: 80, className: 'star-layer-2', size: 3, speed: 5 },
        { count: 60, className: 'star-layer-3', size: 4, speed: 7 }
    ];

    layers.forEach(layer => {
        const layerDiv = document.createElement('div');
        layerDiv.className = layer.className;
        layerDiv.style.position = 'absolute';
        layerDiv.style.width = '100%';
        layerDiv.style.height = '100%';
        layerDiv.style.top = '0';
        layerDiv.style.left = '0';

        for (let i = 0; i < layer.count; i++) {
            const star = document.createElement('div');
            star.className = 'star';

            // Random position
            const x = Math.random() * 100;
            const y = Math.random() * 100;

            // Random color (white, purple, or cyan)
            const colors = ['#FFFFFF', '#A100FF', '#00D9FF'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Random animation delay
            const delay = Math.random() * layer.speed;

            star.style.position = 'absolute';
            star.style.left = `${x}%`;
            star.style.top = `${y}%`;
            star.style.width = `${layer.size}px`;
            star.style.height = `${layer.size}px`;
            star.style.backgroundColor = color;
            star.style.borderRadius = '50%';
            star.style.boxShadow = `0 0 ${layer.size * 2}px ${color}`;
            star.style.animation = `twinkle ${layer.speed}s ease-in-out infinite`;
            star.style.animationDelay = `${delay}s`;

            layerDiv.appendChild(star);
        }

        starsContainer.appendChild(layerDiv);
    });
}

// Add twinkle animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes twinkle {
        0%, 100% {
            opacity: 0.3;
            transform: scale(1);
        }
        50% {
            opacity: 1;
            transform: scale(1.2);
        }
    }
    
    .star {
        pointer-events: none;
    }
`;
document.head.appendChild(style);

// Create stars when page loads
document.addEventListener('DOMContentLoaded', createStars);

// Recreate stars when window resizes
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(createStars, 250);
});
