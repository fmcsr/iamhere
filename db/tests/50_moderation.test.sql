\echo '── 50 · Şikâyet delili: gece bitince kalır, saklama süresi dolunca silinir'
\set ayse  '00000000-0000-7000-8000-00000000000a'
\set burak '00000000-0000-7000-8000-00000000000b'
\set cem   '00000000-0000-7000-8000-00000000000c'
SET ephemeral.now = '2026-10-16 22:00:00+03';
CALL ephemeral.run_maintenance();

SET ROLE anlik_app;
SELECT id AS room FROM ephemeral.create_room(:'ayse', 'Kadıköy sahil', 40.9900, 29.0280) \gset
-- Burak odaya anonim katılır
INSERT INTO ephemeral.conversation_members (conversation_id, user_id, persona_id)
VALUES (:'room', :'burak', (ephemeral.persona_for(:'burak')).id);
INSERT INTO ephemeral.messages (conversation_id, sender_id, body) VALUES (:'room', :'ayse', 'Merhaba');
INSERT INTO ephemeral.messages (conversation_id, sender_id, body)
VALUES (:'room', :'burak', 'Hakaret içeren mesaj') RETURNING id AS bad \gset

SELECT t.throws(format($$SELECT core.file_report(%L, %L, 'harassment')$$, :'cem', :'bad'), '42501',
                'sohbet üyesi olmayan şikâyet edemez (başkasının sohbetine arka kapı yok)');
SELECT t.throws(format($$INSERT INTO ephemeral.conversation_members (conversation_id, user_id, persona_id)
                         VALUES (%L, %L, %L)$$, :'room', :'cem', (ephemeral.persona_for(:'burak')).id),
                '23503', 'kimse başkasının personasıyla katılamaz (FK: persona ↔ kullanıcı)');
SELECT core.file_report(:'ayse', :'bad', 'harassment', 'Taciz') AS report \gset
RESET ROLE;

SELECT t.eq((SELECT jsonb_path_query_array(payload, '$.messages[*].body')
             FROM core.report_evidence WHERE report_id = :'report'),
            '["Merhaba", "Hakaret içeren mesaj"]'::jsonb, 'delil: şikâyet edilen mesaj + önceki bağlam');
SELECT t.eq((SELECT target_user_id FROM core.reports WHERE id = :'report'), :'burak'::uuid,
            'anonim gönderenin gerçek kimliği moderasyona iletilir');

SET ephemeral.now = '2026-10-17 04:00:00+03';
CALL ephemeral.run_maintenance();
SELECT t.ok(to_regclass('ephemeral.messages_c20261016') IS NULL, 'gece silindi');
SELECT t.eq((SELECT count(*)::int FROM core.report_evidence WHERE report_id = :'report'), 1,
            'delil gece bitince de duruyor');

SET ephemeral.now = '2027-01-15 12:00:00+03';     -- 90 gün sonrası
CALL ephemeral.run_maintenance();
SELECT t.eq((SELECT count(*)::int FROM core.report_evidence), 0, '90 gün dolunca delil silindi');
SELECT t.eq((SELECT count(*)::int FROM core.reports WHERE id = :'report'), 1,
            'şikâyetin kendisi (içeriksiz meta veri) kalır');
