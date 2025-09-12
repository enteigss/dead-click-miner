import type { LoaderFunctionArgs } from "@remix-run/node";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loader({ request }: LoaderFunctionArgs) {
  // Handle CORS for cross-origin requests from Shopify stores
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers });
  }

  try {
    const url = new URL(request.url);
    const pagePath = url.searchParams.get("path");
    
    // Extract store URL from referer header or query param
    const referer = request.headers.get("referer");
    let storeUrl = url.searchParams.get("store");
    
    if (!storeUrl && referer) {
      try {
        const refererUrl = new URL(referer);
        storeUrl = refererUrl.hostname;
      } catch {
        // Ignore invalid referer URLs
      }
    }

    if (!pagePath) {
      return Response.json(
        { error: "Missing 'path' parameter" }, 
        { status: 400, headers }
      );
    }

    // Query dead clicks for the specific store and page
    const query = supabase
      .from("dead_clicks")
      .select("target_selector, click_x, click_y")
      .eq("page_path", pagePath);

    if (storeUrl) {
      query.eq("store_url", storeUrl);
    }

    const { data: clicks, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return Response.json(
        { error: "Failed to fetch click data" }, 
        { status: 500, headers }
      );
    }

    // Process element stats (count clicks per selector)
    const selectorCounts = (clicks || []).reduce((acc, click) => {
      const selector = click.target_selector || "Unknown Selector";
      acc[selector] = (acc[selector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const element_stats = Object.entries(selectorCounts).map(([selector, count]) => ({
      selector,
      click_count: count,
    }));

    // Process click positions (extract coordinates if available)
    const click_positions = (clicks || [])
      .filter(click => click.click_x !== null && click.click_y !== null)
      .map(click => ({
        x: click.click_x,
        y: click.click_y,
        selector: click.target_selector,
      }));

    return Response.json(
      {
        element_stats,
        click_positions,
      },
      { headers }
    );
  } catch (error) {
    console.error("Preview API error:", error);
    return Response.json(
      { error: "Internal server error" }, 
      { status: 500, headers }
    );
  }
}