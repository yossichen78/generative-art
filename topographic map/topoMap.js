const canvas = document.getElementById('topoCanvas');
const ctx = canvas.getContext('2d');

// Increase canvas resolution without changing element size
canvas.style.width = '800px';
canvas.style.height = '600px';
canvas.width = 1600;
canvas.height = 1200;

const width = canvas.width;
const height = canvas.height;
let scale = 5; // Size of each cell in the grid

// Initialize p5.js to use its noise function
new p5();

let t = 0; // Time variable for animation
let isMouseDown = false; // Track mouse state
let noiseScale = 0.005;
let colors = [[0, 0, 255], [0, 255, 0], [255, 255, 0]]; // Initial colors
let targetColors = colors.slice(); // To store the target color palette for transition
let transitionProgress = 1; // 1 means fully transitioned, 0 means not transitioned at all
let showLines = false;
let lineDistance = 10;
let lineWidth = 2;
let lineOpacity = 1;
let lineColor = '#000000';
let speed = 0.009;
let contrast = 1;
let strength = 1;
let detail = 0.005;
let animationActive = true;
let paintDrops = [];

const updateColorsButton = document.getElementById('updateColors');
const addColorButton = document.getElementById('addColor');
const removeColorButton = document.getElementById('removeColor');
const randomizeColorsButton = document.getElementById('randomizeColors');
const resetColorsButton = document.getElementById('resetColors');
const colorPickersContainer = document.getElementById('colorContainer');
const showLinesCheckbox = document.getElementById('showLines');
const lineDistanceSlider = document.getElementById('lineDistance');
const lineWidthSlider = document.getElementById('lineWidth');
const lineOpacitySlider = document.getElementById('lineOpacity');
const lineColorPicker = document.getElementById('lineColor');
const noiseLevelSlider = document.getElementById('noiseLevel');
const scaleSlider = document.getElementById('scale');
const speedSlider = document.getElementById('speed');
const contrastSlider = document.getElementById('contrast');
const strengthSlider = document.getElementById('strength');
const detailSlider = document.getElementById('detail');
const freezeButton = document.getElementById('freezeButton');

// Load saved settings
window.addEventListener('load', () => {
    const savedSettings = JSON.parse(localStorage.getItem('settings'));
    if (savedSettings) {
        applySavedSettings(savedSettings);
    }
});

function saveSettings() {
    const settings = {
        colors: Array.from(document.querySelectorAll('.colorPicker')).map(picker => picker.value),
        showLines,
        lineDistance,
        lineWidth,
        lineOpacity,
        lineColor,
        noiseScale,
        scale,
        speed,
        contrast,
        strength,
        detail,
    };
    localStorage.setItem('settings', JSON.stringify(settings));
}

function applySavedSettings(settings) {
    const colorContainer = document.getElementById('colorContainer');
    colorContainer.innerHTML = '';
    settings.colors.forEach(color => {
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.className = 'colorPicker';
        colorPicker.value = color;
        colorContainer.appendChild(colorPicker);
    });

    showLines = settings.showLines;
    document.getElementById('showLines').checked = showLines;
    lineDistance = settings.lineDistance;
    lineWidth = settings.lineWidth;
    lineOpacity = settings.lineOpacity;
    lineColor = settings.lineColor;
    noiseScale = settings.noiseScale;
    scale = settings.scale;
    speed = settings.speed;
    contrast = settings.contrast;
    strength = settings.strength;
    detail = settings.detail;

    document.getElementById('lineDistance').value = lineDistance;
    document.getElementById('lineWidth').value = lineWidth;
    document.getElementById('lineOpacity').value = lineOpacity;
    document.getElementById('lineColor').value = lineColor;
    document.getElementById('noiseLevel').value = noiseScale;
    document.getElementById('scale').value = scale;
    document.getElementById('speed').value = speed;
    document.getElementById('contrast').value = contrast;
    document.getElementById('strength').value = strength;
    document.getElementById('detail').value = detail;
    document.getElementById('lineDistance').disabled = !showLines;
    document.getElementById('lineWidth').disabled = !showLines;
    document.getElementById('lineOpacity').disabled = !showLines;
    document.getElementById('lineColor').disabled = !showLines;
}

canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    createPaintDrop(event);
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    isMouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        createPaintDrop(event);
    }
});

