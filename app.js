function WeatherApp(apiKey) {

    this.apiKey = apiKey;
    this.apiUrl = "https://api.openweathermap.org/data/2.5/weather";
    this.forecastUrl = "https://api.openweathermap.org/data/2.5/forecast";

    this.searchBtn = document.getElementById("search-btn");
    this.cityInput = document.getElementById("city-input");
    this.weatherDisplay = document.getElementById("weather-display");

    // Recent searches elements
    this.recentSearchesSection = document.getElementById("recent-searches-section");
    this.recentSearchesContainer = document.getElementById("recent-searches-container");

    this.recentSearches = [];
    this.maxRecentSearches = 5;

    this.init();
}


// INIT METHOD
WeatherApp.prototype.init = function () {

    this.searchBtn.addEventListener("click", this.handleSearch.bind(this));

    this.cityInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            this.handleSearch();
        }
    });

    this.loadRecentSearches();
    this.loadLastCity();
};


// WELCOME SCREEN
WeatherApp.prototype.showWelcome = function () {

    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h2>🌤 SkyFetch Weather</h2>
            <p>Search for a city to get started</p>
        </div>
    `;
};


// HANDLE SEARCH
WeatherApp.prototype.handleSearch = function () {

    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError("Please enter a city name");
        return;
    }

    this.getWeather(city);
};


// FETCH WEATHER + FORECAST
WeatherApp.prototype.getWeather = async function (city) {

    this.showLoading();

    const weatherUrl =
        `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    try {

        const [currentWeather, forecastData] = await Promise.all([
            axios.get(weatherUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentWeather.data);
        this.displayForecast(forecastData);

        // SAVE SEARCH
        this.saveRecentSearch(city);
        localStorage.setItem("lastCity", city);

    } catch (error) {

        console.error(error);

        if (error.response && error.response.status === 404) {
            this.showError("City not found");
        } else {
            this.showError("Something went wrong");
        }
    }
};


// FORECAST API
WeatherApp.prototype.getForecast = async function (city) {

    const url =
        `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    const response = await axios.get(url);

    return response.data;
};


// DISPLAY CURRENT WEATHER
WeatherApp.prototype.displayWeather = function (data) {

    const cityName = data.name;
    const temp = Math.round(data.main.temp);
    const desc = data.weather[0].description;
    const icon = data.weather[0].icon;

    const iconUrl =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const html = `
        <div class="weather-info">
            <h2>${cityName}</h2>
            <img src="${iconUrl}">
            <h1>${temp}°C</h1>
            <p>${desc}</p>
        </div>
    `;

    this.weatherDisplay.innerHTML = html;
};


// PROCESS FORECAST
WeatherApp.prototype.processForecastData = function (data) {

    const daily = data.list.filter(function (item) {
        return item.dt_txt.includes("12:00:00");
    });

    return daily.slice(0, 5);
};


// DISPLAY FORECAST
WeatherApp.prototype.displayForecast = function (data) {

    const forecasts = this.processForecastData(data);

    const forecastHTML = forecasts.map(function (day) {

        const date = new Date(day.dt * 1000);

        const dayName =
            date.toLocaleDateString("en-US", { weekday: "short" });

        const temp = Math.round(day.main.temp);

        const desc = day.weather[0].description;

        const icon = day.weather[0].icon;

        const iconUrl =
            `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
        <div class="forecast-card">
            <h4>${dayName}</h4>
            <img src="${iconUrl}">
            <p>${temp}°C</p>
            <p>${desc}</p>
        </div>
        `;
    }).join("");

    const section = `
        <div class="forecast-section">
            <h3>5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML += section;
};


// LOADING
WeatherApp.prototype.showLoading = function () {

    this.weatherDisplay.innerHTML = `
        <p class="loading">Loading weather...</p>
    `;
};


// ERROR
WeatherApp.prototype.showError = function (message) {

    this.weatherDisplay.innerHTML = `
        <p class="error">${message}</p>
    `;
};


// LOAD RECENT SEARCHES
WeatherApp.prototype.loadRecentSearches = function () {

    const saved = localStorage.getItem("recentSearches");

    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }

    this.displayRecentSearches();
};


// SAVE RECENT SEARCH
WeatherApp.prototype.saveRecentSearch = function (city) {

    const cityName =
        city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    const index = this.recentSearches.indexOf(cityName);

    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }

    this.recentSearches.unshift(cityName);

    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }

    localStorage.setItem(
        "recentSearches",
        JSON.stringify(this.recentSearches)
    );

    this.displayRecentSearches();
};


// DISPLAY RECENT SEARCHES
WeatherApp.prototype.displayRecentSearches = function () {

    this.recentSearchesContainer.innerHTML = "";

    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = "none";
        return;
    }

    this.recentSearchesSection.style.display = "block";

    this.recentSearches.forEach(function (city) {

        const btn = document.createElement("button");

        btn.className = "recent-search-btn";
        btn.textContent = city;

        btn.addEventListener("click", function () {

            this.cityInput.value = city;
            this.getWeather(city);

        }.bind(this));

        this.recentSearchesContainer.appendChild(btn);

    }.bind(this));
};


// LOAD LAST CITY
WeatherApp.prototype.loadLastCity = function () {

    const lastCity = localStorage.getItem("lastCity");

    if (lastCity) {
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};


// CREATE APP INSTANCE
const app = new WeatherApp("e9bd89ca43f0815009bef21f08859270");