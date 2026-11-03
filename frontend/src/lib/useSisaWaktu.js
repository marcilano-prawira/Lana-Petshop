import { useEffect, useState } from 'react';

export default function useSisaWaktu(expiresAt) {
  const [sisa, setSisa] = useState(() => Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setSisa(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return sisa;
}
