# SSJ Estimation

A responsive Next.js silver jewellery and bullion estimation workspace. The app includes a silver-only estimation grid, customer selector and form, live weight and amount calculations, cash/bank/bullion/old-silver settlements, browser printing, an estimate register, CSV export, and JSON backup.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current data mode

The customer book and estimate register are stored in the current browser's local storage. The app starts with an empty customer book, estimate register, and billing table. The Owner can add and edit customer name, phone, address, and GSTIN; use **Export** or **Back up** to save a copy. Direct folder/USB backup is available in browsers that support the File System Access API; other browsers download the backup file.

This local mode is intended for single-device prototyping, not as a secure, multi-user point-of-sale deployment. The Owner-only customer controls are a UI restriction, not an authorization boundary. Production authentication, server-side Admin/Owner authorization, persistent PostgreSQL/Supabase storage, audit logging, shared financial-year controls, Google integrations, and encrypted backup require configuring and deploying the corresponding backend services. No default administrator password is included in the client app.

## Estimate calculations

- Net weight = max(0, gross weight − cover tare)
- Pure silver weight = net weight × silver touch ÷ 100
- Sales pure weight = max(0, gross weight − cover tare) × manual touch ÷ 100
- Board Rate (₹/g) is entered manually on each estimate. Sales pure metal cost = sales pure weight × Board Rate.
- Item amount = sales pure metal cost + (net weight × making-charge rate)
- Customer pure return = return weight × manual return touch ÷ 100; rate-cut metal credit = customer pure return × the same manually entered Board Rate
- Net payable = max(0, item total − metal credit − discount); balance due = net payable − cash paid − bank/UPI paid
- Settlement supports cash-only, silver-exchange-only, and hybrid/split modes. Estimate number, billing date, Board Rate, both manual touch mappings, making-charge rate, and discount are editable.
- New item rows start with blank PCS, weights, touch, and making-charge fields. Board Rate, payment, discount, and return-metal numeric inputs also start blank; empty or invalid values safely calculate as zero, and derived weights and amounts update as you type.
