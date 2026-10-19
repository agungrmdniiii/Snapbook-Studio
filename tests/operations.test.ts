import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { createRequestStoreForAPI } from 'next/dist/server/async-storage/request-store';
import { workAsyncStorage } from 'next/dist/server/app-render/work-async-storage.external';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { createSessionToken } from '../src/lib/auth';
import { prisma } from '../src/lib/prisma';
import { GET as calendar } from '../src/app/api/admin/calendar/route';
import { POST as payment } from '../src/app/api/bookings/[id]/payments/route';
import { PATCH as reschedule } from '../src/app/api/bookings/[id]/reschedule/route';
import { POST as block } from '../src/app/api/admin/blocks/route';
import { conflictIds, operationFailure } from '../src/lib/studio-operations';
const booking={id:'book1',date:'2099-01-02',startTime:'10:00',endTime:'11:00',status:'CONFIRMED',archivedAt:null,totalPrice:100000,updatedAt:new Date('2026-01-01'),packageDurationAtBooking:60,package:{name:'Paket',duration:60,price:100000}};
const config={openingTime:'09:00',closingTime:'20:00',slotDuration:60,bufferMinutes:0};
function setup(t:{after:(f:()=>void)=>void},tx:Record<string,unknown>){
 const originalAdmin=prisma.adminUser.findUnique,originalTx=prisma.$transaction;
 prisma.adminUser.findUnique=(async()=>({id:'admin1',username:'admin',sessionVersion:0})) as unknown as typeof originalAdmin;
 prisma.$transaction=(async(run:(db:unknown)=>Promise<unknown>)=>run(tx)) as typeof originalTx;
 t.after(()=>{prisma.adminUser.findUnique=originalAdmin;prisma.$transaction=originalTx;});
}
async function call(handler:(r:Request,c:any)=>Promise<Response>,body:unknown,authenticated=true,method='POST',url='http://localhost/api/test'){
 process.env.SESSION_SECRET='test-only-operations-secret-more-than-32-bytes';
 const r=new NextRequest(url,{method,headers:{...(authenticated?{cookie:`snapbook_admin_session=${createSessionToken({id:'admin1',username:'admin'})}`}:{})},...(method==='GET'?{}:{body:JSON.stringify(handler===payment?{...body as object,requestKey:"00000000-0000-4000-8000-000000000001"}:body)})});
 const store=createRequestStoreForAPI(r,new URL(r.url),{tags:[],expirationsByCacheKind:new Map()},undefined,undefined);
 return workAsyncStorage.run({route:'/api/test',isStaticGeneration:false} as Parameters<typeof workAsyncStorage.run>[0],()=>workUnitAsyncStorage.run(store,()=>handler(r,{params:Promise.resolve({id:'book1'})})));
}
test('operational APIs reject unauthenticated writes',async()=>{
 for(const fn of [payment,reschedule,block]) assert.equal((await call(fn,{},false)).status,401);
});
test('payment ledger rejects overpayment/refund and records valid payment with audit atomically',async t=>{
 let entries=0,audits=0;
 setup(t,{$queryRaw:async()=>[],booking:{findUnique:async()=>booking},bookingPayment:{findUnique:async()=>null,findMany:async()=>[{amount:80000}],create:async({data}:any)=>{entries++;return{id:'pay1',...data};}},auditEvent:{create:async()=>{audits++;}}});
 for(const body of [{amount:30000,kind:'PAYMENT'},{amount:90000,kind:'REFUND'}])assert.equal((await call(payment,{...body,method:'CASH'})).status,409);
 assert.equal(entries,0);
 const r=await call(payment,{amount:20000,kind:'PAYMENT',method:'TRANSFER'});assert.equal(r.status,201);
 assert.equal((await r.json()).balance,0);assert.equal(entries,1);assert.equal(audits,1);
});
test('reschedule rejects stale version and collision without updating customer data',async t=>{
 let writes=0;
 setup(t,{$executeRaw:async()=>0,$queryRaw:async()=>[],booking:{findUnique:async()=>booking,findFirst:async()=>booking,update:async()=>{writes++;}},studioConfig:{findUnique:async()=>config},scheduleBlock:{findFirst:async()=>null}});
 assert.equal((await call(reschedule,{date:'2099-01-02',startTime:'12:00',expectedUpdatedAt:'2025-01-01'},true,'PATCH')).status,409);
 assert.equal((await call(reschedule,{date:'2099-01-02',startTime:'12:00',expectedUpdatedAt:booking.updatedAt.toISOString()},true,'PATCH')).status,409);
 assert.equal(writes,0);
});
test('calendar is private, bounded and legacy conflicts are detected with buffer',async()=>{
 assert.equal((await call(calendar,undefined,false,'GET','http://localhost/api/admin/calendar?from=2099-01-01&to=2099-01-08')).status,401);
 const ids=conflictIds([booking,{...booking,id:'book2',startTime:'11:00',endTime:'12:00'}],[],15);
 assert.deepEqual([...ids].sort(),['book1','book2']);
 assert.equal(conflictIds([{...booking,status:'CANCELLED'},{...booking,id:'book2'}],[],0).size,0);
});
test('calendar rejects invalid or excessive date range before reading agendas',async t=>{
 setup(t,{});
 for(const query of ['from=2099-01-01&to=2099-02-01','from=2099-02-30&to=2099-03-01'])assert.equal((await call(calendar,undefined,true,'GET','http://localhost/api/admin/calendar?'+query)).status,400);
});
test('payment retry with same identity returns existing ledger without a duplicate write',async t=>{
 const existing={id:'pay1',bookingId:'book1',amount:20000,method:'TRANSFER',reference:null,notes:null,recordedById:'admin1'};
 setup(t,{$queryRaw:async()=>[],booking:{findUnique:async()=>booking},bookingPayment:{findMany:async()=>[existing],findUnique:async()=>existing,create:async()=>{throw Error('DUPLICATE_PAYMENT');}}});
 const r=await call(payment,{amount:20000,kind:'PAYMENT',method:'TRANSFER'});assert.equal(r.status,201);assert.equal((await r.json()).paidAmount,20000);
});
test('successful reschedule uses booked duration and writes history in the same transaction',async t=>{
 let audited=false;
 setup(t,{$executeRaw:async()=>0,$queryRaw:async()=>[],booking:{findUnique:async()=>({...booking,package:{...booking.package,duration:120}}),findFirst:async()=>null,update:async({data}:any)=>{assert.equal(data.endTime,'14:00');return{...booking,...data};}},studioConfig:{findUnique:async()=>config},scheduleBlock:{findFirst:async()=>null},auditEvent:{create:async({data}:any)=>{assert.equal(data.action,'BOOKING_RESCHEDULED');assert.equal(data.actorId,'admin1');audited=true;}}});
 const r=await call(reschedule,{date:'2099-01-02',startTime:'13:00',expectedUpdatedAt:booking.updatedAt.toISOString()},true,'PATCH');assert.equal(r.status,200);assert.equal(audited,true);
});
test('block cannot close occupied time but a free interval is stored with an audit event',async t=>{
 let occupied=true,writes=0,logged=false;
 setup(t,{$executeRaw:async()=>0,studioConfig:{findUnique:async()=>config},booking:{findFirst:async()=>occupied?booking:null},scheduleBlock:{findFirst:async()=>null,create:async({data}:any)=>{writes++;return{id:'block1',...data};}},auditEvent:{create:async()=>{logged=true;}}});
 const input={date:'2099-01-02',startTime:'10:00',endTime:'11:00',reason:'Libur contoh'};
 assert.equal((await call(block,input)).status,409);assert.equal(writes,0);
 occupied=false;assert.equal((await call(block,input)).status,201);assert.equal(writes,1);assert.equal(logged,true);
});

test('database collision errors are safe conflicts and unknown failures stay unavailable',async()=>{
 assert.equal(operationFailure({code:'P2010',meta:{code:'23P01'}}).status,409);
 assert.equal(operationFailure(null).status,503);
 assert.equal(operationFailure({code:'P2004'}).status,503);
});
