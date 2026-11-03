import { ExternalLink, Landmark } from 'lucide-react';
import SpotlightCard from '../components/SpotlightCard';
import ShinyText from '../components/ShinyText';

const SCHEMES = [
  {
    name: 'PM-KISAN & Namo Shetkari',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi + Namo Shetkari Mahasanman',
    description:
      'Direct income support scheme providing ₹12,000 annually (₹6,000 Central + ₹6,000 Maharashtra State) directly deposited into Aadhaar-seeded bank accounts of eligible farmers in three 4-month tranches.',
    eligibility: 'All landholding farmer families with cultivable land record in Maharashtra. E-KYC and land seeding mandatory on PM-Kisan portal.',
    howToApply: 'Apply online at pmkisan.gov.in or visit your nearest CSC / Aaple Sarkar Seva Kendra with 7/12 extract, Aadhaar card, and bank passbook.',
    link: 'https://pmkisan.gov.in',
    linkLabel: 'pmkisan.gov.in',
    badge: 'Central + State Joint',
    amount: '₹12,000 / Year',
  },
  {
    name: 'Magel Tyala Saur Krishi Pump',
    fullName: 'Magel Tyala Saur Krishi Pump Yojana (PM-KUSUM Component B)',
    description:
      'Provides 90% to 95% capital subsidy for installing 3 HP, 5 HP, or 7.5 HP off-grid DC solar water pumps. Ensures uninterrupted daytime irrigation without electricity or diesel bills.',
    eligibility: 'Farmers in Maharashtra without traditional electric grid pump connection or with pending connection requests.',
    howToApply:
      'Register on the MSEDCL solar portal (mahadiscom.in/solar) with land 7/12 & 8A extracts, Aadhaar, water source proof (well/borewell), and caste certificate.',
    link: 'https://www.mahadiscom.in/solar',
    linkLabel: 'mahadiscom.in/solar',
    badge: 'Maharashtra State',
    amount: 'Up to 95% Subsidy',
  },
  {
    name: '1 Rupaya Pik Vima (PMFBY)',
    fullName: 'Pradhan Mantri Fasal Bima Yojana — ₹1 Crop Insurance Maharashtra',
    description:
      'Comprehensive insurance protection against crop loss from sowing failure, unseasonal rainfall, localized hailstorms, and drought. Maharashtra farmers pay only a token fee of ₹1 per application.',
    eligibility: 'All loanee and non-loanee farmers cultivating notified kharif and rabi crops in Maharashtra.',
    howToApply:
      'Apply online via pmfby.gov.in or through Aaple Sarkar portal within the cut-off notification dates. In case of localized damage, report on Crop Insurance App within 72 hours.',
    link: 'https://pmfby.gov.in',
    linkLabel: 'pmfby.gov.in',
    badge: '₹1 Scheme',
    amount: 'Full Crop Cover',
  },
  {
    name: 'PKVY & Jaivik Kheti',
    fullName: 'Paramparagat Krishi Vikas Yojana (Organic Cluster Development)',
    description:
      'Promotes certified organic farming through farmer clusters. Provides financial support of ₹50,000 per hectare over 3 years for organic inputs, vermicompost units, and PGS certification.',
    eligibility: 'Farmer groups of 20-50 farmers forming a contiguous cluster of 50 acres/hectares.',
    howToApply:
      'Contact your Taluka Agriculture Officer (TAO) or local Krishi Vigyan Kendra (KVK). Cluster registration is facilitated through the Maharashtra State Organic Farming Commission.',
    link: 'https://pgsindia-ncof.gov.in',
    linkLabel: 'pgsindia-ncof.gov.in',
    badge: 'Central Scheme',
    amount: '₹50,000 / Hectare',
  },
];

export default function GovernmentSchemes() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 agri-animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0C150A] via-[#142311] to-[#1E3319] text-white p-6 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#84CC16]/20 text-[#BEF264] border border-[#84CC16]/30 mb-2">
            <Landmark size={13} />
            <ShinyText text="State & Central Agricultural Subsidies" speed={4} className="text-[11px] font-semibold" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDFAF2]">
            Government Schemes &amp; Subsidies
          </h2>
          <p className="text-xs sm:text-sm text-[#A3B39C] mt-1">
            Curated financial assistance, solar pump subsidies, crop loss compensation, and verified portal application links for Maharashtra farmers.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {SCHEMES.map((s) => (
          <SpotlightCard
            key={s.name}
            spotlightColor="rgba(132, 204, 22, 0.16)"
            borderColor="rgba(132, 204, 22, 0.4)"
            className="p-6 sm:p-7 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-[#FDFAF2]">{s.name}</h3>
                  <span className="text-[10px] font-bold bg-[#84CC16]/20 text-[#BEF264] px-2.5 py-0.5 rounded-full border border-[#84CC16]/30">
                    {s.badge}
                  </span>
                </div>
                <div className="text-xs font-medium text-[#8E9B85] mt-0.5">{s.fullName}</div>
              </div>

              <div className="self-start sm:self-auto text-sm font-serif font-bold text-[#84CC16] bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
                {s.amount}
              </div>
            </div>

            <p className="text-xs text-[#D1DAC9] leading-relaxed">
              {s.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#0B1309]/80 p-3.5 rounded-2xl border border-white/10">
                <div className="text-[10px] uppercase font-bold text-[#84CC16] mb-1">Eligibility Criteria</div>
                <p className="text-[#A3B39C] leading-relaxed">{s.eligibility}</p>
              </div>

              <div className="bg-[#0B1309]/80 p-3.5 rounded-2xl border border-white/10">
                <div className="text-[10px] uppercase font-bold text-[#84CC16] mb-1">How &amp; Where to Apply</div>
                <p className="text-[#A3B39C] leading-relaxed">{s.howToApply}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 agri-btn-primary text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>Visit Official Portal ({s.linkLabel})</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
