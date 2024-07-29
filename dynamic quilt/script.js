let img;
let video;
let useCamera = false;
let gridSize = 10;
let gridColor = '#ffffff';
let gridLineWidth = 1;
let noiseScale = 0.1;
let noiseStrength = 10;
let speed = 0.01;
let showVectorField = false;
let animationRunning = false;
let stretchShapes = false;
let time = 0;
let gravity = 0.5;
let shapeType = 'square'; // Shape type for divided pixels
let randomPolygon = []; // Store the vertices of the random polygon
let sizeDifference = 10; // Maximum size difference for random sizes

let precomputedColors = [];
let shapeSizes = []; // Store sizes of shapes
let fallingPixels = [];
let fallenPixels = [];
let capturer;

function setup() {
    const canvas = createCanvas(800, 800);
    canvas.parent('canvasContainer');

    select('#gridSizeSlider').attribute('max', 40).input(updateSettings);
    select('#gridColorPicker').input(updateSettings);
    select('#gridLineWidthSlider').input(updateSettings);
    select('#noiseScaleSlider').input(updateSettings);
    select('#noiseStrengthSlider').input(updateSettings);
    select('#speedSlider').input(updateSettings);
    select('#showVectorFieldToggle').changed(toggleVectorField);
    select('#startStopToggle').changed(toggleAnimation);
    select('#stretchShapesToggle').changed(toggleStretchShapes);
    select('#fileInput').changed(handleFile);
    select('#shapeTypePicker').changed(updateSettings);
    select('#sizeDifferenceSlider').input(updateSettings);

    select('#cameraButton').mousePressed(() => {
        useCamera = true;
        if (!video) {
            video = createCapture(VIDEO);
            video.size(800, 800);
            video.hide();
        }
    });

    select('#imageButton').mousePressed(() => {
        useCamera = false;
        if (video) {
            video.remove();
            video = null;
        }
        select('#fileInput').elt.click();
    });

    select('#startRecordingButton').mousePressed(startRecording);
    select('#stopRecordingButton').mousePressed(stopRecording);

    loadSettings();
    noLoop();

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            regenerateFallenPixels();
        }
    });

    generateRandomPolygon();
}

function draw() {
    background(0);
    if (animationRunning) {
        time += speed;
    }

    if (useCamera && video) {
        video.loadPixels();
        if (video.pixels.length > 0) {
            precomputeColorsFromVideo();
        }
    } else if (img) {
        precomputeColorsFromImage();
    }

    drawGrid();
    drawFallingPixels();
    if (showVectorField) {
        drawVectorField();
    }
    applyGravity();

    if (capturer) {
        capturer.capture(canvas);
    }
}

function drawGrid() {
    for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
            let fallenPixel = fallenPixels.find(pixel => pixel.x === x && pixel.y === y);
            if (fallenPixel) {
                continue;
            }

            let angle = noise(x * noiseScale, y * noiseScale, time) * TWO_PI;
            let wave = sin(time + x * noiseScale + y * noiseScale) * noiseStrength;
            let xOffset = cos(angle) * wave;
            let yOffset = sin(angle) * wave;

            if (!precomputedColors[Math.floor(y / gridSize)] || !precomputedColors[Math.floor(y / gridSize)][Math.floor(x / gridSize)]) {
                continue;
            }

            let col = precomputedColors[Math.floor(y / gridSize)][Math.floor(x / gridSize)];
            let index = (y / gridSize) * (width / gridSize) + (x / gridSize);

            if (!shapeSizes[index]) {
                shapeSizes[index] = gridSize + random(-sizeDifference, sizeDifference);
            }
            let size = shapeSizes[index];

            fill(col);
            noStroke();

            if (stretchShapes && !fallenPixel) {
                drawShape(x, y, size * 1.5, shapeType); // Stretch shapes
            } else {
                drawShape(x + xOffset, y + yOffset, size, shapeType);
            }

            if (gridLineWidth > 0) {
                stroke(gridColor);
                strokeWeight(gridLineWidth);
                noFill();
                drawShape(x + xOffset, y + yOffset, size, shapeType, true);
            }
        }
    }
}

