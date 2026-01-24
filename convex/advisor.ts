"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

const OPEN_METEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export const getCropAdvice = action({
    args: {
        location: v.string(),
        crops: v.array(v.string()),
        query: v.optional(v.string()),
        language: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const aiApiKey = process.env.OPENROUTER_API_KEY;
            if (!aiApiKey) throw new Error("API Key missing");

            // 1. Get Geocoding
            const isPlaceholder = args.location.toLowerCase().includes("enter location") || args.location.includes("स्थान दर्ज करें");
            if (isPlaceholder) {
                throw new Error("Location not found. Location provided is likely a placeholder.");
            }

            const geoRes = await fetch(`${OPEN_METEO_GEO_URL}?name=${encodeURIComponent(args.location)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error(`Location not found: "${args.location}"`);
            }

            const { latitude, longitude, name: city } = geoData.results[0];

            // 2. Get Weather Forecast
            const weatherRes = await fetch(`${OPEN_METEO_FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
            const weather = await weatherRes.json();

            // 3. AI Advisory Prompt
            const languageInstruction = args.language === 'hi'
                ? "CRITICAL: The user's language is Hindi. Provide the response in HINDI language only."
                : "";

            const prompt = `You are an expert AI Crop Advisor for farmers.
      
      LOCATION: ${city} (${latitude}, ${longitude})
      CROPS: ${args.crops.join(", ")}
      
      CURRENT WEATHER:
      - Temp: ${weather.current.temperature_2m}°C
      - Humidity: ${weather.current.relative_humidity_2m}%
      - Wind: ${weather.current.wind_speed_10m} km/h
      - Prec: ${weather.current.precipitation} mm
      
      USER QUESTION: ${args.query || "Give me a general advisory for today."}
      
      TASK:
      Provide 3-4 bullet points of actionable farming advice based on this specific weather and these crops. Include a "Weather Summary" and "Pro-Tip".
      
      ${languageInstruction}`;

            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${aiApiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://convex.dev",
                    "X-Title": "AgriHorizon Advisor"
                },
                body: JSON.stringify({
                    model: "xiaomi/mimo-v2-flash:free",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 500
                })
            });

            const aiData = await aiRes.json();
            const advice = aiData.choices[0]?.message?.content || "Could not generate advice.";

            return {
                city,
                currentWeather: {
                    temp: weather.current.temperature_2m,
                    humidity: weather.current.relative_humidity_2m,
                    wind: weather.current.wind_speed_10m,
                    code: weather.current.weather_code
                },
                forecast: weather.daily,
                advice: advice
            };

        } catch (error) {
            console.error("Crop Advisor Error:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to get crop advice");
        }
    },
});
