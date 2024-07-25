class Canvas {
    constructor(canvasId, numSections) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.numSections = numSections;
        this.lineWidth = 2;
        this.lineColor = '#000000';
        this.backgroundColor = '#ffffff';
        this.opacity = 1;
        this.history = [];
        this.t = 0;
        this.drawShape = 'none';
        this.isDrawing = false;
        this.autoDrawInterval = null;
        this.drawMode = 'curls'; // Default draw mode
        this.turnRadius = 10; // Default turn radius for curls
        this.turnDepth = 20; // Default turn depth for curls
    }

    setNumSections(numSections) {
        this.numSections = numSections;
        this.saveSettings();
        this.redrawCanvas();
    }

    setLineWidth(lineWidth) {
        this.lineWidth = lineWidth;
        this.saveSettings();
    }

    setLineColor(lineColor) {
        this.lineColor = lineColor;
        this.saveSettings();
    }

    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.saveSettings();
        this.redrawCanvas();
    }

    setOpacity(opacity) {
        this.opacity = opacity;
        this.saveSettings();
    }

    setDrawMode(mode) {
        this.drawMode = mode;
        this.saveSettings();
    }

    setTurnRadius(radius) {
        this.turnRadius = radius;
        this.saveSettings();
    }

    setTurnDepth(depth) {
        this.turnDepth = depth;
        this.saveSettings();
    }

    drawLine(x1, y1, x2, y2) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const angleStep = (2 * Math.PI) / this.numSections;

        this.ctx.lineWidth = this.lineWidth;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.fillStyle = this.ctx.strokeStyle;

        for (let i = 0; i < this.numSections; i++) {
            const angle = i * angleStep;
            const rotatedStartX = Math.cos(angle) * (x1 - centerX) - Math.sin(angle) * (y1 - centerY) + centerX;
            const rotatedStartY = Math.sin(angle) * (x1 - centerX) + Math.cos(angle) * (y1 - centerY) + centerY;
            const rotatedX = Math.cos(angle) * (x2 - centerX) - Math.sin(angle) * (y2 - centerY) + centerX;
            const rotatedY = Math.sin(angle) * (x2 - centerX) + Math.cos(angle) * (y2 - centerY) + centerY;

            this.ctx.beginPath();
            this.ctx.moveTo(rotatedStartX, rotatedStartY);
            this.ctx.lineTo(rotatedX, rotatedY);
            this.ctx.stroke();
        }
    }

    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.history.length > 0) {
            this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
        }
    }

    saveSettings() {
        const settings = {
            numSections: this.numSections,
            lineWidth: this.lineWidth,
            lineColor: this.lineColor,
            backgroundColor: this.backgroundColor,
            opacity: this.opacity,
            turnRadius: this.turnRadius,
            turnDepth: this.turnDepth,
            drawMode: this.drawMode,
        };
        localStorage.setItem('mandalaSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('mandalaSettings'));
        if (settings) {
            this.numSections = settings.numSections;
            this.lineWidth = settings.lineWidth;
            this.lineColor = settings.lineColor;
            this.backgroundColor = settings.backgroundColor;
            this.opacity = settings.opacity;
            this.turnRadius = settings.turnRadius;
            this.turnDepth = settings.turnDepth;
            this.drawMode = settings.drawMode;
        }
    }

    resetSettings() {
        this.numSections = 4;
        this.lineWidth = 2;
        this.lineColor = '#000000';
        this.backgroundColor = '#ffffff';
        this.opacity = 1;
        this.turnRadius = 10;
        this.turnDepth = 20;
        this.drawMode = 'curls';
        this.saveSettings();
        this.redrawCanvas();
    }

    startAutoDraw() {
        if (this.isDrawing) return;
        this.isDrawing = true;
        this.autoDraw();
    }

    stopAutoDraw() {
        this.isDrawing = false;
        if (this.autoDrawInterval) {
            clearTimeout(this.autoDrawInterval);
            this.autoDrawInterval = null;
        }
    }

    autoDraw() {
        let x = Math.random() * this.canvas.width;
        let y = Math.random() * this.canvas.height;
        let angle = Math.random() * 2 * Math.PI;
        let depthCounter = 0;

        const drawCurls = () => {
            if (!this.isDrawing) return;

            const turnRadius = this.turnRadius / 10; // Adjust for smoother control
            const turnDepth = this.turnDepth * 10; // Adjust for longer depth
            const angleIncrement = (Math.random() - 0.5) * (Math.PI / turnRadius);

            angle += angleIncrement;
            const dx = Math.cos(angle) * 2;
            const dy = Math.sin(angle) * 2;
            const newX = x + dx;
            const newY = y + dy;

            depthCounter += 1;
            if (depthCounter > turnDepth) {
                depthCounter = 0;
                angle += Math.PI; // Change direction
            }

            if (newX < 0 || newX > this.canvas.width || newY < 0 || newY > this.canvas.height) {
                angle = Math.random() * 2 * Math.PI;
            } else {
                this.drawLine(x, y, newX, newY);
                x = newX;
                y = newY;
            }

            this.autoDrawInterval = setTimeout(drawCurls, 10); // Adjust speed here if needed
        };

        drawCurls();
    }
}

