-- Beta için örnek mekânlar: uygulamanın prototip verisindeki Kadıköy mekânları (apps/mobile/src/data/mock.ts).
-- Adlar uydurmadır (park/meydan gibi kamusal yerler hariç). Gerçek mekânlar Google Places'tan gelecek (K-05).
-- Yüklemek isteğe bağlıdır: supabase db push --include-seed. Tekrar çalıştırmak bir şey değiştirmez.

INSERT INTO public.venues (id, name, category, area, event, lat, lng) VALUES
  ('00000000-0000-4000-a000-000000000001', 'Rıhtım Açıkhava',    'konser', 'Rıhtım',        'Gece Treni konseri · 21:00',    40.9905, 29.0225),
  ('00000000-0000-4000-a000-000000000002', 'Kıyı Kahvesi',       'kafe',   'Caferağa',      NULL,                            40.9893, 29.0241),
  ('00000000-0000-4000-a000-000000000003', 'Moda Sahili',        'acik',   'Moda',          'Gece koşusu buluşması · 23:30', 40.9842, 29.0262),
  ('00000000-0000-4000-a000-000000000004', 'Nar Ocakbaşı',       'yemek',  'Kadıköy Çarşı', '02:00’ye kadar açık',           40.9871, 29.0297),
  ('00000000-0000-4000-a000-000000000005', 'Kule Teras',         'bar',    'Yeldeğirmeni',  'DJ seti · 22:00',               40.9921, 29.0318),
  ('00000000-0000-4000-a000-000000000006', 'Çınar Meyhane',      'yemek',  'Kadıköy Çarşı', 'Fasıl · 22:00',                 40.9885, 29.0258),
  ('00000000-0000-4000-a000-000000000007', 'Dalga Burger',       'yemek',  'Caferağa',      NULL,                            40.9899, 29.0252),
  ('00000000-0000-4000-a000-000000000008', 'Sahne Kadıköy',      'konser', 'Bahariye',      'Akustik gece · 23:00',          40.9918, 29.0270),
  ('00000000-0000-4000-a000-000000000009', 'Plak Odası',         'bar',    'Moda',          'Plak gecesi · 22:30',           40.9846, 29.0305),
  ('00000000-0000-4000-a000-000000000010', 'Haydarpaşa Sahnesi', 'konser', 'Haydarpaşa',    'Elektronik gece · 23:00',       40.9968, 29.0188),
  ('00000000-0000-4000-a000-000000000011', 'Fener Balıkçısı',    'yemek',  'Fenerbahçe',    NULL,                            40.9712, 29.0371),
  ('00000000-0000-4000-a000-000000000012', 'İskele Kahvesi',     'kafe',   'Kuzguncuk',     NULL,                            41.0362, 29.0297)
ON CONFLICT (id) DO NOTHING;
