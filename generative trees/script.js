const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth - 200; // Adjust canvas width to account for settings pane
canvas.height = window.innerHeight;

const colorInput = document.getElementById('color');
const lineWidthInput = document.getElementById('lineWidth');
const branchSpeedInput = document.getElementById('branchSpeed');
const branchProbabilityInput = document.getElementById('branchProbability');
const divisionInput = document.getElementById('division');
const bgColorInput = document.getElementById('bgColor');
const randomizeButton = document.getElementById('randomize');
const resetButton = document.getElementById('reset');

const defaultSettings = {
    color: '#000000',
    lineWidth: 1,
    branchSpeed: 100,
    branchProbability: 1,
    division: 4,
    bgColor: '#ffffff'
};

// Load settings from localStorage or use defaults
const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('settings')) || defaultSettings;
    colorInput.value = settings.color;
    lineWidthInput.value = settings.lineWidth;
    branchSpeedInput.value = settings.branchSpeed;
    branchProbabilityInput.value = settings.branchProbability;
    divisionInput.value = settings.division;
    bgColorInput.value = settings.bgColor;
    applyBackgroundColor();
};

// Save settings to localStorage
const saveSettings = () => {
    const settings = {
        color: colorInput.value,
        lineWidth: lineWidthInput.value,
        branchSpeed: branchSpeedInput.value,
        branchProbability: branchProbabilityInput.value,
        division: divisionInput.value,
        bgColor: bgColorInput.value
    };
    localStorage.setItem('settings', JSON.stringify(settings));
};

// Apply background color
const applyBackgroundColor = () => {
    ctx.fillStyle = bgColorInput.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

let drawing = false;
let lastX = 0;
let lastY = 0;
let lastTime = 0;
let branchCounter = 0;
let lastBranches = [];
let branching = true;

function drawBranch(x, y, length, angle, thickness, generation, branchList) {
    if (!branching) return;

    const maxLength = branchCounter % 10 === 0 ? length * 4 : length;
    let currentLength = 0;
    const step = 2;
    let currentX = x;
    let currentY = y;
    let currentThickness = thickness;
    const initialThickness = thickness;
    let decrement = (thickness - 0.5) / (maxLength / step);

    const draw = () => {
        if (!branching || currentLength >= maxLength) {
            branchList.push({ x: currentX, y: currentY, angle, thickness: currentThickness, generation });
            return;
        }

        const endX = currentX + step * Math.cos(angle);
        const endY = currentY + step * Math.sin(angle);
        const curveAngle = (Math.random() - 0.5) * 0.2; // Slight curve

        ctx.strokeStyle = colorInput.value;
        ctx.lineWidth = currentThickness;

        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        currentX = endX;
        currentY = endY;
        currentThickness -= decrement;
        currentLength += step;
        angle += curveAngle;

        setTimeout(draw, branchSpeedInput.value / 10 - (currentLength / maxLength) * branchSpeedInput.value / 10); // Variable speed

        // Probability of generating new branches
        if (currentLength >= maxLength * 0.8 && currentThickness > 0.5) {
            const branchProbability = (initialThickness / lineWidthInput.value) * branchProbabilityInput.value * 0.95;
            if (Math.random() < branchProbability) {
                branchCounter++;
                drawBranch(currentX, currentY, Math.random() * 28 + 2, angle + Math.PI / 4, currentThickness * 0.7, generation + 1, branchList); // 45 degrees to the right
            }
            if (Math.random() < branchProbability) {
                branchCounter++;
                drawBranch(currentX, currentY, Math.random() * 28 + 2, angle - Math.PI / 4, currentThickness * 0.7, generation + 1, branchList); // 45 degrees to the left
            }
            if (Math.random() < branchProbability / 2) {
                branchCounter++;
                drawBranch(currentX, currentY, Math.random() * 28 + 2, angle + Math.PI / 2, currentThickness * 0.7, generation + 1, branchList); // 90 degrees to the right
            }
        }
    };
    draw();
}

function drawLineSmoothly(x1, y1, x2, y2, speed) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = distance / 2; // Number of steps to draw the line smoothly

    let x = x1;
    let y = y1;

    const thickness = Math.max(lineWidthInput.value * (3 - speed), 1); // Thicker lines for slower speed
    let branchList = [];

    for (let i = 0; i < steps; i++) {
        x += dx / steps;
        y += dy / steps;
        drawBranch(x, y, Math.random() * 28 + 2 + 20, Math.random() * Math.PI * 2, thickness, 0, branchList);
    }

    // Replicate the branches symmetrically
    replicateBranches(branchList);
}

function replicateBranches(branchList) {
    const divisions = parseInt(divisionInput.value);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 1; i < divisions; i++) {
        const angle = (2 * Math.PI / divisions) * i;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.translate(-centerX, -centerY);
        branchList.forEach(branch => {
            drawBranch(branch.x, branch.y, branch.length, branch.angle + angle, branch.thickness, branch.generation, []);
        });
        ctx.restore();
    }
}

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    lastTime = Date.now();
    branchCounter = 0; // Reset the branch counter
    lastBranches = []; // Reset the branches
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentTime = Date.now();

    const dx = x - lastX;
    const dy = y - lastY;
    const dt = currentTime - lastTime;
    const speed = Math.sqrt(dx * dx + dy * dy) / dt;

    drawLineSmoothly(lastX, lastY, x, y, speed);

    lastX = x;
    lastY = y;
    lastTime = currentTime;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 200;
    canvas.height = window.innerHeight;
    applyBackgroundColor();
});

bgColorInput.addEventListener('input', applyBackgroundColor);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        branching = false; // Completely stop branching
    } else if (e.code === 'KeyC') {
        branching = true; // Continue branching
        lastBranches.forEach(branch => {
            drawBranch(branch.x, branch.y, Math.random() * 28 + 2 + 20, branch.angle, branch.thickness, branch.generation, lastBranches);
        });
        lastBranches = [];
    }
});

randomizeButton.addEventListener('click', () => {
    colorInput.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    lineWidthInput.value = Math.floor(Math.random() * 10) + 1;
    branchSpeedInput.value = Math.floor(Math.random() * 191) + 10;
    branchProbabilityInput.value = (Math.random() * 1 + 0.5).toFixed(2);
    divisionInput.value = Math.floor(Math.random() * 50) + 1;
    bgColorInput.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    applyBackgroundColor();
    saveSettings();
});

resetButton.addEventListener('click', () => {
    colorInput.value = defaultSettings.color;
    lineWidthInput.value = defaultSettings.lineWidth;
    branchSpeedInput.value = defaultSettings.branchSpeed;
    branchProbabilityInput.value = defaultSettings.branchProbability;
    divisionInput.value = defaultSettings.division;
    bgColorInput.value = defaultSettings.bgColor;
    applyBackgroundColor();
    saveSettings();
});

// Set initial background color and load settings
loadSettings();
applyBackgroundColor();
