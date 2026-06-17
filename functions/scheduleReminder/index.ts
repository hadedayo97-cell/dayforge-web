import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Create a Supabase admin client using the service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") ?? "reminders@dayforge.com";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase URL or Service Role Key environmental variables.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1.5 Scan for birthdays and schedule notifications
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, birthday");

      if (profilesError) {
        console.error("Error fetching profiles for birthday scan:", profilesError.message);
      } else if (profiles && profiles.length > 0) {
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();

        for (const profile of profiles) {
          if (!profile.birthday) continue;

          // Parse birthday "YYYY-MM-DD"
          const bdayParts = profile.birthday.split("-");
          if (bdayParts.length !== 3) continue;
          const bdayMonth = parseInt(bdayParts[1], 10) - 1; // 0-indexed month
          const bdayDate = parseInt(bdayParts[2], 10);

          if (bdayMonth === todayMonth && bdayDate === todayDate) {
            // Check if already scheduled this year
            const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();
            const { data: existingBdays, error: checkError } = await supabaseAdmin
              .from("notifications")
              .select("id")
              .eq("user_id", profile.id)
              .eq("type", "birthday")
              .gte("created_at", startOfYear);

            if (!checkError && (!existingBdays || existingBdays.length === 0)) {
              await supabaseAdmin.from("notifications").insert([{
                user_id: profile.id,
                type: "birthday",
                payload: {
                  title: `Happy Birthday, ${profile.full_name || "User"}! 🎂`,
                  message: `Wishing you a wonderful birthday from the team at DayForge! Keep forging ahead and achieving your goals.`
                },
                send_at: new Date().toISOString(),
                status: "scheduled"
              }]);
              console.log(`Scheduled birthday notification for user ${profile.id}`);
            }
          }
        }
      }
    } catch (bdayErr: any) {
      console.error("Failed to run birthday scan:", bdayErr.message);
    }

    // 2. Fetch notifications that are scheduled and due (send_at <= now)
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("status", "scheduled")
      .lte("send_at", new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending reminders to send at this time.", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Processing ${notifications.length} scheduled reminders...`);
    const results = [];

    // 3. Process each notification
    for (const notif of notifications) {
      try {
        // Fetch the user's email from Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
          notif.user_id
        );

        if (userError || !userData?.user?.email) {
          throw new Error(userError?.message || `User email not found for ID: ${notif.user_id}`);
        }

        const email = userData.user.email;
        const title = notif.payload?.title || "DayForge Reminder";
        const message = notif.payload?.message || "You have a scheduled reminder.";

        let emailSent = false;
        let deliveryError = "";

        if (resendApiKey) {
          // Send email using Resend API
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: `DayForge <${senderEmail}>`,
              to: email,
              subject: title,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1a202c;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">DayForge</h2>
                    <p style="color: #718096; margin: 4px 0 0 0; font-size: 14px;">Forge better days, one goal at a time.</p>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
                  <div style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                    <p style="font-weight: bold; font-size: 18px; margin-top: 0; color: #2d3748;">Hello,</p>
                    <p style="margin-top: 0;">This is a scheduled reminder from your DayForge dashboard:</p>
                    <div style="background-color: #f7fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                      <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px; font-weight: 700;">${title}</h4>
                      <p style="margin: 0; color: #4a5568; font-size: 14px;">${message}</p>
                    </div>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
                  <div style="text-align: center; font-size: 12px; color: #a0aec0;">
                    <p style="margin: 0;">You received this email because you scheduled a reminder in your DayForge account.</p>
                    <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} DayForge. All rights reserved.</p>
                  </div>
                </div>
              `,
            }),
          });

          if (emailResponse.ok) {
            emailSent = true;
          } else {
            const errBody = await emailResponse.text();
            deliveryError = `Resend API Error: ${errBody}`;
          }
        } else {
          // If Resend API Key is missing, simulate sending for offline development logging
          console.warn("⚠️ RESEND_API_KEY is not set. Simulating email send for offline mode.");
          console.log(`[SIMULATION] Email sent to: ${email}`);
          console.log(`[SIMULATION] Subject: ${title}`);
          console.log(`[SIMULATION] Message: ${message}`);
          emailSent = true;
        }

        if (emailSent) {
          // Update status to 'sent'
          await supabaseAdmin
            .from("notifications")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", notif.id);

          results.push({ id: notif.id, status: "sent", recipient: email });
        } else {
          throw new Error(deliveryError || "Unknown delivery failure");
        }
      } catch (err: any) {
        console.error(`Failed to send notification ${notif.id}:`, err.message);

        // Update status to 'failed'
        await supabaseAdmin
          .from("notifications")
          .update({ status: "failed" })
          .eq("id", notif.id);

        results.push({ id: notif.id, status: "failed", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ message: "Processed scheduled reminders.", processed: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Global Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
