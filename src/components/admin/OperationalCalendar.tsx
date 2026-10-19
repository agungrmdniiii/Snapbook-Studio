'use client';
import React,{useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { calendarDates,shiftCalendarDate,studioToday } from '@/lib/calendar-dates';
import { formatDateIndonesian } from '@/lib/utils';
import { useVisibleRefresh } from './useVisibleRefresh';
import { BookingOperations,CalendarBooking,readResponse } from './BookingOperations';
import { validDate } from '@/lib/scheduling';
type Block={id:string;date:string;startTime:string;endTime:string;reason:string};
type Data={bookings:CalendarBooking[];blocks:Block[];config:{bufferMinutes:number}};
export function OperationalCalendar({initialDate,initialBookingId}:{initialDate?:string;initialBookingId?:string}){
 const notify = useToast();
 const [date,setDate]=useState(()=>initialDate&&validDate(initialDate)?initialDate:studioToday()),[view,setView]=useState<'day'|'week'>('week'),[data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState<CalendarBooking|null>(null),[showBlock,setShowBlock]=useState(false),[saving,setSaving]=useState(false);
 const openedInitial=useRef(false);
 const [blockDate,setBlockDate]=useState(studioToday),[start,setStart]=useState('09:00'),[end,setEnd]=useState('10:00'),[allDay,setAllDay]=useState(false),[reason,setReason]=useState(''),[formError,setFormError]=useState('');
 const days=calendarDates(date,view),from=days[0],to=days[days.length-1];
 const request=useRef<AbortController|null>(null),inFlight=useRef(false),version=useRef(0);
 async function load(quiet=false){
  if(quiet&&inFlight.current)return;
  request.current?.abort();const controller=new AbortController();request.current=controller;inFlight.current=true;const current=++version.current;
  if(!quiet)setLoading(true);
  try{const result=await fetch(`/api/admin/calendar?from=${from}&to=${to}`,{cache:'no-store',signal:controller.signal}).then(readResponse);if(!controller.signal.aborted&&current===version.current){setData(result);setError('');}}
  catch(e){if(!controller.signal.aborted&&current===version.current)setError(e instanceof Error?e.message:'Kalender belum dapat dimuat.');}
  finally{if(current===version.current){inFlight.current=false;setLoading(false);}}
 }
 useEffect(()=>{load();return()=>request.current?.abort();},[from,to]);
 useVisibleRefresh(()=>load(true));
 useEffect(()=>{if(data&&initialBookingId&&!openedInitial.current){const b=data.bookings.find(b=>b.id===initialBookingId);if(b){setSelected(b);openedInitial.current=true;}}},[data,initialBookingId]);
 const conflicts=data?.bookings.filter(b=>b.hasConflict).length??0;
 async function removeBlock(block:Block){if(saving||!confirm(`Buka kembali waktu ${block.startTime}–${block.endTime} pada ${formatDateIndonesian(block.date)}?`))return;setSaving(true);try{await fetch(`/api/admin/blocks/${block.id}`,{method:'DELETE'}).then(readResponse);notify('Blok waktu berhasil dibuka kembali.');await load(true);}catch(e){setError(e instanceof Error?e.message:'Gagal membuka blok.');}finally{setSaving(false);}}
 return <div className="space-y-6 max-w-7xl min-w-0">
  <header className="flex flex-wrap gap-3 justify-between"><div><h1 className="font-serif text-3xl text-white">Kalender Studio</h1><p className="text-sm text-neutral-400 mt-2">Atur agenda, pindah jadwal, dan catat DP. Semua jam mengikuti WIB.</p></div><Link href="/admin/bookings" className="text-sm text-neutral-300 underline self-center">Lihat daftar reservasi</Link></header>
  <div className="flex flex-wrap gap-2 items-center"><Button variant="outline" size="sm" onClick={()=>setDate(shiftCalendarDate(date,view==='week'?-7:-1))}>Sebelumnya</Button><Button variant="outline" size="sm" onClick={()=>setDate(studioToday())}>Hari ini</Button><Button variant="outline" size="sm" onClick={()=>setDate(shiftCalendarDate(date,view==='week'?7:1))}>Berikutnya</Button><input aria-label="Tanggal kalender" type="date" value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}} className="min-w-0 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm"/><Button size="sm" variant={view==='day'?'primary':'outline'} onClick={()=>setView('day')}>Harian</Button><Button size="sm" variant={view==='week'?'primary':'outline'} onClick={()=>setView('week')}>Mingguan</Button><Button size="sm" variant="outline" onClick={()=>load()} disabled={loading}>Muat ulang</Button><Button size="sm" onClick={()=>{setBlockDate(date);setFormError('');setShowBlock(true);}}>Blok waktu / libur</Button></div>
  {error&&<p role="alert" className="bg-rose-950/40 rounded-xl p-4 text-sm text-rose-200">{error}</p>}
  {conflicts>0&&<p role="alert" className="border border-amber-800 bg-amber-950/30 rounded-xl p-4 text-sm text-amber-200">{conflicts} reservasi pada rentang ini bertabrakan. Jadwal lama tetap disimpan; pilih kartu untuk meninjau dan memindahkan jadwal bersama pelanggan.</p>}
  <p className="text-xs text-neutral-400">Jeda antarsesi: {data?.config.bufferMinutes??0} menit. Diperbarui setiap 30 detik saat halaman aktif.</p>
  {loading&&!data?<p role="status" className="text-neutral-400 py-10">Memuat kalender…</p>:<div className="overflow-x-auto max-w-full rounded-2xl border border-neutral-800" role="region" aria-label="Agenda studio" tabIndex={0}><div className="grid" style={{gridTemplateColumns:`repeat(${days.length},minmax(${view==='week'?'175':'260'}px,1fr))`}}>{days.map(day=><section key={day} className="min-w-0 p-3 border-r border-neutral-800 last:border-r-0 bg-[#101013] space-y-3"><h2 className="text-sm font-medium text-white pb-3 border-b border-neutral-800">{formatDateIndonesian(day)}</h2>
   {data?.blocks.filter(b=>b.date===day).map(b=><div key={b.id} className="p-3 rounded-xl border border-neutral-600 bg-neutral-800/60"><p className="text-xs text-neutral-300">Ditutup · {b.startTime}–{b.endTime}</p><p className="text-sm text-white break-words my-2">{b.reason}</p><button disabled={saving} onClick={()=>removeBlock(b)} className="text-xs underline text-neutral-300 disabled:opacity-40">Buka kembali</button></div>)}
   {data?.bookings.filter(b=>b.date===day).map(b=><button key={b.id} onClick={()=>setSelected(b)} className={`w-full text-left p-3 rounded-xl border space-y-2 focus-visible:ring-2 focus-visible:ring-white ${b.hasConflict?'border-rose-600 bg-rose-950/30':b.status==='PENDING'?'border-amber-900 bg-amber-950/15':'border-neutral-700 bg-neutral-900'}`}><span className="block font-mono text-xs text-white">{b.startTime}–{b.endTime}</span><strong className="block text-sm text-white break-words">{b.clientName}</strong><span className="block text-xs text-neutral-400">{b.package.name}</span><span className="block text-[11px] text-neutral-300">{b.status==='PENDING'?'Menunggu DP':b.status==='CONFIRMED'?'Terkonfirmasi':'Selesai'}{b.hasConflict?' · Bentrok':''}</span><span className="block text-[11px] text-neutral-400">{b.paidAmount>=b.totalPrice?'Lunas':b.paidAmount>0?'DP tercatat':'Belum ada pembayaran'}</span></button>)}
   {!data?.bookings.some(b=>b.date===day)&&!data?.blocks.some(b=>b.date===day)&&<p className="text-xs text-neutral-500 py-10">Belum ada agenda.</p>}
  </section>)}</div></div>}
  {selected&&<BookingOperations key={selected.id} booking={selected} onClose={()=>setSelected(null)} onChanged={updated=>{if(updated)setSelected({...selected,...updated});load(true);}}/>}
  <Modal isOpen={showBlock} onClose={()=>{if(!saving)setShowBlock(false);}} title="Blok waktu atau hari libur" maxWidth="md"><form className="space-y-4" onSubmit={async e=>{e.preventDefault();if(saving)return;setSaving(true);setFormError('');try{await fetch('/api/admin/blocks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:blockDate,startTime:allDay?'00:00':start,endTime:allDay?'23:59':end,reason})}).then(readResponse);setShowBlock(false);setReason('');notify('Blok waktu berhasil disimpan.');await load(true);}catch(e){setFormError(e instanceof Error?e.message:'Blok belum dapat disimpan.');}finally{setSaving(false);}}}>
   <Input label="Tanggal blok" type="date" value={blockDate} onChange={e=>setBlockDate(e.target.value)} required disabled={saving}/><label className="flex gap-2 text-sm text-neutral-300"><input type="checkbox" checked={allDay} onChange={e=>setAllDay(e.target.checked)} disabled={saving}/>Tutup sepanjang hari</label>
   {!allDay&&<div className="grid grid-cols-2 gap-3"><Input label="Mulai (WIB)" type="time" value={start} onChange={e=>setStart(e.target.value)} required disabled={saving}/><Input label="Sampai (WIB)" type="time" value={end} onChange={e=>setEnd(e.target.value)} required disabled={saving}/></div>}
   <Input label="Alasan penutupan" value={reason} onChange={e=>setReason(e.target.value)} maxLength={200} required disabled={saving}/><p className="text-xs text-neutral-400">Waktu yang sudah memiliki reservasi aktif tidak dapat ditutup. Pindahkan reservasi tersebut terlebih dahulu.</p>{formError&&<p role="alert" className="text-sm text-rose-300">{formError}</p>}<Button type="submit" isLoading={saving} loadingLabel="Menyimpan…">Simpan blok waktu</Button>
  </form></Modal>
 </div>;
}