function drawShape(x, y, size, shapeType, outline = false) {
    if (shapeType === 'circle') {
        ellipse(x + size / 2, y + size / 2, size, size);
    } else if (shapeType === 'triangle') {
        triangle(x, y + size, x + size / 2, y, x + size, y + size);
    } else if (shapeType === 'polygon') {
        beginShape();
        for (let i = 0; i < randomPolygon.length; i++) {
            let sx = x + randomPolygon[i].x * size;
            let sy = y + randomPolygon[i].y * size;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    } else {
        rect(x, y, size, size);
    }
}

function drawVectorField() {
    for (let y = 0; y < height; y += gridSize) {
        for (let x = 0; x < width; x += gridSize) {
            let angle = noise(x * noiseScale, y * noiseScale, time) * TWO_PI;
            let wave = sin(time + x * noiseScale + y * noiseScale) * noiseStrength;
            let xOffset = cos(angle) * wave;
            let yOffset = sin(angle) * wave;

            stroke(255, 0, 0);
            line(x, y, x + xOffset, y + yOffset);
        }
    }
}

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        loadImage(e.target.result, (loadedImg) => {
            img = loadedImg;
            img.resize(800, 800);
            useCamera = false;
            shapeSizes = []; // Reset shape sizes to recalculate with the new size difference
            redraw();
        });
    };
    reader.readAsDataURL(file);
}

function precomputeColorsFromImage() {
    precomputedColors = [];
    img.loadPixels();
    for (let y = 0; y < height; y += gridSize) {
        let row = [];
        for (let x = 0; x < width; x += gridSize) {
            let col = img.get(x, y);
            row.push(col);
        }
        precomputedColors.push(row);
    }
}

function precomputeColorsFromVideo() {
    precomputedColors = [];
    for (let y = 0; y < height; y += gridSize) {
        let row = [];
        for (let x = 0; x < width; x += gridSize) {
            let index = (y * width + x) * 4;
            let col = [video.pixels[index], video.pixels[index + 1], video.pixels[index + 2], video.pixels[index + 3]];
            row.push(col);
        }
        precomputedColors.push(row);
    }
}

function resetFallingPixels() {
    fallingPixels = [];
    fallenPixels = [];
    redraw();
}

function regenerateFallenPixels() {
    for (let i = 0; i < fallenPixels.length; i++) {
        let pixel = fallenPixels[i];
        fallingPixels.push({
            x: pixel.x,
            y: height,
            originalX: pixel.originalX,
            originalY: pixel.originalY,
            color: pixel.color,
            vy: -5,
            vx: 0,
            angle: 0,
            angleSpeed: 0,
            size: pixel.size // Add size to regenerate correctly
        });
    }
    fallenPixels = [];
    redraw();
}

function applyGravity() {
    for (let i = 0; i < fallingPixels.length; i++) {
        let pixel = fallingPixels[i];
        pixel.vy += gravity;
        pixel.y += pixel.vy;
        pixel.x += pixel.vx;
        pixel.angle += pixel.angleSpeed;

        // Check if the pixel has reached the bottom of the screen
        if (pixel.y >= height - gridSize) {
            pixel.y = height - gridSize;
            pixel.vy = 0;
        }

        // Check if the pixel has reached its original position during regeneration
        if (pixel.y <= pixel.originalY && pixel.vy < 0) {
            pixel.y = pixel.originalY;
            pixel.x = pixel.originalX;
            pixel.vy = 0;
            pixel.vx = 0;
            // Remove it from the falling pixels
            fallingPixels.splice(i, 1);
            i--;
        }
    }
}

function drawFallingPixels() {
    for (let i = 0; i < fallingPixels.length; i++) {
        let pixel = fallingPixels[i];

        push();
        translate(pixel.x + pixel.size / 2, pixel.y + pixel.size / 2);
        rotate(pixel.angle);
        translate(-pixel.size / 2, -pixel.size / 2);

        fill(pixel.color);
        noStroke();
        drawShape(0, 0, pixel.size, shapeType);

        if (gridLineWidth > 0) {
            stroke(gridColor);
            strokeWeight(gridLineWidth);
            noFill();
            drawShape(0, 0, pixel.size, shapeType, true);
        }
        pop();
    }
}

