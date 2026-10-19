'use client';
import React,{useEffect,useRef,useState} from 'react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatIDR,formatDateIndonesian } from '@/lib/utils';
export type CalendarBooking={id:string;bookingCode:string;clientName:string;date:string;startTime:string;endTime:string;status:string;updatedAt:string;totalPrice:number;paidAmount:number;hasConflict:boolean;package:{name:string;duration:number}};
type Payment={id:string;amount:number;method:string;reference:string|null;createdAt:string;recordedByUsername:string};
type Event={id:string;action:string;actorUsername:string;createdAt:string;before?:{date?:string;startTime?:string};after?:{date?:string;startTime?:string}};
const actionLabels:Record<string,string>={BOOKING_CREATED:'Reservasi dibuat',BOOKING_RESCHEDULED:'Jadwal dipindahkan',BOOKING_STATUS_CHANGED:'Status diperbarui',BOOKING_ARCHIVED:'Reservasi diarsipkan',PAYMENT_RECORDED:'Pembayaran dicatat',REFUND_RECORDED:'Pengembalian dicatat'};
export async function readResponse(response:Response){const data=await response.json();if(!response.ok)throw new Error(data.error||'Permintaan gagal. Silakan coba kembali.');return data;}
export function BookingOperations({booking,onClose,onChanged}:{booking:CalendarBooking;onClose:()=>void;onChanged:(updated?:CalendarBooking)=>void}){
 const setMessage = useToast();
 const [date,setDate]=useState(booking.date),[time,setTime]=useState(booking.startTime),[amount,setAmount]=useState(''),[kind,setKind]=useState('PAYMENT'),[method,setMethod]=useState('TRANSFER'),[reference,setReference]=useState('');
 const [payments,setPayments]=useState<Payment[]>([]),[paid,setPaid]=useState(booking.paidAmount),[events,setEvents]=useState<Event[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),requestKey=useRef('');
 useEffect(()=>{requestKey.current=crypto.randomUUID();},[amount,kind,method,reference]);
 useEffect(()=>{
  const controller=new AbortController();
  Promise.all([fetch(`/api/bookings/${booking.id}/payments`,{signal:controller.signal,cache:'no-store'}).then(readResponse),fetch(`/api/bookings/${booking.id}/history`,{signal:controller.signal,cache:'no-store'}).then(readResponse)])
   .then(([p,h])=>{if(!controller.signal.aborted){setPayments(p.payments);setPaid(p.paidAmount);setEvents(h.events);setLoaded(true);}})
   .catch(e=>{if(!controller.signal.aborted)setError(e.message);});
  return()=>controller.abort();
 },[booking.id]);
 async function run(work:()=>Promise<void>){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{await work();}catch(e){setError(e instanceof Error?e.message:'Permintaan gagal.');}finally{pending.current=false;setBusy(false);}}
 async function refreshHistory(){try{const h=await fetch(`/api/bookings/${booking.id}/history`,{cache:'no-store'}).then(readResponse);setEvents(h.events);}catch{setError('Perubahan tersimpan, tetapi riwayat belum berhasil dimuat ulang.');}}
 const control='w-full min-w-0 rounded-xl border border-neutral-700 bg-[#0c0c0e] p-3 text-sm text-white';
 return <Modal isOpen onClose={()=>{if(!busy)onClose();}} title={booking.bookingCode} maxWidth="2xl">
  <div className="max-h-[74vh] overflow-y-auto pr-1 space-y-6">
   <div><p className="text-lg text-white">{booking.clientName}</p><p className="text-sm text-neutral-400">{booking.package.name} · {formatDateIndonesian(booking.date)} · {booking.startTime}–{booking.endTime} WIB</p></div>
   {booking.hasConflict&&<p role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">Jadwal ini bertabrakan. Pastikan kesepakatan dengan pelanggan sebelum memindahkannya.</p>}
   {error&&<div role="alert" className="rounded-xl bg-rose-950/50 p-3 text-sm text-rose-200">{error}<button disabled={busy} onClick={()=>run(async()=>{const [b,p,h]=await Promise.all([fetch(`/api/bookings/${booking.id}`,{cache:'no-store'}).then(readResponse),fetch(`/api/bookings/${booking.id}/payments`,{cache:'no-store'}).then(readResponse),fetch(`/api/bookings/${booking.id}/history`,{cache:'no-store'}).then(readResponse)]);onChanged(b);setDate(b.date);setTime(b.startTime);setPayments(p.payments);setPaid(p.paidAmount);setEvents(h.events);setLoaded(true);setMessage('Detail jadwal dan pembayaran dimuat ulang.');})} className="block underline mt-2">Muat ulang detail jadwal</button></div>}
   <section className="border-t border-neutral-800 pt-4 space-y-3"><h3 className="text-white font-medium">Pindahkan jadwal</h3>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();run(async()=>{const result=await fetch(`/api/bookings/${booking.id}/reschedule`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,startTime:time,expectedUpdatedAt:booking.updatedAt})}).then(readResponse);onChanged(result.booking);setMessage('Jadwal berhasil dipindahkan. Beri tahu pelanggan melalui WhatsApp.');await refreshHistory();});}}>
     <div className="grid grid-cols-2 gap-3"><Input label="Tanggal baru" type="date" required value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/><Input label="Jam mulai baru (WIB)" type="time" required value={time} onChange={e=>setTime(e.target.value)} disabled={busy}/></div>
     <Button type="submit" size="sm" isLoading={busy} loadingLabel="Memproses…" disabled={!['PENDING','CONFIRMED'].includes(booking.status)}>Simpan jadwal baru</Button>
    </form>
   </section>
   <section className="border-t border-neutral-800 pt-4 space-y-3"><h3 className="text-white font-medium">Pembayaran / DP</h3>
    <div className="grid grid-cols-3 gap-2 text-xs text-neutral-400"><p>Total<strong className="block text-white mt-1">{formatIDR(booking.totalPrice)}</strong></p><p>Tercatat<strong className="block text-white mt-1">{formatIDR(paid)}</strong></p><p>Sisa<strong className="block text-white mt-1">{formatIDR(booking.totalPrice-paid)}</strong></p></div>
    <p className="text-xs text-neutral-400">Pencatatan ini tidak mengubah status reservasi secara otomatis.</p>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();run(async()=>{const result=await fetch(`/api/bookings/${booking.id}/payments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:Number(amount),kind,method,reference,requestKey:requestKey.current})}).then(readResponse);setPayments(result.payments);setPaid(result.paidAmount);setAmount('');requestKey.current=crypto.randomUUID();onChanged();setMessage('Transaksi berhasil dicatat.');await refreshHistory();});}}>
     <div className="grid grid-cols-2 gap-3"><label className="text-xs text-neutral-400 space-y-2">Jenis transaksi<select aria-label="Jenis transaksi" className={control} value={kind} onChange={e=>setKind(e.target.value)} disabled={busy}><option value="PAYMENT">Pembayaran / DP</option><option value="REFUND">Pengembalian</option></select></label><label className="text-xs text-neutral-400 space-y-2">Metode<select aria-label="Metode pembayaran" className={control} value={method} onChange={e=>setMethod(e.target.value)} disabled={busy}><option value="TRANSFER">Transfer</option><option value="CASH">Tunai</option><option value="OTHER">Lainnya</option></select></label></div>
     <Input label="Jumlah (Rp)" type="number" min="1" step="1" required value={amount} onChange={e=>setAmount(e.target.value)} disabled={busy}/><Input label="Referensi transaksi (opsional)" maxLength={500} value={reference} onChange={e=>setReference(e.target.value)} disabled={busy}/>
     <Button type="submit" size="sm" isLoading={busy} loadingLabel="Memproses…" disabled={!loaded}>Catat transaksi</Button>
    </form>
    {!loaded&&<p className="text-xs text-neutral-400">Memuat catatan pembayaran…</p>}
    <ul className="space-y-2">{payments.map(p=><li key={p.id} className="text-xs text-neutral-400 border-t border-neutral-800 pt-2"><span className="text-white">{p.amount<0?'Pengembalian':'Pembayaran'} {formatIDR(Math.abs(p.amount))}</span> · {p.method==='TRANSFER'?'Transfer':p.method==='CASH'?'Tunai':'Lainnya'} · {p.recordedByUsername}{p.reference&&<span className="block break-words">Referensi: {p.reference}</span>}</li>)}</ul>
   </section>
   <section className="border-t border-neutral-800 pt-4"><h3 className="text-white font-medium mb-3">Riwayat perubahan</h3>{events.length===0?<p className="text-xs text-neutral-400">Belum ada riwayat perubahan yang tercatat.</p>:<ul className="space-y-3">{events.map(e=><li key={e.id} className="text-xs text-neutral-400"><strong className="text-neutral-200">{actionLabels[e.action]||'Perubahan reservasi'}</strong> · {e.actorUsername}<span className="block">{new Date(e.createdAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})} WIB</span>{e.action==='BOOKING_RESCHEDULED'&&<span className="block">{e.before?.date} {e.before?.startTime} → {e.after?.date} {e.after?.startTime}</span>}</li>)}</ul>}</section>
  </div>
 </Modal>;
}
