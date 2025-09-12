import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Page, Card, ResourceList, Text, EmptyState } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client (move credentials to .env)
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Loader function: Runs on the server before the component renders
export async function loader({ request }: LoaderFunctionArgs) {
  // Authenticates the request and provides admin API context
  const { session } = await authenticate.admin(request);

  // 1. Fetch all raw click data from your existing 'dead_clicks' table
  const { data: rawClicks, error } = await supabase
    .from('dead_clicks')
    .select('page_path')
    .eq('store_url', session.shop);

  if (error) {
    console.error("Supabase error:", error);
    // Handle error appropriately
    return Response.json({ pages: [] }, { status: 500 });
  }

  // 2. Process the raw data in JavaScript to count clicks per page
  const pageCounts = rawClicks.reduce((acc, click) => {
    const path = click.page_path || 'Unknown Page'; // Group clicks with no path
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Format the data into an array of objects for the component
  const pages = Object.entries(pageCounts)
    .map(([path, count]) => ({
      path: path,
      click_count: count,
    }))
    .sort((a, b) => b.click_count - a.click_count); // Sort by most clicks

  return Response.json({ pages });
}

// Type for page data
type PageData = {
  path: string;
  click_count: number;
};

// React Component: Renders the UI
export default function Index() {
  const { pages } = useLoaderData<typeof loader>();

  const resourceListItems = pages.map((page: PageData, index: number) => ({
    id: `${index}`,
    url: `/app/insights${page.path}`, // Link to the detail page
    name: page.path,
    attribute: `${page.click_count} dead clicks`,
  }));

  return (
    <Page title="Dead Click Miner Dashboard">
      <Card>
        {pages.length > 0 ? (
          <ResourceList
            resourceName={{ singular: 'page', plural: 'pages' }}
            items={resourceListItems}
            renderItem={(item) => {
              const { id, url, name, attribute } = item;
              return (
                <ResourceList.Item
                  id={id}
                  url={url}
                  accessibilityLabel={`View details for ${name}`}
                >
                  <Text variant="bodyMd" fontWeight="bold" as="h3">
                    {name}
                  </Text>
                  <div>{attribute}</div>
                </ResourceList.Item>
              );
            }}
          />
        ) : (
          <EmptyState
            heading="No dead clicks recorded yet"
            image="[https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png](https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png)"
          >
            <p>Once your store starts recording events, you'll see a list of pages with dead clicks here.</p>
          </EmptyState>
        )}
      </Card>
    </Page>
  );
}
