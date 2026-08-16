# Friedman Portal → Shulman Production Board

The Friedman portal is a mandatory production-board source. Every submitted portal line item becomes a separate production job while retaining a shared portal order ID.

## Source identity

- `source`: `Friedmans Portal`
- `source_system`: `friedmans_portal`
- `source_order_id`: one ID for the entire portal checkout
- `job_id`: one unique ID per line item, e.g. `FRD-260812231500-01`

## Restaurant roster

The portal now contains 27 location profiles derived from the supplied Jonah invoice archive. Each profile has:

- stable restaurant ID
- display name and delivery address
- unique login ID
- unique color palette
- unique graphic motif
- restaurant-scoped invoice history / reorder catalog

Restaurant passwords are never stored in the repository. The deployment reads scrypt password hashes from the Netlify secret `RESTAURANT_CREDENTIALS_JSON` and signs successful sessions with `RESTAURANT_SESSION_SECRET`.

## Historical product / pricing references

The supplied invoice PDFs were normalized into restaurant-scoped historical product records. Historical records preserve:

- invoice number and date
- original line description
- inferred customer/run quantity when available
- invoice line quantity
- billed rate
- billed line amount
- size and sides when recoverable
- product category

Historical pricing is shown as **Last billed** / **Historical billing reference**. It must not be treated as a guaranteed current unit price. Some invoices use an invoice-line quantity of `1` for a job whose description says `Qty 500`, `Qty 1,000`, etc.; those records therefore preserve both quantities rather than fabricating a per-piece price.

## Required production-board fields

Each production job provides or is prepared to provide:

- customer / restaurant / delivery location
- requested by / received at / needed by
- rush flag and production priority
- job name / product / SKU / quantity
- finished size / stock / sides / finish
- artwork status and artwork filename
- proof required / proof status / approver
- estimated clicks / sheets / square feet
- estimated machine minutes / machine
- estimated finishing minutes
- pack-by-store flag
- production notes
- status / last updated

## Status vocabulary

Use the same language in the portal, live production board, and printed production board:

1. Awaiting Artwork
2. Awaiting Proof
3. Awaiting Approval
4. Ready to Print
5. Printing
6. Finishing
7. Ready
8. Complete

Rush is an independent priority flag and does not replace the production status.

## Workflow rule

A line item may be visible on the master board immediately after order receipt, but it should not enter the ready-to-print queue until its artwork and proof requirements are satisfied.

## Production estimates

Production recipes are workload estimates only. Customer pricing must come from the Shulman Paper & Printing Pricing Bible rather than from the workload recipe.

Digital work estimates:

- sheets
- clicks
- machine minutes
- finishing minutes

Wide-format work estimates:

- square feet
- machine minutes
- finishing minutes

The current recipe layer supports size-specific digital impositions so click/sheet estimates can vary by finished size.

## Due-time priority

The Netlify production-feed function adds:

- `priority_score`
- `priority_label`
- `due_in_minutes`

Rush adds a major priority weight, and jobs due within 48, 24, 12, or 4 hours receive progressively higher urgency. The master production board can sort on `priority_score` while still showing the normal status color.

## Current handoff

The portal currently has three handoff paths:

1. FileMaker: when `window.FM.call` exists, the full payload is sent to the `Create Order` script.
2. Browser event: the portal emits `shulman:production-order` with the same payload.
3. Netlify Function: `src/productionBoardTransport.ts` forwards the browser event to `/.netlify/functions/submit-order` and attaches the restaurant session token when present.

The Netlify Function normalizes the Friedman source identity, adds due-time priority fields, and can forward the payload to the master board when these Netlify environment variables are configured:

- `PRODUCTION_BOARD_INGEST_URL`
- `PRODUCTION_BOARD_INGEST_TOKEN` (optional)

Until an ingest URL is configured, the function accepts and validates the production payload but reports that master-board forwarding still requires configuration.

## Authentication

Restaurant login IDs are stored with the restaurant profiles. Passwords are generated outside the repository. `/.netlify/functions/restaurant-login` verifies the supplied password against the scrypt hash in `RESTAURANT_CREDENTIALS_JSON` and returns a signed 12-hour restaurant session using `RESTAURANT_SESSION_SECRET`.

The next security step is to validate that signed restaurant token again inside `submit-order`, so a restaurant can never submit a job for another restaurant by modifying a browser payload.

## Order history

Submitted order metadata is retained in browser local storage as a convenience for the current prototype. This is not a substitute for the authoritative backend order history.

## Backend work still required

Before the portal becomes authoritative for unattended production-board ingestion, complete:

- configure `RESTAURANT_CREDENTIALS_JSON` and `RESTAURANT_SESSION_SECRET` in Netlify
- enforce the signed restaurant token inside order submission / server-side restaurant authorization
- durable backend order persistence
- real artwork storage/upload
- real proof approval updates
- real order history and status synchronization
- master production-board ingestion endpoint/database
- Pricing Bible pricing service
- production-recipe calibration and automated tests
