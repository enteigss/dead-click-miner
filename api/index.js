var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest,
  streamTimeout: () => streamTimeout
});
import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import {
  createReadableStreamFromReadable
} from "@remix-run/node";
import { isbot } from "isbot";

// app/shopify.server.ts
import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";

// app/db.server.ts
import { PrismaClient } from "@prisma/client";
var prisma = global.prismaGlobal ?? new PrismaClient(), db_server_default = prisma;

// app/shopify.server.ts
var shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(db_server_default),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: !0,
    removeRest: !0
  },
  ...process.env.SHOP_CUSTOM_DOMAIN ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] } : {}
});
var apiVersion = ApiVersion.January25, addDocumentResponseHeaders = shopify.addDocumentResponseHeaders, authenticate = shopify.authenticate, unauthenticated = shopify.unauthenticated, login = shopify.login, registerWebhooks = shopify.registerWebhooks, sessionStorage = shopify.sessionStorage;

// app/entry.server.tsx
import { jsx } from "react/jsx-runtime";
var streamTimeout = 5e3;
async function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  addDocumentResponseHeaders(request, responseHeaders);
  let userAgent = request.headers.get("user-agent"), callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";
  return new Promise((resolve, reject) => {
    let { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url
        }
      ),
      {
        [callbackName]: () => {
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, console.error(error);
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}

// app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App
});
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration
} from "@remix-run/react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function App() {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx2("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx2("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx2("link", { rel: "preconnect", href: "https://cdn.shopify.com/" }),
      /* @__PURE__ */ jsx2(
        "link",
        {
          rel: "stylesheet",
          href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        }
      ),
      /* @__PURE__ */ jsx2(Meta, {}),
      /* @__PURE__ */ jsx2(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx2(Outlet, {}),
      /* @__PURE__ */ jsx2(ScrollRestoration, {}),
      /* @__PURE__ */ jsx2(Scripts, {})
    ] })
  ] });
}

// app/routes/webhooks.app.scopes_update.tsx
var webhooks_app_scopes_update_exports = {};
__export(webhooks_app_scopes_update_exports, {
  action: () => action
});
var action = async ({ request }) => {
  let { payload, session, topic, shop } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);
  let current = payload.current;
  return session && await db_server_default.session.update({
    where: {
      id: session.id
    },
    data: {
      scope: current.toString()
    }
  }), new Response();
};

// app/routes/webhooks.app.uninstalled.tsx
var webhooks_app_uninstalled_exports = {};
__export(webhooks_app_uninstalled_exports, {
  action: () => action2
});
var action2 = async ({ request }) => {
  let { shop, session, topic } = await authenticate.webhook(request);
  return console.log(`Received ${topic} webhook for ${shop}`), session && await db_server_default.session.deleteMany({ where: { shop } }), new Response();
};

// app/routes/api.insights.preview.tsx
var api_insights_preview_exports = {};
__export(api_insights_preview_exports, {
  loader: () => loader
});
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL, supabaseKey = process.env.SUPABASE_KEY, supabase = createClient(supabaseUrl, supabaseKey);
async function loader({ request }) {
  let headers2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS")
    return new Response(null, { status: 200, headers: headers2 });
  try {
    let url = new URL(request.url), pagePath = url.searchParams.get("path"), referer = request.headers.get("referer"), storeUrl = url.searchParams.get("store");
    if (!storeUrl && referer)
      try {
        storeUrl = new URL(referer).hostname;
      } catch {
      }
    if (!pagePath)
      return Response.json(
        { error: "Missing 'path' parameter" },
        { status: 400, headers: headers2 }
      );
    let query = supabase.from("dead_clicks").select("target_selector, click_x, click_y").eq("page_path", pagePath);
    storeUrl && query.eq("store_url", storeUrl);
    let { data: clicks, error } = await query;
    if (error)
      return console.error("Supabase error:", error), Response.json(
        { error: "Failed to fetch click data" },
        { status: 500, headers: headers2 }
      );
    let selectorCounts = (clicks || []).reduce((acc, click) => {
      let selector = click.target_selector || "Unknown Selector";
      return acc[selector] = (acc[selector] || 0) + 1, acc;
    }, {}), element_stats = Object.entries(selectorCounts).map(([selector, count]) => ({
      selector,
      click_count: count
    })), click_positions = (clicks || []).filter((click) => click.click_x !== null && click.click_y !== null).map((click) => ({
      x: click.click_x,
      y: click.click_y,
      selector: click.target_selector
    }));
    return Response.json(
      {
        element_stats,
        click_positions
      },
      { headers: headers2 }
    );
  } catch (error) {
    return console.error("Preview API error:", error), Response.json(
      { error: "Internal server error" },
      { status: 500, headers: headers2 }
    );
  }
}

