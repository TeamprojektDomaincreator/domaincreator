import { DxfHandler, Layer } from './dxf-handler';

let scaleFactor = 1;
let selectedLayers: number[] = [];

const dxfHandler = new DxfHandler();

const drawButton = document.getElementById('drawButton');
const numEntities = document.getElementById('numberOfEntities');
const scaleUp = document.getElementById('scaleUpButton');
const scaleDown = document.getElementById('scaleDownButton');
const fileInput = document.getElementById('fileInput');
const extractButton = document.getElementById('extract');
const mainCanvas = document.getElementById('myCanvas') as HTMLCanvasElement;

// @todo: Add info on current scaling faktor and current layer name to UI


drawButton!.addEventListener('click', () => {
    fileInput!.click();
});

extractButton!.addEventListener('click', () => {
    const mainCanvasCtx = mainCanvas.getContext('2d') as CanvasRenderingContext2D;
    const mergedLayer = dxfHandler.mergeLayers(selectedLayers);
    const lines = dxfHandler.extractObjects(selectedLayers);
    const trans_x = -1 * mergedLayer.minPoint[0];
    const trans_y = -1 * mergedLayer.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;

    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    mainCanvasCtx.lineWidth = 1;

    while (count < lines.length) {
        // Generate a random color
        const randomColor =
            'rgba(' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',1)';
        mainCanvasCtx.strokeStyle = randomColor;

        // Draw the line with black start and end points
        x1 = lines[count];
        y1 = lines[count + 1];
        x2 = lines[count + 2];
        y2 = lines[count + 3];

        mainCanvasCtx.beginPath();
        mainCanvasCtx.fillStyle = 'black'; // Set the fill color to black for drawing the points
        mainCanvasCtx.arc(
            (x1 + trans_x) * scaleFactor,
            (y1 + trans_y) * scaleFactor,
            3,
            0,
            2 * Math.PI
        ); // Draw the start point
        mainCanvasCtx.fill();

        mainCanvasCtx.beginPath();
        mainCanvasCtx.arc(
            (x2 + trans_x) * scaleFactor,
            (y2 + trans_y) * scaleFactor,
            3,
            0,
            2 * Math.PI
        ); // Draw the end point
        mainCanvasCtx.fill();

        mainCanvasCtx.beginPath();
        mainCanvasCtx.moveTo((x1 + trans_x) * scaleFactor, (y1 + trans_y) * scaleFactor);
        mainCanvasCtx.lineTo((x2 + trans_x) * scaleFactor, (y2 + trans_y) * scaleFactor);
        mainCanvasCtx.stroke();

        count += 4;
    }
});

scaleUp!.addEventListener('click', () => {
    scaleFactor *= 2;
    updateCanvas();
});

scaleDown!.addEventListener('click', () => {
    scaleFactor /= 2;
    updateCanvas();
});

fileInput!.addEventListener('change', handleFileSelect);

async function handleFileSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    await dxfHandler.loadDxf(file);
    resetState();
    renderLayerSelection(dxfHandler.layers);
    updateCanvas();
}

function resetState() {
    scaleFactor = 1;
    selectedLayers = [];
}

function renderLayerSelection(layers: Layer[]) {
    // reset the layer selection
    var parentDiv = document.querySelector('#layer-col');
    parentDiv!.innerHTML = '';

    layers.forEach((layer, index) => {
        _addLayerTileToUI(layer, index);
        const canvas = document.querySelector(`#layer-canvas${index}`);
        if (canvas) {
            renderLayer(layer, canvas as HTMLCanvasElement);
        }
    });
}

function _addLayerTileToUI(layer: Layer, layerId: number) {
    function handleLayerSelected(isSelected: boolean) {
        if (isSelected) {
            myCheckbox.checked = true;
            selectedLayers.push(layerId);
            layerCanvas.classList.add('selected');
        } else {
            myCheckbox.checked = false;
            selectedLayers = selectedLayers.filter((id) => id !== layerId);
            layerCanvas.classList.remove('selected');
        }
    }

    var parentDiv = document.querySelector('#layer-col');

    let layerTile = document.createElement('div');
    layerTile.setAttribute('class', 'layer-tile');
    layerTile.setAttribute('id', `layer-tile${layerId}`);

    let layerName = document.createElement('div');
    layerName.textContent = layer.name;
    layerName.setAttribute('id', 'layerName');

    let flexRow = document.createElement('div');
    flexRow.setAttribute('class', 'flex-row');
    flexRow.setAttribute('style', `gap: 1px;`);

    let layerCanvas = document.createElement('canvas');
    layerCanvas.setAttribute('id', `layer-canvas${layerId}`);
    layerCanvas.setAttribute('width', '200');
    layerCanvas.setAttribute('height', '120');

    layerCanvas.addEventListener('click', function () {
        const isSelected = selectedLayers.includes(layerId);
        handleLayerSelected(!isSelected);
        updateCanvas();
    });

    let myCheckbox = document.createElement('input');
    myCheckbox.setAttribute('type', 'checkbox');
    myCheckbox.setAttribute('id', 'myCheckbox');
    myCheckbox.checked = selectedLayers.includes(layerId) ? true : false;
    myCheckbox.addEventListener('change', function () {
        handleLayerSelected(myCheckbox.checked);
        updateCanvas();
    });

    flexRow.appendChild(layerCanvas);
    flexRow.appendChild(myCheckbox);
    layerTile.appendChild(layerName);
    layerTile.appendChild(flexRow);
    document.body.appendChild(layerTile);
    parentDiv?.appendChild(layerTile);
}

function renderLayer(layer: Layer, canvas: HTMLCanvasElement, scaleFactor = 1) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    const listRef = layer.lines;
    const trans_x = -1 * layer.minPoint[0];
    const trans_y = -1 * layer.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;

    // Calculate the scale factors for the x and y dimensions
    let scaleX = canvas.width / layer.maxPoint[0];
    let scaleY = canvas.height / layer.maxPoint[1];

    // Use the smaller scale factor to avoid stretching
    let scale = Math.min(scaleX, scaleY);

    while (count < listRef.length) {
        // Draw the line
        x1 = listRef[count];
        y1 = listRef[count + 1];
        x2 = listRef[count + 2];
        y2 = listRef[count + 3];
        ctx.beginPath();
        ctx.moveTo((x1 + trans_x) * scale * scaleFactor, (y1 + trans_y) * scale * scaleFactor);
        ctx.lineTo((x2 + trans_x) * scale * scaleFactor, (y2 + trans_y) * scale * scaleFactor);
        ctx.stroke();
        count+=4;
    }
}

function updateCanvas() {
    var mergedLayer = dxfHandler.mergeLayers(selectedLayers);
    renderLayer(mergedLayer, mainCanvas, scaleFactor);
    numEntities!.innerText = (mergedLayer.lines.length / 4).toString();
}
