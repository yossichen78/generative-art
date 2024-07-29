let gridSize, cols, rows, flowField, particles;
let bgColor, particleColor, particleSpeed, particleOpacity, particleSize, particleLifetime;
let force = 2, density = 20, noiseFactor = 0.1, octaves = 4;
let showPoints = false;
let showVectors = false;
let showTrails = true;
let smearEffect = false;
let smearIntensity = 50;
let particleCount;
let gradualChange = false;
let continuousGeneration = false;
let controls = {
    gridSize: parseInt(localStorage.getItem('gridSize')) || 20,
    bgColor: localStorage.getItem('bgColor') || '#000000',
    particleColor: localStorage.getItem('particleColor') || '#ffffff',
    particleCount: parseInt(localStorage.getItem('particleCount')) || 200,
    particleSpeed: parseInt(localStorage.getItem('particleSpeed')) || 2,
    particleOpacity: parseInt(localStorage.getItem('particleOpacity')) || 100,
    particleSize: parseInt(localStorage.getItem('particleSize')) || 1,
    smearEffect: localStorage.getItem('smearEffect') === 'true',
    smearIntensity: parseInt(localStorage.getItem('smearIntensity')) || 50,
    force: parseFloat(localStorage.getItem('force')) || 2,
    density: parseInt(localStorage.getItem('density')) || 20,
    noise: parseFloat(localStorage.getItem('noise')) || 0.1,
    octaves: parseInt(localStorage.getItem('octaves')) || 4,
    particleLifetime: parseInt(localStorage.getItem('particleLifetime')) || 100,
    continuousGeneration: localStorage.getItem('continuousGeneration') === 'true'
};

function setup() {
    let canvas = createCanvas(window.innerWidth - 200, window.innerHeight);
    canvas.parent('canvas-container');
    cols = Math.floor(width / density);
    rows = Math.floor(height / density);
    flowField = new Array(cols * rows);
    bgColor = controls.bgColor;
    particleColor = controls.particleColor;
    particleCount = controls.particleCount;
    particleSpeed = controls.particleSpeed;
    particleOpacity = controls.particleOpacity;
    particleSize = controls.particleSize;
    smearEffect = controls.smearEffect;
    smearIntensity = controls.smearIntensity;
    force = controls.force;
    density = controls.density;
    noiseFactor = controls.noise;
    octaves = controls.octaves;
    particleLifetime = controls.particleLifetime;
    continuousGeneration = controls.continuousGeneration;
    generateFlowField();
    initParticles(particleCount);
    noLoop();
}

function generateFlowField() {
    noiseDetail(octaves);
    noiseSeed(Math.random() * 10000);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let angle = noise(x * noiseFactor, y * noiseFactor) * TWO_PI;
            let vector = p5.Vector.fromAngle(angle);
            vector.setMag(force);
            flowField[x + y * cols] = vector;
        }
    }
}

function initParticles(num) {
    if (!particles) {
        particles = [];
    }
    for (let i = 0; i < num; i++) {
        particles.push(new Particle());
    }
}

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = particleSpeed;
        this.prevPos = this.pos.copy();
        this.lifetime = particleLifetime;
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.lifetime--;
    }

    follow(vectors) {
        let x = floor(this.pos.x / density);
        let y = floor(this.pos.y / density);
        let index = x + y * cols;
        let force = vectors[index];
        if (force) this.applyForce(force);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    show() {
        stroke(color(particleColor)._getRed(), color(particleColor)._getGreen(), color(particleColor)._getBlue(), particleOpacity);
        strokeWeight(particleSize);
        if (showTrails) {
            line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
        } else {
            point(this.pos.x, this.pos.y);
        }
        this.updatePrev();
    }

    updatePrev() {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
    }

    edges() {
        if (this.pos.x > width) {
            this.pos.x = 0;
            this.updatePrev();
        }
        if (this.pos.x < 0) {
            this.pos.x = width;
            this.updatePrev();
        }
        if (this.pos.y > height) {
            this.pos.y = 0;
            this.updatePrev();
        }
        if (this.pos.y < 0) {
            this.pos.y = height;
            this.updatePrev();
        }
    }

    isDead() {
        return this.lifetime <= 0;
    }
}

