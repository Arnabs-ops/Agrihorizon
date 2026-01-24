import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Get current price and prediction
http.route({
  path: "/api/getPrice",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const vegetable = url.searchParams.get("veg");
    const location = url.searchParams.get("location");

    if (!vegetable || !location) {
      return new Response(
        JSON.stringify({ error: "Missing vegetable or location parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const priceData = await ctx.runAction((api as any).vegActions.fetchCurrentPrice, {
        vegetable,
        location,
      });

      return new Response(
        JSON.stringify({
          today_price: priceData.currentPrice ? `₹${priceData.currentPrice}/kg` : "Data not available",
          tomorrow_prediction: priceData.tomorrowPrediction?.range || "Prediction not available",
          analysis: priceData.analysis || "No analysis available",
          sources: priceData.sources || [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch price data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// Get price history
http.route({
  path: "/api/history",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const vegetable = url.searchParams.get("veg");
    const location = url.searchParams.get("location");
    const days = parseInt(url.searchParams.get("days") || "7");

    if (!vegetable || !location) {
      return new Response(
        JSON.stringify({ error: "Missing vegetable or location parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const history = await ctx.runQuery(api.vegPrices.getPriceHistory, {
        vegetable,
        location,
        days,
      });

      return new Response(
        JSON.stringify({
          vegetable,
          location,
          history: history.map((h: any) => ({
            date: h.date,
            price: `₹${h.price}/kg`,
            source: h.source,
          })),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch price history" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
