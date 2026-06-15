import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  message: string;
  audience: "all" | "passengers" | "drivers";
  // Optional: target specific external_ids (used by trip trigger)
  external_ids?: string[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error("OneSignal credentials are not configured in Supabase secrets. Please set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY.");
    }

    const payload: NotificationPayload = await req.json();
    const { title, message, audience, external_ids } = payload;

    if (!title || !message) {
      return new Response(
        JSON.stringify({ error: "title and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Build OneSignal notification body ──────────────────────────────────
    const onesignalBody: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title, es: title },
      contents: { en: message, es: message },
    };

    if (external_ids && external_ids.length > 0) {
      // Target specific users by their Supabase UUIDs (External IDs)
      onesignalBody.include_aliases = { external_id: external_ids };
      onesignalBody.target_channel = "push";
    } else if (audience === "all") {
      // Send to all subscribed users
      onesignalBody.included_segments = ["Subscribed Users"];
    } else if (audience === "drivers") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: drivers } = await supabase
        .from("users")
        .select("id")
        .eq("role", "operator");

      if (drivers && drivers.length > 0) {
        onesignalBody.include_aliases = {
          external_id: drivers.map((d: { id: string }) => d.id),
        };
        onesignalBody.target_channel = "push";
      } else {
        return new Response(
          JSON.stringify({ success: false, message: "No drivers found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (audience === "passengers") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: passengers } = await supabase
        .from("users")
        .select("id")
        .eq("role", "passenger");

      if (passengers && passengers.length > 0) {
        onesignalBody.include_aliases = {
          external_id: passengers.map((p: { id: string }) => p.id),
        };
        onesignalBody.target_channel = "push";
      } else {
        return new Response(
          JSON.stringify({ success: false, message: "No passengers found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Limpiamos el KEY
    const rawKey = ONESIGNAL_REST_API_KEY.replace(/^(Basic\s+|Key\s+)/i, "").trim();

    // ── Send to OneSignal REST API ─────────────────────────────────────────
    const onesignalRes = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${rawKey}`,
      },
      body: JSON.stringify(onesignalBody),
    });

    const onesignalData = await onesignalRes.json();

    if (!onesignalRes.ok) {
      console.error("OneSignal error:", onesignalData);
      return new Response(
        JSON.stringify({ error: "OneSignal API error", details: onesignalData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, onesignal_id: onesignalData.id, recipients: onesignalData.recipients }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
