ALTER TABLE public.sales
  ADD COLUMN customer_name text NOT NULL DEFAULT '',
  ADD COLUMN customer_phone text NOT NULL DEFAULT '',
  ADD COLUMN payment_method text NOT NULL DEFAULT 'cash',
  ADD COLUMN returned_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN returned_at timestamptz,
  ADD COLUMN invoice_no text NOT NULL DEFAULT '';