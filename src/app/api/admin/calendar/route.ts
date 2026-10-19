import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/admin-session';
import { validDate } from '@/lib/scheduling';
import { withBookedPackage } from '@/lib/booking-view';
import { conflictIds, OperationError, operationFailure, privateHeaders } from '@/lib/studio-operations';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 try {
  if(!await getAdminSession())return NextResponse.json({error:'Tidak memiliki izin akses'},{status:401});
  const params=new URL(request.url).searchParams,from=params.get('from')??'',to=params.get('to')??'';
  if(!validDate(from)||!validDate(to)||from>to||(Date.parse(to)-Date.parse(from))/86400000>30)throw new OperationError('Pilih rentang kalender maksimal 31 hari.',400);
  const [config,bookings,blocks]=await Promise.all([
   prisma.studioConfig.findUnique({where:{id:'default'}}),
   prisma.booking.findMany({where:{date:{gte:from,lte:to},archivedAt:null,status:{in:['PENDING','CONFIRMED','COMPLETED']}},include:{package:true,addOns:{include:{addOn:true}},payments:{select:{amount:true}}},orderBy:[{date:'asc'},{startTime:'asc'},{id:'asc'}],take:1001}),
   prisma.scheduleBlock.findMany({where:{date:{gte:from,lte:to}},orderBy:[{date:'asc'},{startTime:'asc'}],take:1001}),
  ]);
  if(!config)throw new OperationError('Pengaturan studio belum tersedia.',503);
  if(bookings.length>1000||blocks.length>1000)throw new OperationError('Terlalu banyak agenda. Persempit rentang kalender.',422);
  const conflicts=conflictIds(bookings,blocks,config.bufferMinutes);
  const rows=bookings.map(({payments,...b})=>({...withBookedPackage(b),paidAmount:payments.reduce((s,p)=>s+p.amount,0),hasConflict:conflicts.has(b.id)}));
  return NextResponse.json({from,to,config:{openingTime:config.openingTime,closingTime:config.closingTime,slotDuration:config.slotDuration,bufferMinutes:config.bufferMinutes},bookings:rows,blocks},{headers:privateHeaders});
 }catch(error){return operationFailure(error);}
}
