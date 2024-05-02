interface LayerInfo {
    id: number,
    min_x: number,
    min_y: number,
}

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
 * const lines = handler.linesOfCurrentLayer();
 * handler.moveToNextLayer();
 * const nextLines = handler.linesOfCurrentLayer();
 * ```
 */
export class DxfHandler {

    /* Index of layername corresponds to index in lines and layerInfo */
    layerNames: string[] = [];
    lines: number[][] = [];
    // @todo: Merge this with layerNames and add names to LayerInfo Interface
    layerInfo: LayerInfo[] = []

    _currentIndex = 0;

    _reset() {
        /* Mark all contents for GC collection */
        this.lines.length = 0;
        this.layerNames.length = 0;
        this.layerInfo.length = 0;

        this._currentIndex = 0;
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
            console.warn('DXF-Handler: Unable to load file.');
            return;
        }
        let time = performance.now();
        let entityCount = 0
        fileText.split('AcDbEntity').forEach((value) => {
            /* Skip the header */
            if (entityCount === 0) {
                entityCount++;
                return;
            }
            entityCount++;
            /* Skip everything thats not a line */
            if (!value.includes("AcDbLine")) return;

            const entity = value.split('\n').map((x) => {
                if (x.startsWith(' ')) {
                    return 'ID' + x.trim();
                }
                return x.trim();
            });

            const layerName = entity[2];
            if (!this.layerNames.includes(layerName)) {
                const newId = this.layerNames.push(layerName);
                this.lines[newId - 1] = [];
            }
            const id = this.layerNames.indexOf(layerName);
            for (let i = 0; i < entity.length; i++) {
                switch (entity[i]) {
                    case 'ID10':
                        this.lines[id].push(parseFloat(entity[i + 1]));
                        break;
                    case 'ID20':
                        this.lines[id].push(parseFloat(entity[i + 1]));
                        break;
                    case 'ID11':
                        this.lines[id].push(parseFloat(entity[i + 1]));
                        break;
                    case 'ID21':
                        this.lines[id].push(parseFloat(entity[i + 1]));
                        return
                    default:
                }

            }
        });
        time = performance.now() - time;
        console.log(`DXF-Handler: Took ${time} ms to parse ${entityCount + 1} entities.`)

        this._addLayerInfo();
    }

    /**
     * Finds minium x and y corrdinate that is required for translation.
     * 
     * @todo: 
     * Add support for max x and max y and fix current implementation.
     * Maybe rename to verifyOutput, and also remove layers with 0 lines.
     * That requires reshuffling the indices since they need to align
     *
     */
    _addLayerInfo() {
        for (let i = 0; i < this.lines.length; i++) {
            let count = 0;
            let min_x;
            let min_y;
            while (this.lines[i].length > count) {
                if (min_x === undefined || this.lines[i][count] < min_x) min_x = this.lines[i][count];
                if (min_y === undefined || this.lines[i][count + 1] < min_y) min_y = this.lines[i][count + 1];
                count += 2;
            }
            if (!min_x) min_x = 0;
            if (!min_y) min_y = 0;
            this.layerInfo.push({ id: i, min_x: min_x, min_y: min_y });
        }
    }

    mergeLayers(layer1: number, layer2: number) {
        // @todo: Add implementation
    }

    /**
     * Retrieves the lines of the current layer.
     * 
     *  @note
     * The returned array is flattened for cache coherency. Iterate over it in steps of 4 to access individual line coordinates.
     * 
     *  @example
     * ```js
     * const list = handler.linesOfCurrentLayer();
     * let i = 0;
     * while (i < list.length) {
     *   const line_start_x = list[i];
     *   const line_start_y = list[i + 1];
     *   const line_end_x = list[i + 2];
     *   const line_end_y = list[i + 3];
     *   i += 4;
     * }
     * ```
     * 
     *  @returns An array of numbers, aligned as follows: [start_x0, start_y0, end_x1, end_y1, ...]
     */
    get linesOnCurrentLayer(): number[] {
        if (this.lines.length === 0) return [];
        return this.lines[this._currentIndex];
    }

    moveToNextLayer() {
        this._currentIndex = (this._currentIndex + 1) % this.lines.length;
    }

    moveToPrevLayer() {
        this._currentIndex = this._currentIndex === 0 ? this.lines.length - 1 : this._currentIndex - 1;
    }
}