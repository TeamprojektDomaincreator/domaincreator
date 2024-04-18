import {Helper} from "dxf";
import { DxfConverter } from "./DxfConverter";

const drawButton = document.getElementById('drawButton');
const fileInput = document.getElementById('fileInput');
const numberOfEntities = document.getElementById('numberOfEntities')
const svgContainer = document.getElementById('svg')

drawButton.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event: any) {
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

        var dxfFile = DxfConverter.readDXF({
            dxfFileAsStr: event.target.result,
            fileName: file.name,
            strSection: "ENTITIES",
            strObject: "LINE",
        });
        
        numberOfEntities.innerHTML = h.denormalised.length.toString()
        svgContainer.innerHTML = h.toSVG()
    };

    reader.readAsBinaryString(file)
}
