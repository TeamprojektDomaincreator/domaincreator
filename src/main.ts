import {DxfHandler, Layer, MergedLayer} from './dxf-handler';

type RenderSettings = {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    minPoint: Float32Array;
    maxPoint: Float32Array;
    scaleFactor: number;
};

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
    const connectedGraph = dxfHandler.extractObjects(selectedLayers);

    mainCanvasCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    mainCanvasCtx.lineWidth = 1;

    const settings: RenderSettings = {
        ctx: mainCanvasCtx,
        width: mainCanvas.width,
        height: mainCanvas.height,
        minPoint: mergedLayer.minPoint,
        maxPoint: mergedLayer.maxPoint,
        scaleFactor: scaleFactor,
    };

    connectedGraph.forEach((lines) => {
        const randomColor =
            'rgba(' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',1)';
        mainCanvasCtx.strokeStyle = randomColor;
        renderLines(lines, settings);
    });
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
            const c = canvas as HTMLCanvasElement;
            const settings: RenderSettings = {
                ctx: c.getContext('2d') as CanvasRenderingContext2D,
                width: c.width,
                height: c.height,
                minPoint: layer.minPoint,
                maxPoint: layer.maxPoint,
                scaleFactor: -1,
            };
            renderLines(
                layer.lines,
                settings,
            );
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

function renderLines(
    lines: number[],
    settings: RenderSettings
) {

    settings.ctx.lineWidth = 1;
    const trans_x = -1 * settings.minPoint[0];
    const trans_y = -1 * settings.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;

    // Calculate the scale factors for the x and y dimensions
    const scaleX = Math.abs(settings.width / (settings.maxPoint[0] + trans_x));
    const scaleY = Math.abs(settings.height / (settings.maxPoint[1] + trans_y));

    // Use the smaller scale factor to avoid stretching
    const scale = settings.scaleFactor === -1 ? Math.min(scaleX, scaleY) : settings.scaleFactor;

    while (count < lines.length) {
        // Draw the line
        x1 = lines[count];
        y1 = lines[count + 1];
        x2 = lines[count + 2];
        y2 = lines[count + 3];
        settings.ctx.beginPath();
        settings.ctx.moveTo(
            (x1 + trans_x) * scale,
            (y1 + trans_y) * scale
        );
        settings.ctx.lineTo(
            (x2 + trans_x) * scale,
            (y2 + trans_y) * scale
        );
        settings.ctx.stroke();
        count += 4;
    }
}

function updateCanvas() {
    const ctx = mainCanvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    const mergedLayer = dxfHandler.mergeLayers(selectedLayers);
    const settings: RenderSettings = {
        ctx: ctx,
        width: mainCanvas.width,
        height: mainCanvas.height,
        minPoint: mergedLayer.minPoint,
        maxPoint: mergedLayer.maxPoint,
        scaleFactor: scaleFactor,
    };
    mergedLayer.lines.forEach((lines) => {
        ctx.strokeStyle = 'black';
        renderLines(
            lines, settings
        );
    });
    numEntities!.innerText = mergedLayer.lineCount.toString();
}
