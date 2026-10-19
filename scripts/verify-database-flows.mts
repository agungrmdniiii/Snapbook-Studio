/** Real browser → Next API → Prisma/Postgres verification. All writes use a private random fixture schema. */
import nextEnv from '@next/env';
import {PrismaClient} from '@prisma/client';
import {chromium} from 'playwright';
import {randomBytes,randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
nextEnv.loadEnvConfig(process.cwd());
const control=new PrismaClient();
const namespace=`qa_crud_${randomUUID().replaceAll('-','')}`;
assert.match(namespace,/^qa_crud_[a-f0-9]{32}$/);
const quoted=`"${namespace}".`;
const url=new URL(process.env.DATABASE_URL!);url.searchParams.set('schema',namespace);
const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
const fixtureBuild=path.resolve('.tmp',namespace+'_build');
assert.equal(path.dirname(fixtureBuild),path.resolve('.tmp'));
let created=false,child:ReturnType<typeof spawn>|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
const results:string[]=[];
function splitSQL(sql:string){
 const parts:string[]=[];let start=0,quoted=false,dollar=false,comment=false;
 for(let i=0;i<sql.length;i++){
  if(comment){if(sql[i]==='\n')comment=false;else continue;}
  if(!quoted&&!dollar&&sql.slice(i,i+2)==='--'){comment=true;i++;continue;}
  if(!quoted&&sql.slice(i,i+2)==='$$'){dollar=!dollar;i++;continue;}
  if(!dollar&&sql[i]==="'")quoted=!quoted;
  if(sql[i]===';'&&!quoted&&!dollar){parts.push(sql.slice(start,i));start=i+1;}
 }
 if(sql.slice(start).trim())parts.push(sql.slice(start));
 return parts.filter(s=>s.replace(/--[^\n]*/g,'').trim());
}
try{
 await control.$executeRawUnsafe(`CREATE SCHEMA "${namespace}"`);created=true;
 for(const table of ['AdminUser','StudioConfig','Package','AddOn','Booking','BookingAddOn','ShowcaseImage','RequestLimit','ScheduleBlock','BookingPayment','AuditEvent'])await control.$executeRawUnsafe(`CREATE TABLE ${quoted}"${table}" (LIKE public."${table}" INCLUDING ALL)`);
 for(const [table,column,parent] of [['Booking','packageId','Package'],['BookingAddOn','bookingId','Booking'],['BookingAddOn','addOnId','AddOn'],['BookingPayment','bookingId','Booking']])await control.$executeRawUnsafe(`ALTER TABLE ${quoted}"${table}" ADD FOREIGN KEY ("${column}") REFERENCES ${quoted}"${parent}"(id)`);
 const sql=fs.readFileSync('prisma/operations.sql','utf8');
 for(const stmt of splitSQL(sql.slice(sql.indexOf('CREATE FUNCTION public.snapbook_minutes')).replaceAll('public.',quoted)))await control.$executeRawUnsafe(stmt);
 assert.equal((await db.$queryRaw<{schema:string}[]>`SELECT current_schema() AS schema`)[0].schema,namespace);
 const password=randomBytes(20).toString('base64url'),secret=randomBytes(48).toString('hex');
 await db.adminUser.create({data:{id:'fixture-admin',username:'fixture-admin',passwordHash:await bcrypt.hash(password,10)}});
 await db.studioConfig.create({data:{id:'default',studioName:'Studio Uji',whatsappNumber:'6280000000000',openingTime:'09:00',closingTime:'20:00',slotDuration:60,bufferMinutes:0}});
 await db.package.create({data:{id:'fixture-package',name:'Paket Uji',description:'Data dummy',price:100000,duration:60,category:'Portrait',features:'[]',sortOrder:7,imageUrl:'https://example.com/fixture.jpg'}});
 await db.addOn.create({data:{id:'fixture-addon',name:'Add-on Gratis Uji',price:0}});
 const portServer=http.createServer();await new Promise<void>(r=>portServer.listen(0,'127.0.0.1',r));const port=(portServer.address() as {port:number}).port;await new Promise<void>(r=>portServer.close(()=>r()));
 fs.cpSync('.next',fixtureBuild,{recursive:true,filter:source=>!path.resolve(source).startsWith(path.resolve('.next/cache'))});
 fs.writeFileSync('.tmp/crud-next-server.cjs',`const next=require('next');const http=require('node:http');const app=next({dev:false,dir:process.cwd(),conf:{distDir:process.env.SNAPBOOK_FIXTURE_DIST}});app.prepare().then(()=>http.createServer(app.getRequestHandler()).listen(Number(process.env.PORT),'127.0.0.1'));`);
 child=spawn(process.execPath,['.tmp/crud-next-server.cjs'],{env:{...process.env,DATABASE_URL:url.toString(),DIRECT_URL:url.toString(),SESSION_SECRET:secret,VERCEL:'0',PORT:String(port),SNAPBOOK_FIXTURE_DIST:path.relative(process.cwd(),fixtureBuild)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 child.stdout?.on('data',()=>{});child.stderr?.on('data',()=>{});
 const origin=`http://127.0.0.1:${port}`;
 let ready=false;for(let i=0;i<80;i++){try{const r=await fetch(origin+'/admin/login');if(r.ok){ready=true;break;}}catch{}if(child.exitCode!==null)throw Error('Fixture server exited');await new Promise(r=>setTimeout(r,250));}assert.ok(ready,'Fixture server ready');
 browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(origin+'/admin/login');await page.getByLabel('USERNAME ADMIN',{exact:true}).fill('fixture-admin');await page.getByLabel('PASSWORD',{exact:true}).fill(password);await page.locator('button[type="submit"]').click();await page.waitForURL(origin+'/admin');
 async function api(path:string,method='GET',body?:unknown,expected=200){const r=await context.request.fetch(origin+path,{method,...(body===undefined?{}:{data:body})});const data=await r.json();assert.equal(r.status(),expected,`${method} ${path}: ${data.error??''}`);return data;}
 const catalog=await api('/api/packages?all=true');assert.deepEqual(catalog.packages.map((p:{id:string})=>p.id),['fixture-package']);results.push('real login and fixture database isolation');
 await page.goto(origin+'/admin/packages');await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByLabel('NAMA *',{exact:true}).fill('Paket Uji Diubah');await page.getByLabel('HARGA (RP) *',{exact:true}).fill('120000');await page.getByRole('button',{name:'Simpan Data',exact:true}).click();await page.getByRole('status').filter({hasText:'Paket foto berhasil diubah.'}).waitFor();
 const edited=await db.package.findUniqueOrThrow({where:{id:'fixture-package'}});assert.equal(edited.name,'Paket Uji Diubah');assert.equal(edited.price,120000);assert.equal(edited.sortOrder,7);assert.equal(edited.imageUrl,'https://example.com/fixture.jpg');results.push('real package edit persists, omitted sortOrder/image preserved');
 await page.getByRole('button',{name:'Edit add-on Add-on Gratis Uji',exact:true}).click();await page.waitForFunction('document.getElementById("nama-*")?.value === "Add-on Gratis Uji"');assert.equal(await page.getByLabel('HARGA (RP) *',{exact:true}).inputValue(),'0','Free addon must retain zero on edit');await page.getByLabel('NAMA *',{exact:true}).fill('Add-on Gratis Diubah');await page.getByRole('button',{name:'Simpan Data',exact:true}).click();await page.getByRole('status').filter({hasText:'Add-on berhasil diubah.'}).waitFor();assert.equal((await db.addOn.findUniqueOrThrow({where:{id:'fixture-addon'}})).price,0);results.push('real zero-price addon edit');
 const newPackage=await api('/api/packages','POST',{type:'package',name:'Paket Hapus Dummy',price:0,duration:30,features:[]});await api('/api/packages/'+newPackage.package.id,'DELETE');assert.equal(await db.package.count(),1);
 const newAddon=await api('/api/packages','POST',{type:'addon',name:'Add-on Hapus Dummy',price:100});await api('/api/packages/'+newAddon.addon.id+'?type=addon','DELETE');assert.equal(await db.addOn.count(),1);results.push('package/addon create and unreferenced delete');
 await api('/api/packages/fixture-package','PUT',{type:'package',price:-1},400);await api('/api/packages/nonexistent','PUT',{type:'package',name:'Tidak Ada'},404);assert.equal((await db.package.findUniqueOrThrow({where:{id:'fixture-package'}})).price,120000);results.push('invalid edit rejected without persistence, missing404');
 await page.goto(origin+'/admin/settings');await page.getByLabel('JEDA ANTARSESI (MENIT)',{exact:true}).fill('15');await page.getByRole('button',{name:/Simpan/}).click();await page.getByRole('status').filter({hasText:'Pengaturan studio berhasil diperbarui.'}).waitFor();assert.equal((await db.studioConfig.findUniqueOrThrow({where:{id:'default'}})).bufferMinutes,15);results.push('real settings form persists and audits');
 const input={packageId:'fixture-package',clientName:'Pelanggan Dummy',clientPhone:'080000000000',clientEmail:'dummy@example.invalid',date:'2099-01-02',startTime:'10:00',addOnIds:['fixture-addon']};
 const createdBooking=await api('/api/bookings','POST',input);const booking=createdBooking.booking;
 assert.equal(booking.totalPrice,120000);await api('/api/bookings','POST',{...input,startTime:'11:00'},409);let availability=await api('/api/bookings/available-slots?date=2099-01-02&packageId=fixture-package');assert.equal(availability.slots.find((s:{time:string})=>s.time==='10:00').available,false);results.push('customer booking writes, prices snapshotted, availability/buffer collision');
 const moved=await api(`/api/bookings/${booking.id}/reschedule`,'PATCH',{date:booking.date,startTime:'13:00',expectedUpdatedAt:booking.updatedAt});assert.equal(moved.booking.endTime,'14:00');await api(`/api/bookings/${booking.id}/reschedule`,'PATCH',{date:booking.date,startTime:'15:00',expectedUpdatedAt:booking.updatedAt},409);results.push('reschedule persisted and stale update409');
 const payment={amount:20000,kind:'PAYMENT',method:'CASH',requestKey:randomUUID()};await api(`/api/bookings/${booking.id}/payments`,'POST',payment,201);await api(`/api/bookings/${booking.id}/payments`,'POST',payment,201);assert.equal(await db.bookingPayment.count(),1);await api(`/api/bookings/${booking.id}/payments`,'POST',{...payment,amount:200000,requestKey:randomUUID()},409);await api(`/api/bookings/${booking.id}/payments`,'POST',{...payment,kind:'REFUND',amount:10000,requestKey:randomUUID()},201);assert.equal((await api(`/api/bookings/${booking.id}/payments`)).paidAmount,10000);results.push('real payment/refund ledger and idempotent retry');
 await api('/api/admin/blocks','POST',{date:booking.date,startTime:'13:00',endTime:'14:00',reason:'Bentrok dummy'},409);const block=await api('/api/admin/blocks','POST',{date:booking.date,startTime:'16:00',endTime:'17:00',reason:'Istirahat dummy'},201);availability=await api('/api/bookings/available-slots?date=2099-01-02&packageId=fixture-package');assert.equal(availability.slots.find((s:{time:string})=>s.time==='16:00').available,false);await api('/api/admin/blocks/'+block.block.id,'DELETE');assert.equal(await db.scheduleBlock.count(),0);results.push('time blocks persisted, availability updates, reopening');
 await api(`/api/bookings/${booking.id}/status`,'PATCH',{status:'CONFIRMED'});await api(`/api/bookings/${booking.id}`,'DELETE');const archived=await db.booking.findUniqueOrThrow({where:{id:booking.id}});assert.ok(archived.archivedAt);assert.equal(archived.status,'CANCELLED');assert.equal(await db.bookingPayment.count(),2);assert.ok((await api(`/api/bookings/${booking.id}/history`)).events.some((e:{action:string})=>e.action==='BOOKING_ARCHIVED'));results.push('status/archive preserve booking and payment history');
 const deletedPackage=await api('/api/packages/fixture-package','DELETE');assert.ok(deletedPackage.message.includes('diarsipkan'));assert.equal((await db.package.findUniqueOrThrow({where:{id:'fixture-package'}})).isActive,false);await api('/api/packages/fixture-addon?type=addon','DELETE');assert.equal((await db.addOn.findUniqueOrThrow({where:{id:'fixture-addon'}})).isActive,false);results.push('referenced catalog entries archived, relations preserved');
 const photo=await api('/api/gallery','POST',{url:'https://example.com/dummy.jpg',title:'Foto Dummy'});assert.equal(await db.showcaseImage.count(),1);await api('/api/gallery/'+photo.image.id,'DELETE');await api('/api/gallery/'+photo.image.id,'DELETE',undefined,404);assert.equal(await db.showcaseImage.count(),0);results.push('gallery create/delete and missing404');
 assert.deepEqual(errors,[]);await context.close();fs.mkdirSync('docs/audits/2026-10-19/database-mutations',{recursive:true});fs.writeFileSync('docs/audits/2026-10-19/database-mutations/results.json',JSON.stringify({scope:'private random fixture schema; no public customer writes',results},null,2));console.log(JSON.stringify({passed:results.length,results}));
}finally{
 await browser?.close();if(child){child.kill();await new Promise<void>(resolve=>{if(child!.exitCode!==null)resolve();else child!.once('exit',()=>resolve());});}
 if(path.dirname(fixtureBuild)===path.resolve('.tmp')&&/^qa_crud_[a-f0-9]{32}_build$/.test(path.basename(fixtureBuild)))fs.rmSync(fixtureBuild,{recursive:true,force:true});
 await db.$disconnect();if(created)await control.$executeRawUnsafe(`DROP SCHEMA "${namespace}" CASCADE`);await control.$disconnect();
}
