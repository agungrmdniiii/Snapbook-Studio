// Browser fixture test: local UI only. Every API response is mocked; no credentials or production writes.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
const folder='docs/audits/2026-10-19/operations-browser';fs.mkdirSync(folder,{recursive:true});fs.mkdirSync('.tmp',{recursive:true});
fs.writeFileSync('.tmp/calendar-harness.tsx','import React from "react";import {createRoot} from "react-dom/client";import {OperationalCalendar} from "../src/components/admin/OperationalCalendar";createRoot(document.getElementById("root")!).render(<div style={{padding:16,minHeight:"100vh",background:"#09090b"}}><OperationalCalendar initialDate="2099-01-02"/></div>);');
await build({entryPoints:['.tmp/calendar-harness.tsx'],bundle:true,platform:'browser',format:'iife',outfile:'.tmp/calendar-harness.js',define:{'process.env.NODE_ENV':'"production"','process.env':'{}'},tsconfig:'tsconfig.json'});
const cssDir='.next/static/css';const css=fs.readdirSync(cssDir).filter(n=>n.endsWith('.css')).map(n=>fs.readFileSync(path.join(cssDir,n),'utf8')).join('\n');
const server=http.createServer((req,res)=>{
 if(req.url==='/app.js'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync('.tmp/calendar-harness.js'));}
 else if(req.url==='/styles.css'){res.setHeader('Content-Type','text/css');res.end(css);}
 else if(/\.(woff2?|ttf)$/.test(req.url||'')){const file=path.join('.next/static/media',path.basename(req.url));if(fs.existsSync(file)){res.end(fs.readFileSync(file));}else{res.statusCode=404;res.end();}}
 else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="id"><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="/styles.css"/></head><body><div id="root"></div><script src="/app.js"></script></body></html>');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}});let calendarReads=0;const errors=[];
  const booking={id:'dummy',bookingCode:'SB-DUMMY',clientName:'Pelanggan Contoh',date:'2099-01-02',startTime:'10:00',endTime:'11:00',status:'CONFIRMED',updatedAt:'2026-10-19T00:00:00.000Z',totalPrice:100000,paidAmount:0,hasConflict:true,package:{name:'Paket Contoh',duration:60}};
  let payments=[],events=[],blocks=[];
  await context.route('**/api/**',async route=>{
   const r=route.request(),u=new URL(r.url()),body=r.method()==='GET'?{}:r.postDataJSON();let result,status=200;
   if(u.pathname==='/api/admin/calendar'){calendarReads++;result={bookings:[booking],blocks,config:{bufferMinutes:0}};}
   else if(u.pathname.endsWith('/payments')){
    if(r.method()==='POST'){payments.unshift({id:'pay1',amount:body.kind==='REFUND'?-body.amount:body.amount,method:body.method,reference:body.reference,recordedByUsername:'Admin Contoh',createdAt:new Date().toISOString()});booking.paidAmount=payments.reduce((sum,p)=>sum+p.amount,0);events.unshift({id:'event-pay',action:'PAYMENT_RECORDED',actorUsername:'Admin Contoh',createdAt:new Date().toISOString()});status=201;}
    result={payments,paidAmount:booking.paidAmount,balance:booking.totalPrice-booking.paidAmount};
   }else if(u.pathname.endsWith('/history'))result={events};
   else if(u.pathname.endsWith('/reschedule')){
    if(body.startTime==='11:00'){status=409;result={error:'Jadwal berbenturan dengan reservasi aktif lain.'};}
    else{Object.assign(booking,{date:body.date,startTime:body.startTime,endTime:'14:00',hasConflict:false,updatedAt:new Date().toISOString()});events.unshift({id:'event-move',action:'BOOKING_RESCHEDULED',actorUsername:'Admin Contoh',createdAt:new Date().toISOString()});result={booking};}
   }else if(u.pathname==='/api/admin/blocks'){blocks.push({id:'block1',...body});result={block:blocks[0]};status=201;}
   else if(u.pathname==='/api/admin/blocks/block1'){blocks=[];result={success:true};}
   else if(u.pathname==='/api/bookings/dummy')result=booking;
   else{status=404;result={error:'Unknown fixture route'};}
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
  });
  const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('dialog',dialog=>dialog.accept());
  await page.goto(origin,{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Kalender Studio',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.getByRole('button',{name:/10:00.*Pelanggan Contoh/}).click();
  await page.getByLabel('Jam mulai baru (WIB)',{exact:true}).fill('11:00');await page.getByRole('button',{name:'Simpan jadwal baru',exact:true}).click();await page.getByRole('alert').filter({hasText:'Jadwal berbenturan dengan reservasi aktif lain.'}).waitFor();
  await page.getByLabel('Jam mulai baru (WIB)',{exact:true}).fill('13:00');await page.getByRole('button',{name:'Simpan jadwal baru',exact:true}).click();await page.getByText('Jadwal berhasil dipindahkan. Beri tahu pelanggan melalui WhatsApp.',{exact:true}).waitFor();
  await page.getByLabel('Jumlah (Rp)',{exact:true}).fill('50000');
  const before=calendarReads,response=page.waitForResponse(r=>r.url().includes('/api/admin/calendar'));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await response;
  assert.equal(await page.getByLabel('Jumlah (Rp)',{exact:true}).inputValue(),'50000');assert.ok(calendarReads>before);
  await page.getByRole('button',{name:'Catat transaksi',exact:true}).click();await page.getByText('Transaksi berhasil dicatat.',{exact:true}).waitFor();assert.equal(booking.paidAmount,50000);
  await page.screenshot({path:`${folder}/detail-${width}.png`});await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByRole('button',{name:'Blok waktu / libur',exact:true}).click();await page.getByLabel('Tanggal blok',{exact:true}).fill('2099-01-02');await page.getByLabel('Tutup sepanjang hari',{exact:true}).check();await page.getByLabel('Alasan penutupan',{exact:true}).fill('Libur Contoh');await page.getByRole('button',{name:'Simpan blok waktu',exact:true}).click();await page.getByText('Libur Contoh',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Buka kembali',exact:true}).click();await page.getByText('Libur Contoh',{exact:true}).waitFor({state:'detached'});
  await page.screenshot({path:`${folder}/calendar-${width}.png`});assert.deepEqual(errors,[]);results.push({width,rescheduleCollision:true,rescheduleSuccess:true,payment:true,formPreservedOnRefresh:true,blocks:true,noOverflow:true,errors});await context.close();
 }
 fs.writeFileSync(`${folder}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
