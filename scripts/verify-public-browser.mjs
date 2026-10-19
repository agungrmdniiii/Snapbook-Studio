import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base='https://snapbook-studio.vercel.app';
const folder='docs/audits/2026-10-19/browser';
fs.mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];const checks=[];
try {
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
  const context=await browser.newContext({viewport});
  // This smoke test may read pages and availability, but cannot submit reservations.
  await context.route('**/*',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Home overflow');
  await page.screenshot({path:`${folder}/home-${viewport.width}.png`});
  await page.goto(base+'/book?packageId=pkg-self-portrait',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/^09:00/}).click();
  await page.getByRole('button',{name:'Lanjutkan',exact:true}).click();
  await page.getByRole('heading',{name:'Layanan Tambahan (Add-ons)',exact:true}).waitFor();
  await page.getByRole('button',{name:'Lanjutkan',exact:true}).click();
  await page.getByRole('heading',{name:'Informasi Pemesan',exact:true}).waitFor();
  await page.evaluate(() => window.scrollTo(0,0));
  await page.locator('.animate-studio-fade').evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations()).map(animation => animation.finished.catch(() => {}))));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Booking overflow');
  await page.screenshot({path:`${folder}/booking-${viewport.width}.png`});
  await page.goto(base+'/cek-booking',{waitUntil:'networkidle'});
  await page.getByRole('textbox',{name:'Kode booking',exact:true}).fill('SB-DUMMY');
  await page.getByRole('button',{name:'Lacak Jadwal'}).click();
  await page.getByText('Masukkan kode booking dan nomor WhatsApp yang digunakan saat memesan.').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Tracking overflow');
  await page.screenshot({path:`${folder}/tracking-${viewport.width}.png`});
  await page.goto(base+'/admin/login',{waitUntil:'networkidle'});
  assert.equal(await page.getByText('adminpassword123',{exact:false}).count(),0);
  checks.push({width:viewport.width,home:true,bookingSteps:true,trackingRequiresPhone:true,publishedDefaultPassword:false,horizontalOverflow:false});
  await context.close();
 }
 assert.deepEqual(errors,[],'Browser runtime errors');
 fs.writeFileSync(`${folder}/results.json`,JSON.stringify({checks,errors,noBookingSubmitted:true},null,2));
 console.log(JSON.stringify({checks,errors,noBookingSubmitted:true}));
} finally {await browser.close();}
