import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher, useNavigation } from "@remix-run/react";
import {
  Page,
  Card,
  ResourceList,
  Text,
  Badge,
  Button,
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { createClient } from "@supabase/supabase-js";
import { useAppBridge } from "@shopify/app-bridge-react";

// Type for selector data
type SelectorData = {
  target_selector: string;
  click_count: number;
};

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// SERVER-SIDE LOADER: Fetches data before the page renders
export async function loader({ request, params }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const splat = params["*"];

  // Reconstruct the page path from the URL splat
  let pagePath = `/${splat}`;
  if (splat === "__root__") {
    pagePath = "/";
  }

  const { data: rawClicks, error } = await supabase
    .from("dead_clicks")
    .select("target_selector")
    .eq("store_url", session.shop)
    .eq("page_path", pagePath);

  if (error) {
    console.error("Supabase error:", error);
    return json({
      selectors: [],
      pagePath,
      shop: session.shop,
      error: "Failed to fetch click data"
    }, { status: 500 });
  }

  if (!rawClicks) {
    return json({ selectors: [], pagePath, shop: session.shop });
  }

  // Process data to count selectors
  const selectorCounts = rawClicks.reduce((acc, click) => {
    const selector = click.target_selector || "Unknown Selector";
    acc[selector] = (acc[selector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const selectors = Object.entries(selectorCounts)
    .map(([selector, count]) => ({
      target_selector: selector,
      click_count: count,
    }))
    .sort((a, b) => b.click_count - a.click_count);

  return json({ selectors, pagePath, shop: session.shop });
}

// SERVER-SIDE ACTION: Handles the "Preview Mode" button click
export async function action({ request }: ActionFunctionArgs) {
    try {
        console.log("=== Preview Mode Action Started ===");

        const { admin, session } = await authenticate.admin(request);
        console.log("Authentication successful, shop:", session.shop);

        const formData = await request.formData();
        const pagePath = formData.get("pagePath") as string;
        const shop = session.shop;

        console.log("Form data - pagePath:", pagePath);
        console.log("Session shop:", shop);

        // Try to get preview URL from any product (since products implement OnlineStorePreviewable)
        const productQuery = `
          query GetProductPreview {
            products(first: 1) {
              edges {
                node {
                  id
                  onlineStorePreviewUrl
                }
              }
            }
          }`;

        console.log("Executing product query...");
        const productResponse = await admin.graphql(productQuery);
        console.log("Product response status:", productResponse.status);

        const productResult = await productResponse.json();
        console.log("Product query result:", JSON.stringify(productResult, null, 2));

        if ('errors' in productResult && productResult.errors) {
            console.error("GraphQL errors:", productResult.errors);
            return json({ error: "GraphQL query failed", details: productResult.errors }, { status: 500 });
        }

        const product = productResult.data?.products?.edges?.[0]?.node;
        const basePreviewUrl = product?.onlineStorePreviewUrl;

        console.log("Found product:", !!product);
        console.log("Base preview URL:", basePreviewUrl);

        if (basePreviewUrl) {
            try {
                // Extract the base URL and token, then construct URL for our specific page
                const url = new URL(basePreviewUrl);
                console.log("Original URL parts - host:", url.host, "pathname:", url.pathname, "search:", url.search);

                // Keep the authentication parameters but change the path
                url.pathname = pagePath;
                url.searchParams.set('dead_click_preview', 'true');
                const previewUrl = url.toString();

                console.log(`Final preview URL: ${previewUrl}`);
                return json({ previewUrl });
            } catch (urlError) {
                console.error("Error constructing URL:", urlError);
                throw urlError;
            }
        }

        // Fallback: construct URL manually (may require password)
        console.log("No product preview URL found, using fallback");
        const fallbackUrl = `https://${shop}${pagePath}?dead_click_preview=true`;
        console.log(`Fallback preview URL: ${fallbackUrl}`);
        return json({ previewUrl: fallbackUrl });

    } catch (error) {
        console.error("=== Preview Mode Action Error ===");
        console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("Full error:", error);
        console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");

        return json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error),
            type: error instanceof Error ? error.constructor.name : typeof error
        }, { status: 500 });
    }
}


// CLIENT-SIDE COMPONENT
export default function InsightsPage() {
  const { selectors, pagePath, shop } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const fetcher = useFetcher<typeof action>();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const loading = navigation.state === "loading";

  // Handle opening preview URL in new tab after URL is fetched
  useEffect(() => {
    if (fetcher.data && 'previewUrl' in fetcher.data) {
      // Open the authenticated preview URL in a new tab
      window.open(fetcher.data.previewUrl, '_blank');
    }
  }, [fetcher.data]);

  const handleTestSelector = (selector: string) => {
    // For now, just open the regular preview - could be enhanced to highlight specific selectors
    const formData = new FormData();
    formData.append("pagePath", pagePath);
    fetcher.submit(formData, { method: "post" });
  };

  const renderItem = (item: SelectorData) => {
    const { target_selector, click_count } = item;
    return (
      <ResourceList.Item
        id={target_selector}
        accessibilityLabel={`${target_selector} with ${click_count} clicks`}
        onClick={() => handleTestSelector(target_selector)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Text variant="bodyMd" as="p" fontWeight="medium">{target_selector}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Badge tone="critical">{`${click_count} ${click_count === 1 ? 'click' : 'clicks'}`}</Badge>
                <Button size="micro" onClick={() => handleTestSelector(target_selector)}>Test Selector</Button>
            </div>
        </div>
      </ResourceList.Item>
    );
  };

  return (
    <Page
      title={`Dead Clicks: ${pagePath}`}
      backAction={{ content: "Back to overview", url: "/app" }}
      secondaryActions={[
        {
          content: "Preview Mode",
          onAction: () => {
            const formData = new FormData();
            formData.append("pagePath", pagePath);
            fetcher.submit(formData, { method: "post" });
          },
          loading: fetcher.state === "submitting",
          disabled: fetcher.state === "submitting",
        },
      ]}
    >
      <Card>
        <ResourceList
          resourceName={{ singular: "selector", plural: "selectors" }}
          items={selectors}
          renderItem={renderItem}
          loading={loading}
          emptyState={
            <EmptyState
                heading="No dead clicks found for this page"
                image="[https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png](https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png)"
            >
                <p>No dead clicks have been recorded for {pagePath}.</p>
            </EmptyState>
          }
        />
      </Card>

    </Page>
  );
}