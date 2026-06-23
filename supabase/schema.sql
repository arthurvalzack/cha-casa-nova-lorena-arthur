-- ============================================================
-- Chá de Casa Nova · Lorena & Arthur
-- Schema completo do Supabase
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABELA: site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_name           text NOT NULL DEFAULT 'Lorena & Arthur',
  event_name            text NOT NULL DEFAULT 'Chá de Casa Nova',
  event_date            timestamptz NOT NULL DEFAULT '2026-07-18 20:00:00+00',
  event_time_text       text DEFAULT 'A partir das 17h',
  hero_image_url        text,
  couple_photo_url      text,
  main_message          text,
  pix_email             text,
  pix_qr_code_url       text,
  thank_you_message     text,
  address_message       text,
  theme_primary_color   text DEFAULT '#0b0b0f',
  theme_secondary_color text DEFAULT '#3f3f46',
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- Garante apenas uma linha de configurações.
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton_idx ON public.site_settings ((true));

-- ============================================================
-- 2. TABELA: gift_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. TABELA: gifts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gifts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id          uuid REFERENCES public.gift_categories(id) ON DELETE SET NULL,
  name                 text NOT NULL,
  description          text,
  image_url            text,
  desired_quantity     integer NOT NULL DEFAULT 1 CHECK (desired_quantity >= 0),
  available_quantity   integer NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  suggested_pix_value  numeric(10,2) CHECK (suggested_pix_value IS NULL OR suggested_pix_value >= 0),
  is_active            boolean DEFAULT true,
  sort_order           integer DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  CONSTRAINT available_lte_desired CHECK (available_quantity <= desired_quantity)
);

-- Identificador estável para seeds idempotentes. Slugs existentes podem permanecer nulos.
ALTER TABLE public.gifts ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS gifts_slug_unique_idx ON public.gifts (slug) WHERE slug IS NOT NULL;

-- Mantém a validação compatível também em projetos que já tinham a tabela criada.
ALTER TABLE public.gifts DROP CONSTRAINT IF EXISTS gifts_desired_quantity_check;
ALTER TABLE public.gifts
  ADD CONSTRAINT gifts_desired_quantity_check CHECK (desired_quantity >= 0);

-- ============================================================
-- 4. TABELA: gift_reservations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_reservations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id           uuid NOT NULL REFERENCES public.gifts(id) ON DELETE RESTRICT,
  guest_whatsapp    text,
  reservation_type  text NOT NULL CHECK (reservation_type IN ('bring_gift', 'pix')),
  quantity          integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status            text NOT NULL DEFAULT 'reserved'
                      CHECK (status IN ('reserved', 'address_sent', 'pix_received', 'delivered', 'cancelled')),
  is_hidden         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Reservas novas são anônimas; dados antigos de WhatsApp são preservados.
ALTER TABLE public.gift_reservations
  ALTER COLUMN guest_whatsapp DROP NOT NULL;
ALTER TABLE public.gift_reservations
  ADD COLUMN IF NOT EXISTS reservation_group_id uuid;
CREATE INDEX IF NOT EXISTS gift_reservations_group_id_idx
  ON public.gift_reservations (reservation_group_id);

