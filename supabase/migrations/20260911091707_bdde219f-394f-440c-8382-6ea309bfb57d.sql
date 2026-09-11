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