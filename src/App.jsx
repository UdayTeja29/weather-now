import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const WeatherApp = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    return JSON.parse(localStorage.getItem("recentSearches")) || [];
  });

  const fetchWeather = async (cityName) => {
    try {
      setError("");
      setWeather(null);

      // 1. Convert city name to coordinates
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found");
        return;
      }
      const { latitude, longitude, name, country } = geoData.results[0];

      // 2. Fetch weather data
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      // Current weather
      setWeather({
        name,
        country,
        temperature: weatherData.current_weather.temperature,
        wind: weatherData.current_weather.windspeed,
        condition: weatherData.current_weather.weathercode,
      });

      // 24-hour forecast
      const hours = weatherData.hourly.time.slice(0, 24);
      const temps = weatherData.hourly.temperature_2m.slice(0, 24);
      const rain = weatherData.hourly.precipitation_probability.slice(0, 24);

      setForecast(
        hours.map((time, i) => ({
          time: new Date(time).getHours() + ":00",
          temperature: temps[i],
          rain: rain[i],
        }))
      );

      // Save to recent searches
      const updatedSearches = [cityName, ...recentSearches.filter((c) => c !== cityName)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch weather data.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (city.trim() !== "") {
      fetchWeather(city);
    }
  };

  useEffect(() => {
    // Load last search if available
    if (recentSearches.length > 0) {
      fetchWeather(recentSearches[0]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-indigo-600 flex flex-col items-center text-white p-6">
      <h1 className="text-3xl font-bold mb-6">🌦️ Weather Now</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-4 py-2 rounded-xl text-black outline-none"
        />
        <button
          type="submit"
          className="bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold shadow-md hover:scale-105 transition"
        >
          Search
        </button>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="flex gap-2 mb-6">
          {recentSearches.map((item, i) => (
            <button
              key={i}
              onClick={() => fetchWeather(item)}
              className="bg-white/30 px-3 py-1 rounded-lg hover:bg-white/50"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && <p className="bg-red-500 px-4 py-2 rounded-lg">{error}</p>}

      {/* Weather Info */}
      {weather && (
        <div className="bg-white/20 p-6 rounded-2xl shadow-xl w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-2">
            {weather.name}, {weather.country}
          </h2>
          <p className="text-5xl font-bold">{weather.temperature}°C</p>
          <p className="mt-2">💨 Wind: {weather.wind} km/h</p>
          <p className="mt-1">🌍 Condition code: {weather.condition}</p>
        </div>
      )}

      {/* Forecast Chart */}
      {forecast.length > 0 && (
        <div className="bg-white/20 p-4 rounded-2xl shadow-xl mt-6 w-full max-w-2xl">
          <h3 className="mb-3 text-lg font-semibold">Next 24 Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecast}>
              <XAxis dataKey="time" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip
                contentStyle={{ backgroundColor: "#333", borderRadius: "10px" }}
                labelStyle={{ color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ffeb3b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;
