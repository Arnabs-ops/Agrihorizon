"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";

const OPEN_METEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

// Helper function for retry logic
async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 2) {
    const delays = [2000, 5000]; // 2s, 5s

    for (let i = 0; i <= retries; i++) {
        try {
            return await fetchWithTimeout(url, options, 15000);
        } catch (error) {
            if (i === retries) throw error;

            const delay = delays[i] || 5000;
            console.log(`Fetch failed, retrying in ${delay}ms (attempt ${i + 1}/${retries})...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("Max retries exceeded");
}

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

            let city = args.location;
            let latitude = 0;
            let longitude = 0;
            let weather: any = null;

            try {
                const geoRes = await fetchWithRetry(`${OPEN_METEO_GEO_URL}?name=${encodeURIComponent(args.location)}&count=1&language=en&format=json`);
                const geoData = await geoRes.json();

                if (!geoData.results || geoData.results.length === 0) {
                    throw new Error(`Location not found: "${args.location}"`);
                }

                ({ latitude, longitude, name: city } = geoData.results[0]);

                // 2. Get Weather Forecast
                const weatherRes = await fetchWithRetry(`${OPEN_METEO_FORECAST_URL}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
                weather = await weatherRes.json();
            } catch (weatherError) {
                console.warn("Weather API unavailable, using fallback:", weatherError);
                // Continue with null weather data - AI will handle it
            }

            // 3. AI Advisory Prompt
            const languageInstruction = args.language === 'hi'
                ? "CRITICAL: The user's language is Hindi. Provide the response in HINDI language only."
                : "";

            const weatherInfo = weather ? `
      CURRENT WEATHER:
      - Temp: ${weather.current.temperature_2m}°C
      - Humidity: ${weather.current.relative_humidity_2m}%
      - Wind: ${weather.current.wind_speed_10m} km/h
      - Prec: ${weather.current.precipitation} mm
      ` : `
      WEATHER DATA UNAVAILABLE - Provide general seasonal advice for ${city}.
      `;

            const prompt = `You are an expert AI Crop Advisor for farmers.
      
      LOCATION: ${city}${latitude && longitude ? ` (${latitude}, ${longitude})` : ''}
      CROPS: ${args.crops.join(", ")}
      ${weatherInfo}
      USER QUESTION: ${args.query || "Give me a general advisory for today."}
      
      TASK:
      Provide 3-4 bullet points of actionable farming advice based on ${weather ? "this specific weather" : "general seasonal conditions"} and these crops. Include a "Weather Summary" and "Pro-Tip".
      
      ${languageInstruction}`;

            const aiRes = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${aiApiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://convex.dev",
                    "X-Title": "AgriHorizon Advisor"
                },
                body: JSON.stringify({
                    model: "nvidia/nemotron-nano-9b-v2:free",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 500
                })
            });

            // Check HTTP status first
            if (!aiRes.ok) {
                const errorText = await aiRes.text();
                console.error(`AI API failed with status ${aiRes.status}:`, errorText);
                throw new Error(`AI API error (${aiRes.status}): ${errorText.substring(0, 200)}`);
            }

            const aiData = await aiRes.json();

            // Extract AI text - Handle NVIDIA models
            let advice = aiData.choices[0]?.message?.content;
            if (!advice || advice.trim() === "") {
                advice = aiData.choices[0]?.message?.reasoning;
            }
            if (!advice || advice.trim() === "") {
                const reasoningDetails = aiData.choices[0]?.message?.reasoning_details;
                if (reasoningDetails && Array.isArray(reasoningDetails) && reasoningDetails.length > 0) {
                    advice = reasoningDetails.map((detail: any) => detail.text || "").join("\n");
                }
            }

            if (!advice || advice.trim() === "") {
                console.error("AI response missing content:", JSON.stringify(aiData.choices[0]));
                throw new Error("AI API response missing advice content");
            }

            return {
                city,
                currentWeather: weather ? {
                    temp: weather.current.temperature_2m,
                    humidity: weather.current.relative_humidity_2m,
                    wind: weather.current.wind_speed_10m,
                    code: weather.current.weather_code
                } : null,
                forecast: weather?.daily || null,
                advice: advice,
                weatherAvailable: !!weather
            };

        } catch (error) {
            console.error("Crop Advisor Error:", error);

            // Provide helpful fallback message
            const errorMessage = error instanceof Error ? error.message : "Failed to get crop advice";
            const isNetworkError = errorMessage.includes("fetch") || errorMessage.includes("timeout") || errorMessage.includes("Connect");

            if (isNetworkError) {
                return {
                    city: args.location,
                    currentWeather: null,
                    forecast: null,
                    advice: args.language === 'hi'
                        ? `सामान्य सलाह: ${args.crops.join(", ")} के लिए नियमित सिंचाई और निगरानी जारी रखें। मौसम की स्थिति की जांच करते रहें और अपनी फसलों को कीटों से बचाएं।\n\nमहत्वपूर्ण: मौसम डेटा अस्थायी रूप से अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें।`
                        : `General advice: Continue regular irrigation and monitoring for ${args.crops.join(", ")}. Keep checking weather conditions and protect your crops from pests.\n\nNote: Weather data is temporarily unavailable. Please try again later.`,
                    weatherAvailable: false,
                    error: "Weather service temporarily unavailable"
                };
            }

            throw new Error(errorMessage);
        }
    },
});
