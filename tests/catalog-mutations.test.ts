import 'next/dist/server/node-environment';
import assert from 'node:assert/strict';
import {test,type TestContext} from 'node:test';
import {NextRequest} from 'next/server';
import {createRequestStoreForAPI} from 'next/dist/server/async-storage/request-store';
import {workAsyncStorage} from 'next/dist/server/app-render/work-async-storage.external';
import {workUnitAsyncStorage} from 'next/dist/server/app-render/work-unit-async-storage.external';
import {createSessionToken} from '../src/lib/auth';
import {prisma} from '../src/lib/prisma';
import {PUT,DELETE} from '../src/app/api/packages/[id]/route';
import {POST} from '../src/app/api/packages/route';
import {DELETE as deletePhoto} from '../src/app/api/gallery/[id]/route';
const form={type:'package',name:'Paket Contoh',price:100000,description:'Deskripsi',duration:60,category:'Portrait',features:'["Satu sesi"]',isActive:true};
async function call(fn:any,body:unknown,method='PUT',authenticated=true,url='http://localhost/api/packages/test'){
 process.env.SESSION_SECRET='catalog-mutation-test-only-secret-at-least-32-bytes';
 const req=new NextRequest(url,{method,headers:{...(authenticated?{cookie:`snapbook_admin_session=${createSessionToken({id:'admin1',username:'admin'})}`}:{})},...(method==='DELETE'?{}:{body:typeof body==='symbol'?'{bad':JSON.stringify(body)})});
 const store=createRequestStoreForAPI(req,new URL(req.url),{tags:[],expirationsByCacheKind:new Map()},undefined,undefined);
 return workAsyncStorage.run({route:'/api/packages/test',isStaticGeneration:false,incrementalCache:{}} as any,()=>workUnitAsyncStorage.run(store,()=>fn(req,{params:Promise.resolve({id:'test'})})));
}
function mock(t:TestContext,obj:any,key:string,fn:any){const original=obj[key];obj[key]=fn;t.after(()=>{obj[key]=original;});}
function auth(t:TestContext){mock(t,prisma.adminUser,'findUnique',async()=>({id:'admin1',username:'admin',sessionVersion:0}));}
test('edit package accepts actual modal payload and preserves omitted order and image',async t=>{
 auth(t);let stored:any={...form,sortOrder:7,imageUrl:'https://example.com/original.jpg'};
 mock(t,prisma.package,'update',async({data}:any)=>{assert.ok(!('sortOrder' in data)||Number.isInteger(data.sortOrder),'sortOrder must not be NaN');stored={...stored,...Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined))};return{id:'test',...stored};});
 const r=await call(PUT,form);assert.equal(r.status,200);assert.equal(stored.sortOrder,7);assert.equal(stored.imageUrl,'https://example.com/original.jpg');assert.equal(stored.name,form.name);
});
test('catalog rejects malformed values before any database mutation',async t=>{
 auth(t);let writes=0;mock(t,prisma.package,'create',async()=>{writes++;return{};});mock(t,prisma.package,'update',async()=>{writes++;return{};});mock(t,prisma.addOn,'create',async()=>{writes++;return{};});
 for(const invalid of [{price:-1},{duration:0},{duration:1.5},{sortOrder:''},{sortOrder:null},{sortOrder:'bad'},{isActive:'true'},{name:[]},{name:' '},{features:'invalid JSON'},{features:'[1]'}, {type:'unknown'}, {price:2147483648}]){
  for(const [fn,method] of [[PUT,'PUT'],[POST,'POST']] as const)assert.equal((await call(fn,{...form,...invalid},method)).status,400,JSON.stringify(invalid));
 }
 assert.equal((await call(PUT,Symbol('invalid'))).status,400);assert.equal(writes,0);
});
test('missing catalog and gallery records return404 and FK conflicts409',async t=>{
 auth(t);mock(t,prisma.package,'update',async()=>{throw{code:'P2025'};});assert.equal((await call(PUT,form)).status,404);
 mock(t,prisma.booking,'count',async()=>0);mock(t,prisma.package,'delete',async()=>{throw{code:'P2003'};});assert.equal((await call(DELETE,undefined,'DELETE')).status,409);
 mock(t,prisma.showcaseImage,'delete',async()=>{throw{code:'P2025'};});assert.equal((await call(deletePhoto,undefined,'DELETE')).status,404);
});
test('catalog mutation endpoints require authentication',async()=>{
 for(const [fn,method] of [[PUT,'PUT'],[POST,'POST'],[DELETE,'DELETE']] as const)assert.equal((await call(fn,form,method,false)).status,401);
});

test('partial addon edits preserve omitted price and inactive state',async t=>{
 auth(t);let stored:any={id:'test',name:'Lama',price:15000,isActive:false};
 mock(t,prisma.addOn,'update',async({data}:any)=>{assert.ok(data.price===undefined||Number.isSafeInteger(data.price));stored={...stored,...Object.fromEntries(Object.entries(data).filter(([,v])=>v!==undefined))};return stored;});
 const r=await call(PUT,{type:'addon',name:'Nama baru'});assert.equal(r.status,200);assert.equal(stored.price,15000);assert.equal(stored.isActive,false);
});
