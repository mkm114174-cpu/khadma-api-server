---
name: Khadma request contact phone storage
description: Where a service request's contact phone is stored, and why mandatory-phone flows must persist to the user profile.
---

# Request contact phone lives on the user profile, not the request

`RequestInput` (POST /requests) has **no** phone field. The only place a
provider/admin can read the requester's contact number is the user profile
(`users.phone`).

**Rule:** any "phone required to submit a request" flow must persist the entered
number to the profile via `updateCurrentUser({ phone })` (+ `refresh()`), and
treat that update as a HARD prerequisite — if it fails, do NOT create the
request. A best-effort/swallowed update means the request is created with no
reachable contact, defeating the requirement.

**Why:** validating a phone in the UI is meaningless if the value is discarded
(the original `app/request/new.tsx` collected + validated phone but never sent
it anywhere). Both request entry points (`app/request/new.tsx` and
`app/(tabs)/request.tsx`) must stay consistent.

**How to apply:** validate with the shared `lib/phone.ts` `normalizeIlPhone()`
(strips spaces/dashes, +972/972 → leading 0, accepts Israeli 0 + 8–9 digits),
persist the normalized value, then create the request.