updateColorsButton.addEventListener('click', () => {
    const colorPickers = document.querySelectorAll('.colorPicker');
    targetColors = Array.from(colorPickers).map(picker => hexToRgb(picker.value));
    if (targetColors.length < 2) {
        targetColors.push(targetColors[0]);
    }
    transitionProgress = 0; // Start transition
    saveSettings();
});

addColorButton.addEventListener('click', () => {
    const newColorPicker = document.createElement('input');
    newColorPicker.type = 'color';
    newColorPicker.className = 'colorPicker';
    newColorPicker.value = '#ffffff';
    colorPickersContainer.appendChild(newColorPicker);
    saveSettings();
});

removeColorButton.addEventListener('click', () => {
    const colorPickers = document.querySelectorAll('.colorPicker');
    if (colorPickers.length > 1) {
        colorPickers[colorPickers.length - 1].remove();
        saveSettings();
    }
});

randomizeColorsButton.addEventListener('click', () => {
    const colorPickers = document.querySelectorAll('.colorPicker');
    colorPickers.forEach(picker => {
        picker.value = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    });
    updateColorsButton.click();
});

resetColorsButton.addEventListener('click', () => {
    const colorContainer = document.getElementById('colorContainer');
    colorContainer.innerHTML = '';
    const blackColor = document.createElement('input');
    blackColor.type = 'color';
    blackColor.className = 'colorPicker';
    blackColor.value = '#000000';
    colorContainer.appendChild(blackColor);
    const whiteColor = document.createElement('input');
    whiteColor.type = 'color';
    whiteColor.className = 'colorPicker';
    whiteColor.value = '#ffffff';
    colorContainer.appendChild(whiteColor);
    updateColorsButton.click();
});

showLinesCheckbox.addEventListener('change', (event) => {
    showLines = event.target.checked;
    lineDistanceSlider.disabled = !showLines;
    lineWidthSlider.disabled = !showLines;
    lineOpacitySlider.disabled = !showLines;
    lineColorPicker.disabled = !showLines;
    saveSettings();
});

lineDistanceSlider.addEventListener('input', (event) => {
    lineDistance = parseInt(event.target.value);
    saveSettings();
});

lineWidthSlider.addEventListener('input', (event) => {
    lineWidth = parseInt(event.target.value);
    saveSettings();
});

lineOpacitySlider.addEventListener('input', (event) => {
    lineOpacity = parseFloat(event.target.value);
    saveSettings();
});

lineColorPicker.addEventListener('input', (event) => {
    lineColor = event.target.value;
    saveSettings();
});

noiseLevelSlider.addEventListener('input', (event) => {
    noiseScale = parseFloat(event.target.value);
    saveSettings();
});

scaleSlider.addEventListener('input', (event) => {
    scale = parseInt(event.target.value);
    saveSettings();
});

speedSlider.addEventListener('input', (event) => {
    speed = parseFloat(event.target.value);
    saveSettings();
});

contrastSlider.addEventListener('input', (event) => {
    contrast = parseFloat(event.target.value);
    saveSettings();
});

strengthSlider.addEventListener('input', (event) => {
    strength = parseFloat(event.target.value);
    saveSettings();
});

detailSlider.addEventListener('input', (event) => {
    detail = parseFloat(event.target.value);
    saveSettings();
});

freezeButton.addEventListener('click', () => {
    animationActive = !animationActive;
    freezeButton.textContent = animationActive ? 'Freeze' : 'Continue';
    if (animationActive) {
        requestAnimationFrame(animate);
    }
});

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function createPaintDrop(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const color = colors[Math.floor(Math.random() * colors.length)];
    paintDrops.push({ x: mouseX, y: mouseY, color: color, radius: 1, alpha: 1 });
}

function generateHeightMap(width, height, scale, t) {
    const cols = Math.ceil(width / scale);
    const rows = Math.ceil(height / scale);
    const heightMap = [];

    for (let x = 0; x < cols; x++) {
        heightMap[x] = [];
        for (let y = 0; y < rows; y++) {
            heightMap[x][y] = noise(x * detail, y * detail, t);
        }
    }

    return heightMap;
}