CREATE INDEX IF NOT EXISTS gifts_active_idx ON public.gifts (is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS gifts_category_idx ON public.gifts (category_id);
CREATE INDEX IF NOT EXISTS reservations_created_at_idx ON public.gift_reservations (created_at DESC);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.gift_reservations (status);
CREATE INDEX IF NOT EXISTS reservations_whatsapp_idx ON public.gift_reservations (guest_whatsapp);

-- ============================================================
-- 5. TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_gift_categories_updated_at ON public.gift_categories;
CREATE TRIGGER set_gift_categories_updated_at
  BEFORE UPDATE ON public.gift_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_gifts_updated_at ON public.gifts;
CREATE TRIGGER set_gifts_updated_at
  BEFORE UPDATE ON public.gifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_gift_reservations_updated_at ON public.gift_reservations;
CREATE TRIGGER set_gift_reservations_updated_at
  BEFORE UPDATE ON public.gift_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 6. FUNÇÃO RPC: reserve_gift
-- Reserva atômica com SELECT FOR UPDATE.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_gift(
  p_gift_id          uuid,
  p_guest_whatsapp   text,
  p_reservation_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gift            public.gifts%ROWTYPE;
  v_reservation_id  uuid;
  v_whatsapp        text;
BEGIN
  v_whatsapp := regexp_replace(coalesce(p_guest_whatsapp, ''), '\D', '', 'g');

  IF p_reservation_type NOT IN ('bring_gift', 'pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de reserva inválido.');
  END IF;

  SELECT * INTO v_gift
  FROM public.gifts
  WHERE id = p_gift_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presente não encontrado.');
  END IF;

  IF NOT v_gift.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presente não está disponível.');
  END IF;

  IF v_gift.available_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Esse presente acabou de ser esgotado. Por favor, escolha outro presente da lista.'
    );
  END IF;

  UPDATE public.gifts
  SET available_quantity = available_quantity - 1
  WHERE id = p_gift_id;

  INSERT INTO public.gift_reservations (gift_id, guest_whatsapp, reservation_type, quantity, status, is_hidden)
  VALUES (p_gift_id, NULL, p_reservation_type, 1, 'reserved', true)
  RETURNING id INTO v_reservation_id;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'gift_id', p_gift_id,
    'remaining_quantity', v_gift.available_quantity - 1
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- 7. FUNÇÃO RPC: cancel_reservation
-- Cancela reserva e devolve automaticamente 1 unidade ao presente.
-- ============================================================
DROP FUNCTION IF EXISTS public.cancel_reservation(uuid);

CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_reservation_id uuid,
  p_delete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation public.gift_reservations%ROWTYPE;
  v_gift        public.gifts%ROWTYPE;
BEGIN
  SELECT * INTO v_reservation
  FROM public.gift_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reserva não encontrada.');
  END IF;

  SELECT * INTO v_gift
  FROM public.gifts
  WHERE id = v_reservation.gift_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Presente da reserva não encontrado.');
  END IF;

  IF v_reservation.status <> 'cancelled' THEN
    UPDATE public.gifts
    SET
      available_quantity = LEAST(desired_quantity, available_quantity + v_reservation.quantity),
      updated_at = now()
    WHERE id = v_reservation.gift_id;
  END IF;

  IF p_delete THEN
    DELETE FROM public.gift_reservations
    WHERE id = p_reservation_id;
  ELSE
    UPDATE public.gift_reservations
    SET status = 'cancelled', updated_at = now()
    WHERE id = p_reservation_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', p_reservation_id,
    'gift_id', v_reservation.gift_id,
    'deleted', p_delete
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_gift TO anon;
GRANT EXECUTE ON FUNCTION public.reserve_gift TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reservation(uuid, boolean) TO anon, authenticated;

-- Reserva vários presentes de forma atômica: todos são reservados ou nenhum é alterado.
CREATE OR REPLACE FUNCTION public.reserve_gift_batch(
  p_items jsonb,
  p_reservation_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_gift_id uuid;
  v_gift public.gifts%ROWTYPE;
  v_group_id uuid := gen_random_uuid();
  v_ids uuid[] := ARRAY[]::uuid[];
  v_reserved jsonb := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Selecione pelo menos um presente.');
  END IF;
  IF p_reservation_type NOT IN ('bring_gift', 'pix') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo de reserva inválido.');
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_gift_id := (v_item->>'gift_id')::uuid;
    IF v_gift_id IS NULL OR v_gift_id = ANY(v_ids) THEN
      RETURN jsonb_build_object('success', false, 'error', 'A seleção contém presentes inválidos ou duplicados.');
    END IF;
    v_ids := array_append(v_ids, v_gift_id);
  END LOOP;
  -- Valida e bloqueia todos os itens antes de qualquer baixa de estoque.
  FOREACH v_gift_id IN ARRAY v_ids
  LOOP
    SELECT * INTO v_gift FROM public.gifts WHERE id = v_gift_id FOR UPDATE;
    IF NOT FOUND OR NOT v_gift.is_active OR v_gift.available_quantity <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Um ou mais presentes selecionados não estão mais disponíveis. Atualize sua seleção.');
    END IF;
  END LOOP;
  FOREACH v_gift_id IN ARRAY v_ids
  LOOP
    UPDATE public.gifts SET available_quantity = available_quantity - 1, updated_at = now() WHERE id = v_gift_id RETURNING * INTO v_gift;
    INSERT INTO public.gift_reservations (gift_id, reservation_group_id, guest_whatsapp, reservation_type, quantity, status, is_hidden)
    VALUES (v_gift_id, v_group_id, NULL, p_reservation_type, 1, 'reserved', true);
    v_reserved := v_reserved || jsonb_build_array(jsonb_build_object('gift_id', v_gift.id, 'name', v_gift.name));
  END LOOP;
  RETURN jsonb_build_object('success', true, 'reservation_group_id', v_group_id, 'reserved_count', array_length(v_ids, 1), 'items', v_reserved);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.reserve_gift_batch(jsonb, text) TO anon, authenticated;

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.site_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_reservations  ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para o script poder ser executado mais de uma vez.
DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_update_public" ON public.site_settings;
DROP POLICY IF EXISTS "categories_read_public" ON public.gift_categories;
DROP POLICY IF EXISTS "categories_write_public" ON public.gift_categories;
DROP POLICY IF EXISTS "categories_update_public" ON public.gift_categories;
DROP POLICY IF EXISTS "categories_delete_public" ON public.gift_categories;
DROP POLICY IF EXISTS "gifts_read_public" ON public.gifts;
DROP POLICY IF EXISTS "gifts_insert_public" ON public.gifts;
DROP POLICY IF EXISTS "gifts_update_public" ON public.gifts;
DROP POLICY IF EXISTS "gifts_delete_public" ON public.gifts;
DROP POLICY IF EXISTS "reservations_read_admin" ON public.gift_reservations;
DROP POLICY IF EXISTS "reservations_update_admin" ON public.gift_reservations;

-- site_settings
CREATE POLICY "site_settings_read_public"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "site_settings_update_public"
  ON public.site_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- gift_categories
CREATE POLICY "categories_read_public"
  ON public.gift_categories FOR SELECT
  USING (true);

CREATE POLICY "categories_write_public"
  ON public.gift_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "categories_update_public"
  ON public.gift_categories FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_delete_public"
  ON public.gift_categories FOR DELETE
  USING (true);

-- gifts
CREATE POLICY "gifts_read_public"
  ON public.gifts FOR SELECT
  USING (true);

CREATE POLICY "gifts_insert_public"
  ON public.gifts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "gifts_update_public"
  ON public.gifts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "gifts_delete_public"
  ON public.gifts FOR DELETE
  USING (true);

-- gift_reservations
-- Observação brutalmente honesta:
-- Como o admin deste projeto é uma senha simples no frontend, estas policies permitem o painel admin funcionar com anon key.
-- Isso é suficiente para uso pessoal simples, mas não é segurança máxima. Para segurança forte, use Supabase Auth ou backend/Edge Functions.
CREATE POLICY "reservations_read_admin"
  ON public.gift_reservations FOR SELECT
  USING (true);

CREATE POLICY "reservations_update_admin"
  ON public.gift_reservations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Grants e policies explícitos para leituras públicas pela anon key.
-- As policies administrativas existentes são mantidas porque o painel usa senha no frontend.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT ON public.gift_categories TO anon, authenticated;
GRANT SELECT ON public.gifts TO anon, authenticated;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read active gift categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Public can read active gifts" ON public.gifts;

CREATE POLICY "Public can read site settings"
  ON public.site_settings FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public can read active gift categories"
  ON public.gift_categories FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Public can read active gifts"
  ON public.gifts FOR SELECT TO anon
  USING (is_active = true);

NOTIFY pgrst, 'reload schema';

-- Não criar policy de INSERT direto para gift_reservations.
-- Reservas devem ser inseridas somente pela RPC reserve_gift.

-- ============================================================
-- 9. SUPABASE STORAGE BUCKET: wedding-gifts
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wedding-gifts',
  'wedding-gifts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "wedding_gifts_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "wedding_gifts_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "wedding_gifts_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "wedding_gifts_storage_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read wedding gift images" ON storage.objects;
DROP POLICY IF EXISTS "Anon upload wedding gift images" ON storage.objects;
DROP POLICY IF EXISTS "Anon update wedding gift images" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete wedding gift images" ON storage.objects;

CREATE POLICY "Public read wedding gift images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wedding-gifts');

CREATE POLICY "Anon upload wedding gift images"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'wedding-gifts');

CREATE POLICY "Anon update wedding gift images"
  ON storage.objects FOR UPDATE
  TO anon
  USING (bucket_id = 'wedding-gifts')
  WITH CHECK (bucket_id = 'wedding-gifts');

CREATE POLICY "Anon delete wedding gift images"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'wedding-gifts');

