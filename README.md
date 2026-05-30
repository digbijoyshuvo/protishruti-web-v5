# Protishruti Analytics

Protishruti Analytics is a comprehensive platform built to empower Small and Medium Enterprises (SMEs) with digital ledger capabilities, financial insights, and a matchmaking system to connect them with potential investors.

## 🚀 Features

- **SME Dashboard**: A dedicated live workspace for businesses to track their daily sales, expenses, net profit, and outstanding credit (Baki).
- **Investor Matchmaking**: Connects verified SMEs with investors by showcasing their business health scores, transaction history, and financial metrics.
- **AI-Powered Insights & OCR**: Features AI-driven financial summaries and Optical Character Recognition (OCR) to digitize handwritten ledger entries.
- **Business Health Score**: A proprietary scoring system that evaluates a business's health based on its transaction data and verification status.
- **Multi-language Support**: Seamless internationalization for accessible use by diverse user bases.
- **CloudCash SME Account**: Premium account features tracking balances and secure verification.

## 🛠️ Technology Stack

This project is built using modern web development tools and best practices:

- **Framework**: [TanStack Start](https://tanstack.com/start/latest) (leveraging React 19 and Vite)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Backend as a Service**: [Supabase](https://supabase.com/) (Authentication, PostgreSQL Database, Edge Functions)
- **Charts & Data Visualization**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Package Manager**: Bun / NPM

## 📂 Project Structure

```
├── .lovable/              # Lovable configuration
├── src/
│   ├── assets/            # Static assets like images and logos
│   ├── components/        # Reusable UI components (shadcn/ui and custom)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party integrations (Supabase, etc.)
│   ├── lib/               # Utility functions, helpers, i18n, and mock data
│   ├── routes/            # File-based routing for TanStack Router
│   ├── server.ts          # Server entry point
│   ├── start.ts           # App entry point
│   └── styles.css         # Global Tailwind CSS and base styles
├── supabase/              # Supabase configuration and database migrations
├── vite.config.ts         # Vite configuration
└── package.json           # Dependencies and scripts
```

## 🏁 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [Bun](https://bun.sh/) (or NPM) installed on your machine.
You will also need a Supabase project set up.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd protishruti-web-v5
   ```

2. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and configure your Supabase variables and any other required keys:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To build the application for production, run:

```bash
bun run build
# or
npm run build
```

This will generate the production-ready static files and server bundles using Vite.

## 📝 License

This project is proprietary and confidential.
