document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const scenes = document.querySelectorAll('.scene');
    const body = document.body;

    // --- Custom Cursor Logic ---
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Smooth outline follower
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // --- Interaction Hover ---
    document.querySelectorAll('a, button, .btn-main, .btn-sub').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '60px';
            cursorOutline.style.height = '60px';
            cursorOutline.style.backgroundColor = 'rgba(161, 0, 255, 0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '30px';
            cursorOutline.style.height = '30px';
            cursorOutline.style.backgroundColor = 'transparent';
        });
    });

    // --- Intersection Observer for Scrollytelling ---
    const observerOptions = {
        threshold: 0.5
    };

    const sceneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all
                scenes.forEach(s => s.classList.remove('active'));

                // Add to current
                entry.target.classList.add('active');

                // Update body state for CSS targeting
                const sceneId = entry.target.id;
                body.setAttribute('data-active-scene', sceneId);

                // Speed up stars if in "speed" scene
                if (sceneId === 'speed') {
                    document.querySelectorAll('.stars').forEach(star => {
                        star.style.animationDuration = '2s';
                    });
                } else {
                    document.querySelectorAll('.stars').forEach(star => {
                        star.style.animationDuration = ''; // reset to CSS default
                    });
                }
            }
        });
    }, observerOptions);

    scenes.forEach(scene => sceneObserver.observe(scene));

    // --- Parallax Effect on Mouse Move ---
    window.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.01;

        document.querySelector('.layer-1').style.transform = `translate(${moveX}px, ${moveY}px)`;
        document.querySelector('.layer-2').style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
        document.querySelector('.layer-3').style.transform = `translate(${moveX * 3}px, ${moveY * 3}px)`;
    });

    // --- Add a subtle "shake" on ignition ---
    window.addEventListener('scroll', () => {
        const currentScene = body.getAttribute('data-active-scene');
        if (currentScene === 'ignition') {
            const astronaut = document.querySelector('.astronaut-wrapper');
            const shake = Math.random() * 2;
            astronaut.style.marginLeft = `${shake}px`;
        }
    });
});
