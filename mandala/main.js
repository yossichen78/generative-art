class Canvas {
    constructor(canvasId, numSections) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.numSections = numSections;
        this.lineWidth = 2;
        this.lineColor = '#000000';
        this.fill = false;
        this.changeColor = false;
        this.color1 = '#ff0000';
        this.color2 = '#0000ff';
        this.colorSpeed = 10;
        this.opacity = 1;
        this.history = [];
        this.t = 0;
        this.drawShape = 'none';
    }

    setNumSections(numSections) {
        this.numSections = numSections;
        this.redrawCanvas();
    }

    setLineWidth(lineWidth) {
        this.lineWidth = lineWidth;
    }

    setLineColor(lineColor) {
        this.lineColor = lineColor;
    }

    setFill(fill) {
        this.fill = fill;
    }

    setChangeColor(changeColor) {
        this.changeColor = changeColor;
    }

    setColor1(color1) {
        this.color1 = color1;
    }

    setColor2(color2) {
        this.color2 = color2;
    }

    setColorSpeed(colorSpeed) {
        this.colorSpeed = colorSpeed;
    }

    setOpacity(opacity) {
        this.opacity = opacity;
    }

    setDrawShape(drawShape) {
        this.drawShape = drawShape;
    }

    drawLine(x1, y1, x2, y2) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const angleStep = (2 * Math.PI) / this.numSections;

        this.ctx.lineWidth = this.lineWidth;
        this.ctx.globalAlpha = this.opacity;

        if (this.changeColor) {
            this.ctx.strokeStyle = this.getColorTransition(this.color1, this.color2, this.t / this.colorSpeed);
            this.t = (this.t + 1) % (this.colorSpeed * 2);
        } else {
            this.ctx.strokeStyle = this.lineColor;
        }
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

            if (this.fill) {
                this.ctx.lineTo(centerX, centerY);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
    }

    redrawCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.history.length > 0) {
            this.ctx.putImageData(this.history[this.history.length - 1], 0, 0);
        }
    }

    getColorTransition(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = (bigint & 255);
        return { r, g, b };
    }
}

class ControlPanel {
    constructor(canvas) {
        this.canvas = canvas;
    }

    init() {
        this.initControls();
    }

    initControls() {
        const sectionsElem = document.getElementById('sections');
        if (sectionsElem) {
            sectionsElem.addEventListener('input', (e) => {
                this.canvas.setNumSections(parseInt(e.target.value));
            });
        }

        const lineWidthElem = document.getElementById('lineWidth');
        if (lineWidthElem) {
            lineWidthElem.addEventListener('input', (e) => {
                this.canvas.setLineWidth(parseFloat(e.target.value));
            });
        }

        const lineColorElem = document.getElementById('lineColor');
        if (lineColorElem) {
            lineColorElem.addEventListener('input', (e) => {
                this.canvas.setLineColor(e.target.value);
            });
        }

        const fillElem = document.getElementById('fill');
        if (fillElem) {
            fillElem.addEventListener('change', (e) => {
                this.canvas.setFill(e.target.checked);
            });
        }

        const changeColorElem = document.getElementById('changeColor');
        if (changeColorElem) {
            changeColorElem.addEventListener('change', (e) => {
                this.canvas.setChangeColor(e.target.checked);
            });
        }

        const color1Elem = document.getElementById('color1');
        if (color1Elem) {
            color1Elem.addEventListener('input', (e) => {
                this.canvas.setColor1(e.target.value);
            });
        }

        const color2Elem = document.getElementById('color2');
        if (color2Elem) {
            color2Elem.addEventListener('input', (e) => {
                this.canvas.setColor2(e.target.value);
            });
        }

        const colorSpeedElem = document.getElementById('colorSpeed');
        if (colorSpeedElem) {
            colorSpeedElem.addEventListener('input', (e) => {
                this.canvas.setColorSpeed(parseInt(e.target.value));
            });
        }

        const opacityElem = document.getElementById('opacity');
        if (opacityElem) {
            opacityElem.addEventListener('input', (e) => {
                this.canvas.setOpacity(parseFloat(e.target.value));
            });
        }

        document.querySelectorAll('input[name="drawMode"]').forEach((elem) => {
            elem.addEventListener('change', (e) => {
                this.canvas.setDrawShape(e.target.value);
                document.querySelectorAll('.submenu').forEach((submenu) => {
                    submenu.style.display = 'none';
                });
                document.querySelector(`.${e.target.value}Settings`).style.display = 'block';
            });
        });

        document.querySelectorAll('.toggle-submenu').forEach(button => {
            button.addEventListener('click', (e) => {
                const submenu = e.target.parentElement.nextElementSibling;
                if (submenu) {
                    submenu.style.display = submenu.style.display === 'none' ? 'flex' : 'none';
                }
            });
        });
    }
}

