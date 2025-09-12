import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
    return Response.json({ 
      selectors: [], 
      pagePath, 
      shop: session.shop,
      error: "Failed to fetch click data" 
    }, { status: 500 });
  }

  if (!rawClicks) {
    return Response.json({ selectors: [], pagePath, shop: session.shop });
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

  return Response.json({ selectors, pagePath, shop: session.shop });
}

// SERVER-SIDE ACTION: Handles the "Preview Mode" button click
export async function action({ request }: ActionFunctionArgs) {
    const { admin, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const pagePath = formData.get("pagePath") as string;
    const shop = session.shop;

    const query = `
      query GetLiveTheme {
        themes(first: 10) {
          edges {
            node { 
              id 
              role
            }
          }
        }
      }`;

    const response = await admin.graphql(query);
    const result = await response.json();

    const themes = result.data?.themes?.edges || [];
    const mainTheme = themes.find((edge: any) => edge.node.role === "MAIN");
    
    if (mainTheme) {
        const themeId = mainTheme.node.id.split("/").pop();
        // const previewUrl = `https://${shop}${pagePath}?preview_theme_id=${themeId}&dead_click_preview=true`;
        const previewUrl = `https://${shop}${pagePath}?dead_click_preview=true`;
        console.log(`Preview URL: ${previewUrl}`);
        return Response.json({ previewUrl });
    }

    return Response.json({ error: "Could not retrieve theme ID." }, {status: 500});
}


// CLIENT-SIDE COMPONENT
export default function InsightsPage() {
  const { selectors, pagePath, shop } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const loading = navigation.state === "loading";

  // Handle redirect after preview URL is fetched
  useEffect(() => {
    if (fetcher.data?.previewUrl) {
      open(fetcher.data.previewUrl, '_blank');
    }
  }, [fetcher.data, shopify]);

  const handleTestSelector = (selector: string) => {
    const testUrl = `https://${shop}${pagePath}?highlight_selector=${encodeURIComponent(selector)}`;
    open(testUrl, '_blank');
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