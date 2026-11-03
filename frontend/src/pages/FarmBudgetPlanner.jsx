import { useMemo, useState } from "react";
import {
  Calculator,
  IndianRupee,
  Sprout,
  Wallet,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import SpotlightCard from "../components/SpotlightCard";
import AnimatedCounter from "../components/AnimatedCounter";
import ShinyText from "../components/ShinyText";

const parseNum = (val) => Math.max(0, Number(val) || 0);

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

  const result = useMemo(() => {
    const land = parseNum(form.land);
    const yieldPerAcre = parseNum(form.expectedYield);
    const pricePerQuintal = parseNum(form.sellingPrice);
    const totalCostPerAcre =
      parseNum(form.seedCost) +
      parseNum(form.fertilizerCost) +
      parseNum(form.pesticideCost) +
      parseNum(form.laborCost) +
      parseNum(form.irrigationCost) +
      parseNum(form.machineryCost) +
      parseNum(form.otherCost);
    const totalCost = totalCostPerAcre * land;
    const totalYield = yieldPerAcre * land;
    const revenue = totalYield * pricePerQuintal;
    const netProfit = revenue - totalCost;
    const profitPerAcre = land > 0 ? netProfit / land : 0;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const costPerQuintal = totalYield > 0 ? totalCost / totalYield : 0;

    return {
      land,
      totalCost,
      totalCostPerAcre,
      totalYield,
      revenue,
      netProfit,
      profitPerAcre,
      profitMargin,
      costPerQuintal,
    };
  }, [form]);

  const costItems = [
    { key: "seedCost", label: "Certified Seed / Planting Material", icon: Sprout },
    { key: "fertilizerCost", label: "Fertilizers & Organic Manures", icon: Wallet },
    { key: "pesticideCost", label: "Crop Protection & Fungicides", icon: Sparkles },
    { key: "laborCost", label: "Manual Labor (Sowing, Weeding, Harvest)", icon: Calculator },
    { key: "irrigationCost", label: "Irrigation Electricity / Fuel / Water", icon: Wallet },
    { key: "machineryCost", label: "Tractor & Machinery Rental", icon: Calculator },
    { key: "otherCost", label: "Post-Harvest Transport & Mandi Cesses", icon: IndianRupee },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <Calculator size={13} />
            <ShinyText text="Farm Economics & Seasonal Budgeting" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Seasonal Farm Budget &amp; Cashflow Planner
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Calculate operational expenses, production cost per quintal, break-even selling price, and projected profit margins per acre.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Input Parameters (7 cols) */}
        <div className="lg:col-span-7 agri-glass-card p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider">
              Land &amp; Yield Target Parameters
            </h3>
            <span className="text-xs text-[#8E9B85]">Real-time calculator</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#8E9B85] mb-1">Target Crop</label>
              <input
                type="text"
                value={form.crop}
                onChange={update("crop")}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E9B85] mb-1">Total Land Area (Acres)</label>
              <input
                type="number"
                step="any"
                value={form.land}
                onChange={update("land")}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E9B85] mb-1">Expected Yield (Quintals/Acre)</label>
              <input
                type="number"
                step="any"
                value={form.expectedYield}
                onChange={update("expectedYield")}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8E9B85] mb-1">Expected APMC Rate (₹/Quintal)</label>
              <input
                type="number"
                step="any"
                value={form.sellingPrice}
                onChange={update("sellingPrice")}
                className="w-full bg-[#10190D] border border-white/10 rounded-xl px-3.5 py-2 text-sm font-semibold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
              />
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-xs font-semibold text-[#84CC16] uppercase tracking-wider mb-3">
              Input Costs (₹ Per Acre)
            </h3>
            <div className="space-y-2.5">
              {costItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0B1309]/80 border border-white/10"
                >
                  <label className="text-xs text-[#D1DAC9] font-medium flex items-center gap-2">
                    <item.icon size={14} className="text-[#84CC16]" />
                    <span>{item.label}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#8E9B85]">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={form[item.key]}
                      onChange={update(item.key)}
                      className="w-24 text-right bg-[#10190D] border border-white/15 rounded-lg px-2 py-1 text-xs font-bold text-[#FDFAF2] focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projected Financial Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="agri-glass-card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-semibold text-[#FDFAF2] uppercase tracking-wider">
                Financial Projections ({form.crop})
              </h3>
              <span className="text-xs font-bold text-[#BEF264] bg-[#84CC16]/20 border border-[#84CC16]/30 px-2.5 py-0.5 rounded-full">
                {result.land} Acres
              </span>
            </div>

            <div className="space-y-3">
              <SpotlightCard
                spotlightColor="rgba(132, 204, 22, 0.16)"
                borderColor="rgba(132, 204, 22, 0.4)"
                className="bg-[#0B1309]/80 p-4 rounded-2xl border border-white/10 flex justify-between items-center"
              >
                <div>
                  <div className="text-[10px] text-[#8E9B85] uppercase font-semibold">Total Gross Revenue</div>
                  <div className="text-xl font-serif font-bold text-[#84CC16]">
                    <AnimatedCounter value={result.revenue} prefix="₹" duration={1000} />
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#A3B39C]">
                  {result.totalYield.toFixed(1)} Qtl total
                </div>
              </SpotlightCard>

              <SpotlightCard
                spotlightColor="rgba(248, 113, 113, 0.16)"
                borderColor="rgba(248, 113, 113, 0.4)"
                className="bg-[#0B1309]/80 p-4 rounded-2xl border border-white/10 flex justify-between items-center"
              >
                <div>
                  <div className="text-[10px] text-[#8E9B85] uppercase font-semibold">Total Input &amp; Labor Cost</div>
                  <div className="text-xl font-serif font-bold text-[#F87171]">
                    <AnimatedCounter value={result.totalCost} prefix="₹" duration={1000} />
                  </div>
                </div>
                <div className="text-right text-[11px] text-[#A3B39C]">
                  ₹{Math.round(result.totalCostPerAcre).toLocaleString('en-IN')}/acre
                </div>
              </SpotlightCard>

              {/* Net Profit Callout */}
              <SpotlightCard
                spotlightColor={result.netProfit >= 0 ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}
                borderColor={result.netProfit >= 0 ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)"}
                className={`p-5 rounded-2xl border ${
                  result.netProfit >= 0
                    ? "bg-[#0F2913]/70 border-[#22C55E]/40 text-[#4ADE80]"
                    : "bg-[#2A0F0D]/70 border-[#EF4444]/40 text-[#F87171]"
                }`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                  Projected Net Profit
                </div>
                <div className="text-3xl font-serif font-bold mt-1">
                  <AnimatedCounter value={result.netProfit} prefix="₹" duration={1200} />
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs font-medium">
                  <span>Margin: <AnimatedCounter value={result.profitMargin} decimals={1} suffix="%" duration={1000} /></span>
                  <span>₹{Math.round(result.profitPerAcre).toLocaleString('en-IN')} / acre</span>
                </div>
              </SpotlightCard>

              <div className="bg-[#0B1309]/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                <div className="font-semibold text-[#FDFAF2]">Cost of Cultivation per Quintal:</div>
                <div className="text-sm font-serif font-bold text-[#84CC16]">
                  <AnimatedCounter value={result.costPerQuintal} prefix="₹" decimals={0} suffix=" / Quintal" duration={1000} />
                </div>
                <p className="text-[11px] text-[#8E9B85]">
                  Any mandi price higher than this ensures a profitable harvest.
                </p>
              </div>
            </div>

            <Link
              to="/mandi-rates"
              className="w-full inline-flex items-center justify-center gap-2 agri-btn-primary py-3 rounded-2xl transition shadow-sm text-xs font-semibold"
            >
              <span>Compare with Live Mandi Rates</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