class Randomizer {
    constructor(canvas, controlPanel) {
        this.canvas = canvas;
        this.controlPanel = controlPanel;
    }

    init() {
        document.getElementById('chooseRandom').addEventListener('click', this.chooseRandom.bind(this));
        document.getElementById('setRandom').addEventListener('click', this.randomizeAllSelected.bind(this));
        document.getElementById('clearRandom').addEventListener('click', this.clearRandom.bind(this));
    }

    chooseRandom() {
        document.querySelectorAll('.submenu input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = Math.random() < 0.5;
            const id = checkbox.id.replace('check', '');
            const label = document.getElementById(`${id.toLowerCase()}Asterisk`);
            if (label) {
                label.textContent = checkbox.checked ? '*' : '';
            }
        });
    }

    randomizeAllSelected() {
        if (document.getElementById('checkLineWidth').checked) {
            this.randomizeLineWidth();
        }
        if (document.getElementById('checkLineColor').checked) {
            this.randomizeLineColor();
        }
        if (document.getElementById('checkFill').checked) {
            this.randomizeFill();
        }
        if (document.getElementById('checkChangeColor').checked) {
            this.randomizeChangeColor();
        }
        if (document.getElementById('checkColor1').checked) {
            this.randomizeColor1();
        }
        if (document.getElementById('checkColor2').checked) {
            this.randomizeColor2();
        }
        if (document.getElementById('checkOpacity').checked) {
            this.randomizeOpacity();
        }
    }

    clearRandom() {
        document.querySelectorAll('.submenu input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
            const id = checkbox.id.replace('check', '');
            const label = document.getElementById(`${id.toLowerCase()}Asterisk`);
            if (label) {
                label.textContent = '';
            }
        });
    }

    randomizeLineWidth() {
        const min = parseInt(document.getElementById('lineWidthMin').value);
        const max = parseInt(document.getElementById('lineWidthMax').value);
        document.getElementById('lineWidth').value = this.getRandomInt(min, max);
        this.canvas.setLineWidth(parseFloat(document.getElementById('lineWidth').value));
    }

    randomizeLineColor() {
        document.getElementById('lineColor').value = this.getRandomColor();
        this.canvas.setLineColor(document.getElementById('lineColor').value);
    }

    randomizeFill() {
        document.getElementById('fill').checked = Math.random() < 0.5;
        this.canvas.setFill(document.getElementById('fill').checked);
    }

    randomizeChangeColor() {
        document.getElementById('changeColor').checked = Math.random() < 0.5;
        this.canvas.setChangeColor(document.getElementById('changeColor').checked);
    }

    randomizeColor1() {
        document.getElementById('color1').value = this.getRandomColor();
        this.canvas.setColor1(document.getElementById('color1').value);
    }

    randomizeColor2() {
        document.getElementById('color2').value = this.getRandomColor();
        this.canvas.setColor2(document.getElementById('color2').value);
    }

    randomizeOpacity() {
        const min = parseFloat(document.getElementById('opacityMin').value);
        const max = parseFloat(document.getElementById('opacityMax').value);
        document.getElementById('opacity').value = (Math.random() * (max - min) + min).toFixed(2);
        this.canvas.setOpacity(parseFloat(document.getElementById('opacity').value));
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}

class AutoDrawer {
    constructor(canvas) {
        this.canvas = canvas;
        this.isDrawing = false;
        this.autoDrawSpeed = 100;
        this.autoDrawInterval = null;
        this.autoDrawMode = 'manual';
        this.x = this.canvas.canvas.width / 2;
        this.y = this.canvas.canvas.height / 2;
        this.changeInterval = 5000;
        this.lastChangeTime = 0;
        this.drawMode = 'straightLines';
        this.isUserDrawing = false;
        this.angle = Math.random() * 2 * Math.PI;
        this.radius = 10; // Starting radius for smooth curves
    }

