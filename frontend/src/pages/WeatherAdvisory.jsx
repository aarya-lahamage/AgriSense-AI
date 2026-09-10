function WeatherAdvisory() {
    return (
      <div>
        <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">
          ⛅ Weather Advisory
        </h2>
        <p className="text-stone-500">
          Farming advice based on live weather conditions.
        </p>
        <div className="mt-6 bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-stone-400">Weather data coming soon...</p>
        </div>
      </div>
    );
  }
  
  export default WeatherAdvisory;