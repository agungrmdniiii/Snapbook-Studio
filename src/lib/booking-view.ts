/** Preserve the purchased package details when the live catalog changes. */
export function withBookedPackage<T extends {
  package: { name: string; price: number; duration: number };
  packageNameAtBooking?: string | null;
  packagePriceAtBooking?: number | null;
  packageDurationAtBooking?: number | null;
}>(booking: T): T {
  return { ...booking, package: {
    ...booking.package,
    name: booking.packageNameAtBooking ?? booking.package.name,
    price: booking.packagePriceAtBooking ?? booking.package.price,
    duration: booking.packageDurationAtBooking ?? booking.package.duration,
  } };
}