    init() {
        document.getElementById('start').addEventListener('click', this.start.bind(this));
        document.getElementById('stop').addEventListener('click', this.stop.bind(this));
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.autoDrawSpeed = parseInt(e.target.value);
            document.getElementById('speedNumber').value = this.autoDrawSpeed;
        });
        document.getElementById('speedNumber').addEventListener('input', (e) => {
            this.autoDrawSpeed = parseInt(e.target.value);
            document.getElementById('speedControl').value = this.autoDrawSpeed;
        });
        document.querySelectorAll('input[name="autoDrawMode"]').forEach((elem) => {
            elem.addEventListener('change', (e) => {
                this.autoDrawMode = e.target.value;
            });
        });
        document.querySelectorAll('input[name="drawMode"]').forEach((elem) => {
            elem.addEventListener('change', (e) => {
                this.drawMode = e.target.value;
            });
        });
    }

    start() {
        if (this.isDrawing) return;
        this.isDrawing = true;
        this.autoDraw();
    }

    stop() {
        this.isDrawing = false;
        clearInterval(this.autoDrawInterval);
    }

    autoDraw() {
        if (!this.isDrawing || this.isUserDrawing) return;

        let dx = 0;
        let dy = 0;

        if (this.drawMode === 'curvedTurns') {
            const turnRadius = parseFloat(document.getElementById('turnRadius').value);
            this.angle += (Math.random() - 0.5) * 0.2; // Smooth angle change
            dx = Math.cos(this.angle) * turnRadius;
            dy = Math.sin(this.angle) * turnRadius;
        }

        const newX = this.x + dx;
        const newY = this.y + dy;

        if (newX >= 0 && newX <= this.canvas.canvas.width && newY >= 0 && newY <= this.canvas.canvas.height) {
            this.canvas.drawLine(this.x, this.y, newX, newY);
            this.x = newX;
            this.y = newY;
        }

        setTimeout(() => this.autoDraw(), this.getAutoDrawInterval());
    }

    getAutoDrawInterval() {
        const minSpeed = 1000 / 10; // 10 mm per second
        const maxSpeed = 1000; // 1 mm per second
        return minSpeed + (maxSpeed - minSpeed) * (this.autoDrawSpeed / 100);
    }

    handleAutoDrawMode() {
        switch (this.autoDrawMode) {
            case 'organizedRandom':
                this.setRandomParams();
                break;
            case 'totalChaos':
                this.setRandomParams();
                this.randomizeDrawingSpeed();
                break;
            case 'oneAtATime':
                this.setRandomParams(true);
                break;
            default:
                break;
        }
    }

    setRandomParams(singleChange = false) {
        const params = ['lineWidth', 'lineColor', 'fill', 'changeColor', 'color1', 'color2', 'opacity'];
        if (singleChange) {
            const paramToChange = params[Math.floor(Math.random() * params.length)];
            this.randomizeParam(paramToChange);
        } else {
            params.forEach((param) => {
                this.randomizeParam(param);
            });
        }
    }

    randomizeParam(param) {
        switch (param) {
            case 'lineWidth':
                this.randomizeLineWidth();
                break;
            case 'lineColor':
                this.randomizeLineColor();
                break;
            case 'fill':
                this.randomizeFill();
                break;
            case 'changeColor':
                this.randomizeChangeColor();
                break;
            case 'color1':
                this.randomizeColor1();
                break;
            case 'color2':
                this.randomizeColor2();
                break;
            case 'opacity':
                this.randomizeOpacity();
                break;
            default:
                break;
        }
    }

    randomizeDrawingSpeed() {
        this.autoDrawSpeed = Math.floor(Math.random() * (50000 - 0)) + 0;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = new Canvas('mandalaCanvas', 4);
    const controlPanel = new ControlPanel(canvas);
    const randomizer = new Randomizer(canvas, controlPanel);
    const autoDrawer = new AutoDrawer(canvas);

    controlPanel.init();
    randomizer.init();
    autoDrawer.init();

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    canvas.canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        autoDrawer.isUserDrawing = true;
        const rect = canvas.canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
        autoDrawer.x = lastX;
        autoDrawer.y = lastY;
        autoDrawer.stop();
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
        autoDrawer.isUserDrawing = false;
        if (autoDrawer.isDrawing) {
            autoDrawer.start();
        }
    });

    canvas.canvas.addEventListener('mouseout', () => {
        isDrawing = false;
        autoDrawer.isUserDrawing = false;
        if (autoDrawer.isDrawing) {
            autoDrawer.start();
        }
    });

    document.getElementById('undo').addEventListener('click', () => {
        if (canvas.history.length > 0) {
            canvas.history.pop();
            if (canvas.history.length > 0) {
                canvas.ctx.putImageData(canvas.history[canvas.history.length - 1], 0, 0);
            } else {
                canvas.redrawCanvas();
            }
        }
    });
});
