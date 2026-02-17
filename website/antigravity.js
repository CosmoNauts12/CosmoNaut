import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';

export class Antigravity {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            count: 300,
            magnetRadius: 6,
            ringRadius: 7,
            waveSpeed: 0.4,
            waveAmplitude: 1,
            particleSize: 1.5,
            lerpSpeed: 0.05,
            color: '#5227FF',
            autoAnimate: true,
            particleVariance: 1,
            rotationSpeed: 0,
            depthFactor: 1,
            pulseSpeed: 3,
            particleShape: 'capsule',
            fieldStrength: 10,
            ...options
        };

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        this.particles = [];
        this.mouse = new THREE.Vector2(-1000, -1000);
        this.raycaster = new THREE.Raycaster();

        this.init();
        this.addEventListeners();
        this.animate();
    }

    init() {
        const { count, particleShape, particleSize, color } = this.options;

        let geometry;
        if (particleShape === 'capsule') {
            geometry = new THREE.CapsuleGeometry(0.05 * particleSize, 0.2 * particleSize, 4, 8);
        } else if (particleShape === 'sphere') {
            geometry = new THREE.SphereGeometry(0.1 * particleSize, 8, 8);
        } else {
            geometry = new THREE.BoxGeometry(0.1 * particleSize, 0.1 * particleSize, 0.1 * particleSize);
        }

        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color),
            emissive: new THREE.Color(color),
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 1.0
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        this.scene.add(pointLight);

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(geometry, material.clone());

            // Initial positions in a ring/field
            const angle = (i / count) * Math.PI * 2;
            const radius = this.options.ringRadius + (Math.random() - 0.5) * this.options.particleVariance;

            mesh.position.x = Math.cos(angle) * radius;
            mesh.position.y = Math.sin(angle) * radius;
            mesh.position.z = (Math.random() - 0.5) * this.options.depthFactor;

            // Store original target position for animation
            mesh.userData.basePos = mesh.position.clone();
            mesh.userData.angle = angle;
            mesh.userData.radius = radius;
            mesh.userData.phase = Math.random() * Math.PI * 2;

            this.scene.add(mesh);
            this.particles.push(mesh);
        }

        this.camera.position.z = 25;
    }

    addEventListeners() {
        // Track mouse across the whole body/window
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = performance.now() * 0.001;
        const {
            waveSpeed,
            waveAmplitude,
            lerpSpeed,
            magnetRadius,
            fieldStrength,
            autoAnimate,
            rotationSpeed,
            pulseSpeed
        } = this.options;

        // Interactive mouse position in 3D
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const mouse3D = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(plane, mouse3D);

        this.particles.forEach((p, i) => {
            // 1. Base Motion (Wave + Idle)
            const basePos = p.userData.basePos;
            const wave = Math.sin(time * waveSpeed + p.userData.phase) * waveAmplitude;
            const targetPos = basePos.clone();

            if (autoAnimate) {
                targetPos.x += Math.cos(p.userData.angle) * wave;
                targetPos.y += Math.sin(p.userData.angle) * wave;
            }

            // 2. Magnetic Repulsion
            const dist = p.position.distanceTo(mouse3D);
            if (dist < magnetRadius) {
                const force = (1 - dist / magnetRadius) * fieldStrength;
                const dir = p.position.clone().sub(mouse3D).normalize();
                targetPos.add(dir.multiplyScalar(force));
            }

            // 3. Lerp to target
            p.position.lerp(targetPos, lerpSpeed);

            // 4. Rotation
            if (rotationSpeed > 0) {
                p.rotation.x += 0.01 * rotationSpeed;
                p.rotation.y += 0.02 * rotationSpeed;
            } else {
                // Point towards movement or just jitter
                p.rotation.z = p.userData.angle + Math.PI / 2;
            }

            // 5. Pulsing Scale
            const scale = 1 + Math.sin(time * pulseSpeed + p.userData.phase) * 0.2;
            p.scale.set(scale, scale, scale);
        });

        this.scene.rotation.z += 0.001 * rotationSpeed;

        this.renderer.render(this.scene, this.camera);
    }

    updateColor(color) {
        const threeColor = new THREE.Color(color);
        this.particles.forEach(p => {
            p.material.color.copy(threeColor);
            p.material.emissive.copy(threeColor);
        });
    }
}
