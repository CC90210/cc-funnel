import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- Email templates per interest ---
function buildWelcomeEmail(name: string, interests: string[], body: Record<string, string>) {
  const firstName = name.split(" ")[0];

  const sections: string[] = [];

  if (interests.includes("ai")) {
    sections.push(`
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:16px;border-left:3px solid #e8c547">
        <h3 style="color:#e8c547;margin:0 0 8px">⚡ Your Free AI Audit</h3>
        <p style="color:#ccc;margin:0">I'm personally reviewing <strong>${body.businessName || "your business"}</strong> right now. You'll have a full breakdown of what I'd automate first — and exactly how much time it'll save you — in your inbox within 48 hours.</p>
        ${body.biggestPain ? `<p style="color:#999;margin:8px 0 0;font-size:14px">You mentioned: "${body.biggestPain}" — that's the first thing I'm looking at.</p>` : ""}
      </div>
    `);
  }

  if (interests.includes("music")) {
    sections.push(`
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:16px;border-left:3px solid #e8c547">
        <h3 style="color:#e8c547;margin:0 0 8px">🎧 DJ Booking</h3>
        <p style="color:#ccc;margin:0">I've got your event details${body.eventType ? ` (${body.eventType})` : ""}${body.eventDate ? ` around ${body.eventDate}` : ""}. I'll reach out within 24 hours to lock in availability and talk vibe.</p>
        ${body.musicVibe ? `<p style="color:#999;margin:8px 0 0;font-size:14px">Vibe you're going for: "${body.musicVibe}" — love it.</p>` : ""}
      </div>
    `);
  }

  if (interests.includes("brand")) {
    sections.push(`
      <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:16px;border-left:3px solid #e8c547">
        <h3 style="color:#e8c547;margin:0 0 8px">🔥 Free Brand Strategy Session</h3>
        <p style="color:#ccc;margin:0">I'll DM you on Instagram${body.audience ? ` — since you're targeting ${body.audience}` : ""} to find a time for your 15-minute strategy call. No pitch, just value.</p>
        ${body.brandGoal ? `<p style="color:#999;margin:8px 0 0;font-size:14px">Your goal: "${body.brandGoal}" — I've got some ideas already.</p>` : ""}
      </div>
    `);
  }

  const html = `
    <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:520px;margin:0 auto">
        <h1 style="color:#faf9f5;font-size:24px;margin:0 0 8px">You're in, ${firstName}.</h1>
        <p style="color:#888;font-size:16px;margin:0 0 24px">Here's what happens next:</p>

        ${sections.join("")}

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2a2a2a">
          <p style="color:#888;font-size:14px;margin:0">Talk soon,</p>
          <p style="color:#faf9f5;font-size:16px;font-weight:600;margin:4px 0 0">— CC McKenna</p>
          <p style="color:#666;font-size:12px;margin:8px 0 0">Founder, OASIS AI Solutions</p>
        </div>
      </div>
    </div>
  `;

  const subjectMap: Record<string, string> = {
    ai: "Your free AI audit is on its way",
    music: "Let's lock in your event",
    brand: "Your brand strategy session",
  };
  const subject = subjectMap[interests[0]] || "You're in — here's what's next";

  return { subject, html };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interests, name, email, instagram } = body;

    // Run all 3 actions in parallel for speed
    const promises: Promise<unknown>[] = [];

    // 1. Store in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      promises.push(
        fetch(`${supabaseUrl}/rest/v1/funnel_leads`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            name,
            email,
            instagram_handle: instagram || null,
            interests,
            business_name: body.businessName || null,
            business_type: body.businessType || null,
            biggest_pain: body.biggestPain || null,
            event_type: body.eventType || null,
            event_date: body.eventDate || null,
            music_vibe: body.musicVibe || null,
            brand_goal: body.brandGoal || null,
            audience: body.audience || null,
            current_following: body.currentFollowing || null,
            created_at: new Date().toISOString(),
          }),
        })
      );
    }

    // 2. Notify CC via Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (telegramToken && chatId) {
      const interestLabels: Record<string, string> = {
        ai: "⚡ AI Audit",
        music: "🎧 DJ Booking",
        brand: "🔥 Brand Session",
      };
      const interestText = interests
        .map((i: string) => interestLabels[i] || i)
        .join(", ");

      let details = "";
      if (interests.includes("ai") && body.businessName) {
        details += `\nBusiness: ${body.businessName} (${body.businessType || "?"})`;
        if (body.biggestPain) details += `\nPain: ${body.biggestPain}`;
      }
      if (interests.includes("music") && body.eventType) {
        details += `\nEvent: ${body.eventType}`;
        if (body.eventDate) details += ` — ${body.eventDate}`;
        if (body.musicVibe) details += `\nVibe: ${body.musicVibe}`;
      }
      if (interests.includes("brand") && body.brandGoal) {
        details += `\nGoal: ${body.brandGoal}`;
        if (body.audience) details += `\nAudience: ${body.audience}`;
        if (body.currentFollowing)
          details += ` (${body.currentFollowing} followers)`;
      }

      const message =
        `🚀 <b>New Funnel Lead</b>\n\n` +
        `<b>${name}</b>\n` +
        `${email}\n` +
        `${instagram ? `@${instagram}` : "(no IG)"}\n\n` +
        `Interested in: ${interestText}` +
        details;

      promises.push(
        fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message.slice(0, 4096),
              parse_mode: "HTML",
            }),
          }
        )
      );
    }

    // 3. Send personalized welcome email to the lead
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass && email) {
      const { subject, html } = buildWelcomeEmail(name, interests, body);

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      promises.push(
        transporter.sendMail({
          from: `"Conaugh McKenna" <${gmailUser}>`,
          to: email,
          subject,
          html,
        })
      );
    }

    // Execute all in parallel — don't let one failure block others
    await Promise.allSettled(promises);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Funnel submit error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
