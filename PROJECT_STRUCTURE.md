# Style Stock Manager — Project Structure

```text
style-stock-manager/
├── src/frontend/        FRONTEND (React + TypeScript + Tailwind CSS)
│   ├── components/      KPI cards, animated counters
│   ├── ui/              Buttons, forms, dialogs, tables
│   ├── hooks/           Login state, mobile detection
│   ├── lib/             Bills, receipts, printer, theme, email check
│   └── styles.css       Colours, fonts, design
├── src/routes/          PAGES (Login, Dashboard, Products, Sales, Reports, Analytics, Settings)
├── src/backend/         BACKEND (Node.js-style TypeScript business logic)
│   ├── inventory.ts     Products, sales, returns, exchange, profit/loss
│   ├── reports.ts       Daily/weekly/monthly/yearly reports
│   ├── shop-profile.ts  Shop details
│   └── invoice/         Invoice templates
├── database/            DATABASE (PostgreSQL via Supabase)
│   └── schema.sql       All tables, security rules and triggers in one file
└── supabase/            Database config + migration history (managed automatically)
```

Flow: **Frontend pages → Backend logic → Database**.
