# Pomotea

A calm Pomodoro timer built with Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4 and Nuxt i18n. The original Pomotea cup empties as the session progresses. Tea and Coffee offer two distinct palettes; focus and break sessions are deliberately manual.

## Development

Requires Node.js 24.11+ and pnpm 12.3.4.

```sh
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
pnpm generate
```

Deploy `.output/public` to a static HTTPS host. English lives at `/`, Spanish at `/es`. Serve actual static files before fallback routing, including `/sw.js` as JavaScript. Set `Cache-Control: no-cache` for `/sw.js` and HTML; hashed `/_nuxt/` assets may be immutable. `pnpm generate` includes both locales and prepares the offline cache. `pnpm build` also supports a Nuxt server deployment, but the offline shell is prepared only by `generate`.

`NUXT_PUBLIC_I18N_BASE_URL` overrides the canonical production origin at build time. Update `public/sitemap.xml` and `public/robots.txt` if deploying under another domain. The app assumes deployment at the origin root.

## Architecture

- `app/lib/timer.ts`: pure timer transitions and strict storage validation, tested with Node's test runner.
- `app/composables/usePomodoro.ts`: browser lifecycle, one atomic localStorage snapshot, and cross-tab coordination.
- `app/composables/usePreferences.ts`: validated settings, SSR theme cookie, and original app duration import.
- `app/composables/useSessionAlerts.ts`: opt-in notifications and a short synthesized chime.
- `app/components/TimerCup.vue`: original SVG silhouette/handle with a clipped liquid level and reduced-motion-aware steam.
- shadcn-vue/Refined Reka primitives handle dialog focus, keyboard navigation and form controls. The timer, cup and action controls are product-specific.

A running session stores an absolute `endAt`; ticks only refresh the display. Reload, `pageshow`, focus and visibility changes reconcile against the clock. Pausing stores exact milliseconds, so repeatedly pausing does not add fractional seconds. Completion is persisted, including when the device was suspended. The timer never silently starts the next session.

Web Locks serialize mutations between same-origin tabs and prevent duplicate completion alerts. Storage events keep their displays aligned. Browsers without Web Locks fall back to storage events and notification tags; simultaneous tab actions and duplicate sounds cannot be strictly serialized there. If storage is unavailable, the page continues in memory and explains that reload recovery is unavailable. Settings are local to this browser; clearing site data removes them.

System clock changes affect the wall-clock deadline. Remaining time is clamped to the session duration and zero. No browser-only solution can recover both true elapsed time across a restart and an arbitrarily changed system clock without a trusted external time source.

## Alerts and installation

| Situation | Actual behavior |
| --- | --- |
| App active | Completion state, optional chime, and an OS notification if permission is granted and supported. |
| Open in the background | Same deadline, but browsers may throttle or freeze JavaScript. Alerts can be late. |
| Device suspended | Reconciles on wake. Alerts more than one minute late are suppressed; the completion message remains. |
| All app windows closed | No scheduled local alert. On reopening, the elapsed session is recovered. |

Notification permission is requested only through the settings action. Persistent notifications use `ServiceWorkerRegistration.showNotification`; a desktop constructor fallback is attempted where needed. Browser/OS settings, Focus modes and permission revocation can suppress delivery. The chime needs a user interaction after page load and may be unavailable after a reload until the next interaction.

The manifest enables installation where supported. iOS/iPadOS notification support requires a supported OS (16.4+) and installation to the Home Screen. Installation does **not** make a service worker an always-running timer. The service worker handles notification clicks and the generated offline shell; it runs no interval or timeout. Offline support requires a successful initial online cache installation, enough storage, and `pnpm generate`. Cache eviction by the browser can remove it. New releases activate once existing app windows close, keeping each open session on a coherent asset version.

### If closed-app reminders become a requirement

Add a small opt-in Web Push backend: VAPID keys kept on the server, an anonymous per-device subscription, durable scheduled jobs keyed by session ID, and endpoints to schedule/cancel on start, pause, resume and reset. Expire subscriptions and completed jobs, rate-limit requests, validate ownership through a random capability token, and discard stale session revisions. A push handler in the service worker would display the notification. This requires durable storage and a scheduler; client-only timers, Background Sync and periodic sync are not substitutes. Even push delivery is subject to connectivity and OS policies, so it is not an exact alarm guarantee. This infrastructure is intentionally absent from the current local-first product.

Sources checked October 2026: [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API), [showNotification](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification), [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API), [background tab policies](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [WebKit Home Screen Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Apple Web Push requirements](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers).

## Visual decisions

The original cup's geometry and draining metaphor remain the identity. Sage tea, warm paper and espresso coffee replace the original panel, shadows and blue Coffee actions. Geist connects to the portfolio's typographic clarity; locally bundled Fraunces adds a softer voice to headings and the wordmark. A two-column ritual becomes one column on phones. Settings remain in a keyboard-accessible dialog. No account, analytics, task lists, streaks or external runtime services are required.

Design skill: Editorial greeting, seed `20590678`. Its centered editorial composition was adapted to the user's single-purpose timer: no sidebar, KPI tiles or dashboard. The shell was redrawn once because those controls contradict the brief. Oversized time figures and the prominent cup intentionally supersede the skill's dashboard-sized figures. No sample metrics or generated images are used.

Original artwork and behavior: [aruizcastillo/pomotea](https://github.com/aruizcastillo/pomotea), `src/app/components/cup/cup.component.html` and `src/app/services/timer.service.ts`. This is a new Nuxt implementation, not an Angular compatibility layer.
