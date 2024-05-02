"use strict";
(() => {
  // src/dxf-handler.ts
  var DxfHandler = class {
    constructor() {
      /* Index of layername corresponds to index in lines and layerInfo */
      this.layerNames = [];
      this.lines = [];
      // @todo: Merge this with layerNames and add names to LayerInfo Interface
      this.layerInfo = [];
      this._currentIndex = 0;
    }
    _reset() {
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
    async loadDxf(file) {
      const reader = new FileReader();
      this._reset();
      await new Promise((resolve) => {
        reader.onload = () => {
          resolve();
        };
        reader.readAsText(file);
      });
      const fileText = reader.result;
      if (!fileText || fileText instanceof ArrayBuffer) {
        console.warn("DXF-Handler: Unable to load file.");
        return;
      }
      let time = performance.now();
      let entityCount = 0;
      fileText.split("AcDbEntity").forEach((value) => {
        if (entityCount === 0) {
          entityCount++;
          return;
        }
        entityCount++;
        if (!value.includes("AcDbLine"))
          return;
        const entity = value.split("\n").map((x) => {
          if (x.startsWith(" ")) {
            return "ID" + x.trim();
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
            case "ID10":
              this.lines[id].push(parseFloat(entity[i + 1]));
              break;
            case "ID20":
              this.lines[id].push(parseFloat(entity[i + 1]));
              break;
            case "ID11":
              this.lines[id].push(parseFloat(entity[i + 1]));
              break;
            case "ID21":
              this.lines[id].push(parseFloat(entity[i + 1]));
              return;
            default:
          }
        }
      });
      time = performance.now() - time;
      console.log(`DXF-Handler: Took ${time} ms to parse ${entityCount + 1} entities.`);
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
          if (min_x === void 0 || this.lines[i][count] < min_x)
            min_x = this.lines[i][count];
          if (min_y === void 0 || this.lines[i][count + 1] < min_y)
            min_y = this.lines[i][count + 1];
          count += 2;
        }
        if (!min_x)
          min_x = 0;
        if (!min_y)
          min_y = 0;
        this.layerInfo.push({ id: i, min_x, min_y });
      }
    }
    mergeLayers(layer1, layer2) {
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
    get linesOnCurrentLayer() {
      if (this.lines.length === 0)
        return [];
      return this.lines[this._currentIndex];
    }
    moveToNextLayer() {
      this._currentIndex = (this._currentIndex + 1) % this.lines.length;
    }
    moveToPrevLayer() {
      this._currentIndex = this._currentIndex === 0 ? this.lines.length - 1 : this._currentIndex - 1;
    }
  };

  // src/main.ts
  var scaleFactor = 1;
  var dxfHandler = new DxfHandler();
  var drawButton = document.getElementById("drawButton");
  var numEntities = document.getElementById("numberOfEntities");
  var scaleUp = document.getElementById("scaleUpButton");
  var scaleDown = document.getElementById("scaleDownButton");
  var advanceButton = document.getElementById("advanceLayer");
  var goBackButton = document.getElementById("goBackLayer");
  var fileInput = document.getElementById("fileInput");
  var canvas = document.getElementById("myCanvas");
  var ctx = canvas.getContext("2d");
  drawButton.addEventListener("click", () => {
    fileInput.click();
  });
  goBackButton.addEventListener("click", () => {
    dxfHandler.moveToPrevLayer();
    updateCanvas();
  });
  advanceButton.addEventListener("click", () => {
    dxfHandler.moveToNextLayer();
    updateCanvas();
  });
  scaleUp.addEventListener("click", () => {
    scaleFactor *= 2;
    updateCanvas();
  });
  scaleDown.addEventListener("click", () => {
    scaleFactor /= 2;
    updateCanvas();
  });
  fileInput.addEventListener("change", handleFileSelect);
  async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file)
      return;
    await dxfHandler.loadDxf(file);
    updateCanvas();
  }
  function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    const listRef = dxfHandler.linesOnCurrentLayer;
    const trans_x = -1 * dxfHandler.layerInfo[dxfHandler._currentIndex].min_x;
    const trans_y = -1 * dxfHandler.layerInfo[dxfHandler._currentIndex].min_y;
    let count = 0;
    let x1, y1, x2, y2;
    while (count < listRef.length) {
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
    numEntities.innerText = (dxfHandler.linesOnCurrentLayer.length / 4).toString();
  }
})();
