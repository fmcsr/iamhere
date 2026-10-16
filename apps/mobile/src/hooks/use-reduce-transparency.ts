import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** iOS "Saydamlığı Azalt" ayarı. Açıksa cam yerine opak yüzey kullanılır (TASARIM.md §2.3). */
export function useReduceTransparency(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