function mousePressed() {
    addFallingPixel(mouseX, mouseY);
}

function mouseDragged() {
    addFallingPixel(mouseX, mouseY);
}

function addFallingPixel(x, y) {
    // Determine which grid cell was clicked
    let xIndex = Math.floor(x / gridSize);
    let yIndex = Math.floor(y / gridSize);

    // Check if the click is within the canvas bounds and within a radius of 2-3 mm
    if (xIndex >= 0 && xIndex < width / gridSize && yIndex >= 0 && yIndex < height / gridSize) {
        let col = precomputedColors[yIndex][xIndex];
        // Avoid adding the same pixel multiple times
        if (!fallingPixels.find(pixel => pixel.x === xIndex * gridSize && pixel.y === yIndex * gridSize)) {
            let index = (yIndex * (width / gridSize)) + xIndex;
            let size = shapeSizes[index];

            fallingPixels.push({
                x: xIndex * gridSize,
                y: yIndex * gridSize,
                originalX: xIndex * gridSize,
                originalY: yIndex * gridSize,
                size: size,
                color: col,
                vy: random(2, 5),
                vx: random(-1, 1),
                angle: 0,
                angleSpeed: random(-0.05, 0.05)
            });
            // Mark the pixel as fallen to create an empty spot
            fallenPixels.push({
                x: xIndex * gridSize,
                y: yIndex * gridSize,
                originalX: xIndex * gridSize,
                originalY: yIndex * gridSize,
                size: size,
                color: col
            });

            // Add pixels in the surrounding area
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let nx = xIndex + i;
                    let ny = yIndex + j;
                    if (nx >= 0 && nx < width / gridSize && ny >= 0 && ny < height / gridSize && (i !== 0 || j !== 0)) {
                        let ncol = precomputedColors[ny][nx];
                        let nindex = (ny * (width / gridSize)) + nx;
                        let nsize = shapeSizes[nindex];

                        if (!fallingPixels.find(pixel => pixel.x === nx * gridSize && pixel.y === ny * gridSize)) {
                            fallingPixels.push({
                                x: nx * gridSize,
                                y: ny * gridSize,
                                originalX: nx * gridSize,
                                originalY: ny * gridSize,
                                size: nsize,
                                color: ncol,
                                vy: random(2, 5),
                                vx: random(-1, 1),
                                angle: 0,
                                angleSpeed: random(-0.05, 0.05)
                            });
                            fallenPixels.push({
                                x: nx * gridSize,
                                y: ny * gridSize,
                                originalX: nx * gridSize,
                                originalY: ny * gridSize,
                                size: nsize,
                                color: ncol
                            });
                        }
                    }
                }
            }
        }
    }
}

function updateSettings() {
    gridSize = parseInt(select('#gridSizeSlider').value());
    gridColor = select('#gridColorPicker').value();
    gridLineWidth = parseInt(select('#gridLineWidthSlider').value());
    noiseScale = parseFloat(select('#noiseScaleSlider').value());
    noiseStrength = parseInt(select('#noiseStrengthSlider').value());
    speed = parseFloat(select('#speedSlider').value());
    shapeType = select('#shapeTypePicker').value();
    sizeDifference = parseInt(select('#sizeDifferenceSlider').value());

    if (shapeType === 'polygon') {
        generateRandomPolygon();
    }

    select('#gridSizeValue').html(gridSize);
    select('#gridLineWidthValue').html(gridLineWidth);
    select('#noiseScaleValue').html(noiseScale);
    select('#noiseStrengthValue').html(noiseStrength);
    select('#speedValue').html(speed);
    select('#shapeTypeValue').html(shapeType);
    select('#sizeDifferenceValue').html(sizeDifference);

    saveSettings();
    shapeSizes = []; // Reset shape sizes to recalculate with the new size difference
    if (useCamera && video) {
        precomputeColorsFromVideo();
    } else if (img) {
        precomputeColorsFromImage();
    }
    redraw();
}

