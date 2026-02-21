document.getElementById('extractBtn').addEventListener('click', extractText);
document.getElementById('downloadBtn').addEventListener('click', downloadText);

// ===================== Předzpracování obrázku =====================
async function preprocessImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // 1️⃣ Grayscale + kontrast + prahování
      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
        gray = Math.min(255, Math.max(0, (gray-128)*1.5 + 128));
        gray = gray > 150 ? 255 : 0;
        data[i] = data[i+1] = data[i+2] = gray;
      }

      // 2️⃣ Odstranění velkých bloků (pravděpodobné obrázky/loga)
      const areaThreshold = 4000; // uprav podle velikosti ilustrací
      const visited = new Uint8Array(width*height);

      function floodFill(x, y){
        const stack = [[x, y]];
        let size = 0;
        while(stack.length){
          const [cx,cy] = stack.pop();
          const idx = cy*width + cx;
          if(cx<0||cy<0||cx>=width||cy>=height) continue;
          if(visited[idx]) continue;
          visited[idx] = 1;
          const color = data[idx*4];
          if(color===0){
            size++;
            stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
          }
        }
        return size;
      }

      for(let y=0; y<height; y++){
        for(let x=0; x<width; x++){
          const idx = y*width + x;
          if(!visited[idx] && data[idx*4]===0){
            const size = floodFill(x,y);
            if(size > areaThreshold){
              for(let i=0;i<width*height;i++){
                if(visited[i]){
                  data[i*4]=255;
                  data[i*4+1]=255;
                  data[i*4+2]=255;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData,0,0);
      canvas.toBlob(resolve,"image/png");
    };
    img.src = URL.createObjectURL(file);
  });
}

// ===================== Hlavní OCR funkce =====================
async function extractText(){
  const files = document.getElementById('imageInput').files;
  if(!files.length){ alert("Upload at least one image"); return; }

  document.getElementById("output").value="";
  document.getElementById("status").innerText="Processing...";

  for(let i=0;i<files.length;i++){
    const preprocessedFile = await preprocessImage(files[i]);

    const result = await Tesseract.recognize(preprocessedFile,'eng+ces',{
      logger:m=>{
        if(m.progress){
          document.getElementById("status").innerText=
            `Processing image ${i+1} of ${files.length}: ${Math.round(m.progress*100)}%`;
        }
      }
    });

    // Filtrace řádků → jen řádky s písmeny, delší než 3 znaky
    const lines = result.data.text.split('\n');
    const filtered = lines.filter(line => line.trim().length>3 && /[a-zA-Záčéěíóřšťůúýž]/.test(line));

    // Sloučení rozdělených řádků
    let merged=[];
    filtered.forEach(line=>{
      if(merged.length && !/[.!?]$/.test(merged[merged.length-1])){
        merged[merged.length-1]+=' '+line;
      }else{
        merged.push(line);
      }
    });

    document.getElementById("output").value += merged.join('\n') + "\n\n";
  }

  document.getElementById("status").innerText="Done!";
}

// ===================== Stažení textu =====================
function downloadText(){
  const text=document.getElementById("output").value;
  if(!text){ alert("No text to download"); return; }
  const blob=new Blob([text],{type:"text/plain"});
  const link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="extracted_text.txt";
  link.click();
}
