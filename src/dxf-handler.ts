/**
 * Represents a DXF Layer
 */
interface Layer {
    name: string,
    lines: number[],
    minPoint: Float32Array,
    maxPoint: Float32Array,
}

/* Constants */
const ENTITY = 'AcDbEntity';
const LINE = 'AcDbLine';
const CODE_8 = ' 8';
const CODE_10 = ' 10';
const CODE_20 = ' 20';
const CODE_11 = ' 11';
const CODE_21 = ' 21';

/**
 * Handles DXF Files.
 * 
 * @description
 * The DxfHandler is able to decode all lines from a DXF and store them on a per-layer basis.
 * To avoid unnecessary copying, all decoded lines are stored inside the handler itself.
 * It also provides convenience methods to quickly move through the layers.
 * 
 * @example
 * ```js
 * const handler = new DxfHandler();
 * await handler.loadDxf(file);
 * const lines = handler.currentLayer.lines;
 * handler.moveToNextLayer();
 * const nextLines = handler.currentLayer.lines;
 * ```
 */
export class DxfHandler {

    layers: Layer[] = [];

    #currentIndex = 0;

    _reset() {
        /* Mark all contents for garbage collection */
        this.layers.length = 0;

        this.#currentIndex = 0;
    }

    /**
     * Async function that loads a DXF file and parses its contents.
     *
     * @param {File} file - A File object representing the DXF file to be loaded.
     *
     * @returns A empty promise that resolves once the entire file has been parsed. 
     *
     * @description
     * This function reads the provided DXF file using a FileReader and then splits the file text into individual entities. Each entity is parsed and processed as follows:
     * 1. The header of the file is skipped.
     * 2. Entities are filtered to only include lines (entities that contain "AcDbLine").
     * 3. For each line, the following information is extracted and stored in the internal state of the DxfHandler instance:
     *    - Layer name
     *    - Start X-coordinate
     *    - Start Y-coordinate
     *    - End X-coordinate
     *    - End Y-coordinate
     *
     * @async
     * @example
     * ```
     * await dxfHandler.loadDxf(file);
     * ```
     */
    async loadDxf(file: File) {
        const reader = new FileReader();
        this._reset();

        await new Promise<void>((resolve) => {
            reader.onload = () => {
                resolve();
            };
            reader.readAsText(file);
        });

        const fileText = reader.result;
        if (!fileText || fileText instanceof ArrayBuffer) {
            console.error('DXF-Handler: Unable to load file.');
            return;
        }

        let time = performance.now();

        /* Windows and Mac/Linux handle return differently */
        const returnChar = fileText.indexOf("\r") === -1 ? '\n' : '\r';
        const entity = ENTITY + returnChar;
        const line = LINE + returnChar;
        const nameID = CODE_8 + returnChar;
        const startX = CODE_10 + returnChar;
        const startY = CODE_20 + returnChar;
        const endX = CODE_11 + returnChar;
        const endY = CODE_21 + returnChar;

        let entityCount = 0
        let temp = 0;
        let layerName = "";
        let arrayRef;

        let x1, y1, x2, y2;

        for (let i = 0; i < fileText.length; i++) {
            i = fileText.indexOf(entity, i);
            /* No Entities anymore */
            if (i === -1) break;
            entityCount++;
            temp = fileText.indexOf('AcDb', i + entity.length)
            if (fileText.substring(temp, temp + line.length ) !== line) continue;

            i = fileText.indexOf(nameID, i);
            /* Skip until next entry */
            i = fileText.indexOf('\n', i) + 1;
            layerName = fileText.substring(i, fileText.indexOf(returnChar, i));
            temp = this._getOrAddLayerID(layerName);

            /* Find code that indicates the coordinate points */
            x1 = fileText.indexOf(startX, i);
            y1 = fileText.indexOf(startY, i);
            x2 = fileText.indexOf(endX, i);
            y2 = fileText.indexOf(endY, i);

            /* Skip to where the actual values begin */
            x1 = fileText.indexOf('\n', x1) + 1;
            y1 = fileText.indexOf('\n', y1) + 1;
            x2 = fileText.indexOf('\n', x2) + 1;
            y2 = fileText.indexOf('\n', y2) + 1;

            arrayRef = this.layers[temp].lines;
            arrayRef.push(parseFloat(fileText.substring(x1, fileText.indexOf(returnChar, x1))));
            arrayRef.push(parseFloat(fileText.substring(y1, fileText.indexOf(returnChar, y1))));
            arrayRef.push(parseFloat(fileText.substring(x2, fileText.indexOf(returnChar, x2))));
            arrayRef.push(parseFloat(fileText.substring(y2, fileText.indexOf(returnChar, y2))));
        }
        time = performance.now() - time;
        console.log(`DXF-Handler: Took ${time.toPrecision(4)} ms to parse ${entityCount + 1} entities.`)

        /* Find the minimum and maximum Points */
        for (let i = 0; i < this.layers.length; i++) {
            const lines = this.layers[i].lines;
            const minPoint = new Float32Array(2);
            const maxPoint = new Float32Array(2);
          
            for (let j = 0; j < lines.length; j += 2) {
              minPoint[0] = Math.min(minPoint[0], lines[j]);
              minPoint[1] = Math.min(minPoint[1], lines[j+1]);
          
              maxPoint[0] = Math.max(maxPoint[0], lines[j]);
              maxPoint[1] = Math.max(maxPoint[1], lines[j+1]);
            }
          
            this.layers[i].minPoint = minPoint;
            this.layers[i].maxPoint = maxPoint;
        }
    }

