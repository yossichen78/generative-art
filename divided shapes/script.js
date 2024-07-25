const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.75;
canvas.height = window.innerHeight * 0.75;

const rectangleStartButton = document.getElementById('rectangleStartButton');
const rectangleAngledButton = document.getElementById('rectangleAngledButton');
const circleButton = document.getElementById('circleButton');
let drawing = false;
let shapes = [];

function drawRectangle(x, y, width, height, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, width, height);
}

function drawAngledRectangle(x, y, width, height, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height);
    ctx.moveTo(x + width, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
}

function drawCircle(x, y, radius, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

function getRandomFraction() {
    const fractions = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4];
    return fractions[Math.floor(Math.random() * fractions.length)];
}

function kdTreeDivide(x, y, width, height, isVertical, probability, lineWidth) {
    if (width <= 5 || height <= 5 || Math.random() > probability) {
        return;
    }

    drawRectangle(x, y, width, height, lineWidth);

    const fraction = getRandomFraction();
    const newLineWidth = Math.max(lineWidth * 0.8, 1);

    if (isVertical) {
        const lineX = x + width * fraction;

        setTimeout(() => {
            ctx.beginPath();
            ctx.moveTo(lineX, y);
            ctx.lineTo(lineX, y + height);
            ctx.stroke();

            kdTreeDivide(x, y, lineX - x, height, !isVertical, probability - 0.1, newLineWidth); // Left part
            kdTreeDivide(lineX, y, width - (lineX - x), height, !isVertical, probability - 0.1, newLineWidth); // Right part

            shapes.push({ x, y, width: lineX - x, height, lineWidth: newLineWidth, isVertical: !isVertical });
            shapes.push({ x: lineX, y, width: width - (lineX - x), height, lineWidth: newLineWidth, isVertical: !isVertical });
        }, 50);
    } else {
        const lineY = y + height * fraction;

        setTimeout(() => {
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + width, lineY);
            ctx.stroke();

            kdTreeDivide(x, y, width, lineY - y, !isVertical, probability - 0.1, newLineWidth); // Top part
            kdTreeDivide(x, lineY, width, height - (lineY - y), !isVertical, probability - 0.1, newLineWidth); // Bottom part

            shapes.push({ x, y, width, height: lineY - y, lineWidth: newLineWidth, isVertical: !isVertical });
            shapes.push({ x, y: lineY, width, height: height - (lineY - y), lineWidth: newLineWidth, isVertical: !isVertical });
        }, 50);
    }
}

function autoDivideRectangle() {
    if (!drawing) return;

    // Sort shapes by area (largest first)
    shapes.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // 90% chance to pick the largest rectangle
    if (shapes.length > 0 && Math.random() < 0.9) {
        const shape = shapes[0];
        kdTreeDivide(shape.x, shape.y, shape.width, shape.height, shape.isVertical, 1.0, shape.lineWidth);
        shapes = shapes.filter(s => s !== shape); // Remove the divided shape
    }

    // Continue dividing
    setTimeout(autoDivideRectangle, 100);
}

function autoDivideAngledRectangle() {
    if (!drawing) return;

    // Sort shapes by area (largest first)
    shapes.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // 90% chance to pick the largest rectangle
    if (shapes.length > 0 && Math.random() < 0.9) {
        const shape = shapes[0];
        drawAngledRectangle(shape.x, shape.y, shape.width, shape.height, shape.lineWidth);
        shapes = shapes.filter(s => s !== shape); // Remove the divided shape

        // Recursively divide the new shapes
        const fraction = getRandomFraction();
        const newLineWidth = Math.max(shape.lineWidth * 0.8, 1);

        shapes.push({ x: shape.x, y: shape.y, width: shape.width * fraction, height: shape.height * fraction, lineWidth: newLineWidth, isVertical: !shape.isVertical });
        shapes.push({ x: shape.x + shape.width * fraction, y: shape.y + shape.height * fraction, width: shape.width * (1 - fraction), height: shape.height * (1 - fraction), lineWidth: newLineWidth, isVertical: !shape.isVertical });
    }

    // Continue dividing
    setTimeout(autoDivideAngledRectangle, 100);
}

function autoDivideCircle() {
    if (!drawing) return;

    // Sort shapes by radius (largest first)
    shapes.sort((a, b) => (b.radius) - (a.radius));

    // 90% chance to pick the largest circle
    if (shapes.length > 0 && Math.random() < 0.9) {
        const shape = shapes[0];
        const radius = shape.radius;
        const fraction = getRandomFraction();
        const newRadius = radius * fraction;
        const newLineWidth = Math.max(shape.lineWidth * 0.8, 1);

        drawCircle(shape.x, shape.y, newRadius, newLineWidth);
        shapes = shapes.filter(s => s !== shape); // Remove the divided shape

        // Recursively divide the new shapes
        shapes.push({ x: shape.x, y: shape.y, radius: newRadius, lineWidth: newLineWidth });
        shapes.push({ x: shape.x + radius - newRadius, y: shape.y, radius: radius - newRadius, lineWidth: newLineWidth });
    }

    // Continue dividing
    setTimeout(autoDivideCircle, 100);
}

rectangleStartButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes = [];
    drawing = true;
    const x = canvas.width / 8;
    const y = canvas.height / 8;
    const width = canvas.width * 3 / 4;
    const height = canvas.height * 3 / 4;
    kdTreeDivide(x, y, width, height, true, 1.0, 7);
    shapes.push({ x, y, width, height, lineWidth: 7, isVertical: true });

    autoDivideRectangle();
});

rectangleAngledButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes = [];
    drawing = true;
    const x = canvas.width / 8;
    const y = canvas.height / 8;
    const width = canvas.width * 3 / 4;
    const height = canvas.height * 3 / 4;
    drawAngledRectangle(x, y, width, height, 7);
    shapes.push({ x, y, width, height, lineWidth: 7, isVertical: true });

    autoDivideAngledRectangle();
});

circleButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes = [];
    drawing = true;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 3 / 8;
    drawCircle(x, y, radius, 7);
    shapes.push({ x, y, radius, lineWidth: 7 });

    autoDivideCircle();
});

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        drawing = false;
    }
});
