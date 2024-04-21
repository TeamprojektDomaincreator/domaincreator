import React, { useState } from 'react';
import { Helper } from 'dxf';


export const FileUpload = () => { 

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const svgRef = React.useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> ) => {
    setSelectedFile(event.target.files?.[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    console.log('Uploading file', selectedFile);
    const reader = new FileReader();

    reader.onload = function(event) {
        if (typeof event.target.result !== "string") {
            console.warn("Result was not a string!");
            return;
        }
        const h = new Helper(event.target.result);
        console.log(h.toPolylines())
        // numberOfEntities.innerHTML = h.denormalised?.length.toString()
        if (!svgRef.current) return;
        svgRef.current.innerHTML = h.toSVG()
    };

    reader.readAsBinaryString(selectedFile)
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <div ref={svgRef} />
    </div>
  );
  
}