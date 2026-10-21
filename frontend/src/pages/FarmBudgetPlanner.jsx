import { useMemo, useState } from "react";
import {
  Calculator,
  IndianRupee,
  Sprout,
  TrendingUp,
  Wallet,
  RotateCcw,
} from "lucide-react";

/**
 * AgriSense AI — Farm Budget Planner
 * Drop-in React page component. Uses existing Tailwind CSS and lucide-react.
 * No API key or backend required; calculations run locally in the browser.
 */
export default function FarmBudgetPlanner() {
  const [form, setForm] = useState({
    crop: "Soybean",
    land: "2",
    expectedYield: "8",
    sellingPrice: "4800",
    seedCost: "2500",
    fertilizerCost: "6000",
    pesticideCost: "2500",
    laborCost: "8000",
    irrigationCost: "3500",
    machineryCost: "4000",
    otherCost: "2000",
  });

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const number = (key) => Math.max(0, Number(form[key]) || 0);

  const result = useMemo(() => {
    const land = number("land");
    const yieldPerAcre = number("expectedYield");
    const pricePerQuintal = number("sellingPrice");
    const totalCostPerAcre =
      number("seedCost") +
      number("fertilizerCost") +
      number("pesticideCost") +
      number("laborCost") +
      number("irrigationCost") +
      number("machineryCost") +
      number("otherCost");
    const totalCost = totalCostPerAcre * land;
    const totalYield = yieldPerAcre * land;
    const revenue = totalYield * pricePerQuintal;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const breakEvenPrice = totalYield > 0 ? totalCost / totalYield : 0;
    return { totalCost, totalYield, revenue, profit, margin, breakEvenPrice };
  }, [form]);

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);

  const reset = () =>
    setForm({
      crop: "Soybean",
      land: "2",
      expectedYield: "8",
      sellingPrice: "4800",
      seedCost: "2500",
      fertilizerCost: "6000",
      pesticideCost: "2500",
      laborCost: "8000",
      irrigationCost: "3500",
      machineryCost: "4000",
      otherCost: "2000",
    });

  const fields = [
    { key: "seedCost", label: "Seeds", hint: "₹ per acre" },
    { key: "fertilizerCost", label: "Fertilizer", hint: "₹ per acre" },
    { key: "pesticideCost", label: "Pesticides", hint: "₹ per acre" },
    { key: "laborCost", label: "Labour", hint: "₹ per acre" },
    { key: "irrigationCost", label: "Irrigation", hint: "₹ per acre" },
    { key: "machineryCost", label: "Machinery", hint: "₹ per acre" },
    { key: "otherCost", label: "Other expenses", hint: "₹ per acre" },
  ];

  const inputClass =
    "mt-1 w-full rounded-xl border border-[#E5E0D0] bg-white px-3 py-2.5 text-sm text-[#22301A] outline-none transition focus:border-[#6B8547] focus:ring-2 focus:ring-[#DCE8C8]";
  const labelClass = "text-sm font-medium text-[#4C5741]";

  return (
    <div className="min-h-screen bg-[#F6F4EC] px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EAF1DC] px-3 py-1.5 text-xs font-medium text-[#55733A]">
              <Calculator size={14} /> FARM PLANNING TOOL
            </div>
            <h1 className="font-serif text-3xl font-semibold text-[#22301A] sm:text-4xl">
              Farm Budget Planner
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#858477]">
              Estimate cultivation costs, expected sales, profit and break-even
              price before you invest in a crop.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E0D0] bg-white px-4 py-2.5 text-sm text-[#526044] transition hover:bg-[#F8F7F1]"
          >
            <RotateCcw size={15} /> Reset values
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl border border-[#ECE8DA] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-[#22301A]">
              <Sprout size={19} className="text-[#5B7A3A]" /> Crop and land details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Crop
                <select value={form.crop} onChange={update("crop")} className={inputClass}>
                  {["Soybean", "Cotton", "Wheat", "Rice", "Maize", "Onion", "Tomato", "Sugarcane", "Other"].map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Land area (acres)
                <input type="number" min="0" step="0.25" value={form.land} onChange={update("land")} className={inputClass} />
              </label>
              <label className={labelClass}>
                Expected yield (quintals per acre)
                <input type="number" min="0" step="0.5" value={form.expectedYield} onChange={update("expectedYield")} className={inputClass} />
              </label>
              <label className={labelClass}>
                Expected selling price (₹ / quintal)
                <input type="number" min="0" step="50" value={form.sellingPrice} onChange={update("sellingPrice")} className={inputClass} />
              </label>
            </div>

            <div className="mb-4 mt-7 flex items-center justify-between">
              <h3 className="font-semibold text-[#22301A]">Cultivation expenses</h3>
              <span className="text-xs text-[#989585]">Enter costs per acre</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <label className={labelClass} key={field.key}>
                  {field.label}
                  <div className="relative">
                    <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A927D]" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form[field.key]}
                      onChange={update(field.key)}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                  <span className="mt-1 block text-[11px] font-normal text-[#A09D8F]">{field.hint}</span>
                </label>
              ))}
            </div>
            <p className="mt-5 rounded-xl bg-[#F8F7F1] p-3 text-xs leading-5 text-[#858477]">
              Estimates depend on your entries. Actual yield, market prices,
              weather and local input costs may differ.
            </p>
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl bg-[#22301A] p-5 text-white shadow-sm sm:p-6">
              <div className="flex items-center gap-2 text-sm text-[#D4DFC5]">
                <TrendingUp size={17} /> Estimated result for {form.crop}
              </div>
              <p className="mt-5 text-sm text-[#D4DFC5]">Estimated net profit / loss</p>
              <p className={`mt-1 break-words text-3xl font-semibold sm:text-4xl ${result.profit < 0 ? "text-[#FFB4A8]" : "text-[#D5E8B8]"}`}>
                {money(result.profit)}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-[#D4DFC5]">Profit margin</p>
                  <p className="mt-1 text-xl font-semibold">{result.margin.toFixed(1)}%</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-xs text-[#D4DFC5]">Land area</p>
                  <p className="mt-1 text-xl font-semibold">{number("land")} acres</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Metric icon={<Wallet size={18} />} label="Total cultivation cost" value={money(result.totalCost)} />
              <Metric icon={<TrendingUp size={18} />} label="Expected sales" value={money(result.revenue)} />
              <Metric icon={<Sprout size={18} />} label="Total expected yield" value={`${result.totalYield.toLocaleString("en-IN")} quintals`} />
              <Metric icon={<Calculator size={18} />} label="Break-even price" value={`${money(result.breakEvenPrice)} / quintal`} />
            </div>

            <div className="rounded-2xl border border-[#E8E3D4] bg-white p-5">
              <h3 className="font-semibold text-[#22301A]">How the estimate works</h3>
              <div className="mt-4 space-y-3 text-sm">
                <Formula label="Total cost" value="Per-acre expenses × land area" />
                <Formula label="Expected sales" value="Yield × land area × selling price" />
                <Formula label="Net profit" value="Expected sales − total cost" />
                <Formula label="Break-even price" value="Total cost ÷ total yield" />
              </div>
              <div className="mt-4 rounded-xl bg-[#F6F4EC] p-3 text-xs leading-5 text-[#77786A]">
                Planning aid only—not a guaranteed return or a live market-price quote.
                Check local mandi rates and current input prices before making a decision.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#E8E3D4] bg-white p-4">
      <div className="flex items-center gap-2 text-[#668348]">{icon}<span className="text-xs text-[#858477]">{label}</span></div>
      <p className="mt-3 break-words text-lg font-semibold text-[#22301A]">{value}</p>
    </div>
  );
}

function Formula({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[#F0EEE4] pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-[#526044]">{label}</span>
      <span className="text-xs text-[#858477] sm:text-right">{value}</span>
    </div>
  );
}
