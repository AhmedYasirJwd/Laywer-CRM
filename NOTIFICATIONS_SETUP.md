# Notification reminders — setup

This adds real push notifications: a reminder 1 day before and 1 hour
before each hearing, and a reminder 1 day before a task's due date. They
arrive even if the app/browser is closed, same as a phone notification.

## What was added

- `supabase/schema.sql` — a `push_subscriptions` table, plus reminder-tracking
  columns on `hearings` and `tasks`. **Run this file's new bottom section in
  your Supabase SQL Editor** (it's safe to re-run the whole file).
- `public/sw.js` — shows the notification when a push arrives, opens the
  right page on tap.
- `src/app/api/push/subscribe` — saves/removes a browser's subscription.
- `src/app/api/cron/notifications` — the job that actually checks for due
  reminders and sends them.
- `src/lib/notifications-cron.ts` — the reminder logic itself.
- Settings page now has a "Notifications" card to turn reminders on/off.
- A small "Turn on reminders" prompt appears once per browser until
  dismissed or enabled.

**Vercel Hobby note:** Vercel Cron on the free plan only allows once-a-day
schedules, which is too coarse for an hour-before reminder. So instead of
relying on Vercel Cron, `/api/cron/notifications` is a plain API route that
any external scheduler can call — see "Scheduling the cron" below.

## One-time setup

1. **Run the schema update.** Open `supabase/schema.sql`, copy it into the
   Supabase SQL Editor, and run it (it's idempotent, so this is safe even
   though you've run it before).

2. **Generate a VAPID keypair** (this is what lets your server send pushes
   without impersonating anyone):
   ```
   npx web-push generate-vapid-keys
   ```
   This prints a public and private key.

3. **Get your Supabase service role key**: Supabase Dashboard → Project
   Settings → API → `service_role` key. Keep this secret — it bypasses your
   row-level security.

4. **Generate a cron secret** (any random string works):
   ```
   openssl rand -hex 32
   ```

5. **Fill in the new environment variables** — locally in `.env.local`, and
   on Vercel under Project Settings → Environment Variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_SUBJECT=mailto:you@example.com
   CRON_SECRET=...
   ```

6. **Install the new dependency**:
   ```
   npm install
   ```

7. **Deploy** to Vercel as usual (set the same env vars there under Project
   Settings → Environment Variables).

## Scheduling the cron (Vercel Hobby plan)

Vercel Cron on Hobby only supports once-a-day jobs, which can't hit an
"hour before" reminder on time. Use a free external scheduler instead —
`/api/cron/notifications` is a normal GET endpoint, so anything that can
call a URL on a timer works.

**Easiest: [cron-job.org](https://cron-job.org)** (free, no code)
1. Create a free account.
2. Add a new cron job:
   - URL: `https://<your-app>.vercel.app/api/cron/notifications`
   - Schedule: every 15 minutes
   - Under "Advanced" → Request headers, add:
     `Authorization: Bearer <your CRON_SECRET>`
3. Save. That's it — it'll call your endpoint every 15 minutes from now on.

**Alternative: GitHub Actions** (if your code is on GitHub), add
`.github/workflows/notifications-cron.yml`:
```yaml
name: Notification reminders
on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch: {}
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -f -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://<your-app>.vercel.app/api/cron/notifications
```
Add `CRON_SECRET` as a repo secret (Settings → Secrets and variables →
Actions) with the same value you set on Vercel. Note GitHub's schedule
timing isn't exact under load, so treat 15 minutes as "roughly."

If you later upgrade to Vercel Pro, you can switch back to Vercel Cron by
adding a `vercel.json` with:
```json
{ "crons": [{ "path": "/api/cron/notifications", "schedule": "*/15 * * * *" }] }
```

## Debugging: reminder didn't arrive

The single most useful step: call the cron endpoint yourself and read what
it says. It tells you exactly how many hearings/tasks it checked, how many
notifications it sent, and any errors:
```
curl -H "Authorization: Bearer <your CRON_SECRET>" \
  https://<your-app>.vercel.app/api/cron/notifications
```
It replies with JSON like:
```json
{ "ok": true, "hearingsChecked": 1, "tasksChecked": 0, "notificationsSent": 1, "subscriptionsPruned": 0, "errors": [] }
```

Read that response against this checklist:

- **`hearingsChecked` / `tasksChecked` is 0 when you expected it to find
  something** → the schema migration probably hasn't been run against your
  *production* Supabase project (the new `reminder_24h_sent_at` /
  `reminder_1h_sent_at` / `reminder_sent_at` columns). Re-run
  `supabase/schema.sql` in the SQL Editor. If those columns don't exist yet,
  the query errors out and you'll see it under `"errors"`.
- **`hearingsChecked` is right but `notificationsSent` is 0** → you have no
  saved push subscription for that user. Open the app on the device you
  want reminders on, go to Settings, and tap "Enable" under Notifications
  (and accept the browser permission prompt). Note: **iPhone Safari only
  supports push if the app has been "Added to Home Screen"** — opened in a
  normal Safari tab, push isn't available at all (this is an Apple
  restriction, not something the app controls).
- **You get `401 Unauthorized`** → the `Authorization` header doesn't match
  `CRON_SECRET` set on Vercel. Double check you copied the exact same value
  into both cron-job.org (or GitHub Actions) and Vercel's env vars — and
  that you redeployed after adding it (env var changes need a redeploy to
  take effect).
- **You get a 500 with an error message mentioning VAPID** → one of
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`
  isn't set on Vercel (setting them only in `.env.local` doesn't cover
  production — they need to be added in Vercel's Project Settings too).
- **Everything above looks right and it still doesn't arrive** → check
  `errors` in the response for something from the push service itself
  (e.g. a malformed VAPID key), and check your OS-level notification
  settings for the browser (some OSes block a specific browser's
  notifications separately from the in-browser permission).
- Also double check the actual scheduler is running: on cron-job.org, the
  job's history/log tab shows each execution and its HTTP status.

## Testing it end-to-end

1. Make sure you completed the one-time setup above, including the
   scheduler (cron-job.org or GitHub Actions).
2. In the app, go to Settings → Notifications → Enable, accept the
   permission prompt.
3. Create a hearing dated about 50–55 minutes from now (inside the 1-hour
   window) — or a task due tomorrow.
4. Either wait for the scheduler's next run, or trigger it immediately with
   the `curl` command above — same effect, just doesn't make you wait.
5. You should get a system notification within moments of that curl/run.
   Tapping it opens Calendar (for hearings) or Tasks.
6. To test the offline/local backstop (new — see below): with the app
   open in a tab, turn off your device's Wi-Fi/data, create or already have
   a hearing inside the 1-hour or 24-hour window, and wait up to a minute —
   a notification should still appear even with no connection, since it's
   checking data already cached on your device.

## Offline notifications

True push (the kind that reaches you with the app fully closed) requires
the *server* to have internet to deliver it — that's unavoidable for any
app, not just this one, so if this device or the server has no connection
and the app isn't open, nothing can wake it up.

What's still solvable: **if the app is open — foreground or a background
browser tab — reminders now also work with zero internet connection.**
`src/lib/local-reminders.ts` checks hearings/tasks already cached on the
device (the same offline store the Calendar/Tasks pages already use — see
`src/lib/offline-db.ts`) once a minute and whenever the tab becomes
visible, and shows the same style of notification locally, no network
needed. This runs automatically whenever the app is open — no extra setup.

So in practice: closed app + online → server push. Open app + offline →
local check. Closed app + offline → nothing can fire, same as any app.

## Notes / things worth knowing

- **Vercel plan limits**: Vercel Cron itself isn't used here (see
  "Scheduling the cron" above) specifically because Hobby restricts it to
  once a day. If you're on Pro and would rather use Vercel's built-in cron,
  the note above shows the `vercel.json` to add.
- Each reminder only ever sends once (tracked via the new
  `reminder_24h_sent_at` / `reminder_1h_sent_at` / `reminder_sent_at`
  columns), so it's safe for the cron to run frequently.
- Tasks only have a due *date*, not a time, so they get one "due tomorrow"
  reminder rather than the two hearings get. Say the word if you'd also
  like a same-day "due today" ping, or an "overdue" one.
- If a subscription goes stale (user uninstalled, cleared data, etc.) the
  cron detects that from the push service's response and quietly removes
  it — no cleanup needed on your end.
- The local/offline backstop and the server push track "already sent"
  separately (one in the browser's localStorage, one in Supabase) — so in
  the specific case where you were offline when a reminder fired locally
  and then come back online before the server-side window closes, you
  might get the same reminder twice. Harmless, just occasionally
  redundant — the trade-off for the offline case actually working.
