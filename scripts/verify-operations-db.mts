import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const db = new PrismaClient();
const namespace = `qa_snapbook_${randomUUID().replaceAll('-','')}`;
if(!/^qa_snapbook_[a-f0-9]{32}$/.test(namespace)) throw Error('Unsafe test namespace');
const q=`"${namespace}".`;
let created=false;
function statements(sql:string) {
 const parts:string[]=[];let start=0,quoted=false,dollar=false,comment=false;
 for(let i=0;i<sql.length;i++) {
  if(comment){if(sql[i]==='\n')comment=false;else continue;}
  if(!quoted&&!dollar&&sql.slice(i,i+2)==='--'){comment=true;i++;continue;}
  if(!quoted&&sql.slice(i,i+2)==='$$'){dollar=!dollar;i++;continue;}
  if(!dollar&&sql[i]==="'")quoted=!quoted;
  if(sql[i]===';'&&!quoted&&!dollar){parts.push(sql.slice(start,i));start=i+1;}
 }
 if(sql.slice(start).trim())parts.push(sql.slice(start));
 return parts.filter(s=>s.replace(/--[^\n]*/g,'').trim());
}
const booking=(id:string,date:string,start:string,end:string)=>`INSERT INTO ${q}"Booking" (id,date,"startTime","endTime",status,"totalPrice") VALUES ('${id}','${date}','${start}','${end}','CONFIRMED',100)`;
async function rejected(sql:string,code:string){await assert.rejects(db.$executeRawUnsafe(sql),error=>JSON.stringify(error).includes(code));}
try {
 await db.$executeRawUnsafe(`CREATE SCHEMA "${namespace}"`);created=true;
 await db.$executeRawUnsafe(`CREATE TABLE ${q}"StudioConfig" (id text PRIMARY KEY,"openingTime" text,"closingTime" text)`);
 await db.$executeRawUnsafe(`INSERT INTO ${q}"StudioConfig" VALUES ('default','09:00','20:00')`);
 await db.$executeRawUnsafe(`CREATE TABLE ${q}"Booking" (id text PRIMARY KEY,date text,"startTime" text,"endTime" text,status text,"archivedAt" timestamp,"totalPrice" integer)`);
 await db.$executeRawUnsafe(booking('legacy-a','2098-01-01','09:00','10:30'));
 await db.$executeRawUnsafe(booking('legacy-b','2098-01-01','10:00','11:00'));
 for(const sql of statements(fs.readFileSync('prisma/operations.sql','utf8').replaceAll('public.',q))) await db.$executeRawUnsafe(sql);
 await rejected(booking('legacy-overlap','2098-01-01','09:30','10:30'),'23P01');
 await db.$executeRawUnsafe(booking('adjacent','2098-01-01','11:00','12:00'));
 let signal!:()=>void;const inserted=new Promise<void>(resolve=>{signal=resolve;});
 const first=db.$transaction(async tx=>{await tx.$executeRawUnsafe(booking('race-a','2099-01-02','10:00','11:00'));signal();await new Promise(resolve=>setTimeout(resolve,200));});
 await inserted;
 const race=await Promise.allSettled([first,db.$executeRawUnsafe(booking('race-b','2099-01-02','10:30','11:30'))]);
 assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
 assert.match(JSON.stringify(race.find(r=>r.status==='rejected')),/23P01/);
 const block=(id:string,start:string,end:string)=>`INSERT INTO ${q}"ScheduleBlock" (id,date,"startTime","endTime",reason,"createdById","createdByUsername") VALUES ('${id}','2099-01-02','${start}','${end}','Dummy','test','test')`;
 await rejected(block('collision','10:30','11:30'),'23P01');
 await db.$executeRawUnsafe(block('closed','12:00','13:00'));
 await rejected(booking('during-block','2099-01-02','12:00','13:00'),'23P01');
 await db.$executeRawUnsafe(`UPDATE ${q}"StudioConfig" SET "bufferMinutes"=15`);
 await rejected(booking('buffer-collision','2099-01-02','11:00','11:30'),'23P01');
 await rejected(booking('late','2099-01-03','19:00','20:00'),'23514');
 const payment=(id:string,amount:number)=>`INSERT INTO ${q}"BookingPayment" (id,"requestKey","bookingId",amount,method,"recordedById","recordedByUsername") VALUES ('${id}','${id}','race-a',${amount},'CASH','test','test')`;
 const payments=await Promise.allSettled([db.$executeRawUnsafe(payment('pay-a',80)),db.$executeRawUnsafe(payment('pay-b',80))]);
 assert.equal(payments.filter(r=>r.status==='fulfilled').length,1);
 await rejected(payment('refund-over',-81),'23514');
 await db.$executeRawUnsafe(payment('refund',-20));
 await rejected(`UPDATE ${q}"BookingPayment" SET amount=1`,'55000');
 const rows=await db.$queryRawUnsafe<{legacy:bigint;paid:bigint}[]>(`SELECT (SELECT count(*) FROM ${q}"Booking" WHERE id LIKE 'legacy-%') AS legacy,(SELECT sum(amount) FROM ${q}"BookingPayment") AS paid`);
 assert.equal(Number(rows[0].legacy),2);assert.equal(Number(rows[0].paid),60);
 console.log('PASS: historical rows preserved, raw SQL overlap/block/buffer rejected, concurrent booking/payment serialized, refund bounds and append-only ledger enforced.');
} finally {
 if(created) await db.$executeRawUnsafe(`DROP SCHEMA "${namespace}" CASCADE`);
 await db.$disconnect();
}
