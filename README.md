# Dead Click Miner

A powerful Shopify app that tracks and visualizes "dead clicks" - user interactions with non-functional UI elements on e-commerce websites. This analytics tool helps merchants identify UX issues and optimize their storefronts for better conversion rates.

## 🎯 Features

- **Real-time Click Tracking**: Automatically detects and records clicks on non-interactive elements
- **Visual Analytics Dashboard**: Comprehensive overview of dead clicks across all store pages
- **Interactive Preview Mode**: Overlay visualization showing click heatmaps and element highlighting
- **Cross-Origin Data Collection**: Seamless tracking across different store domains
- **Shopify Integration**: Native integration with Shopify Admin using Polaris design system

## 🏗️ Architecture

### Frontend
- **Remix.js** - Full-stack React framework with server-side rendering
- **Shopify Polaris** - Native Shopify design system components
- **TypeScript** - Type-safe development

### Backend
- **Node.js** - Server-side JavaScript runtime
- **Supabase/PostgreSQL** - Database for storing click analytics
- **Prisma ORM** - Type-safe database queries

### Data Collection
- **JavaScript Tracker** - Lightweight client-side script for click detection
- **CORS-enabled APIs** - Cross-origin data collection endpoints
- **Real-time Processing** - Live click data ingestion and analysis

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.20 or higher)
- **Shopify Partner Account** - [Create one here](https://partners.shopify.com/signup)
- **Development Store** - [Set up a test store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store)
- **Supabase Account** - [Sign up for free](https://supabase.com)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/enteigss/dead-click-miner.git
   cd dead-click-miner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:
   ```env
   SHOPIFY_API_KEY=your_shopify_api_key
   SHOPIFY_API_SECRET=your_shopify_api_secret
   SCOPES=read_products,write_products
   HOST=https://your-app-url.com

   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/deadclickminer
   DIRECT_URL=postgresql://username:password@localhost:5432/deadclickminer

   # Supabase
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   ```bash
   npm run setup
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📊 Usage

### For Merchants

1. **Install the app** from your Shopify Admin
2. **View Analytics** - Check the dashboard for pages with dead clicks
3. **Analyze Patterns** - Click on specific pages to see detailed click data
4. **Preview Mode** - Add `?dead_click_preview=true` to any store URL to see live overlays

### For Developers

#### API Endpoints

**Track Dead Clicks**
```bash
POST /api/track
Content-Type: application/json

{
  "store_url": "mystore.myshopify.com",
  "page_path": "/products/example-product",
  "target_selector": "div.product-image",
  "click_x": 0.5,
  "click_y": 0.3
}
```

**Get Insights Preview**
```bash
GET /api/insights/preview?path=/products/example&store=mystore.myshopify.com

Response:
{
  "element_stats": [
    {
      "selector": "div.product-image",
      "click_count": 15
    }
  ],
  "click_positions": [
    {
      "x": 0.5,
      "y": 0.3,
      "selector": "div.product-image"
    }
  ]
}
```

#### Database Schema

```sql
-- Dead clicks tracking table
CREATE TABLE dead_clicks (
  id SERIAL PRIMARY KEY,
  store_url VARCHAR NOT NULL,
  page_path TEXT NOT NULL,
  target_selector TEXT NOT NULL,
  click_x FLOAT NOT NULL,
  click_y FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopify session management
CREATE TABLE Session (
  id TEXT PRIMARY KEY,
  shop TEXT NOT NULL,
  state TEXT NOT NULL,
  isOnline BOOLEAN DEFAULT false,
  scope TEXT,
  expires TIMESTAMPTZ,
  accessToken TEXT NOT NULL,
  userId BIGINT,
  firstName TEXT,
  lastName TEXT,
  email TEXT,
  accountOwner BOOLEAN DEFAULT false,
  locale TEXT,
  collaborator BOOLEAN DEFAULT false,
  emailVerified BOOLEAN DEFAULT false
);
```

## 🛠️ Development

### Project Structure

```
├── app/
│   ├── routes/
│   │   ├── app._index.tsx          # Main dashboard
│   │   ├── app.insights.$.tsx      # Page-specific insights
│   │   ├── api.track.tsx           # Click tracking endpoint
│   │   └── api.insights.preview.tsx # Preview data endpoint
│   └── shopify.server.ts           # Shopify authentication
├── prisma/
│   └── schema.prisma               # Database schema
├── public/
│   └── collector.js                # Client-side tracking script
└── package.json
```

### Key Components

**Dashboard (`app/routes/app._index.tsx`)**
- Displays list of pages with dead click counts
- Integrates with Shopify authentication
- Uses Polaris components for consistent UI

**Tracking Script (`public/collector.js`)**
- Lightweight JavaScript for click detection
- Dual mode: collection and preview
- Cross-browser compatible

**API Routes**
- `api.track.tsx` - Receives and stores click data
- `api.insights.preview.tsx` - Provides visualization data

### Running Tests

```bash
npm run lint       # ESLint code quality checks
npm run typecheck  # TypeScript type checking
npm test          # Run test suite (if available)
```

### Building for Production

```bash
npm run build     # Build production bundle
npm start         # Start production server
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "framework": "remix"
}
```

### Other Platforms

- **Heroku**: Follow [Shopify's deployment guide](https://shopify.dev/docs/apps/deployment/web)
- **Railway**: Deploy with built-in PostgreSQL support
- **Fly.io**: Lightweight deployment with global edge locations

### Environment Variables for Production

```env
NODE_ENV=production
SHOPIFY_API_KEY=your_production_api_key
SHOPIFY_API_SECRET=your_production_api_secret
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
```

## 🔧 Configuration

### Shopify App Settings

Update `shopify.app.toml` for your app configuration:

```toml
name = "dead-click-miner"
client_id = "your_client_id"
application_url = "https://your-app-url.com"
embedded = true

[access_scopes]
use_legacy_install_flow = true

[auth]
redirect_urls = ["https://your-app-url.com/auth/callback"]

[webhooks]
api_version = "2024-01"
```

### Database Configuration

**PostgreSQL** (Recommended for production)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/deadclickminer
```

**SQLite** (Development only)
```env
DATABASE_URL=file:./dev.db
```

## 📈 Analytics & Insights

### Key Metrics Tracked

- **Click Coordinates**: Normalized x,y positions relative to target elements
- **Element Selectors**: CSS selectors for precise element identification
- **Page Paths**: URL paths where dead clicks occur
- **Timestamps**: When clicks occurred for temporal analysis

### Data Processing

1. **Click Detection**: JavaScript event listeners identify non-functional clicks
2. **Data Normalization**: Coordinates normalized to element dimensions
3. **Aggregation**: Server-side processing groups clicks by page and element
4. **Visualization**: Real-time overlays and dashboard analytics

## 🛡️ Security & Privacy

- **CORS Protection**: Configurable cross-origin policies
- **Data Encryption**: All data transmitted over HTTPS
- **Privacy Compliance**: No personally identifiable information collected
- **Shopify Standards**: Follows Shopify app security best practices

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [Shopify App Development](https://shopify.dev/docs/apps)
- [Remix Framework](https://remix.run/docs)
- [Shopify Polaris](https://polaris.shopify.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma ORM](https://www.prisma.io/docs/)

---

**Dead Click Miner** - Turning unproductive clicks into actionable insights 🎯
