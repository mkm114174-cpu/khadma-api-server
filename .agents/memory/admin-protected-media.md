---
name: Admin protected media fetch
description: How the Khadma admin web must load auth-gated binary assets (KYC docs) and how KYC review/deletion is gated.
---

- The admin web authenticates with a **bearer token** (not cookies), so a plain `<img src>` / `<a href>` to a protected API media endpoint will 401. Fetch the bytes through the generated client (returns a `Blob` via the shared customFetch auto content-type inference), then `URL.createObjectURL` and revoke it on unmount/prop change.
  - **Why:** mobile and admin share one customFetch that attaches `Authorization: Bearer` only on programmatic calls; the browser never adds it to direct element loads.
  - **How to apply:** any new admin surface showing private object-storage media must go through the client + object URL, never a raw element URL.

- KYC provider documents are **deleted on the final decision** (approved/rejected). Admin Approve/Reject must be reachable only after the document-review surface (detail dialog), not from list/card quick-actions, so docs aren't destroyed before they're reviewed.
  - **Why:** deletion is irreversible; a card-level quick decision would discard unseen evidence.
  - **How to apply:** keep final-decision buttons inside the review dialog; cards open the dialog instead of finalizing.
