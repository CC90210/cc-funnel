import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// --- Claude-powered personalized email ---
async function generatePersonalizedEmail(
  name: string,
  interests: string[],
  details: Record<string, string>
): Promise<{ subject: string; body: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackEmail(name, interests, details);
  }

  const firstName = name.split(" ")[0];

  const contextParts: string[] = [];
  if (interests.includes("ai")) {
    contextParts.push(`They're interested in AI automation for their business.`);
    if (details.businessName) contextParts.push(`Business name: ${details.businessName}`);
    if (details.businessType) contextParts.push(`Business type: ${details.businessType}`);
    if (details.biggestPain) contextParts.push(`Their biggest pain point: "${details.biggestPain}"`);
  }
  if (interests.includes("music")) {
    contextParts.push(`They want to book a DJ.`);
    if (details.eventType) contextParts.push(`Event type: ${details.eventType}`);
    if (details.eventDate) contextParts.push(`Date: ${details.eventDate}`);
    if (details.musicVibe) contextParts.push(`Vibe they want: "${details.musicVibe}"`);
  }
  if (interests.includes("brand")) {
    contextParts.push(`They want help building their personal brand.`);
    if (details.brandGoal) contextParts.push(`Their goal: ${details.brandGoal}`);
    if (details.audience) contextParts.push(`Target audience: ${details.audience}`);
    if (details.currentFollowing) contextParts.push(`Current following: ${details.currentFollowing}`);
  }

  const prompt = `You are Conaugh McKenna (CC), a 22-year-old entrepreneur who runs OASIS AI Solutions (an AI automation agency), DJs events, and coaches people on personal branding. You're authentic, warm, direct, and never salesy. You talk like you're texting a friend — casual but sharp.

Someone named ${firstName} just filled out your funnel form. Here's what they told you:
${contextParts.join("\n")}

Write a SHORT, personalized email to ${firstName}. Rules:
- Sound like YOU, not a corporation. No "Dear" or "Thank you for your interest."
- Reference their SPECIFIC details (business name, pain point, event type, etc.)
- Tell them exactly what you're going to do for them and when
- If AI interest: tell them you'll send a personalized AI audit within 48 hours
- If music interest: tell them you'll reach out to discuss their event
- If brand interest: tell them you'll DM them on Instagram to book a 15-min strategy session
- Keep it under 150 words
- End with "— CC"
- No emojis in the body text

Return ONLY a JSON object with "subject" and "body" keys. The body should be plain text (not HTML). No markdown, no code fences, just the JSON.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Claude API error:", res.status);
      return fallbackEmail(name, interests, details);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const parsed = JSON.parse(text);
    return { subject: parsed.subject, body: parsed.body };
  } catch (e) {
    console.error("Claude generation failed:", e);
    return fallbackEmail(name, interests, details);
  }
}

// Fallback if Claude API is down
function fallbackEmail(
  name: string,
  interests: string[],
  details: Record<string, string>
): { subject: string; body: string } {
  const firstName = name.split(" ")[0];

  if (interests.includes("ai")) {
    return {
      subject: `${firstName}, your AI audit is coming`,
      body: `Hey ${firstName},\n\nGot your info — I'm reviewing ${details.businessName || "your business"} right now. You'll have a full breakdown of what I'd automate first in your inbox within 48 hours.\n\n${details.biggestPain ? `You mentioned "${details.biggestPain}" — that's the first thing I'm looking at.\n\n` : ""}Talk soon,\n— CC`,
    };
  }
  if (interests.includes("music")) {
    return {
      subject: `${firstName}, let's talk about your event`,
      body: `Hey ${firstName},\n\nGot your details${details.eventType ? ` for your ${details.eventType}` : ""}${details.eventDate ? ` around ${details.eventDate}` : ""}. I'll reach out within 24 hours to talk availability and vibe.\n\n${details.musicVibe ? `"${details.musicVibe}" — I already have some ideas.\n\n` : ""}— CC`,
    };
  }
  return {
    subject: `${firstName}, let's book your strategy session`,
    body: `Hey ${firstName},\n\nI'm reaching out about your free brand strategy session. ${details.brandGoal ? `You said your goal is to ${details.brandGoal}` : "I've got some ideas"} — I'll DM you on Instagram to find a time this week.\n\n15 minutes, zero pitch, and you'll walk away with something you can use immediately.\n\n— CC`,
  };
}

// --- Format email as HTML ---
function wrapInHtml(body: string): string {
  const htmlBody = body
    .split("\n\n")
    .map((p) => `<p style="color:#ccc;line-height:1.6;margin:0 0 16px">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `
    <div style="background:#0a0a0a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="max-width:520px;margin:0 auto">
        ${htmlBody}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #2a2a2a">
          <p style="color:#666;font-size:12px;margin:0">Conaugh McKenna | OASIS AI Solutions</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interests, name, email, phone, instagram } = body;

    // Run all actions in parallel
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
            phone: phone || null,
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

    // 2. Notify CC via Telegram (with phone number now included)
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
        `📧 ${email}\n` +
        `${phone ? `📱 ${phone}\n` : ""}` +
        `${instagram ? `📸 @${instagram}\n` : ""}` +
        `\nInterested in: ${interestText}` +
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

    // 3. Generate personalized email with Claude + send via Gmail
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass && email) {
      const emailPromise = generatePersonalizedEmail(name, interests, body).then(
        ({ subject, body: emailBody }) => {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: gmailUser, pass: gmailPass },
          });

          return transporter.sendMail({
            from: `"Conaugh McKenna" <${gmailUser}>`,
            to: email,
            subject,
            text: emailBody,
            html: wrapInHtml(emailBody),
          });
        }
      );

      promises.push(emailPromise);
    }

    // Execute all in parallel — don't let one failure block others
    const results = await Promise.allSettled(promises);

    // Log any failures server-side
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Action ${i} failed:`, r.reason);
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Funnel submit error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
