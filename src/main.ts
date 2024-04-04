import {Helper} from "dxf";

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
        ReadDXF(event.target.result, "ENTITIES", "LINE", "10,20,30");
        const h = new Helper(event.target.result);
        numberOfEntities.innerHTML = h.denormalised.length.toString()
        svgContainer.innerHTML = h.toSVG()
    };

    reader.readAsBinaryString(file)
}

function ReadDXF(dxfFileAsStr:String, strSection:String, strObject:String, strCodeList:String) {
    let codes = dxfFileAsStr.split("\n").map((line) => line.trim());
    let result: [string, string][] = [];

    console.log('reading ' + codes );
    while (codes.length > 0 && codes[0] !== "EOF") {
        if (codes[0] === "0" && codes[1] === "SECTION") {
            console.log('section found');
            codes = codes.slice(2);
            if (codes[1] === strSection) {
                console.log('section is correct');
                codes = codes.slice(2);
                while (codes[1] != "ENDSEC") {
                    if (codes[0] === "0" && codes[1] === strObject) {
                        console.log('object found ' + codes[1]);
                        codes = codes.slice(2);
                        while (codes[0] != "0") {
                            console.log('codes: ' + codes);
                            if (strCodeList.includes(codes[0])) {
                                console.log('code found ' + codes[0] + " " + codes[1]);
                                result.push([codes[0], codes[1]] );
                            }
                            codes = codes.slice(2);
                        }
                    } else {
                        codes = codes.slice(2);
                    }
                }
            }
        } else {
            codes = codes.slice(2);
        }
    }
    console.log("result: " + result );
}
