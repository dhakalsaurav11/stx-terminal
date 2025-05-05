# Stock Tracking Portal

A personal, locally-hosted stock tracking portal with real-time data, interactive candlestick charts, integrated news sentiment, and a custom decision engine. This project was conceived and architected by me, the user, to provide a professional-grade trading dashboard tailored to individual needs.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Decision Engine](#decision-engine)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Extending the Project](#extending-the-project)
- [License](#license)

---

## Features

- **Real-Time Data**: Fetches live stock prices and updates every few seconds.
- **Candlestick Charts**: Interactive Plotly-based charts with automatic updates.
- **News & Sentiment**: Retrieves latest news headlines and computes sentiment polarity.
- **Decision Engine**: A proprietary engine combining multiple technical indicators and sentiment analysis to generate buy/sell/hold recommendations.
- **Background Scheduler**: APScheduler automates data and news updates without blocking the UI.
- **Responsive UI**: Bootstrap-based interface with modular cards for each stock.

---

## Architecture Overview

1. **Data Collection**
   - **Stock Prices**: Retrieved via `yfinance` (OHLC data) and stored in a local SQLite database.
   - **News Articles**: Fetched from NewsAPI, enriched with sentiment scores (via TextBlob), and stored for historical reference.

2. **Storage**
   - **SQLite**: A lightweight, file-based database (`stock_data.db`) holds price and news records.
   - **SQLAlchemy**: ORM layer for managing database models (`StockPrice`, `NewsArticle`).

3. **Scheduling**
   - **APScheduler**: Runs background jobs every minute (prices) and every five minutes (news) to keep data fresh.

4. **Web Server**
   - **Flask**: Serves endpoints for charts (`/chartdata/<symbol>`), prices (`/price/<symbol>`), news (`/news/<symbol>`), and decisions (`/decision/<symbol>`).

5. **Front-End**
   - **Bootstrap 4**: Responsive layout and styling.
   - **Plotly.js**: Candlestick chart rendering and dynamic updates via AJAX.
   - **JavaScript**: Handles polling logic for real-time prices, chart updates, news, and decision requests.

---

## Decision Engine

At the heart of the portal is a **custom decision engine**, a strategy I devised to mimic professional broker analysis:

1. **Simple Moving Averages (SMA)**: Short-term vs. long-term trend detection.
2. **MACD**: Momentum oscillator and signal line crossover.
3. **Bollinger Bands**: Volatility-based overbought/oversold signals.
4. **RSI**: Overbought (>70) or oversold (<30) momentum indicator.
5. **News Sentiment**: Polarity score averaged over the latest headlines.

Each indicator contributes a signal of `+1` (bullish), `-1` (bearish), or `0` (neutral). The sum yields a **total signal**, which maps to:

- `>= +3`: **Buy**
- `<= -3`: **Sell**
- Otherwise: **Hold**

The explanation for each recommendation is returned alongside the decision, providing transparency into how the engine arrived at its conclusion.

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stock-tracking-portal.git
   cd stock-tracking-portal
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   - `NEWSAPI_KEY`: Your NewsAPI.org key.
   ```bash
   export NEWSAPI_KEY="your_key_here"
   ```

5. **Initialize the database**
   ```bash
   python app.py
   ```
   On first run, this creates `stock_data.db` and required tables.

---

## Usage

1. **Start the Flask server**
   ```bash
   python app.py
   ```
   The portal is available at `http://127.0.0.1:5000/`.

2. **View Real-Time Dashboard**
   - Observe live price updates and interactive charts.
   - Read latest news and click **Get Decision** to see buy/sell/hold recommendations.

3. **Back-End Endpoints**
   - `/chartdata/<symbol>`: JSON OHLC data for charts.
   - `/price/<symbol>`: Current market price.
   - `/news/<symbol>`: Latest news and sentiment.
   - `/decision/<symbol>`: Decision engine output.

---

## Configuration

- **Polling Intervals**: Adjust in `index.html` JavaScript (`setInterval` calls).
- **Scheduler Timing**: Modify APScheduler intervals in `app.py`.
- **Indicators & Thresholds**: Update logic in `/decision/<symbol>` route.

---

## Extending the Project

- **Add Indicators**: Integrate ADX, VWAP, or custom chart patterns.
- **Advanced Sentiment**: Swap TextBlob for transformer-based models (e.g., BERT).
- **Machine Learning**: Train a classifier/regressor on historical signals and price movements.
- **Authentication**: Secure the portal with user login and preferences.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

*Created by me, as the original architect of this decision engine and portal.*