// app/routes/app.additional.tsx
var app_additional_exports = {};
__export(app_additional_exports, {
  default: () => AdditionalPage
});
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function AdditionalPage() {
  return /* @__PURE__ */ jsxs2(Page, { children: [
    /* @__PURE__ */ jsx3(TitleBar, { title: "Additional page" }),
    /* @__PURE__ */ jsxs2(Layout, { children: [
      /* @__PURE__ */ jsx3(Layout.Section, { children: /* @__PURE__ */ jsx3(Card, { children: /* @__PURE__ */ jsxs2(BlockStack, { gap: "300", children: [
        /* @__PURE__ */ jsxs2(Text, { as: "p", variant: "bodyMd", children: [
          "The app template comes with an additional page which demonstrates how to create multiple pages within app navigation using",
          " ",
          /* @__PURE__ */ jsx3(
            Link,
            {
              url: "https://shopify.dev/docs/apps/tools/app-bridge",
              target: "_blank",
              removeUnderline: !0,
              children: "App Bridge"
            }
          ),
          "."
        ] }),
        /* @__PURE__ */ jsxs2(Text, { as: "p", variant: "bodyMd", children: [
          "To create your own page and have it show up in the app navigation, add a page inside ",
          /* @__PURE__ */ jsx3(Code, { children: "app/routes" }),
          ", and a link to it in the ",
          /* @__PURE__ */ jsx3(Code, { children: "<NavMenu>" }),
          " component found in ",
          /* @__PURE__ */ jsx3(Code, { children: "app/routes/app.jsx" }),
          "."
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsx3(Layout.Section, { variant: "oneThird", children: /* @__PURE__ */ jsx3(Card, { children: /* @__PURE__ */ jsxs2(BlockStack, { gap: "200", children: [
        /* @__PURE__ */ jsx3(Text, { as: "h2", variant: "headingMd", children: "Resources" }),
        /* @__PURE__ */ jsx3(List, { children: /* @__PURE__ */ jsx3(List.Item, { children: /* @__PURE__ */ jsx3(
          Link,
          {
            url: "https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav",
            target: "_blank",
            removeUnderline: !0,
            children: "App nav best practices"
          }
        ) }) })
      ] }) }) })
    ] })
  ] });
}
function Code({ children }) {
  return /* @__PURE__ */ jsx3(
    Box,
    {
      as: "span",
      padding: "025",
      paddingInlineStart: "100",
      paddingInlineEnd: "100",
      background: "bg-surface-active",
      borderWidth: "025",
      borderColor: "border",
      borderRadius: "100",
      children: /* @__PURE__ */ jsx3("code", { children })
    }
  );
}

// app/routes/app.insights.$.tsx
var app_insights_exports = {};
__export(app_insights_exports, {
  action: () => action3,
  default: () => InsightsPage,
  loader: () => loader2
});
import { useEffect } from "react";
import { useLoaderData, useFetcher, useNavigation } from "@remix-run/react";
import {
  Page as Page2,
  Card as Card2,
  ResourceList,
  Text as Text2,
  Badge,
  Button,
  EmptyState
} from "@shopify/polaris";
import { createClient as createClient2 } from "@supabase/supabase-js";
import { useAppBridge } from "@shopify/app-bridge-react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var supabaseUrl2 = process.env.SUPABASE_URL, supabaseKey2 = process.env.SUPABASE_KEY, supabase2 = createClient2(supabaseUrl2, supabaseKey2);
async function loader2({ request, params }) {
  let { session } = await authenticate.admin(request), splat = params["*"], pagePath = `/${splat}`;
  splat === "__root__" && (pagePath = "/");
  let { data: rawClicks, error } = await supabase2.from("dead_clicks").select("target_selector").eq("store_url", session.shop).eq("page_path", pagePath);
  if (error)
    return console.error("Supabase error:", error), Response.json({
      selectors: [],
      pagePath,
      shop: session.shop,
      error: "Failed to fetch click data"
    }, { status: 500 });
  if (!rawClicks)
    return Response.json({ selectors: [], pagePath, shop: session.shop });
  let selectorCounts = rawClicks.reduce((acc, click) => {
    let selector = click.target_selector || "Unknown Selector";
    return acc[selector] = (acc[selector] || 0) + 1, acc;
  }, {}), selectors = Object.entries(selectorCounts).map(([selector, count]) => ({
    target_selector: selector,
    click_count: count
  })).sort((a, b) => b.click_count - a.click_count);
  return Response.json({ selectors, pagePath, shop: session.shop });
}
async function action3({ request }) {
  let { admin, session } = await authenticate.admin(request), pagePath = (await request.formData()).get("pagePath"), shop = session.shop, mainTheme = ((await (await admin.graphql(`
      query GetLiveTheme {
        themes(first: 10) {
          edges {
            node { 
              id 
              role
            }
          }
        }
      }`)).json()).data?.themes?.edges || []).find((edge) => edge.node.role === "MAIN");
  if (mainTheme) {
    let themeId = mainTheme.node.id.split("/").pop(), previewUrl = `https://${shop}${pagePath}?dead_click_preview=true`;
    return console.log(`Preview URL: ${previewUrl}`), Response.json({ previewUrl });
  }
  return Response.json({ error: "Could not retrieve theme ID." }, { status: 500 });
}
function InsightsPage() {
  let { selectors, pagePath, shop } = useLoaderData(), navigation = useNavigation(), fetcher = useFetcher(), shopify2 = useAppBridge(), loading = navigation.state === "loading";
  useEffect(() => {
    fetcher.data?.previewUrl && open(fetcher.data.previewUrl, "_blank");
  }, [fetcher.data, shopify2]);
  let handleTestSelector = (selector) => {
    let testUrl = `https://${shop}${pagePath}?highlight_selector=${encodeURIComponent(selector)}`;
    open(testUrl, "_blank");
  }, renderItem = (item) => {
    let { target_selector, click_count } = item;
    return /* @__PURE__ */ jsx4(
      ResourceList.Item,
      {
        id: target_selector,
        accessibilityLabel: `${target_selector} with ${click_count} clicks`,
        onClick: () => handleTestSelector(target_selector),
        children: /* @__PURE__ */ jsxs3("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }, children: [
          /* @__PURE__ */ jsx4(Text2, { variant: "bodyMd", as: "p", fontWeight: "medium", children: target_selector }),
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem" }, children: [
            /* @__PURE__ */ jsx4(Badge, { tone: "critical", children: `${click_count} ${click_count === 1 ? "click" : "clicks"}` }),
            /* @__PURE__ */ jsx4(Button, { size: "micro", onClick: () => handleTestSelector(target_selector), children: "Test Selector" })
          ] })
        ] })
      }
    );
  };
  return /* @__PURE__ */ jsx4(
    Page2,
    {
      title: `Dead Clicks: ${pagePath}`,
      backAction: { content: "Back to overview", url: "/app" },
      secondaryActions: [
        {
          content: "Preview Mode",
          onAction: () => {
            let formData = new FormData();
            formData.append("pagePath", pagePath), fetcher.submit(formData, { method: "post" });
          },
          loading: fetcher.state === "submitting",
          disabled: fetcher.state === "submitting"
        }
      ],
      children: /* @__PURE__ */ jsx4(Card2, { children: /* @__PURE__ */ jsx4(
        ResourceList,
        {
          resourceName: { singular: "selector", plural: "selectors" },
          items: selectors,
          renderItem,
          loading,
          emptyState: /* @__PURE__ */ jsx4(
            EmptyState,
            {
              heading: "No dead clicks found for this page",
              image: "[https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png](https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png)",
              children: /* @__PURE__ */ jsxs3("p", { children: [
                "No dead clicks have been recorded for ",
                pagePath,
                "."
              ] })
            }
          )
        }
      ) })
    }
  );
}

// app/routes/app._index.tsx
var app_index_exports = {};
__export(app_index_exports, {
  default: () => Index,
  loader: () => loader3
});
import { useLoaderData as useLoaderData2 } from "@remix-run/react";
import { Page as Page3, Card as Card3, ResourceList as ResourceList2, Text as Text3, EmptyState as EmptyState2 } from "@shopify/polaris";
import { createClient as createClient3 } from "@supabase/supabase-js";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
var supabaseUrl3 = process.env.SUPABASE_URL, supabaseKey3 = process.env.SUPABASE_KEY, supabase3 = createClient3(supabaseUrl3, supabaseKey3);
async function loader3({ request }) {
  let { session } = await authenticate.admin(request), { data: rawClicks, error } = await supabase3.from("dead_clicks").select("page_path").eq("store_url", session.shop);
  if (error)
    return console.error("Supabase error:", error), Response.json({ pages: [] }, { status: 500 });
  let pageCounts = rawClicks.reduce((acc, click) => {
    let path = click.page_path || "Unknown Page";
    return acc[path] = (acc[path] || 0) + 1, acc;
  }, {}), pages = Object.entries(pageCounts).map(([path, count]) => ({
    path,
    click_count: count
  })).sort((a, b) => b.click_count - a.click_count);
  return Response.json({ pages });
}
function Index() {
  let { pages } = useLoaderData2(), resourceListItems = pages.map((page, index) => ({
    id: `${index}`,
    url: `/app/insights${page.path}`,
    // Link to the detail page
    name: page.path,
    attribute: `${page.click_count} dead clicks`
  }));
  return /* @__PURE__ */ jsx5(Page3, { title: "Dead Click Miner Dashboard", children: /* @__PURE__ */ jsx5(Card3, { children: pages.length > 0 ? /* @__PURE__ */ jsx5(
    ResourceList2,
    {
      resourceName: { singular: "page", plural: "pages" },
      items: resourceListItems,
      renderItem: (item) => {
        let { id, url, name, attribute } = item;
        return /* @__PURE__ */ jsxs4(
          ResourceList2.Item,
          {
            id,
            url,
            accessibilityLabel: `View details for ${name}`,
            children: [
              /* @__PURE__ */ jsx5(Text3, { variant: "bodyMd", fontWeight: "bold", as: "h3", children: name }),
              /* @__PURE__ */ jsx5("div", { children: attribute })
            ]
          }
        );
      }
    }
  ) : /* @__PURE__ */ jsx5(
    EmptyState2,
    {
      heading: "No dead clicks recorded yet",
      image: "[https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png](https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png)",
      children: /* @__PURE__ */ jsx5("p", { children: "Once your store starts recording events, you'll see a list of pages with dead clicks here." })
    }
  ) }) });
}

// app/routes/auth.login/route.tsx
var route_exports = {};
__export(route_exports, {
  action: () => action4,
  default: () => Auth,
  links: () => links,
  loader: () => loader4
});
import { useState } from "react";
import { Form, useActionData, useLoaderData as useLoaderData3 } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button as Button2,
  Card as Card4,
  FormLayout,
  Page as Page4,
  Text as Text4,
  TextField
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

// app/routes/auth.login/error.server.tsx
import { LoginErrorType } from "@shopify/shopify-app-remix/server";
function loginErrorMessage(loginErrors) {
  return loginErrors?.shop === LoginErrorType.MissingShop ? { shop: "Please enter your shop domain to log in" } : loginErrors?.shop === LoginErrorType.InvalidShop ? { shop: "Please enter a valid shop domain to log in" } : {};
}

// app/routes/auth.login/route.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var links = () => [{ rel: "stylesheet", href: polarisStyles }], loader4 = async ({ request }) => ({ errors: loginErrorMessage(await login(request)), polarisTranslations }), action4 = async ({ request }) => ({
  errors: loginErrorMessage(await login(request))
});
function Auth() {
  let loaderData = useLoaderData3(), actionData = useActionData(), [shop, setShop] = useState(""), { errors } = actionData || loaderData;
  return /* @__PURE__ */ jsx6(PolarisAppProvider, { i18n: loaderData.polarisTranslations, children: /* @__PURE__ */ jsx6(Page4, { children: /* @__PURE__ */ jsx6(Card4, { children: /* @__PURE__ */ jsx6(Form, { method: "post", children: /* @__PURE__ */ jsxs5(FormLayout, { children: [
    /* @__PURE__ */ jsx6(Text4, { variant: "headingMd", as: "h2", children: "Log in" }),
    /* @__PURE__ */ jsx6(
      TextField,
      {
        type: "text",
        name: "shop",
        label: "Shop domain",
        helpText: "example.myshopify.com",
        value: shop,
        onChange: setShop,
        autoComplete: "on",
        error: errors.shop
      }
    ),
    /* @__PURE__ */ jsx6(Button2, { submit: !0, children: "Log in" })
  ] }) }) }) }) });
}

// app/routes/api.track.tsx
var api_track_exports = {};
__export(api_track_exports, {
  action: () => action5
});
import { createClient as createClient4 } from "@supabase/supabase-js";
var supabaseUrl4 = process.env.SUPABASE_URL, supabaseKey4 = process.env.SUPABASE_KEY, supabase4 = createClient4(supabaseUrl4, supabaseKey4);
async function action5({ request }) {
  let headers2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS")
    return new Response(null, { status: 200, headers: headers2 });
  if (request.method !== "POST")
    return Response.json({ message: "Method not allowed" }, { status: 405, headers: headers2 });
  try {
    let body = await request.json(), { store_url, page_path, target_selector, click_x, click_y, timestamp } = body, { data, error } = await supabase4.from("dead_clicks").insert([{
      store_url,
      page_path,
      target_selector,
      click_x,
      click_y,
      timestamp: timestamp || (/* @__PURE__ */ new Date()).toISOString()
    }]);
    return error ? (console.error("Tracking error:", error), Response.json({ success: !1, error: error.message }, { status: 500, headers: headers2 })) : Response.json({ success: !0 }, { headers: headers2 });
  } catch {
    return Response.json({ success: !1, error: "Invalid JSON body" }, { status: 400, headers: headers2 });
  }
}

// app/routes/auth.$.tsx
var auth_exports = {};
__export(auth_exports, {
  loader: () => loader5
});
var loader5 = async ({ request }) => (await authenticate.admin(request), null);

// app/routes/_index/route.tsx
var route_exports2 = {};
__export(route_exports2, {
  default: () => App2,
  loader: () => loader6
});
import { redirect } from "@remix-run/node";
import { Form as Form2, useLoaderData as useLoaderData4 } from "@remix-run/react";

// app/routes/_index/styles.module.css
var styles_default = { index: "LQCYp", heading: "bVg-E", text: "_5LEJl", content: "IjJz7", form: "sI1Wg", label: "py2aZ", input: "k8y5b", button: "DcRe8", list: "qyGLW" };

// app/routes/_index/route.tsx
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var loader6 = async ({ request }) => {
  let url = new URL(request.url);
  if (url.searchParams.get("shop"))
    throw redirect(`/app?${url.searchParams.toString()}`);
  return { showForm: !!login };
};
function App2() {
  let { showForm } = useLoaderData4();
  return /* @__PURE__ */ jsx7("div", { className: styles_default.index, children: /* @__PURE__ */ jsxs6("div", { className: styles_default.content, children: [
    /* @__PURE__ */ jsx7("h1", { className: styles_default.heading, children: "A short heading about [your app]" }),
    /* @__PURE__ */ jsx7("p", { className: styles_default.text, children: "A tagline about [your app] that describes your value proposition." }),
    showForm && /* @__PURE__ */ jsxs6(Form2, { className: styles_default.form, method: "post", action: "/auth/login", children: [
      /* @__PURE__ */ jsxs6("label", { className: styles_default.label, children: [
        /* @__PURE__ */ jsx7("span", { children: "Shop domain" }),
        /* @__PURE__ */ jsx7("input", { className: styles_default.input, type: "text", name: "shop" }),
        /* @__PURE__ */ jsx7("span", { children: "e.g: my-shop-domain.myshopify.com" })
      ] }),
      /* @__PURE__ */ jsx7("button", { className: styles_default.button, type: "submit", children: "Log in" })
    ] }),
    /* @__PURE__ */ jsxs6("ul", { className: styles_default.list, children: [
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] }),
      /* @__PURE__ */ jsxs6("li", { children: [
        /* @__PURE__ */ jsx7("strong", { children: "Product feature" }),
        ". Some detail about your feature and its benefit to your customer."
      ] })
    ] })
  ] }) });
}

