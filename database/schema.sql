-- Style Stock Manager: complete database schema (all migrations combined, in order)

-- ===== 20260520043213_f5f90988-20a8-417c-8bc8-b7536b932903.sql =====

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_user ON public.products(user_id);
CREATE INDEX idx_sales_user ON public.sales(user_id);
CREATE INDEX idx_sales_product ON public.sales(product_id);
CREATE INDEX idx_sales_created ON public.sales(created_at);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own products" ON public.products
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users manage own sales" ON public.sales
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== 20260520043237_1b33d2f1-3dbd-4e23-962b-b047b33c7f27.sql =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
-- ===== 20260520050004_5d741fdc-6808-4fdb-b019-e79655c6a68e.sql =====
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0;
-- ===== 20260520051735_e5d31838-99a4-4945-a65c-7f7c55051e32.sql =====
ALTER TABLE public.products ADD COLUMN cost_price numeric NOT NULL DEFAULT 0;
-- ===== 20260911091707_bdde219f-394f-440c-8382-6ea309bfb57d.sql =====
CREATE TABLE public.shop_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  gst_number text NOT NULL DEFAULT '',
  footer_note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_profiles TO authenticated;
GRANT ALL ON public.shop_profiles TO service_role;

ALTER TABLE public.shop_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own shop profile"
  ON public.shop_profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER shop_profiles_touch
  BEFORE UPDATE ON public.shop_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();