-- ============================================================
-- 10. DADOS INICIAIS
-- ============================================================
INSERT INTO public.site_settings (
  couple_name,
  event_name,
  event_date,
  event_time_text,
  main_message,
  pix_email,
  thank_you_message,
  address_message
) VALUES (
  'Lorena & Arthur',
  'Chá de Casa Nova',
  '2026-07-18 20:00:00+00',
  'A partir das 17h',
  'Estamos começando uma nova fase das nossas vidas e será muito especial ter você fazendo parte desse momento. Escolha um presente da nossa lista e reserve com carinho. O endereço será enviado posteriormente pelo WhatsApp.',
  '[COLOCAR_EMAIL_PIX_AQUI]',
  'Obrigado por fazer parte desse momento tão especial para nós.',
  'O endereço será enviado posteriormente pelo WhatsApp.'
)
ON CONFLICT DO NOTHING;

INSERT INTO public.gift_categories (name, slug, sort_order) VALUES
  ('Cozinha',       'cozinha',      1),
  ('Quarto',        'quarto',       2),
  ('Banheiro',      'banheiro',     3),
  ('Lavanderia',    'lavanderia',   4),
  ('Sala',          'sala',         5),
  ('Organização',   'organizacao',  6),
  ('Outros',        'outros',       7)
ON CONFLICT (slug) DO NOTHING;
