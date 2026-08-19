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

## Trying it locally

Push notifications need HTTPS (or `localhost`, which browsers treat as
secure) and a real service worker registration — `npm run dev` plus a
browser tab is enough to test:

1. `npm run dev`, open the app, go to Settings, tap "Enable" under
   Notifications, and accept the browser's permission prompt.
2. To trigger the cron manually without waiting, call it directly:
   ```
   curl -H "Authorization: Bearer <your CRON_SECRET>" \
     http://localhost:3000/api/cron/notifications
   ```
   It'll report how many hearings/tasks it checked and how many
   notifications it sent. To actually see a notification, add/edit a
   hearing so its date falls within the next hour (or next 24 hours), or a
   task due tomorrow, then re-run the curl command.

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
