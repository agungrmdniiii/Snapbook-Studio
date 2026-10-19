import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { validDate, wibNow, timeMinutes, minuteTime, BookingValidationError } from '@/lib/scheduling';
import { activeStatuses, audit, lockDates, OperationError, operationFailure, privateHeaders, requiredText } from '@/lib/studio-operations';
export async function POST(request:Request){
 try{
  const actor=await getAdminSession();if(!actor)return NextResponse.json({error:'Tidak memiliki izin akses'},{status:401});
  const body=await request.json();
  if(typeof body?.date!=='string'||!validDate(body.date)||body.date<wibNow().date||typeof body.startTime!=='string'||typeof body.endTime!=='string')throw new BookingValidationError('Tanggal dan jam blok tidak valid.');
  const start=timeMinutes(body.startTime),end=timeMinutes(body.endTime),reason=requiredText(body.reason,200)!;
  if(start>=end)throw new BookingValidationError('Jam akhir harus setelah jam mulai.');
  const block=await prisma.$transaction(async tx=>{
   await lockDates(tx,[body.date]);
   const config=await tx.studioConfig.findUnique({where:{id:'default'}});if(!config)throw new OperationError('Pengaturan studio belum tersedia.',503);
   const clash=await tx.booking.findFirst({where:{date:body.date,archivedAt:null,status:{in:activeStatuses},startTime:{lt:body.endTime},endTime:{gt:minuteTime(Math.max(0,start-config.bufferMinutes))}}});
   const existing=await tx.scheduleBlock.findFirst({where:{date:body.date,startTime:{lt:body.endTime},endTime:{gt:body.startTime}}});
   if(clash||existing)throw new OperationError('Blok waktu berbenturan dengan agenda aktif. Pindahkan reservasi terlebih dahulu.');
   const created=await tx.scheduleBlock.create({data:{date:body.date,startTime:body.startTime,endTime:body.endTime,reason,createdById:actor.id,createdByUsername:actor.username}});
   await audit(tx,actor,'BLOCK_CREATED',null,undefined,{id:created.id,date:created.date,startTime:created.startTime,endTime:created.endTime,reason});return created;
  });
  return NextResponse.json({block},{status:201,headers:privateHeaders});
 }catch(error){return operationFailure(error);}
}
