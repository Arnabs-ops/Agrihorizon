# AgroHorizon - Agriculture Role-Based Authentication App
  
This is a project built with [Chef](https://chef.convex.dev) [ note that only the prototype was made using chef ]  using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`modest-swan-464`](https://dashboard.convex.dev/d/modest-swan-464).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

## Environment Variables

This application requires environment variables to be set for full functionality:

### Required: OPENROUTER_API_KEY

The OpenRouter API key is required for AI-powered vegetable price predictions.

**Quick Setup:**
```bash
npx convex env set OPENROUTER_API_KEY your-api-key-here
```

For detailed instructions, see [ENV_SETUP.md](./ENV_SETUP.md).

## Features

### Vegetable Price Search & Prediction

- **Live Web Search**: Real-time DuckDuckGo search for current vegetable prices
- **AI-Powered Predictions**: Uses OpenRouter AI to predict tomorrow's prices based on:
  - Live web search results
  - Historical price data (last 7 days)
  - Market trends and seasonal patterns
- **Seller Dashboard**: Market Prices section for monitoring current and predicted prices
- **Buyer Dashboard**: Best Deals section with price drop alerts and savings recommendations
