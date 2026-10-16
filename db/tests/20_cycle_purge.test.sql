\echo '── 20 · 04:00 temizliği: önce görünmezlik, sonra fiziksel silme'
\set ayse  '00000000-0000-7000-8000-00000000000a'
\set burak '00000000-0000-7000-8000-00000000000b'
\set cem   '00000000-0000-7000-8000-00000000000c'

-- 16 Ekim gecesi, 23:30
SET ephemeral.now = '2026-10-16 23:30:00+03';
CALL ephemeral.run_maintenance();
SELECT t.eq((SELECT count(*)::int FROM ephemeral.cycle_tables ct, generate_series(0, 3) AS i
             WHERE to_regclass(format('ephemeral.%I',
                     ephemeral.partition_name(ct.table_name, date '2026-10-16' + i))) IS NOT NULL),
            20, 'bu gece + 3 gece için 5 tablonun bölümleri hazır');

-- Uygulama rolüyle gerçekçi bir gece: konum pinleri, bir oda, mesajlar, bir DM isteği
SET ROLE anlik_app;
SELECT ephemeral.upsert_presence(:'ayse',  41.0369, 28.9850, 'Kahve içecek var mı?');
SELECT ephemeral.upsert_presence(:'burak', 41.0390, 28.9870);
SELECT id AS room FROM ephemeral.create_room(:'ayse', 'Taksim gece yürüyüşü', 41.0369, 28.9850) \gset
INSERT INTO ephemeral.conversation_members (conversation_id, user_id) VALUES (:'room', :'burak');
INSERT INTO ephemeral.messages (conversation_id, sender_id, body)
VALUES (:'room', :'ayse',  'Selam! İstiklal''in başındayım'),
       (:'room', :'burak', 'Geliyorum');
INSERT INTO ephemeral.conversations (kind, status, created_by, dm_low, dm_high)
VALUES ('direct', 'pending', :'ayse',
        least(:'ayse'::uuid, :'burak'::uuid), greatest(:'ayse'::uuid, :'burak'::uuid))
RETURNING id AS dm \gset
INSERT INTO ephemeral.conversation_members (conversation_id, user_id) VALUES (:'dm', :'ayse'), (:'dm', :'burak');

-- İstemci aynı mesajı (aynı client_msg_id) iki kez gönderirse tek kayıt oluşur
\set cmid '11111111-1111-7111-8111-111111111111'
INSERT INTO ephemeral.messages (conversation_id, sender_id, body, client_msg_id)
VALUES (:'room', :'ayse', 'Kaçıncı kez yazıyorum', :'cmid') ON CONFLICT DO NOTHING;
INSERT INTO ephemeral.messages (conversation_id, sender_id, body, client_msg_id)
VALUES (:'room', :'ayse', 'Kaçıncı kez yazıyorum', :'cmid') ON CONFLICT DO NOTHING;
SELECT t.eq((SELECT count(*)::int FROM ephemeral.messages WHERE client_msg_id = :'cmid'), 1,
            'tekrar gönderim idempotent (client_msg_id)');

SELECT t.throws(format($$INSERT INTO ephemeral.messages (conversation_id, sender_id, body)
                         VALUES (%L, %L, 'merhaba')$$, :'room', :'cem'),
                '23503', 'üye olmayan odaya yazamaz (FK)');
SELECT t.throws(format($$INSERT INTO ephemeral.conversations (kind, created_by, dm_low, dm_high)
                         VALUES ('direct', %L, %L, %L)$$,
                       :'burak', least(:'ayse'::uuid, :'burak'::uuid), greatest(:'ayse'::uuid, :'burak'::uuid)),
                '23505', 'aynı gece aynı ikili için ikinci DM açılamaz');
RESET ROLE;

-- Diskteki veri dosyasının yolu (silindiğini sonra doğrulamak için)
SELECT pg_relation_filepath('ephemeral.messages_c20261016') AS msg_file \gset

-- 03:59:59 — her şey yerinde
SET ephemeral.now = '2026-10-17 03:59:59+03';
SET ROLE anlik_app;
SELECT t.eq((SELECT count(*)::int FROM ephemeral.messages), 3, '03:59:59 mesajlar görünür');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.conversations), 2, '03:59:59 sohbetler görünür');
RESET ROLE;

