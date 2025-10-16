import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: This is a public endpoint. Add security checks as needed (e.g., CORS, API keys).
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers for cross-origin requests from Shopify stores
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle OPTIONS preflight requests (required for CORS)
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return json({ message: "Method not allowed" }, { status: 405, headers: corsHeaders });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ message: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { store_url, page_path, target_selector, click_x, click_y, timestamp, session_id } = body;

    // Insert click data with coordinates and session ID
    const { data, error } = await supabase
      .from('dead_clicks')
      .insert([{
        store_url,
        page_path,
        target_selector,
        click_x,
        click_y,
        session_id,
        timestamp: timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error("Tracking error:", error);
      return json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    return json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    return json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }
}