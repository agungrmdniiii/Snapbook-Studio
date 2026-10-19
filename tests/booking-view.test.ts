import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withBookedPackage } from '../src/lib/booking-view';
test('admin receipt keeps booked package details after catalog price and name change', () => {
  const booking={package:{name:'New catalog',price:999000,duration:120},packageNameAtBooking:'Booked portrait',packagePriceAtBooking:0,packageDurationAtBooking:30};
  const view=withBookedPackage(booking);
  assert.deepEqual(view.package,{name:'Booked portrait',price:0,duration:30});
  assert.equal(booking.package.price,999000);
});
test('legacy receipt falls back to available catalog without inventing history', () => {
  const booking={package:{name:'Legacy',price:100000,duration:60},packageNameAtBooking:null,packagePriceAtBooking:null,packageDurationAtBooking:null};
  assert.deepEqual(withBookedPackage(booking).package,booking.package);
});
