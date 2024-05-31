import {DxfHandler} from './dxf-handler';

let scaleFactor = 2;
const dxfHandler = new DxfHandler();

const drawButton = document.getElementById('drawButton');
const numEntities = document.getElementById('numberOfEntities');
const scaleUp = document.getElementById('scaleUpButton');
const scaleDown = document.getElementById('scaleDownButton');
const advanceButton = document.getElementById('advanceLayer');
const goBackButton = document.getElementById('goBackLayer');
const fileInput = document.getElementById('fileInput');
const extractButton = document.getElementById('extract');
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// @todo: Add info on current scaling faktor and current layer name to UI

drawButton!.addEventListener('click', () => {
    fileInput!.click();
});

goBackButton!.addEventListener('click', () => {
    dxfHandler.moveToPrevLayer();
    updateCanvas();
});
advanceButton!.addEventListener('click', () => {
    dxfHandler.moveToNextLayer();
    updateCanvas();
});
extractButton!.addEventListener('click', () => {
    const graphs = dxfHandler.extractObjects2();
    console.log("graph has: " +graphs.length)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    const trans_x = -1 * dxfHandler.currentLayer.minPoint[0];
    const trans_y = -1 * dxfHandler.currentLayer.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;
    while (count < graphs.length) {
        // Generate a random color
        const randomColor =
            'rgba(' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',' +
            Math.floor(Math.random() * 256) +
            ',1)';
        ctx.strokeStyle = randomColor;

        let count2 = 0;
        while (count2 < graphs[count].length) {
            // Draw the line with black start and end points
            x1 = graphs[count][count2];
            y1 = graphs[count][count2+1];
            x2 = graphs[count][count2+2];
            y2 = graphs[count][count2+3];

            ctx.beginPath();
            ctx.fillStyle = 'black'; // Set the fill color to black for drawing the points
            ctx.arc(
                (x1 + trans_x) * scaleFactor,
                (y1 + trans_y) * scaleFactor,
                3,
                0,
                2 * Math.PI
            ); // Draw the start point
            ctx.fill();

            ctx.beginPath();
            ctx.arc(
                (x2 + trans_x) * scaleFactor,
                (y2 + trans_y) * scaleFactor,
                3,
                0,
                2 * Math.PI
            ); // Draw the end point
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo((x1 + trans_x) * scaleFactor, (y1 + trans_y) * scaleFactor);
            ctx.lineTo((x2 + trans_x) * scaleFactor, (y2 + trans_y) * scaleFactor);
            ctx.stroke();

            count2 += 4;

            }
            count++;

    }
});

/*
extractButton!.addEventListener('click', () => {
    const lines = dxfHandler.extractObjects();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    const trans_x = -1 * dxfHandler.currentLayer.minPoint[0];
    const trans_y = -1 * dxfHandler.currentLayer.minPoint[1];
    let count = 0;
    let x1, y1, x2, y2;
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
        ctx.strokeStyle = randomColor;

        // Draw the line with black start and end points
        x1 = lines[count];
        y1 = lines[count + 1];
        x2 = lines[count + 2];
        y2 = lines[count + 3];

        ctx.beginPath();
        ctx.fillStyle = 'black'; // Set the fill color to black for drawing the points
        ctx.arc(
            (x1 + trans_x) * scaleFactor,
            (y1 + trans_y) * scaleFactor,
            3,
            0,
            2 * Math.PI
        ); // Draw the start point
        ctx.fill();

        ctx.beginPath();
        ctx.arc(
            (x2 + trans_x) * scaleFactor,
            (y2 + trans_y) * scaleFactor,
            3,
            0,
            2 * Math.PI
        ); // Draw the end point
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo((x1 + trans_x) * scaleFactor, (y1 + trans_y) * scaleFactor);
        ctx.lineTo((x2 + trans_x) * scaleFactor, (y2 + trans_y) * scaleFactor);
        ctx.stroke();

        count += 4;
    }
});
*/

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
    while (count < listRef.length) {
        // Draw the line
        x1 = listRef[count];
        y1 = listRef[count + 1];
        x2 = listRef[count + 2];
        y2 = listRef[count + 3];
        ctx.beginPath();
        ctx.moveTo((x1 + trans_x) * scaleFactor, (y1 + trans_y) * scaleFactor);
        ctx.lineTo((x2 + trans_x) * scaleFactor, (y2 + trans_y) * scaleFactor);
        ctx.stroke();
        count += 4;
    }
    numEntities!.innerText = (dxfHandler.currentLayer.lines.length / 4).toString();
}
