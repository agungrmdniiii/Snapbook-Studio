import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { audit, lockDates, OperationError, operationFailure, privateHeaders } from '@/lib/studio-operations';
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
 try{
  const actor=await getAdminSession();if(!actor)return NextResponse.json({error:'Tidak memiliki izin akses'},{status:401});const{id}=await params;
  await prisma.$transaction(async tx=>{
   const b=await tx.scheduleBlock.findUnique({where:{id}});if(!b)throw new OperationError('Blok tidak ditemukan.',404);
   await lockDates(tx,[b.date]);const current=await tx.scheduleBlock.findUnique({where:{id}});
   if(!current)throw new OperationError('Blok tidak ditemukan.',404);if(current.date!==b.date)throw new OperationError('Agenda berubah. Muat ulang kalender.');
   await tx.scheduleBlock.delete({where:{id}});await audit(tx,actor,'BLOCK_REMOVED',null,{id,date:b.date,startTime:b.startTime,endTime:b.endTime});
  });return NextResponse.json({success:true},{headers:privateHeaders});
 }catch(error){return operationFailure(error);}
}
