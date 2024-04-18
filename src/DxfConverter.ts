class DxfConverter {
  static readonly _startCodeX: number = 10;
  static readonly _startCodeY: number = 20;
  static readonly _startCodeZ: number = 30;

  static readonly _endCodeX: number = 11;
  static readonly _endCodeY: number = 21;
  static readonly _endCodeZ: number = 31;

  static readDXF({
    dxfFileAsStr,
    fileName,
    strSection,
    strObject,
  }: {
    dxfFileAsStr: string;
    fileName: string;
    strSection: string;
    strObject: string;
  }): DxfFile {
    const startPointCodes: number[] = [
      DxfConverter._startCodeX,
      DxfConverter._startCodeY,
      DxfConverter._startCodeZ,
    ];
    const endPointCodes: number[] = [
      DxfConverter._endCodeX,
      DxfConverter._endCodeY,
      DxfConverter._endCodeZ,
    ];

    const codes: string[] = dxfFileAsStr.split("\n").map((line) => line.trim());
    const dxfFile: DxfFile = new DxfFile(fileName);

    while (codes.length > 0 && codes[0] !== "EOF") {
      if (codes[0] === "0" && codes[1] === "SECTION") {
        codes.splice(0, 2);
        if (codes[1] === strSection) {
          codes.splice(0, 2);
          while (codes[1] !== "ENDSEC") {
            if (codes[0] === "0" && codes[1] === strObject) {
              codes.splice(0, 2);
              let layerName: string;
              if (codes[0] === "8") {
                layerName = codes[1];
                codes.splice(0, 2);
                let startPoint: DxfCoordinate | null = null;
                let endPoint: DxfCoordinate | null = null;

                while (codes[0] !== "0") {
                  if (startPointCodes.includes(parseInt(codes[0]))) {
                    startPoint = new DxfCoordinate(
                      parseFloat(codes[1]),
                      parseFloat(codes[3]),
                      parseFloat(codes[5])
                    );
                    codes.splice(0, 6);
                  } else if (endPointCodes.includes(parseInt(codes[0]))) {
                    endPoint = new DxfCoordinate(
                      parseFloat(codes[1]),
                      parseFloat(codes[3]),
                      parseFloat(codes[5])
                    );
                    codes.splice(0, 6);
                  } else {
                    codes.splice(0, 2);
                  }
                  if (startPoint !== null && endPoint !== null) {
                    dxfFile.addDataToLayer(
                      layerName,
                      new DxfData(startPoint, endPoint)
                    );
                    startPoint = null;
                    endPoint = null;
                  }
                }
              }
            } else {
              codes.splice(0, 2);
            }
          }
        }
      } else {
        codes.splice(0, 2);
      }
    }
    return dxfFile;
  }
}

class DxfFile {
  fileName: string;
  layers: Map<string, DxfLayer>;

  constructor(fileName: string, layers: Map<string, DxfLayer> = new Map()) {
    this.fileName = fileName;
    this.layers = layers;
  }

  getLayer(layer: string): DxfLayer | undefined {
    return this.layers.get(layer);
  }

  add(layer: DxfLayer): void {
    this.layers.set(layer.layerName, layer);
  }

  addDataToLayer(layerName: string, data: DxfData): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.data.push(data);
    } else {
      this.layers.set(layerName, new DxfLayer(layerName, [data]));
    }
  }
}

class DxfLayer {
  layerName: string;
  data: DxfData[];

  constructor(layerName: string, data: DxfData[]) {
    this.layerName = layerName;
    this.data = data;
  }
}

class DxfData {
  startPoint: DxfCoordinate;
  endPoint: DxfCoordinate;

  constructor(startPoint: DxfCoordinate, endPoint: DxfCoordinate) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }
}

class DxfCoordinate {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}


export { DxfConverter, DxfFile, DxfLayer, DxfData, DxfCoordinate };

