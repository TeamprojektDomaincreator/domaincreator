import 'package:dxf_converter/src/dxf_converter.dart';

void main(List<String> args) {
  DxfFile dxfFile = DxfConverter.readDXF(
    dxfFileAsStr: '',
    fileName: 'example.dxf',
    strObject: 'LINE',
    strSection: 'ENTITIES',
  );
}
