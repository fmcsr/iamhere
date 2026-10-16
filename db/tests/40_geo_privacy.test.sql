\echo '── 40 · Konum maskeleme, mesafe kovaları ve keşif'
\set ayse  '00000000-0000-7000-8000-00000000000a'
\set burak '00000000-0000-7000-8000-00000000000b'
\set cem   '00000000-0000-7000-8000-00000000000c'
\set deniz '00000000-0000-7000-8000-00000000000d'
SET ephemeral.now = '2026-10-16 21:00:00+03';
CALL ephemeral.run_maintenance();

-- Izgara özellikleri: Türkiye sınırları içinde 2000 rastgele nokta
CREATE TEMP TABLE pts AS
SELECT 36 + random() * 6 AS lat, 26 + random() * 19 AS lng FROM generate_series(1, 2000);
SELECT t.ok((SELECT max(ST_Distance(ST_MakePoint(lng, lat)::geography,
                                    ephemeral.snap_to_cell(lat, lng, 250))) FROM pts) <= 180,
            '250 m hücre: maskeli nokta gerçeğe en fazla ~177 m (yarım köşegen) uzak');
SELECT t.ok((SELECT bool_and(ST_Equals(
               ephemeral.snap_to_cell(ST_Y(s::geometry), ST_X(s::geometry), 250)::geometry, s::geometry))
             FROM (SELECT ephemeral.snap_to_cell(lat, lng, 250) AS s FROM pts) x),
            'maskeleme kararlı: hücre merkezi yine kendine düşer (tekrar sorgu bilgi sızdırmaz)');

-- Taksim çevresi: Ayşe; Burak ~60 m; Cem ~1,5 km; Deniz Kadıköy (~6 km, menzil dışı)
SET ROLE anlik_app;
SELECT ephemeral.upsert_presence(:'ayse',  41.0369, 28.9850, 'Kahve içecek var mı?');
SELECT ephemeral.upsert_presence(:'burak', 41.0374, 28.9853);
SELECT ephemeral.upsert_presence(:'cem',   41.0480, 28.9950);
SELECT ephemeral.upsert_presence(:'deniz', 40.9900, 29.0280);
RESET ROLE;

SELECT t.ok((SELECT NOT ST_Equals(geo::geometry, ST_SetSRID(ST_MakePoint(28.9850, 41.0369), 4326))
                    AND ST_Equals(geo::geometry, ephemeral.snap_to_cell(41.0369, 28.9850, 250)::geometry)
             FROM ephemeral.presence WHERE cycle_date = '2026-10-16' AND user_id = :'ayse'),
            'ham GPS saklanmadı; saklanan nokta 250 m hücrenin merkezi');

SET ROLE anlik_app;
SELECT t.eq((SELECT array_agg(display_name || ':' || distance_bucket_m ORDER BY distance_bucket_m)
             FROM ephemeral.nearby_users(:'ayse', 5000)),
            ARRAY['Burak:500', 'Cem:2000'],
            'yakındakiler: kendisi ve menzil dışı yok, mesafe yalnızca kova olarak');
SELECT t.ok((SELECT bool_and(distance_bucket_m IN (500, 1000, 2000, 5000))
             FROM ephemeral.nearby_users(:'burak', 5000)),
            'hiçbir sonuçta ham metre yok');

-- Hassasiyet "area" (1 km): kova hücreden hassas olamaz
UPDATE core.profiles SET location_precision = 'area' WHERE user_id = :'burak';
SELECT ephemeral.upsert_presence(:'burak', 41.0374, 28.9853);
SELECT t.eq((SELECT distance_bucket_m FROM ephemeral.nearby_users(:'ayse', 5000)
             WHERE display_name = 'Burak'), 1000,
            '"area" hassasiyetindeki kişi en yakın "< 1 km" görünür');

