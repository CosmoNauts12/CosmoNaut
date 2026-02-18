// Theme Management
const themeToggle = document.querySelector('.theme-toggle');
const html = document.documentElement;

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Add transition effect
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 2px 20px var(--shadow)';
    } else {
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Detect OS and highlight appropriate platform
function detectOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const platform = window.navigator.platform.toLowerCase();

    let os = 'unknown';

    if (platform.indexOf('win') !== -1) {
        os = 'windows';
    } else if (platform.indexOf('mac') !== -1) {
        os = 'macos';
    } else if (platform.indexOf('linux') !== -1 || platform.indexOf('x11') !== -1) {
        os = 'linux';
    }

    // Highlight the detected OS card
    const platformCards = document.querySelectorAll('.platform-card');
    platformCards.forEach(card => {
        const cardPlatform = card.getAttribute('data-platform');
        if (cardPlatform === os) {
            card.style.borderColor = 'var(--primary)';
            card.style.boxShadow = '0 10px 30px var(--shadow-lg)';
        }
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.capability-card, .platform-card, .insight-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInObserver.observe(el);
});

// Update download links from GitHub API
async function updateDownloadLinks() {
    try {
        const response = await fetch('https://api.github.com/repos/Adith1207/CosmoNaut/releases/latest');
        const data = await response.json();

        // Update version in footer
        const versionElement = document.querySelector('.footer-meta .version');
        if (versionElement && data.tag_name) {
            versionElement.textContent = `Version ${data.tag_name}`;
        }

        // Update download links with actual release assets
        if (data.assets && data.assets.length > 0) {
            const downloadButtons = {
                'windows-msi': null,
                'windows-exe': null,
                'macos-arm': null,
                'macos-intel': null,
                'linux-deb': null,
                'linux-appimage': null
            };

            data.assets.forEach(asset => {
                const name = asset.name.toLowerCase();

                if (name.includes('.msi')) {
                    downloadButtons['windows-msi'] = asset.browser_download_url;
                } else if (name.includes('setup.exe') || name.includes('.exe')) {
                    downloadButtons['windows-exe'] = asset.browser_download_url;
                } else if (name.includes('.dmg') && (name.includes('aarch64') || name.includes('arm'))) {
                    downloadButtons['macos-arm'] = asset.browser_download_url;
                } else if (name.includes('.dmg')) {
                    downloadButtons['macos-intel'] = asset.browser_download_url;
                } else if (name.includes('.deb')) {
                    downloadButtons['linux-deb'] = asset.browser_download_url;
                } else if (name.includes('.appimage')) {
                    downloadButtons['linux-appimage'] = asset.browser_download_url;
                }
            });

            // Update Windows links
            const windowsCard = document.querySelector('[data-platform="windows"]');
            if (windowsCard) {
                const primaryBtn = windowsCard.querySelector('.download-btn.primary');
                const secondaryBtn = windowsCard.querySelector('.download-btn.secondary');
                if (primaryBtn && downloadButtons['windows-msi']) {
                    primaryBtn.href = downloadButtons['windows-msi'];
                }
                if (secondaryBtn && downloadButtons['windows-exe']) {
                    secondaryBtn.href = downloadButtons['windows-exe'];
                }
            }

            // Update macOS links
            const macosCard = document.querySelector('[data-platform="macos"]');
            if (macosCard) {
                const primaryBtn = macosCard.querySelector('.download-btn.primary');
                const secondaryBtn = macosCard.querySelector('.download-btn.secondary');
                if (primaryBtn && downloadButtons['macos-arm']) {
                    primaryBtn.href = downloadButtons['macos-arm'];
                }
                if (secondaryBtn && downloadButtons['macos-intel']) {
                    secondaryBtn.href = downloadButtons['macos-intel'];
                }
            }

            // Update Linux links
            const linuxCard = document.querySelector('[data-platform="linux"]');
            if (linuxCard) {
                const primaryBtn = linuxCard.querySelector('.download-btn.primary');
                const secondaryBtn = linuxCard.querySelector('.download-btn.secondary');
                if (primaryBtn && downloadButtons['linux-deb']) {
                    primaryBtn.href = downloadButtons['linux-deb'];
                }
                if (secondaryBtn && downloadButtons['linux-appimage']) {
                    secondaryBtn.href = downloadButtons['linux-appimage'];
                }
            }
        }
    } catch (error) {
        console.log('Could not fetch latest release info:', error);
        // Fallback to default GitHub releases page
        document.querySelectorAll('.download-btn').forEach(btn => {
            if (btn.href.includes('releases/latest/download')) {
                btn.href = 'https://github.com/Adith1207/CosmoNaut/releases/latest';
            }
        });
    }
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroVisual = document.querySelector('.hero-visual');

    if (heroVisual && scrolled < 800) {
        heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// Add hover effect to capability cards
document.querySelectorAll('.capability-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        const icon = this.querySelector('.capability-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1) rotate(5deg)';
            icon.style.transition = 'transform 0.3s ease';
        }
    });

    card.addEventListener('mouseleave', function () {
        const icon = this.querySelector('.capability-icon');
        if (icon) {
            icon.style.transform = 'scale(1) rotate(0deg)';
        }
    });
});

// Initialize all features on page load
document.addEventListener('DOMContentLoaded', () => {
    detectOS();
    updateDownloadLinks();

    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Handle system theme preference
if (window.matchMedia) {
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Only apply system theme if user hasn't set a preference
    if (!localStorage.getItem('theme')) {
        html.setAttribute('data-theme', systemThemeQuery.matches ? 'dark' : 'light');
    }

    // Listen for system theme changes
    systemThemeQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Toggle theme with Ctrl/Cmd + Shift + L
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        themeToggle.click();
    }
});

// Performance optimization: Lazy load images when they're added
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}
