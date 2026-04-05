# CC FUNNEL — Lead Capture System

> Multi-step lead capture funnel for Conaugh McKenna / OASIS AI Solutions.
> Part of the Business-Empire-Agent ecosystem — managed by Bravo.

## Stack
- **Framework:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS 3.4 with custom `brand.*` color tokens
- **Email:** Nodemailer 8 via Gmail SMTP (app password auth)
- **AI Email:** Claude Sonnet (`claude-sonnet-4-6`) — personalized follow-up emails on each submission
- **Notifications:** Telegram Bot API — real-time lead alerts to CC's phone
- **Database:** Supabase `funnel_leads` table — project `phctllmtsogkovoilwos` (Bravo)
- **Deploy:** Vercel (cc-funnel.vercel.app)

## Architecture

Single-page multi-step funnel. No auth, no dashboard — form in, leads out.

**3-step flow:**
1. **Step 0 — Interest selection:** User picks AI/Music/Brand (multi-select cards)
2. **Step 1 — Contextual questions:** Conditional fieldsets rendered per selected interest
3. **Step 2 — Contact info:** Name (required), email (required), phone, Instagram handle

**On submit (`POST /api/submit`) — three actions run in parallel via `Promise.allSettled`:**
1. Store lead in Supabase `funnel_leads` table
2. Send Telegram message to CC with full lead details
3. Generate a personalized email via Claude API → send via Nodemailer (Gmail SMTP)

If Claude API is unavailable, `fallbackEmail()` handles the response without breaking the submission.

## File Structure
```
src/
├── app/
│   ├── page.tsx              # Entire funnel UI — all 3 steps + thank-you state
│   ├── layout.tsx            # Root layout, OG/Twitter meta tags
│   ├── globals.css           # Base styles + CSS animations (fadeUp, borderGlow, etc.)
│   └── api/
│       └── submit/
│           └── route.ts      # POST handler: Supabase + Telegram + Claude + Nodemailer
├── components/               # Empty — all UI lives in page.tsx for now
public/
└── og-image.png              # OG image for social sharing
tailwind.config.ts            # Brand color tokens
```

## Brand Tokens (Tailwind)
| Token | Hex | Use |
|---|---|---|
| `brand-black` | `#0a0a0a` | Page background |
| `brand-dark` | `#141414` | — |
| `brand-card` | `#1a1a1a` | Input fields, card backgrounds |
| `brand-border` | `#2a2a2a` | Default borders |
| `brand-cream` | `#faf9f5` | Primary text |
| `brand-accent` | `#e8c547` | Gold — CTAs, selected state, active borders |
| `brand-muted` | `#888888` | Secondary text, placeholders |

## Environment Variables
All credentials live in Vercel environment variables. Never hardcode.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API — personalized email generation |
| `GMAIL_USER` | Gmail address for Nodemailer SMTP |
| `GMAIL_APP_PASSWORD` | Gmail app password (not the account password) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot for real-time lead alerts |
| `TELEGRAM_CHAT_ID` | CC's Telegram chat ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for server-side DB writes |
| `NEXT_PUBLIC_BOOKING_LINK` | Cal.com or Google Calendar booking link (shown on thank-you page) |

## Development Rules
1. **Keep it simple.** This is a lead form, not a SaaS. No auth, no routing, no state management libraries.
2. **All styling via Tailwind + `globals.css`.** No new CSS files. Use `brand.*` tokens — never raw hex in className.
3. **No heavy dependencies.** No Framer Motion, no React Hook Form, no Zod. Existing pattern: inline state + TypeScript types.
4. **Form state lives in `page.tsx`.** Until there is a reason to extract components, keep UI consolidated.
5. **Animations via CSS only.** `globals.css` already has `fadeUp`, `borderGlow`, `progress-bar` transitions — extend there.
6. **Mobile-first.** All layouts must work at 375px width. Test `max-w-md` constraints before adding anything wider.
7. **API route: fail gracefully.** `Promise.allSettled` means one failing integration (Supabase down, Telegram rate-limited) never blocks the others. Maintain this pattern.
8. **Claude email generation has a fallback.** `fallbackEmail()` must always stay in sync with interest types. If new interest types are added to `page.tsx`, update both `generatePersonalizedEmail` and `fallbackEmail` in `route.ts`.

## Supabase Schema — `funnel_leads`
Columns stored on submission:
`name`, `email`, `phone`, `instagram_handle`, `interests` (array), `business_name`, `business_type`, `biggest_pain`, `event_type`, `event_date`, `music_vibe`, `brand_goal`, `audience` (array), `current_following`, `created_at`

## Commands
```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build — run before every commit
npm run start    # Production server
```

## Part of Business-Empire-Agent
This app is managed by Bravo (CC's Lead Architect at `C:\Users\User\Business-Empire-Agent`).

When working here:
- Make ALL code changes in THIS repo (`C:\Users\User\APPS\cc-funnel`)
- Run `npm run build` to verify zero errors before committing
- Commit with descriptive messages from this repo's root
- After work is done, log a 1-2 sentence summary in `Business-Empire-Agent/memory/SESSION_LOG.md`
