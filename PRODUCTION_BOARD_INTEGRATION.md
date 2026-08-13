# Friedman Portal → Shulman Production Board

The Friedman portal is a mandatory production-board source. Every submitted portal line item should become a separate production job while retaining a shared portal order ID.

## Source identity

- `source`: `Friedmans Portal`
- `source_system`: `friedmans_portal`
- `source_order_id`: one ID for the entire portal checkout
- `job_id`: one unique ID per line item, e.g. `FRD-260812231500-01`

## Required production-board fields

Each production job should provide:

- customer / restaurant / delivery location
- requested by / received at / needed by
- rush flag and priority
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

Rush is an independent priority flag and should not replace the production status.

## Workflow rule

A line item may be visible on the master board immediately after order receipt, but it should not enter the ready-to-print queue until its artwork and proof requirements are satisfied.

## Production estimates

Production recipes are workload estimates only. Customer pricing must come from the Shulman Paper & Printing Pricing Bible rather than from the workload recipe.

Digital work should estimate:

- sheets
- clicks
- machine minutes
- finishing minutes

Wide-format work should estimate:

- square feet
- machine minutes
- finishing minutes

## Current handoff

The portal sends the full order payload to FileMaker when `window.FM.call` is available and also emits a browser event named `shulman:production-order`. The payload includes a `productionJobs` array ready for ingestion by a master production-board service.

## Backend work still required

The current branch establishes the customer and production data contract. Before the portal becomes authoritative for unattended production-board ingestion, connect:

- real authentication and server-side restaurant authorization
- durable order persistence
- real artwork storage/upload
- real proof approval updates
- real order history and status synchronization
- master production-board ingestion endpoint / database
- Pricing Bible pricing service
