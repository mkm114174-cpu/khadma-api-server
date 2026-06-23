---
name: Provider serviceType ↔ service matching
description: How a provider's serviceType maps to the static services catalog, and why it's brittle
---

`providers.serviceType` stores the **canonical Arabic service name** (e.g. "قص شعر"), not a service id. Across the Khadma app, code resolves a provider's service/category by matching that string against the static catalog: `services.find(s => s.name === provider.serviceType)`.

From the matched service you derive: `serviceId` (s.id, used to deep-link to `/(tabs)/request?serviceId=`), `categoryId` (for marker color/icon), `price`, and the localized display name via `serviceName(s.id, lang)` / fallback `serviceNameByType(serviceType, lang)`.

**Why:** there is no serviceId column on providers; the onboarding picker writes the Arabic `name`. Map markers, the provider ranking list, and the provider dashboard all rely on this name match.

**How to apply:** when adding provider→service logic, match by `s.name === serviceType` and always handle the no-match case (default to `categories[0]`, fall back display to `serviceNameByType`). If you change service names in `constants/services.ts`, existing provider rows keep the old string and will silently fail to match. A stable serviceType enum / serviceId column would remove this fragility.