function drawHeightMap(ctx, heightMap, scale, paintDrops) {
    const cols = heightMap.length;
    const rows = heightMap[0].length;

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let height = heightMap[x][y] * strength;
            let colorValue = Math.floor(height * 255 * contrast);

            colorValue = Math.max(0, Math.min(255, colorValue)); // Clamp color value

            let dropEffect = 0;
            let r = 0, g = 0, b = 0, a = 0;
            paintDrops.forEach(drop => {
                const dx = (x * scale - drop.x) / scale;
                const dy = (y * scale - drop.y) / scale;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < drop.radius) {
                    const effect = (1 - dist / drop.radius) * drop.alpha;
                    dropEffect += effect;
                    r += drop.color[0] * effect;
                    g += drop.color[1] * effect;
                    b += drop.color[2] * effect;
                    a += effect;
                }
            });

            if (a > 0) {
                r = Math.floor(r / a);
                g = Math.floor(g / a);
                b = Math.floor(b / a);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dropEffect})`;
            } else {
                let color = getTransitionedColor(colorValue, transitionProgress);
                ctx.fillStyle = color;
            }

            ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }

    if (showLines) {
        drawTopographicLines(ctx, heightMap, scale, paintDrops);
    }
}

function drawTopographicLines(ctx, heightMap, scale, paintDrops) {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = lineOpacity;

    const cols = heightMap.length;
    const rows = heightMap[0].length;

    ctx.beginPath();
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let height = heightMap[x][y] * strength * 255 * contrast;
            let dropEffect = 0;
            paintDrops.forEach(drop => {
                const dx = (x * scale - drop.x) / scale;
                const dy = (y * scale - drop.y) / scale;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < drop.radius) {
                    dropEffect += (1 - dist / drop.radius) * drop.alpha;
                }
            });

            height -= dropEffect;

            height = Math.max(0, Math.min(255, height)); // Clamp height value

            if (Math.floor(height) % lineDistance === 0) {
                ctx.moveTo(x * scale, y * scale);
                ctx.lineTo(x * scale + scale, y * scale);
                ctx.lineTo(x * scale + scale, y * scale + scale);
                ctx.lineTo(x * scale, y * scale + scale);
                ctx.lineTo(x * scale, y * scale);
            }
        }
    }
    ctx.stroke();
    ctx.globalAlpha = 1; // Reset global alpha to default
}

function getTransitionedColor(value, progress) {
    const maxIndex = colors.length - 1;
    const normalizedValue = value / 255 * maxIndex;
    const index = Math.floor(normalizedValue);
    const fraction = normalizedValue - index;

    if (!colors[index] || !colors[index + 1] || !targetColors[index] || !targetColors[index + 1]) {
        return `rgb(${value}, ${value}, ${value})`;
    }

    const color1 = colors[index];
    const color2 = colors[Math.min(index + 1, maxIndex)];

    const r = Math.floor(color1[0] + fraction * (color2[0] - color1[0]));
    const g = Math.floor(color1[1] + fraction * (color2[1] - color1[1]));
    const b = Math.floor(color1[2] + fraction * (color2[2] - color1[2]));

    const targetColor1 = targetColors[index];
    const targetColor2 = targetColors[Math.min(index + 1, maxIndex)];

    const tr = Math.floor(targetColor1[0] + fraction * (targetColor2[0] - targetColor1[0]));
    const tg = Math.floor(targetColor1[1] + fraction * (targetColor2[1] - targetColor1[1]));
    const tb = Math.floor(targetColor1[2] + fraction * (targetColor2[2] - targetColor1[2]));

    const finalR = Math.floor(r + progress * (tr - r));
    const finalG = Math.floor(g + progress * (tg - g));
    const finalB = Math.floor(b + progress * (tb - b));

    return `rgb(${finalR}, ${finalG}, ${finalB})`;
}

function animate() {
    if (animationActive) {
        ctx.clearRect(0, 0, width, height);
        const heightMap = generateHeightMap(width, height, scale, t);

        drawHeightMap(ctx, heightMap, scale, paintDrops);

        paintDrops.forEach(drop => {
            drop.radius += 0.5;
            drop.alpha -= 0.01;
        });

        paintDrops = paintDrops.filter(drop => drop.alpha > 0);

        t += speed;

        if (transitionProgress < 1) {
            transitionProgress += 0.01; // Increment transition progress
            if (transitionProgress > 1) {
                transitionProgress = 1; // Cap the progress at 1
                colors = targetColors.slice(); // Update colors to target colors after transition
            }
        }
    }

    requestAnimationFrame(animate);
}

animate();