function toggleVectorField() {
    showVectorField = select('#showVectorFieldToggle').checked();
    redraw();
}

function toggleAnimation() {
    animationRunning = select('#startStopToggle').checked();
    if (animationRunning) {
        loop();
    } else {
        noLoop();
    }
}

function toggleStretchShapes() {
    stretchShapes = select('#stretchShapesToggle').checked();
    redraw();
}

function saveSettings() {
    localStorage.setItem('gridSize', gridSize);
    localStorage.setItem('gridColor', gridColor);
    localStorage.setItem('gridLineWidth', gridLineWidth);
    localStorage.setItem('noiseScale', noiseScale);
    localStorage.setItem('noiseStrength', noiseStrength);
    localStorage.setItem('speed', speed);
    localStorage.setItem('shapeType', shapeType);
    localStorage.setItem('sizeDifference', sizeDifference);
}

function loadSettings() {
    const savedGridSize = localStorage.getItem('gridSize');
    const savedGridColor = localStorage.getItem('gridColor');
    const savedGridLineWidth = localStorage.getItem('gridLineWidth');
    const savedNoiseScale = localStorage.getItem('noiseScale');
    const savedNoiseStrength = localStorage.getItem('noiseStrength');
    const savedSpeed = localStorage.getItem('speed');
    const savedShapeType = localStorage.getItem('shapeType');
    const savedSizeDifference = localStorage.getItem('sizeDifference');

    if (savedGridSize !== null) {
        gridSize = parseInt(savedGridSize);
        select('#gridSizeSlider').value(gridSize);
    }
    if (savedGridColor !== null) {
        gridColor = savedGridColor;
        select('#gridColorPicker').value(gridColor);
    }
    if (savedGridLineWidth !== null) {
        gridLineWidth = parseInt(savedGridLineWidth);
        select('#gridLineWidthSlider').value(gridLineWidth);
    }
    if (savedNoiseScale !== null) {
        noiseScale = parseFloat(savedNoiseScale);
        select('#noiseScaleSlider').value(noiseScale);
    }
    if (savedNoiseStrength !== null) {
        noiseStrength = parseInt(savedNoiseStrength);
        select('#noiseStrengthSlider').value(noiseStrength);
    }
    if (savedSpeed !== null) {
        speed = parseFloat(savedSpeed);
        select('#speedSlider').value(speed);
    }
    if (savedShapeType !== null) {
        shapeType = savedShapeType;
        select('#shapeTypePicker').value(shapeType);
    }
    if (savedSizeDifference !== null) {
        sizeDifference = parseInt(savedSizeDifference);
        select('#sizeDifferenceSlider').value(sizeDifference);
    }

    if (shapeType === 'polygon') {
        generateRandomPolygon();
    }

    select('#gridSizeValue').html(gridSize);
    select('#gridLineWidthValue').html(gridLineWidth);
    select('#noiseScaleValue').html(noiseScale);
    select('#noiseStrengthValue').html(noiseStrength);
    select('#speedValue').html(speed);
    select('#shapeTypeValue').html(shapeType);
    select('#sizeDifferenceValue').html(sizeDifference);
}

function generateRandomPolygon() {
    randomPolygon = [];
    let sides = int(random(3, 7));
    let angle = TWO_PI / sides;
    for (let i = 0; i < sides; i++) {
        randomPolygon.push({ x: cos(i * angle), y: sin(i * angle) });
    }
}

function startRecording() {
    capturer = new CCapture({ format: 'webm' });
    capturer.start();
    select('#startRecordingButton').attribute('disabled', true);
    select('#stopRecordingButton').removeAttribute('disabled');
}

function stopRecording() {
    capturer.stop();
    capturer.save();
    capturer = null;
    select('#stopRecordingButton').attribute('disabled', true);
    select('#startRecordingButton').removeAttribute('disabled');
}
