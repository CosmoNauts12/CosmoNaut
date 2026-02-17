export class ClickSpark {
    constructor(options = {}) {
        this.options = {
            sparkColor: '#fff',
            sparkSize: 10,
            sparkRadius: 15,
            sparkCount: 8,
            duration: 400,
            ...options
        };

        this.sparks = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.initCanvas();
        this.addEventListeners();
        this.animate();
    }

    initCanvas() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '9999';
        document.body.appendChild(this.canvas);
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    addEventListeners() {
        window.addEventListener('mousedown', (e) => {
            this.createSparks(e.clientX, e.clientY);
        });

        window.addEventListener('resize', () => this.resize());
    }

    createSparks(x, y) {
        const { sparkCount, sparkColor, sparkSize, sparkRadius, duration } = this.options;
        const startTime = performance.now();

        for (let i = 0; i < sparkCount; i++) {
            const angle = (i / sparkCount) * Math.PI * 2;
            this.sparks.push({
                x,
                y,
                angle,
                startTime,
                duration,
                color: sparkColor,
                size: sparkSize,
                radius: sparkRadius
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.sparks = this.sparks.filter(spark => {
            const elapsed = now - spark.startTime;
            const progress = elapsed / spark.duration;

            if (progress >= 1) return false;

            // Simple easing out
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentRadius = progress * spark.radius * 2;
            const opacity = 1 - progress;

            const targetX = spark.x + Math.cos(spark.angle) * currentRadius;
            const targetY = spark.y + Math.sin(spark.angle) * currentRadius;

            this.ctx.beginPath();
            this.ctx.strokeStyle = spark.color;
            this.ctx.lineWidth = spark.size * (1 - progress);
            this.ctx.lineCap = 'round';
            this.ctx.globalAlpha = opacity;

            // Draw a small line for the spark
            const lineLength = spark.size * 1.5;
            this.ctx.moveTo(
                targetX - Math.cos(spark.angle) * lineLength,
                targetY - Math.sin(spark.angle) * lineLength
            );
            this.ctx.lineTo(targetX, targetY);

            this.ctx.stroke();

            return true;
        });
    }
}
