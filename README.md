# 🌾 AgriHorizon

**AgriHorizon** is an AI-powered agricultural intelligence platform designed to empower farmers and buyers with real-time market data, predictive analytics, and localized advisory services.

Built with a high-performance stack, AgriHorizon bridges the gap between traditional farming and modern financial technology.

---

## 🚀 Key Features

### 🤖 AI Market Intelligence
*   **Predictive Pricing**: Real-time DuckDuckGo web scraping combined with **Mimo v2 Flash AI** to predict tomorrow's vegetable price ranges.
*   **Historical Trends**: 7-day price tracking for all major vegetables and locations.
*   **Savings Analysis**: Buyers receive "Best Deals" notifications based on real-time price drops.

### 📊 Yield & Sales Analytics
*   **AI Sales Strategy**: Input your harvest quantity and investment to get a risk-reward analysis (Wait vs. Sell) based on predicted price movements.
*   **ROI Tracking**: Automated profit calculation and financial forecasting for sellers.

### 🌦️ AI Crop Advisor
*   **Localized Weather**: Integration with **Open-Meteo** for live temperature, humidity, and wind speed.
*   **Weather-Driven Advice**: AI generates proactive farming tips based on your specific crops and current weather conditions (e.g., "High humidity detected: Monitor tomatoes for fungal spots").

### 🎤 Voice-Activated Interface
*   **Global Voice Input**: Fully integrated speech-to-text functionality across the entire platform.
*   **Natural Language Queries**: Ask the AI advisor questions using your voice or search for market prices hands-free.

### 🇮🇳 Multilingual Support
*   **Native Hindi Support**: Complete localization for both English and Hindi.
*   **AI Localization**: AI analysis, strategy, and advisory responses are dynamically translated to the user's preferred language.

### 🤝 Community & Commerce
*   **Community Hub**: A social platform for farmers to share updates, images, and tips.
*   **Direct Messaging**: Secure communication channel between buyers and sellers.
*   **Advanced Orders**: Role-based order management system with status tracking.

---

## 🛠️ Technology Stack

*   **Backend**: [Convex](https://convex.dev) (Real-time database, Auth, Actions)
*   **Frontend**: [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
*   **Styling**: Vanilla CSS + Tailwind-inspired utility layers
*   **AI Models**: `nvidia/nemotron-nano-9b-v2:free` via [OpenRouter](https://openrouter.ai/)
*   **Weather Data**: [Open-Meteo API](https://open-meteo.com/)
*   **Search**: DuckDuckGo HTML 
*   **Speech**: Web Speech API

---

## 🛠️ Installation & Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
You need an **OpenRouter API Key** for the AI features. Set it in your Convex environment:
```bash
npx convex env set OPENROUTER_API_KEY your_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 📁 Project Structure

*   `convex/`: Backend functions (Queries, Mutations, Actions), Schema, and API routes.
*   `src/`: React frontend application.
    *   `src/components/`: Modular UI components (Seller, Buyer, Common).
    *   `src/translations.ts`: Localization dictionary for EN/HI.
*   `assets/`: Image resources and branding.

---

## 📄 License

This project is built for the benefit of the agricultural community.
© 2026 AgriHorizon Team.
