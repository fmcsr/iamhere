/** Hoş geldin ve giriş (K-09: telefon + Apple + Google). Prototipte her yol başarılı; gerçek doğrulama yok. */
export const tr = {
  tagline: 'Neredeysen oradakilerle konuş.',
  pitch: 'Mekâna gel, yerini bildir, bu gece orada olanlarla sohbet et. Sohbetler her gece 04:00’te sıfırlanır.',
  apple: 'Apple ile devam et',
  google: 'Google ile devam et',
  phone: 'Telefonla devam et',
  terms: 'Devam ederek Kullanım Koşulları’nı ve Gizlilik Politikası’nı kabul etmiş olursun.',
  phoneTitle: 'Telefon numaran',
  phoneNote: 'Sana 6 haneli bir kod göndereceğiz.',
  phonePlaceholder: '5xx xxx xx xx',
  sendCode: 'Kod gönder',
  codeTitle: 'Kodu gir',
  codeNote: (phone: string) => `${phone} numarasına gönderilen 6 haneli kod. Prototipte her kod geçerli.`,
  verify: 'Doğrula',
  changeNumber: 'Numarayı değiştir',
};

export const en: typeof tr = {
  tagline: 'Talk to the people where you are.',
  pitch: 'Get to a venue, check in, and chat with everyone there tonight. Chats reset every night at 4 AM.',
  apple: 'Continue with Apple',
  google: 'Continue with Google',
  phone: 'Continue with phone',
  terms: 'By continuing you agree to the Terms of Use and Privacy Policy.',
  phoneTitle: 'Your phone number',
  phoneNote: 'We’ll text you a 6-digit code.',
  phonePlaceholder: '5xx xxx xx xx',
  sendCode: 'Send code',
  codeTitle: 'Enter the code',
  codeNote: (phone: string) => `The 6-digit code sent to ${phone}. Any code works in the prototype.`,
  verify: 'Verify',
  changeNumber: 'Change number',
};
