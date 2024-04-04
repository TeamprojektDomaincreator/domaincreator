import {Helper} from "dxf";

const drawButton = document.getElementById('drawButton');
const fileInput = document.getElementById('fileInput');
const numberOfEntities = document.getElementById('numberOfEntities')
const svgContainer = document.getElementById('svg')

drawButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    numberOfEntities.innerHTML = 'reading...'

    reader.onload = function(event) {
        if (typeof event.target.result !== "string") {
            console.warn("Result was not a string!");
            return;
        }
        const h = new Helper(event.target.result);
        numberOfEntities.innerHTML = h.denormalised?.length.toString()
        svgContainer.innerHTML = h.toSVG()
    };

    reader.readAsBinaryString(file)
}
