const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const fileInput = document.getElementById('fileInput');

const gridSizeSlider = document.getElementById('gridSizeSlider');
const gridSizeValue = document.getElementById('gridSizeValue');
const gridColorPicker = document.getElementById('gridColorPicker');
const gridLineWidthSlider = document.getElementById('gridLineWidthSlider');
const gridLineWidthValue = document.getElementById('gridLineWidthValue');

const width = canvas.width;
const height = canvas.height;

let currentImage = null;

function getDominantColor(imageData, startX, startY, blockSize) {
    const colorCounts = {};
    const data = imageData.data;
    const width = imageData.width;

    for (let y = startY; y < startY + blockSize; y++) {
        for (let x = startX; x < startX + blockSize; x++) {
            const index = (y * width + x) * 4;
            const color = `${data[index]},${data[index + 1]},${data[index + 2]}`;

            if (colorCounts[color]) {
                colorCounts[color]++;
            } else {
                colorCounts[color] = 1;
            }
        }
    }

    let dominantColor = '';
    let maxCount = 0;

    for (const color in colorCounts) {
        if (colorCounts[color] > maxCount) {
            maxCount = colorCounts[color];
            dominantColor = color;
        }
    }

    return dominantColor.split(',').map(Number);
}

function pixelateImage(image, blockSize, gridColor, gridLineWidth) {
    const { width, height } = canvas;
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);

    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            const [r, g, b] = getDominantColor(imageData, x, y, blockSize);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, blockSize, blockSize);

            if (gridLineWidth > 0) {
                ctx.strokeStyle = gridColor;
                ctx.lineWidth = gridLineWidth;
                ctx.strokeRect(x, y, blockSize, blockSize);
            }
        }
    }
}

function handleFileLoad(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                currentImage = img;
                applySettings();
            };
        };
        reader.readAsDataURL(file);
    }
}

function applySettings() {
    if (currentImage) {
        const blockSize = parseInt(gridSizeSlider.value);
        const gridColor = gridColorPicker.value;
        const gridLineWidth = parseInt(gridLineWidthSlider.value);
        pixelateImage(currentImage, blockSize, gridColor, gridLineWidth);
    }
}

function saveSettings() {
    localStorage.setItem('gridSize', gridSizeSlider.value);
    localStorage.setItem('gridColor', gridColorPicker.value);
    localStorage.setItem('gridLineWidth', gridLineWidthSlider.value);
}

function loadSettings() {
    const gridSize = localStorage.getItem('gridSize');
    const gridColor = localStorage.getItem('gridColor');
    const gridLineWidth = localStorage.getItem('gridLineWidth');

    if (gridSize !== null) {
        gridSizeSlider.value = gridSize;
        gridSizeValue.textContent = gridSize;
    }
    if (gridColor !== null) {
        gridColorPicker.value = gridColor;
    }
    if (gridLineWidth !== null) {
        gridLineWidthSlider.value = gridLineWidth;
        gridLineWidthValue.textContent = gridLineWidth;
    }
}

fileInput.addEventListener('change', handleFileLoad);
gridSizeSlider.addEventListener('input', () => {
    gridSizeValue.textContent = gridSizeSlider.value;
    saveSettings();
    applySettings();
});
gridColorPicker.addEventListener('input', () => {
    saveSettings();
    applySettings();
});
gridLineWidthSlider.addEventListener('input', () => {
    gridLineWidthValue.textContent = gridLineWidthSlider.value;
    saveSettings();
    applySettings();
});

function init() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    loadSettings();

    // Draw the initial exotic beach image
    const img = new Image();
    img.src = '/mnt/data/A_beautiful_scenery_of_an_exotic_beach_with_clear_.png';
    img.onload = () => {
        currentImage = img;
        applySettings();
    };
}

init();
