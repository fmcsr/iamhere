-- migrate:up
-- ─────────────────────────────────────────────────────────────────────────────
-- 0006 · Moderasyon: şikâyet anında delil kopyası
--
-- Geçici veri 04:00'te silindiğinden, şikâyet edilen mesaj ve öncesindeki bağlam (son 20
-- mesaj) şikâyet anında core.report_evidence'a kopyalanır ve config.evidence_retention
-- (varsayılan 90 gün) boyunca saklanır. Görsel mesajların medya dosyası da worker
-- tarafından moderasyon kovasına kopyalanmalıdır (media_key payload içindedir).
-- App Store / Google Play, kullanıcı içerikli uygulamalarda şikâyet + engelleme ister.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE FUNCTION core.file_report(
  p_reporter    uuid,
  p_message_id  uuid,
  p_reason      core.report_reason,
  p_note        text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, extensions, pg_temp
AS $$
DECLARE
  v_cycle      date := ephemeral.current_cycle();
  v_msg        ephemeral.messages;
  v_report_id  uuid;
BEGIN
  SELECT * INTO v_msg
  FROM ephemeral.messages WHERE cycle_date = v_cycle AND id = p_message_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'mesaj bulunamadı (gece bitmiş olabilir)' USING ERRCODE = 'no_data_found';
  END IF;

  -- Yalnızca o sohbetin üyesi şikâyet edebilir: şikâyet, başkasının sohbetini okumanın
  -- arka kapısı olmamalı.
  IF NOT EXISTS (
    SELECT 1 FROM ephemeral.conversation_members m
    WHERE m.cycle_date = v_cycle AND m.conversation_id = v_msg.conversation_id
      AND m.user_id = p_reporter
  ) THEN
    RAISE EXCEPTION 'sohbet üyesi değil' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO core.reports (reporter_id, target_user_id, reason, note,
                            cycle_date, conversation_id, message_id)
  VALUES (p_reporter, v_msg.sender_id, p_reason, p_note,
          v_cycle, v_msg.conversation_id, v_msg.id)
  RETURNING id INTO v_report_id;

  INSERT INTO core.report_evidence (report_id, retain_until, payload)
  VALUES (
    v_report_id,
    ephemeral.clock() + (SELECT c.evidence_retention FROM ephemeral.config c),
    jsonb_build_object(
      'reported_message_id', v_msg.id,
      'conversation', (
        SELECT jsonb_build_object('id', c.id, 'kind', c.kind, 'title', c.title,
                                  'created_by', c.created_by, 'created_at', c.created_at)
        FROM ephemeral.conversations c
        WHERE c.cycle_date = v_cycle AND c.id = v_msg.conversation_id),
      'messages', (
        SELECT jsonb_agg(to_jsonb(x) ORDER BY x.id)
        FROM (
          SELECT m.id, m.sender_id, m.kind, m.body, m.media_key, m.created_at
          FROM ephemeral.messages m
          WHERE m.cycle_date = v_cycle AND m.conversation_id = v_msg.conversation_id
            AND m.id <= v_msg.id
          ORDER BY m.id DESC
          LIMIT 20
        ) x)
    ));

  RETURN v_report_id;
END $$;

REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA core, ephemeral FROM PUBLIC;
GRANT EXECUTE ON FUNCTION core.file_report(uuid, uuid, core.report_reason, text) TO anlik_app;


-- migrate:down
DROP FUNCTION core.file_report(uuid, uuid, core.report_reason, text);