    /**
     * Gets the index of a layer with a certain name or creates a new layer.
     * 
     * @param layername Name of the layer to get the index of.
     * @returns Index of the layer.
     * 
     * @warning This function is for internal use only!
     */
    _getOrAddLayerID(layername: string): number {
        /* Search from the back, because most likely case is that the last element is the one we need. */
        for (let i = this.layers.length - 1; i >= 0; i--) {
            if (this.layers[i].name === layername) return i;
        }
        return this.layers.push({name: layername, lines: [], minPoint: new Float32Array([0, 0]), maxPoint: new Float32Array([0, 0])}) - 1;
    }

    /**
     * Extracts polylines from a single layer or group of layers.
     * 
     * @param layerIndices List of indices that the user selected for extraction.
     * @returns A list of of Float32Arrays that each represent a polyline of a object. 
     */
    extractObjects(layerIndices: number[]): Float32Array[] {
        const res: Float32Array[] = []
        // @todo: Add implementation
        return res;
    }

    /**
     * Retrieves the current layer.
     * 
     *  @note
     * The returned array is flattened for cache coherency. Iterate over it in steps of 4 to access individual line coordinates.
     * 
     *  @example
     * ```js
     * const list = handler.currentLayer.lines;
     * let i = 0;
     * while (i < list.length) {
     *   const line_start_x = list[i];
     *   const line_start_y = list[i + 1];
     *   const line_end_x = list[i + 2];
     *   const line_end_y = list[i + 3];
     *   i += 4;
     * }
     * ```
     * @see Layer
     * 
     *  @returns An array of numbers, aligned as follows: [start_x0, start_y0, end_x1, end_y1, ...]
     */
    get currentLayer(): Layer {
        if (this.layers.length === 0) return {name: "", lines: [], minPoint: new Float32Array([0, 0]), maxPoint: new Float32Array([0, 0])};
        return this.layers[this.#currentIndex];
    }

    moveToNextLayer() {
        this.#currentIndex = (this.#currentIndex + 1) % this.layers.length;
    }

    moveToPrevLayer() {
        this.#currentIndex = this.#currentIndex === 0 ? this.layers.length - 1 : this.#currentIndex - 1;
    }

    /**
     * Gets the index of the current layer.
     */
    get currentIndex(): number {
        return this.#currentIndex;
    }
}