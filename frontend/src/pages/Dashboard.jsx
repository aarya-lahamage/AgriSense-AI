import { Link } from 'react-router-dom';

function Dashboard({ backendStatus }) {
  const quickStats = [
    { label: 'Weather', value: '28°C', sub: 'Humidity 78%' },
    { label: 'Disease Risk', value: 'Low', sub: 'Based on recent scans' },
    { label: 'Est. Yield', value: '—', sub: 'Run prediction to see' },
  ];

  const modules = [
    {
      icon: '🌱',
      title: 'Crop Recommendation',
      desc: 'Get the best crop suggestion based on your soil and climate data.',
      button: 'Recommend Crop',
      path: '/crop-recommendation',
    },
    {
      icon: '🔬',
      title: 'Disease Detection',
      desc: 'Upload a leaf photo to identify plant diseases early.',
      button: 'Detect Disease',
      path: '/disease-detection',
    },
    {
      icon: '⛅',
      title: 'Weather Advisory',
      desc: 'Farming advice based on live weather conditions.',
      button: 'Check Weather',
      path: '/weather-advisory',
    },
    {
      icon: '🧪',
      title: 'Fertilizer & Treatment',
      desc: 'Recommended fertilizer and treatment for your crop.',
      button: 'Get Recommendation',
      path: '/fertilizer-treatment',
    },
    {
      icon: '🌾',
      title: 'Yield Prediction',
      desc: 'Predict expected crop yield using AI.',
      button: 'Predict Yield',
      path: '/yield-profit',
    },
    {
      icon: '💰',
      title: 'Profit Prediction',
      desc: 'Estimate expected farming profit.',
      button: 'Predict Profit',
      path: '/yield-profit',
    },
    {
      icon: '🤖',
      title: 'AI Farming Assistant',
      desc: 'Ask farming questions and get intelligent guidance.',
      button: 'Ask Assistant',
      path: '/ai-assistant',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-stone-800">
          Farmer Dashboard
        </h2>
        <p className="text-stone-500 mt-1">
          Your farm's decision-support overview, in one place.
        </p>
        <p className="text-xs text-stone-400 mt-2">
          Backend:{' '}
          <span
            className={
              backendStatus === 'healthy' ? 'text-green-600' : 'text-red-500'
            }
          >
            {backendStatus}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-stone-200 px-5 py-4"
          >
            <p className="text-xs uppercase tracking-wide text-stone-400">
              {stat.label}
            </p>
            <p className="text-2xl font-serif font-bold text-stone-800 mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-stone-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-stone-700 mb-4">Modules</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-amber-400 hover:shadow-md transition"
          >
            <div className="text-3xl mb-3">{mod.icon}</div>
            <h3 className="font-serif text-lg font-semibold text-stone-800">
              {mod.title}
            </h3>
            <p className="text-stone-500 text-sm mt-1 mb-5">{mod.desc}</p>
            <Link
              to={mod.path}
              className="inline-block bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-600 transition"
            >
              {mod.button}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;