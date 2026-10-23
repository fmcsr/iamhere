/**
 * Türkiye cep numarası (giriş): yazılanın yalnızca rakamları; baştaki 0 ya da otomatik doldurulan +90 atılır.
 * Alan kendi yazısını değiştirmez (yazarken rakam kaçmasın diye); gruplama yalnızca gösterirken.
 */
export function phoneDigits(text: string) {
  const digits = text.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('90')) return digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** 10 hane ve 5 ile başlıyorsa cep numarası. */
export const isMobile = (digits: string) => /^5\d{9}$/.test(digits);

/** "5321234567" → "+90 532 123 45 67" */
export const formatPhone = (digits: string) => `+90 ${digits.replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')}`;
