import { DxfHandler} from "./dxf-handler";

let scaleFactor = 1;
const dxfHandler = new DxfHandler();

const drawButton = document.getElementById('drawButton');
const numEntities = document.getElementById('numberOfEntities');
const scaleUp = document.getElementById('scaleUpButton');
const scaleDown = document.getElementById('scaleDownButton');
const advanceButton = document.getElementById('advanceLayer');
const goBackButton = document.getElementById('goBackLayer');
const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// @todo: Add info on current scaling faktor and current layer name to UI


drawButton!.addEventListener('click', () => {
    fileInput!.click();
});

goBackButton!.addEventListener('click', () => {
    dxfHandler.moveToPrevLayer()
    updateCanvas();
});
advanceButton!.addEventListener('click', () => {
    dxfHandler.moveToNextLayer();
    updateCanvas();
    dxfHandler.extractObjects();
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
    updateCanvas();
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    const listRef = dxfHandler.currentLayer.lines; 
    const trans_x = -1 * dxfHandler.currentLayer.minPoint[0];
    const trans_y = -1 * dxfHandler.currentLayer.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;
    while(count < listRef.length) {
        // Draw the line
        x1 = listRef[count];
        y1 = listRef[count + 1];
        x2 = listRef[count + 2];
        y2 = listRef[count + 3];
        ctx.beginPath();
        ctx.moveTo((x1 + trans_x) * scaleFactor, (y1 + trans_y) * scaleFactor);
        ctx.lineTo((x2 + trans_x) * scaleFactor, (y2 + trans_y) * scaleFactor);
        ctx.stroke();
        count+=4;
    }
    numEntities!.innerText = (dxfHandler.currentLayer.lines.length / 4).toString();
}