-- 04:00:00 — bakım HENÜZ çalışmadı ama eski gece görünmez ve yazılamaz
SET ephemeral.now = '2026-10-17 04:00:00+03';
SET ROLE anlik_app;
SELECT t.eq((SELECT count(*)::int FROM ephemeral.messages), 0, '04:00:00 mesajlar anında görünmez (RLS)');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.conversations), 0, '04:00:00 sohbetler görünmez');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.conversation_members), 0, '04:00:00 üyelikler görünmez');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.presence), 0, '04:00:00 konum pinleri görünmez');
SELECT t.throws(format($$INSERT INTO ephemeral.messages (conversation_id, sender_id, body)
                         VALUES (%L, %L, 'geç kaldım')$$, :'room', :'ayse'),
                '23503', 'yeni gecede eski sohbete yazılamaz (FK cycle_date içerir)');
SELECT t.throws(format($$INSERT INTO ephemeral.messages (cycle_date, conversation_id, sender_id, body)
                         VALUES ('2026-10-16', %L, %L, 'hile')$$, :'room', :'ayse'),
                '42501', 'cycle_date elle eski geceye ayarlanamaz (RLS WITH CHECK)');
SELECT t.eq((ephemeral.create_room(:'burak', 'Sabah koşusu', 41.0400, 28.9900)).cycle_date,
            date '2026-10-17', 'yeni gece bölümü önceden hazır: 04:00''te yazma kesintisiz');
RESET ROLE;
SELECT t.eq((SELECT count(*)::int FROM ephemeral.messages WHERE cycle_date = '2026-10-16'), 3,
            'fiziksel olarak henüz diskte (yalnızca tablo sahibi görür)');

-- Bakım turu: eski gece düşürülür
CALL ephemeral.run_maintenance();
SELECT t.ok(to_regclass('ephemeral.messages_c20261016') IS NULL
        AND to_regclass('ephemeral.conversation_members_c20261016') IS NULL
        AND to_regclass('ephemeral.presence_c20261016') IS NULL
        AND to_regclass('ephemeral.conversations_c20261016') IS NULL
        AND to_regclass('ephemeral.personas_c20261016') IS NULL,
       '16 Ekim gecesinin 5 bölümü de düşürüldü');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.messages WHERE cycle_date = '2026-10-16'), 0,
            'tablo sahibi için de veri yok');
SELECT t.ok(coalesce((pg_stat_file(:'msg_file', true)).size, 0) = 0,
            'mesaj bölümünün veri dosyası diskte boşaltıldı/silindi');
SELECT t.eq((SELECT array_agg(table_name::text ORDER BY id) FROM ephemeral.purge_log
             WHERE cycle_date = '2026-10-16'),
            ARRAY['messages', 'conversation_members', 'presence', 'conversations', 'personas'],
            'purge_log: önce çocuk tablolar (FK sırası)');
SELECT t.eq((SELECT count(*)::int FROM ephemeral.cycle_tables ct, generate_series(0, 3) AS i
             WHERE to_regclass(format('ephemeral.%I',
                     ephemeral.partition_name(ct.table_name, date '2026-10-17' + i))) IS NOT NULL),
            20, 'yeni gece + 3 gece hazır');
SELECT t.eq((SELECT count(*)::int FROM core.users), 4, 'kalıcı veri (kullanıcılar) yerinde');

CALL ephemeral.run_maintenance();
SELECT t.eq((SELECT count(*)::int FROM ephemeral.purge_log WHERE cycle_date = '2026-10-16'), 5,
            'ikinci tur hiçbir şey yapmaz (idempotent)');
SET ROLE anlik_app;
SELECT t.eq((SELECT count(*)::int FROM ephemeral.conversations), 1, '04:00 sonrası açılan oda yerinde');
RESET ROLE;

-- Bakım birkaç gün hiç çalışmasa da ilk turda tüm birikmiş geceler temizlenir
SET ephemeral.now = '2026-10-21 12:00:00+03';
CALL ephemeral.run_maintenance();
SELECT t.eq((SELECT count(*)::int FROM pg_inherits i
             JOIN pg_class c ON c.oid = i.inhrelid
             WHERE i.inhparent = 'ephemeral.messages'::regclass
               AND c.relname < 'messages_c20261021'),
            0, 'kaçan turlar telafi edildi: 21 Ekim öncesi bölüm kalmadı');
