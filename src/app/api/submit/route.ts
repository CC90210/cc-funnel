import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interests, name, email, instagram } = body;

    // 1. Store in Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/funnel_leads`, {
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
      });
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

      await fetch(
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
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Funnel submit error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