class ControlPanel {
    constructor(canvas) {
        this.canvas = canvas;
    }

    init() {
        this.initControls();
        this.canvas.loadSettings();
        this.applySettings();
    }

    initControls() {
        document.getElementById('sections').addEventListener('input', (e) => {
            this.canvas.setNumSections(parseInt(e.target.value));
        });

        document.getElementById('lineWidth').addEventListener('input', (e) => {
            this.canvas.setLineWidth(parseFloat(e.target.value));
        });

        document.getElementById('lineColor').addEventListener('input', (e) => {
            this.canvas.setLineColor(e.target.value);
        });

        document.getElementById('backgroundColor').addEventListener('input', (e) => {
            this.canvas.setBackgroundColor(e.target.value);
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            this.canvas.setOpacity(parseFloat(e.target.value));
        });

        document.getElementById('turnRadius').addEventListener('input', (e) => {
            this.canvas.setTurnRadius(parseInt(e.target.value));
        });

        document.getElementById('turnDepth').addEventListener('input', (e) => {
            this.canvas.setTurnDepth(parseInt(e.target.value));
        });

        document.querySelectorAll('input[name="drawMode"]').forEach((elem) => {
            elem.addEventListener('change', (e) => {
                this.canvas.setDrawMode(e.target.value);
            });
        });

        document.getElementById('startStop').addEventListener('click', () => {
            if (this.canvas.isDrawing) {
                this.canvas.stopAutoDraw();
            } else {
                this.canvas.startAutoDraw();
            }
        });

        document.getElementById('undo').addEventListener('click', () => {
            if (this.canvas.history.length > 0) {
                this.canvas.history.pop();
                if (this.canvas.history.length > 0) {
                    this.canvas.ctx.putImageData(this.canvas.history[this.canvas.history.length - 1], 0, 0);
                } else {
                    this.canvas.redrawCanvas();
                }
            }
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.canvas.resetSettings();
            this.applySettings();
        });
    }

    applySettings() {
        document.getElementById('sections').value = this.canvas.numSections;
        document.getElementById('lineWidth').value = this.canvas.lineWidth;
        document.getElementById('lineColor').value = this.canvas.lineColor;
        document.getElementById('backgroundColor').value = this.canvas.backgroundColor;
        document.getElementById('opacity').value = this.canvas.opacity;
        document.getElementById('turnRadius').value = this.canvas.turnRadius;
        document.getElementById('turnDepth').value = this.canvas.turnDepth;
        document.querySelector(`input[name="drawMode"][value="${this.canvas.drawMode}"]`).checked = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = new Canvas('mandalaCanvas', 4);
    const controlPanel = new ControlPanel(canvas);

    controlPanel.init();

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    canvas.canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });

    canvas.canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        canvas.drawLine(lastX, lastY, x, y);
        lastX = x;
        lastY = y;
    });

    canvas.canvas.addEventListener('mouseup', () => {
        isDrawing = false;
        canvas.history.push(canvas.ctx.getImageData(0, 0, canvas.canvas.width, canvas.canvas.height));
    });

    canvas.canvas.addEventListener('mouseout', () => {
        isDrawing = false;
    });
});
