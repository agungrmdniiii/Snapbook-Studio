import { Check, ChevronDown } from 'lucide-react';
import { parsePackageFeatures } from '@/lib/package-features';

export function PackageFeatures({ value }: { value: string }) {
  const features = parsePackageFeatures(value);
  if (!features.length) return <p className="studio-package-empty">Fasilitas belum dicantumkan.</p>;
  function list(items: string[]) {
    return <ul>{items.map((feature, index) => <li key={index}><Check size={15} aria-hidden="true" /><span>{feature}</span></li>)}</ul>;
  }
  return <div className="studio-package-features">
    {list(features.slice(0, 2))}
    {features.length > 2 && <details><summary>{features.length - 2} fasilitas lainnya <ChevronDown size={15} aria-hidden="true" /></summary>{list(features.slice(2))}</details>}
  </div>;
}
