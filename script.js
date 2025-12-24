document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        gridSize: 3,
        data: Array(16).fill(0), // Max 4x4
        bgImage: null, // Data URL
        bgImageAspect: 1,
        colors: ['#ffffff', '#0000ff'], // Array of colors
        opacity: 0.5,
        text: { color: '#000000', size: 24, stroke: false },
        labels: {
            x: Array(4).fill(''),
            y: Array(4).fill('')
        }
    };

    // DOM Elements
    const elements = {
        sizeBtns: document.querySelectorAll('.size-btn'),
        bgUpload: document.getElementById('bg-upload'),
        colorList: document.getElementById('color-list'),
        opacitySlider: document.getElementById('opacity-slider'),
        fontColor: document.getElementById('font-color'),
        fontSize: document.getElementById('font-size'),
        textStroke: document.getElementById('text-stroke'),
        bgColor: document.getElementById('bg-color'),
        transparentBg: document.getElementById('transparent-bg'),
        downloadBtn: document.getElementById('download-btn'),
        matrixContainer: document.getElementById('matrix-container'),
        matrixGrid: document.getElementById('matrix-grid'),
        accuracyValue: document.getElementById('accuracy-value'),
        colorScale: document.getElementById('color-scale'),
        scaleMax: document.getElementById('scale-max'),
        scaleMin: document.getElementById('scale-min')
    };

    // Constants
    const CELL_SIZE = 100;
    const GAP_SIZE = 5;

    // Initialization
    function init() {
        bindEvents();
        renderColorPickers();
        renderGrid();
        updateScale(); // Init scale
        updateMatrixBackground(); // Init background
    }

    function bindEvents() {
        elements.sizeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                elements.sizeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update grid size
                state.gridSize = parseInt(e.target.dataset.size);
                renderGrid();
                updateHeatmap();
                updateStats();
            });
        });

        elements.bgUpload.addEventListener('change', handleImageUpload);

        // Add color button logic is now handled inside renderColorPickers

        elements.opacitySlider.addEventListener('input', (e) => {
            state.opacity = parseInt(e.target.value) / 100;
            updateHeatmap();
        });

        elements.fontColor.addEventListener('input', (e) => {
            state.text.color = e.target.value;
            updateTextStyle();
        });

        elements.fontSize.addEventListener('input', (e) => {
            state.text.size = parseInt(e.target.value);
            updateTextStyle();
        });

        elements.bgColor.addEventListener('input', () => {
            updateMatrixBackground();
        });

        elements.transparentBg.addEventListener('change', () => {
            updateMatrixBackground();
        });

        elements.textStroke.addEventListener('change', (e) => {
            state.text.stroke = e.target.checked;
            updateTextStyle();
        });

        elements.downloadBtn.addEventListener('click', downloadImage);
    }

    function renderColorPickers() {
        elements.colorList.innerHTML = '';
        
        // Render existing colors
        state.colors.forEach((color, index) => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = color;
            input.className = 'color-circle';
            input.addEventListener('input', (e) => {
                state.colors[index] = e.target.value;
                updateHeatmap();
                updateScale();
            });
            elements.colorList.appendChild(input);
        });

        // Render Add Button if < 3 colors
        if (state.colors.length < 3) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-color-circle';
            addBtn.innerHTML = '+';
            addBtn.title = 'Add Color';
            addBtn.addEventListener('click', () => {
                const lastColor = state.colors[state.colors.length - 1];
                state.colors.push(lastColor); // Duplicate last color for smooth transition
                renderColorPickers();
                updateHeatmap();
                updateScale();
            });
            elements.colorList.appendChild(addBtn);
        }
    }

    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                state.bgImage = event.target.result;
                state.bgImageAspect = img.width / img.height;
                updateCellBackgrounds();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderGrid() {
        const size = state.gridSize;
        const grid = elements.matrixGrid;
        grid.innerHTML = '';

        // Set grid template
        // Cols: Main Y | Indiv Y | Cells... | Scale
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `auto auto ` + `repeat(${size}, ${CELL_SIZE}px) auto`;
        // Rows: Cells... | Indiv X | Main X
        grid.style.gridTemplateRows = `repeat(${size}, ${CELL_SIZE}px) auto auto`;
        grid.style.gap = `${GAP_SIZE}px`;

        // 1. Main Y Label (Spans all rows)
        const mainY = createDiv('axis-label y-axis');
        mainY.textContent = 'True Class';
        mainY.style.gridColumn = '1';
        mainY.style.gridRow = `1 / span ${size}`;
        // Force vertical writing mode via inline style to ensure it applies
        mainY.style.writingMode = 'vertical-rl';
        mainY.style.transform = 'rotate(180deg)';
        grid.appendChild(mainY);

        // 2. Rows (Indiv Y + Cells)
        for (let i = 0; i < size; i++) {
            // Indiv Y Label
            const label = createLabelInput(i, 'y');
            label.style.gridColumn = '2';
            label.style.gridRow = `${i + 1}`;
            // Tab Index: After all cells (size*size) + i + 1
            label.querySelector('input').tabIndex = (size * size) + i + 1;
            grid.appendChild(label);

            // Cells
            for (let j = 0; j < size; j++) {
                const dataIndex = i * 4 + j;
                const cell = createCell(dataIndex);
                cell.style.gridColumn = `${j + 3}`;
                cell.style.gridRow = `${i + 1}`;
                // Tab Index: (i * size) + j + 1
                cell.querySelector('input').tabIndex = (i * size) + j + 1;
                grid.appendChild(cell);
            }
        }

        // 3. Scale Bar (Spans all cell rows)
        const scaleContainer = createDiv('scale-container');
        scaleContainer.innerHTML = `
            <div id="scale-max" class="scale-label">0</div>
            <div id="color-scale" class="color-scale"></div>
            <div id="scale-min" class="scale-label">0</div>
        `;
        scaleContainer.style.gridColumn = `${size + 3}`;
        scaleContainer.style.gridRow = `1 / span ${size}`;
        grid.appendChild(scaleContainer);

        // 4. Indiv X Labels
        for (let i = 0; i < size; i++) {
            const label = createLabelInput(i, 'x');
            label.style.gridColumn = `${i + 3}`;
            label.style.gridRow = `${size + 1}`;
            // Tab Index: After Y labels. (size*size) + size + i + 1
            label.querySelector('input').tabIndex = (size * size) + size + i + 1;
            grid.appendChild(label);
        }

        // 5. Main X Label (Spans all cols of cells)
        const mainX = createDiv('axis-label x-axis');
        mainX.textContent = 'Predicted Class';
        mainX.style.gridColumn = `3 / span ${size}`;
        mainX.style.gridRow = `${size + 2}`;
        grid.appendChild(mainX);

        // Update DOM references for scale
        elements.scaleMax = document.getElementById('scale-max');
        elements.scaleMin = document.getElementById('scale-min');
        elements.colorScale = document.getElementById('color-scale');

        updateCellBackgrounds();
        updateHeatmap();
        updateTextStyle();
        updateStats();
        updateScale();
    }

    function createDiv(className) {
        const div = document.createElement('div');
        if (className) div.className = className;
        return div;
    }

    function createLabelInput(index, axis) {
        const container = createDiv(`grid-label ${axis}-axis-label`);
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Label ${index + 1}`;
        input.value = state.labels[axis][index] || '';
        input.addEventListener('input', (e) => {
            state.labels[axis][index] = e.target.value;
        });
        container.appendChild(input);
        return container;
    }

    function createCell(dataIndex) {
        const cell = createDiv('matrix-cell');
        
        // Layer 1: BG
        const bg = createDiv('cell-bg');
        cell.appendChild(bg);

        // Layer 2: Heatmap
        const heatmap = createDiv('cell-heatmap');
        cell.appendChild(heatmap);

        // Layer 3: Input
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'cell-input';
        input.value = state.data[dataIndex];
        input.dataset.index = dataIndex;
        
        // Auto-select content on focus
        input.addEventListener('focus', (e) => e.target.select());

        input.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) || 0;
            state.data[dataIndex] = val;
            updateHeatmap();
            updateStats();
        });

        cell.appendChild(input);
        return cell;
    }

    function updateCellBackgrounds() {
        if (!state.bgImage) return;

        const size = state.gridSize;
        const cells = document.querySelectorAll('.cell-bg');
        
        // Calculate total grid dimensions (excluding headers)
        const totalW = size * CELL_SIZE + (size - 1) * GAP_SIZE;
        const totalH = size * CELL_SIZE + (size - 1) * GAP_SIZE;
        const gridAspect = totalW / totalH;

        let bgW, bgH, offX, offY;

        // Fit logic: Cover (Preserve aspect ratio, fill grid)
        if (state.bgImageAspect > gridAspect) {
            // Image is wider than grid -> Match Height
            bgH = totalH;
            bgW = totalH * state.bgImageAspect;
            offY = 0;
            offX = (totalW - bgW) / 2;
        } else {
            // Image is taller than grid -> Match Width
            bgW = totalW;
            bgH = totalW / state.bgImageAspect;
            offX = 0;
            offY = (totalH - bgH) / 2;
        }

        cells.forEach(bgDiv => {
            const cell = bgDiv.parentElement;
            // Find position of cell in the grid (excluding headers)
            // The grid has (size+1) columns.
            // We can calculate index based on DOM order or just use the loop in render.
            // But here we are selecting all.
            // Let's rely on the input's data-index to find row/col.
            const input = cell.querySelector('input');
            const dataIndex = parseInt(input.dataset.index);
            const row = Math.floor(dataIndex / 4);
            const col = dataIndex % 4;

            // Calculate cell position relative to the grid top-left
            const cellX = col * (CELL_SIZE + GAP_SIZE);
            const cellY = row * (CELL_SIZE + GAP_SIZE);

            bgDiv.style.backgroundImage = `url(${state.bgImage})`;
            bgDiv.style.backgroundSize = `${bgW}px ${bgH}px`;
            bgDiv.style.backgroundPosition = `${offX - cellX}px ${offY - cellY}px`;
        });
    }

    function updateHeatmap() {
        const inputs = document.querySelectorAll('.cell-input');
        let max = -Infinity;
        let min = Infinity;
        
        // Find global min/max
        const size = state.gridSize;
        for(let i=0; i<size; i++) {
            for(let j=0; j<size; j++) {
                const val = state.data[i*4+j];
                if (val > max) max = val;
                if (val < min) min = val;
            }
        }

        // Handle edge cases
        if (min === Infinity) { min = 0; max = 0; }
        if (min === max) { max = min + 1; } // Avoid divide by zero range

        inputs.forEach(input => {
            const val = parseInt(input.value) || 0;
            // Normalize to 0..1
            const intensity = (val - min) / (max - min);
            const color = interpolateMultiColor(state.colors, intensity);
            
            const heatmapDiv = input.parentElement.querySelector('.cell-heatmap');
            heatmapDiv.style.backgroundColor = color;
            heatmapDiv.style.opacity = state.opacity;
        });
        
        // Update scale labels
        if (elements.scaleMax) elements.scaleMax.textContent = max;
        if (elements.scaleMin) elements.scaleMin.textContent = min;
    }

    function updateTextStyle() {
        const inputs = document.querySelectorAll('.cell-input');
        inputs.forEach(input => {
            input.style.color = state.text.color;
            input.style.fontSize = `${state.text.size}px`;
            if (state.text.stroke) {
                input.classList.add('text-stroke');
            } else {
                input.classList.remove('text-stroke');
            }
        });
    }

    function updateMatrixBackground() {
        const container = elements.matrixContainer;
        if (elements.transparentBg.checked) {
            container.style.backgroundColor = 'transparent';
        } else {
            container.style.backgroundColor = elements.bgColor.value;
        }
    }

    function updateStats() {
        const size = state.gridSize;
        let total = 0;
        let diagonal = 0;

        for(let i=0; i<size; i++) {
            for(let j=0; j<size; j++) {
                const val = state.data[i*4+j];
                total += val;
                if (i === j) diagonal += val;
            }
        }

        const accuracy = total === 0 ? 0 : (diagonal / total * 100);
        elements.accuracyValue.textContent = `${accuracy.toFixed(1)}%`;
    }

    function updateScale() {
        if (elements.colorScale) {
            const gradient = state.colors.join(', ');
            elements.colorScale.style.background = `linear-gradient(to top, ${gradient})`;
        }
    }

    function interpolateMultiColor(colors, factor) {
        if (colors.length < 2) return colors[0] || '#ffffff';
        
        // Map factor (0..1) to segments
        // e.g. 3 colors -> 2 segments (0-0.5, 0.5-1)
        const segments = colors.length - 1;
        const segmentLength = 1 / segments;
        
        // Find which segment we are in
        let index = Math.floor(factor / segmentLength);
        if (index >= segments) index = segments - 1; // Clamp to last segment
        
        // Local factor within that segment
        const localFactor = (factor - (index * segmentLength)) / segmentLength;
        
        return interpolateColor(colors[index], colors[index+1], localFactor);
    }

    function interpolateColor(color1, color2, factor) {
        if (arguments.length < 3) { 
            factor = 0.5; 
        }
        var result = color1.slice();
        var r1 = parseInt(color1.substring(1, 3), 16);
        var g1 = parseInt(color1.substring(3, 5), 16);
        var b1 = parseInt(color1.substring(5, 7), 16);

        var r2 = parseInt(color2.substring(1, 3), 16);
        var g2 = parseInt(color2.substring(3, 5), 16);
        var b2 = parseInt(color2.substring(5, 7), 16);

        var r = Math.round(r1 + factor * (r2 - r1));
        var g = Math.round(g1 + factor * (g2 - g1));
        var b = Math.round(b1 + factor * (b2 - b1));

        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function downloadImage() {
        const node = document.getElementById('matrix-container');
        
        // Check if library is loaded
        if (typeof htmlToImage === 'undefined' || !htmlToImage || !htmlToImage.toPng) {
            console.error('htmlToImage library not found:', typeof htmlToImage);
            alert('Image generation library not loaded.');
            return;
        }

        const options = {
            pixelRatio: 2,
            quality: 1.0
        };

        // Add background color if not transparent
        if (!elements.transparentBg.checked) {
            options.backgroundColor = elements.bgColor.value;
        }

        htmlToImage.toPng(node, options)
            .then(function (dataUrl) {
                const link = document.createElement('a');
                link.download = 'matrix-forge.png';
                link.href = dataUrl;
                link.click();
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                alert('Failed to generate image.');
            });
    }

    // Run
    init();
});