// app/routes/app.tsx
var app_exports = {};
__export(app_exports, {
  ErrorBoundary: () => ErrorBoundary,
  default: () => App3,
  headers: () => headers,
  links: () => links2,
  loader: () => loader7
});
import { Link as Link3, Outlet as Outlet2, useLoaderData as useLoaderData5, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles2 from "@shopify/polaris/build/esm/styles.css?url";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var links2 = () => [{ rel: "stylesheet", href: polarisStyles2 }], loader7 = async ({ request }) => (await authenticate.admin(request), { apiKey: process.env.SHOPIFY_API_KEY || "" });
function App3() {
  let { apiKey } = useLoaderData5();
  return /* @__PURE__ */ jsxs7(AppProvider, { isEmbeddedApp: !0, apiKey, children: [
    /* @__PURE__ */ jsxs7(NavMenu, { children: [
      /* @__PURE__ */ jsx8(Link3, { to: "/app", rel: "home", children: "Home" }),
      /* @__PURE__ */ jsx8(Link3, { to: "/app/additional", children: "Additional page" })
    ] }),
    /* @__PURE__ */ jsx8(Outlet2, {})
  ] });
}
function ErrorBoundary() {
  return boundary.error(useRouteError());
}
var headers = (headersArgs) => boundary.headers(headersArgs);

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-R5X5YWNN.js", imports: ["/build/_shared/chunk-FHVTGRZC.js", "/build/_shared/chunk-FTJ4APF5.js", "/build/_shared/chunk-DTKMK5PW.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-LQ67LC46.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_index": { id: "routes/_index", parentId: "root", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_index-DJLAUFUU.js", imports: ["/build/_shared/chunk-JRLTMSNL.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.insights.preview": { id: "routes/api.insights.preview", parentId: "root", path: "api/insights/preview", index: void 0, caseSensitive: void 0, module: "/build/routes/api.insights.preview-THOX4GV7.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.track": { id: "routes/api.track", parentId: "root", path: "api/track", index: void 0, caseSensitive: void 0, module: "/build/routes/api.track-LGISBKS2.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app": { id: "routes/app", parentId: "root", path: "app", index: void 0, caseSensitive: void 0, module: "/build/routes/app-H2HKJQJQ.js", imports: ["/build/_shared/chunk-DB5GCOXF.js", "/build/_shared/chunk-5LFJ7ZD4.js", "/build/_shared/chunk-HQ4WMWC3.js", "/build/_shared/chunk-A6LQCSFZ.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/app._index": { id: "routes/app._index", parentId: "routes/app", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/app._index-ZQQ3BDFE.js", imports: ["/build/_shared/chunk-LIUZDBJ2.js", "/build/_shared/chunk-RM7HTWJG.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.additional": { id: "routes/app.additional", parentId: "routes/app", path: "additional", index: void 0, caseSensitive: void 0, module: "/build/routes/app.additional-CIR2ID3F.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/app.insights.$": { id: "routes/app.insights.$", parentId: "routes/app", path: "insights/*", index: void 0, caseSensitive: void 0, module: "/build/routes/app.insights.$-GMIVLR3K.js", imports: ["/build/_shared/chunk-LIUZDBJ2.js", "/build/_shared/chunk-RM7HTWJG.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.$": { id: "routes/auth.$", parentId: "root", path: "auth/*", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.$-G3CV37Z2.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/auth.login": { id: "routes/auth.login", parentId: "root", path: "auth/login", index: void 0, caseSensitive: void 0, module: "/build/routes/auth.login-3KHCQRZZ.js", imports: ["/build/_shared/chunk-JRLTMSNL.js", "/build/_shared/chunk-DB5GCOXF.js", "/build/_shared/chunk-A6LQCSFZ.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.scopes_update": { id: "routes/webhooks.app.scopes_update", parentId: "root", path: "webhooks/app/scopes_update", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.scopes_update-54K2SYZN.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/webhooks.app.uninstalled": { id: "routes/webhooks.app.uninstalled", parentId: "root", path: "webhooks/app/uninstalled", index: void 0, caseSensitive: void 0, module: "/build/routes/webhooks.app.uninstalled-WGDY2TXC.js", imports: void 0, hasAction: !0, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "512a246a", hmr: void 0, url: "/build/manifest-512A246A.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "production", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1, v3_throwAbortReason: !1, v3_routeConfig: !1, v3_singleFetch: !1, v3_lazyRouteDiscovery: !1, unstable_optimizeDeps: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/webhooks.app.scopes_update": {
    id: "routes/webhooks.app.scopes_update",
    parentId: "root",
    path: "webhooks/app/scopes_update",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_scopes_update_exports
  },
  "routes/webhooks.app.uninstalled": {
    id: "routes/webhooks.app.uninstalled",
    parentId: "root",
    path: "webhooks/app/uninstalled",
    index: void 0,
    caseSensitive: void 0,
    module: webhooks_app_uninstalled_exports
  },
  "routes/api.insights.preview": {
    id: "routes/api.insights.preview",
    parentId: "root",
    path: "api/insights/preview",
    index: void 0,
    caseSensitive: void 0,
    module: api_insights_preview_exports
  },
  "routes/app.additional": {
    id: "routes/app.additional",
    parentId: "routes/app",
    path: "additional",
    index: void 0,
    caseSensitive: void 0,
    module: app_additional_exports
  },
  "routes/app.insights.$": {
    id: "routes/app.insights.$",
    parentId: "routes/app",
    path: "insights/*",
    index: void 0,
    caseSensitive: void 0,
    module: app_insights_exports
  },
  "routes/app._index": {
    id: "routes/app._index",
    parentId: "routes/app",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: app_index_exports
  },
  "routes/auth.login": {
    id: "routes/auth.login",
    parentId: "root",
    path: "auth/login",
    index: void 0,
    caseSensitive: void 0,
    module: route_exports
  },
  "routes/api.track": {
    id: "routes/api.track",
    parentId: "root",
    path: "api/track",
    index: void 0,
    caseSensitive: void 0,
    module: api_track_exports
  },
  "routes/auth.$": {
    id: "routes/auth.$",
    parentId: "root",
    path: "auth/*",
    index: void 0,
    caseSensitive: void 0,
    module: auth_exports
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: route_exports2
  },
  "routes/app": {
    id: "routes/app",
    parentId: "root",
    path: "app",
    index: void 0,
    caseSensitive: void 0,
    module: app_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
