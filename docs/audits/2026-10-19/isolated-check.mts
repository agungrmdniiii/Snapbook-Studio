// Diagnostic reproduction of current behavior; database calls are replaced in memory.
import fs from 'node:fs';
import crypto from 'node:crypto';
process.env.DATABASE_URL='postgresql://audit:audit@127.0.0.1:1/audit?connect_timeout=1';
process.env.DIRECT_URL=process.env.DATABASE_URL;
const {prisma}=await import('../../../src/lib/prisma');
const {POST}=await import('../../../src/app/api/bookings/route');
const {GET:slots}=await import('../../../src/app/api/bookings/available-slots/route');
const {verifySessionToken}=await import('../../../src/lib/auth');
const config={id:'default',openingTime:'09:00',closingTime:'20:00',slotDuration:60,whatsappNumber:'620000000000'};
let selectedPackage:any={id:'audit-pkg',name:'Audit',price:150000,duration:90,isActive:true};
let existing:any[]=[];
const db:any=prisma;
db.package.findUnique=async()=>selectedPackage;
db.addOn.findMany=async()=>[];
db.studioConfig.findUnique=async()=>config;
db.$transaction=async(fn:any)=>fn({booking:{findFirst:async({where}:any)=>existing.find(b=>b.date===where.date&&b.startTime===where.startTime&&where.status.in.includes(b.status))??null,create:async({data}:any)=>({...data,id:'audit-only-in-memory',package:selectedPackage??{name:'Fallback',price:150000},addOns:[]})}});
const baseline={packageId:'audit-pkg',clientName:'Audit Dummy',clientPhone:'080000000000',date:'2030-11-20',startTime:'10:00',addOnIds:[]};
const results:any[]=[];
async function check(name:string,override:any={}){const response=await POST(new Request('http://audit.invalid/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...baseline,...override})}));const body=await response.json();results.push({name,status:response.status,accepted:response.ok,resolvedPackage:body.booking?.packageId,endTime:body.booking?.endTime});}
existing=[{date:baseline.date,startTime:'09:00',endTime:'10:30',status:'CONFIRMED'}];
await check('90-minute booking at 09:00 does not block 10:00');
existing=[];
await check('Past date and arbitrary after-hours start accepted',{date:'2020-01-01',startTime:'23:17'});
selectedPackage={...selectedPackage,isActive:false};await check('Inactive package accepted');
selectedPackage=null;await check('Unknown package silently replaced',{packageId:'does-not-exist'});
db.booking.findMany=async()=>{throw new Error('ISOLATED_AUDIT_DATABASE_UNAVAILABLE')};
const response=await slots(new Request('http://audit.invalid/api/bookings/available-slots?date=2030-11-20'));const body=await response.json();results.push({name:'Availability database failure',status:response.status,advertisedAvailable:body.slots.filter((s:any)=>s.available).length,totalSlots:body.slots.length});
const source=fs.readFileSync(new URL('../../../src/lib/auth.ts',import.meta.url),'utf8');
const fallback=source.match(/SESSION_SECRET \|\| '([^']+)'/)?.[1];
if(fallback){const data=Buffer.from(JSON.stringify({id:'audit-only',username:'audit',iat:946684800000})).toString('base64url');const sig=crypto.createHmac('sha256',fallback).update(data).digest('base64url');results.push({name:'Token issued in year 2000 accepted',accepted:verifySessionToken(data+'.'+sig)!==null});}
fs.writeFileSync(new URL('./isolated-results.json',import.meta.url),JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));await prisma.$disconnect();