function draw() {
    if (smearEffect) {
        fill(color(bgColor)._getRed(), color(bgColor)._getGreen(), color(bgColor)._getBlue(), smearIntensity);
        rect(0, 0, width, height);
    } else {
        background(bgColor);
    }

    if (gradualChange) {
        for (let i = 0; i < flowField.length; i++) {
            let change = noise(i * noiseFactor) * 0.1 - 0.05;
            flowField[i].rotate(change);
        }
    }

    if (showVectors) {
        stroke(255);
        strokeWeight(1);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let index = x + y * cols;
                let vector = flowField[index];
                push();
                translate(x * density, y * density);
                rotate(vector.heading());
                line(0, 0, density / 2, 0);
                pop();
            }
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let particle = particles[i];
        particle.follow(flowField);
        particle.update();
        particle.edges();
        particle.show();
        if (particle.isDead()) {
            particles.splice(i, 1);
        }
    }

    if (showPoints) {
        stroke(255, 0, 0);
        strokeWeight(3);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                point(x * density, y * density);
            }
        }
    }

    if (continuousGeneration) {
        initParticles(1);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const updateFlowField = () => {
        density = parseInt(document.getElementById('density').value);
        force = parseFloat(document.getElementById('force').value);
        noiseFactor = parseFloat(document.getElementById('noise').value);
        octaves = parseInt(document.getElementById('octaves').value);
        localStorage.setItem('density', density);
        localStorage.setItem('force', force);
        localStorage.setItem('noise', noiseFactor);
        localStorage.setItem('octaves', octaves);
        controls.density = density;
        controls.force = force;
        controls.noise = noiseFactor;
        controls.octaves = octaves;
        cols = Math.floor(width / density);
        rows = Math.floor(height / density);
        generateFlowField();
    };

    document.getElementById('force').addEventListener('input', updateFlowField);
    document.getElementById('density').addEventListener('input', updateFlowField);
    document.getElementById('noise').addEventListener('input', updateFlowField);
    document.getElementById('octaves').addEventListener('input', updateFlowField);

    document.getElementById('toggleChange').addEventListener('click', () => {
        gradualChange = !gradualChange;
    });

    document.getElementById('start').addEventListener('click', () => {
        loop();
    });

    document.getElementById('stop').addEventListener('click', () => {
        noLoop();
    });

    document.getElementById('bgColor').addEventListener('change', (event) => {
        bgColor = event.target.value;
        localStorage.setItem('bgColor', bgColor);
        controls.bgColor = bgColor;
    });

    document.getElementById('particleColor').addEventListener('change', (event) => {
        particleColor = event.target.value;
        localStorage.setItem('particleColor', particleColor);
        controls.particleColor = particleColor;
    });

    document.getElementById('particleCount').addEventListener('input', (event) => {
        particleCount = parseInt(event.target.value);
        localStorage.setItem('particleCount', particleCount);
        controls.particleCount = particleCount;
        initParticles(particleCount);
    });

    document.getElementById('particleSpeed').addEventListener('input', (event) => {
        particleSpeed = parseInt(event.target.value);
        localStorage.setItem('particleSpeed', particleSpeed);
        controls.particleSpeed = particleSpeed;
    });

    document.getElementById('particleOpacity').addEventListener('input', (event) => {
        particleOpacity = parseInt(event.target.value);
        localStorage.setItem('particleOpacity', particleOpacity);
        controls.particleOpacity = particleOpacity;
    });

    document.getElementById('particleSize').addEventListener('input', (event) => {
        particleSize = parseInt(event.target.value);
        localStorage.setItem('particleSize', particleSize);
        controls.particleSize = particleSize;
    });

    document.getElementById('particleLifetime').addEventListener('input', (event) => {
        particleLifetime = parseInt(event.target.value);
        localStorage.setItem('particleLifetime', particleLifetime);
        controls.particleLifetime = particleLifetime;
    });

    document.getElementById('smearEffect').addEventListener('change', (event) => {
        smearEffect = event.target.checked;
        localStorage.setItem('smearEffect', smearEffect);
        controls.smearEffect = smearEffect;
    });

    document.getElementById('smearIntensity').addEventListener('input', (event) => {
        smearIntensity = parseInt(event.target.value);
        localStorage.setItem('smearIntensity', smearIntensity);
        controls.smearIntensity = smearIntensity;
    });

    document.getElementById('continuousGeneration').addEventListener('change', (event) => {
        continuousGeneration = event.target.checked;
        localStorage.setItem('continuousGeneration', continuousGeneration);
        controls.continuousGeneration = continuousGeneration;
    });

    document.getElementById('togglePoints').addEventListener('click', () => {
        showPoints = !showPoints;
    });

    document.getElementById('toggleVectors').addEventListener('click', () => {
        showVectors = !showVectors;
    });

    document.getElementById('toggleTrails').addEventListener('click', () => {
        showTrails = !showTrails;
    });

    // Initialize with saved settings
    document.getElementById('gridSize').value = controls.gridSize;
    document.getElementById('bgColor').value = controls.bgColor;
    document.getElementById('particleColor').value = controls.particleColor;
    document.getElementById('particleCount').value = controls.particleCount;
    document.getElementById('particleSpeed').value = controls.particleSpeed;
    document.getElementById('particleOpacity').value = controls.particleOpacity;
    document.getElementById('particleSize').value = controls.particleSize;
    document.getElementById('smearEffect').checked = controls.smearEffect;
    document.getElementById('smearIntensity').value = controls.smearIntensity;
    document.getElementById('force').value = controls.force;
    document.getElementById('density').value = controls.density;
    document.getElementById('noise').value = controls.noise;
    document.getElementById('octaves').value = controls.octaves;
    document.getElementById('particleLifetime').value = controls.particleLifetime;
    document.getElementById('continuousGeneration').checked = controls.continuousGeneration;
    gridSize = parseInt(controls.gridSize);
    bgColor = controls.bgColor;
    particleColor = controls.particleColor;
    particleCount = parseInt(controls.particleCount);
    particleSpeed = parseInt(controls.particleSpeed);
    particleOpacity = parseInt(controls.particleOpacity);
    particleSize = parseInt(controls.particleSize);
    smearEffect = controls.smearEffect;
    smearIntensity = parseInt(controls.smearIntensity);
    force = parseFloat(controls.force);
    density = parseInt(controls.density);
    noiseFactor = parseFloat(controls.noise);
    octaves = parseInt(controls.octaves);
    particleLifetime = parseInt(controls.particleLifetime);
    continuousGeneration = controls.continuousGeneration;
    setup();
});

function mousePressed() {
    particles.push(new Particle());
}
