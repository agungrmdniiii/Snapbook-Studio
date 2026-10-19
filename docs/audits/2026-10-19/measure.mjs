import fs from 'node:fs';
const results=[];
for(let pass=1;pass<=2;pass++){
  for(const pathname of ['/','/book','/api/packages','/api/gallery','/api/bookings/available-slots?date=2026-11-21']){
    const start=performance.now();
    try{
      const response=await fetch('https://snapbook-studio.vercel.app'+pathname,{signal:AbortSignal.timeout(12000)});
      const headerAt=performance.now();const body=await response.arrayBuffer();
      results.push({pass,pathname,status:response.status,ttfbMs:Math.round(headerAt-start),totalMs:Math.round(performance.now()-start),decodedBytes:body.byteLength,cache:response.headers.get('x-vercel-cache'),cacheControl:response.headers.get('cache-control')});
    }catch(error){results.push({pass,pathname,error:error.name,cause:error.cause?.code??null,elapsedMs:Math.round(performance.now()-start)})}
    console.log(JSON.stringify(results.at(-1)));
  }
}
fs.writeFileSync(new URL('./http-measurements.json',import.meta.url),JSON.stringify(results,null,2));