-- Anonim mod: gerçek kimlik, yaş ve fotoğraf sızmaz
UPDATE core.profiles SET location_precision = 'near', avatar_key = 'avatars/burak.jpg'
WHERE user_id = :'burak';
SELECT ephemeral.upsert_presence(:'burak', 41.0374, 28.9853, 'Bu gece anonimim', p_anonymous => true);
SELECT t.ok((SELECT ref_kind = 'persona' AND ref_id <> :'burak'::uuid AND display_name <> 'Burak'
                    AND age IS NULL AND avatar_key IS NULL AND avatar_seed IS NOT NULL
             FROM ephemeral.nearby_users(:'ayse', 5000) WHERE status_text = 'Bu gece anonimim'),
            'anonim kişi persona olarak görünür: user_id/isim/yaş/fotoğraf yok');

-- Odalar: pin maskeli, yalnızca odanın yarıçapı içindekiler görür
SELECT id AS room FROM ephemeral.create_room(:'ayse', 'Taksim gece yürüyüşü', 41.0369, 28.9850, 1000) \gset
SELECT t.ok(EXISTS (SELECT 1 FROM ephemeral.nearby_rooms(:'burak')
                    WHERE conversation_id = :'room' AND member_count = 1
                      AND expires_at = timestamptz '2026-10-17 04:00+03'),
            'Burak (60 m) odayı görür; bitiş anı 04:00');
SELECT t.ok(NOT EXISTS (SELECT 1 FROM ephemeral.nearby_rooms(:'cem') WHERE conversation_id = :'room'),
            'Cem (1,5 km) 1 km yarıçaplı odayı görmez');
RESET ROLE;
SELECT t.ok((SELECT ST_Equals(geo::geometry, ephemeral.snap_to_cell(41.0369, 28.9850, 250)::geometry)
             FROM ephemeral.conversations WHERE cycle_date = '2026-10-16' AND id = :'room'),
            'oda pini kurucunun ham konumunu değil hücre merkezini taşır');

-- Engelleme iki yönlüdür
INSERT INTO core.blocks (blocker_id, blocked_id) VALUES (:'ayse', :'cem');
SET ROLE anlik_app;
SELECT t.ok(NOT EXISTS (SELECT 1 FROM ephemeral.nearby_users(:'ayse', 5000) WHERE display_name = 'Cem'),
            'engelleyen, engellediğini görmez');
SELECT t.ok(NOT EXISTS (SELECT 1 FROM ephemeral.nearby_users(:'cem', 5000) WHERE display_name = 'Ayşe'),
            'engellenen de engelleyeni görmez');

-- Keşfedilemez kullanıcı pin bırakmaz; karşılıklılık: pini olmayan kimseyi göremez
UPDATE core.profiles SET discoverable = false WHERE user_id = :'deniz';
SELECT t.ok(ephemeral.upsert_presence(:'deniz', 41.0372, 28.9852) IS NULL,
            'keşfedilemez kullanıcının konumu kaydedilmez (mevcut pini de silinir)');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.nearby_users(:'deniz', 5000)), 0,
            'görmek için görünür olmak gerekir (karşılıklılık)');
SELECT t.ok(NOT EXISTS (SELECT 1 FROM ephemeral.nearby_users(:'ayse', 5000) WHERE display_name = 'Deniz'),
            'keşfedilemez kullanıcı listede yok');
RESET ROLE;

-- Bayat pin: 30 dk güncellenmeyen pin önce listeden düşer, bakım turunda silinir
SET ephemeral.now = '2026-10-16 21:31:00+03';
SET ROLE anlik_app;
SELECT ephemeral.upsert_presence(:'ayse', 41.0369, 28.9850);
SELECT t.eq((SELECT count(*)::int FROM ephemeral.nearby_users(:'ayse', 5000)), 0,
            '30 dakikadır güncellenmeyen pinler listelenmez');
RESET ROLE;
CALL ephemeral.run_maintenance();
SELECT t.eq((SELECT array_agg(user_id) FROM ephemeral.presence WHERE cycle_date = '2026-10-16'),
            ARRAY[:'ayse'::uuid], 'bayat pinler gece bitmeden silindi; yalnızca güncel pin kaldı');
