import type { ActionFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT: This is a public endpoint. Add security checks as needed (e.g., CORS, API keys).
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ message: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { store_url, page_path, target_selector, click_x, click_y, timestamp } = body;

    // Insert click data with coordinates
    const { data, error } = await supabase
      .from('dead_clicks')
      .insert([{ 
        store_url, 
        page_path, 
        target_selector, 
        click_x, 
        click_y, 
        timestamp: timestamp || new Date().toISOString()
      }]);

    if (error) {
      console.error("Tracking error:", error);
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }
}