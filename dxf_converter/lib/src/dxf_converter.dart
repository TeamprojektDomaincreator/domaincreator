class DxfConverter {
  static const int _startCodeX = 10;
  static const int _startCodeY = 20;
  static const int _startCodeZ = 30;

  static const int _endCodeX = 11;
  static const int _endCodeY = 21;
  static const int _endCodeZ = 31;

  static DxfFile readDXF({
    required String dxfFileAsStr,
    required String fileName,
    required String strSection,
    required String strObject,
  }) {
    List<int> startPointCodes = [
      _startCodeX,
      _startCodeY,
      _startCodeZ,
    ];
    List<int> endPointCodes = [
      _endCodeX,
      _endCodeY,
      _endCodeZ,
    ];

    List<String> codes =
        dxfFileAsStr.split("\n").map((line) => line.trim()).toList();
    DxfFile dxfFile = DxfFile(fileName: fileName);

    while (codes.isNotEmpty && codes[0] != "EOF") {
      if (codes[0] == "0" && codes[1] == "SECTION") {
        codes = codes..removeRange(0, 2);
        if (codes[1] == strSection) {
          codes = codes..removeRange(0, 2);
          while (codes[1] != "ENDSEC") {
            if (codes[0] == "0" && codes[1] == strObject) {
              codes = codes..removeRange(0, 2);
              String layerName;
              if (codes[0] == "8") {
                layerName = codes[1];
                codes = codes..removeRange(0, 2);
                DxfCoordinate? startPoint;
                DxfCoordinate? endPoint;

                while (codes[0] != "0") {
                  if (startPointCodes.contains(int.parse(codes[0]))) {
                    startPoint = DxfCoordinate(
                      double.parse(codes[1]),
                      double.parse(codes[3]),
                      double.parse(codes[5]),
                    );
                    codes = codes..removeRange(0, 6);
                  } else if (endPointCodes.contains(int.parse(codes[0]))) {
                    endPoint = DxfCoordinate(
                      double.parse(codes[1]),
                      double.parse(codes[3]),
                      double.parse(codes[5]),
                    );
                    codes = codes..removeRange(0, 6);
                  } else {
                    codes = codes..removeRange(0, 2);
                  }
                  if (startPoint != null && endPoint != null) {
                    dxfFile.addDataToLayer(
                      layerName,
                      DxfData(startPoint, endPoint),
                    );
                    startPoint = null;
                    endPoint = null;
                  }
                }
              }
            } else {
              codes = codes..removeRange(0, 2);
            }
          }
        }
      } else {
        codes = codes..removeRange(0, 2);
      }
    }
    return dxfFile;
  }
}

class DxfFile {
  String fileName;
  Map<String, DxfLayer> layers;

  DxfFile({
    required this.fileName,
    this.layers = const {},
  });

  DxfLayer? getLayer(String layer) => layers[layer];

  void add(DxfLayer layer) => layers[layer.layerName] = layer;
  void addDataToLayer(String layerName, DxfData data) {
    DxfLayer? layer = layers[layerName];
    if (layer == null) {
      layers[layerName] = DxfLayer(layerName, [data]);
    } else {
      layers[layerName]?.data = [
        ...layers[layerName]?.data ?? [],
        data,
      ];
    }
  }
}

class DxfLayer {
  String layerName;
  List<DxfData> data;

  DxfLayer(
    this.layerName,
    this.data,
  );
}

class DxfData {
  DxfCoordinate startPoint;
  DxfCoordinate endPoint;

  DxfData(
    this.startPoint,
    this.endPoint,
  );
}

class DxfCoordinate {
  double x;
  double y;
  double z;

  DxfCoordinate(
    this.x,
    this.y,
    this.z,
  );
}
