import { ExternalLink, Info } from 'lucide-react';

const SCHEMES = [
  {
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    description:
      'Central Government scheme that provides ₹6,000 per year (in 3 equal installments of ₹2,000) directly into the bank account of eligible small and marginal farmers.',
    eligibility: 'Small & marginal farmers with cultivable land up to 2 hectares. Certain categories like constitutional post holders, serving/retired government employees, income tax payers are excluded.',
    howToApply: 'Visit your nearest Common Service Centre (CSC) or Krishi Vigyan Kendra, or apply online at pmkisan.gov.in with Aadhaar and bank details.',
    link: 'https://pmkisan.gov.in',
    linkLabel: 'pmkisan.gov.in',
    badge: 'Central',
  },
  {
    name: 'Magel Tyala Shet Tale',
    fullName: 'Magel Tyala Shet Tale (Farm Pond Scheme) — Maharashtra',
    description:
      'Maharashtra state scheme that provides financial assistance to farmers to construct farm ponds on their own land for water conservation and irrigation. The state gives a subsidy of up to ₹75,000 (varies by district) for pond construction.',
    eligibility: 'Farmers in Maharashtra with agricultural land. Priority is given to rainfed / drought-prone areas.',
    howToApply:
      'Apply through your local Agriculture Department office or Krishi Vigyan Kendra. Documents needed: 7/12 extract, Aadhaar, bank passbook copy.',
    link: 'https://krishi.maharashtra.gov.in',
    linkLabel: 'krishi.maharashtra.gov.in',
    badge: 'Maharashtra',
  },
  {
    name: 'PKVY',
    fullName: 'Paramparagat Krishi Vikas Yojana (Organic Farming Scheme)',
    description:
      'Central scheme to promote organic farming. Farmer groups of at least 50 farmers forming clusters of 50 acres receive financial support of ₹50,000 per acre over 3 years for inputs, certification (PGS), and training.',
    eligibility: 'Farmer groups (minimum 50 farmers) forming a cluster of at least 50 contiguous acres. Apply through State Agriculture Department.',
    howToApply:
      'Contact your Block Agriculture Officer or KVK. The application is submitted at cluster level through the State Agriculture Department to the central portal.',
    link: 'https://pgsindia-ncof.gov.in',
    linkLabel: 'pgsindia-ncof.gov.in',
    badge: 'Central',
  },
];

const BADGE_STYLES = {
  Central: 'bg-[#E3EDF7] text-[#4A7BA7]',
  Maharashtra: 'bg-[#DCE8C8] text-[#5B7A3A]',
};

export default function GovernmentSchemes() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-[26px] font-medium text-[#22301A] mb-1">Government Schemes</h2>
      <p className="text-[#7A8A6A] text-sm mb-2">
        Key schemes relevant to farmers in Maharashtra. Information is a general reference — check official portals for latest eligibility and amounts.
      </p>
      <div className="flex items-start gap-2 bg-[#FBF3E3] border border-[#EFE7D8] rounded-xl p-3 mb-7">
        <Info size={15} strokeWidth={2} className="text-[#C9A15A] mt-0.5 shrink-0" />
        <p className="text-[12px] text-[#7A6A3A]">
          Scheme amounts and rules may be revised each year. Always verify at the official website or your local Krishi Vibhag / KVK before applying.
        </p>
      </div>

      <div className="space-y-5">
        {SCHEMES.map((scheme) => (
          <div
            key={scheme.name}
            className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(34,48,26,0.06),0_8px_24px_rgba(34,48,26,0.05)]"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BADGE_STYLES[scheme.badge]}`}>
                    {scheme.badge}
                  </span>
                  <h3 className="font-serif text-[18px] font-medium text-[#22301A]">{scheme.name}</h3>
                </div>
                <p className="text-[12px] text-[#7A8A6A]">{scheme.fullName}</p>
              </div>
            </div>

            <p className="text-sm text-[#22301A] mb-4 leading-relaxed">{scheme.description}</p>

            <div className="space-y-3">
              <div className="bg-[#F6F4EC] rounded-xl p-4">
                <div className="text-[11px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">Eligibility</div>
                <p className="text-sm text-[#4A4A3A] leading-relaxed">{scheme.eligibility}</p>
              </div>
              <div className="bg-[#F6F4EC] rounded-xl p-4">
                <div className="text-[11px] font-semibold text-[#22301A] uppercase tracking-wide mb-1">How to Apply</div>
                <p className="text-sm text-[#4A4A3A] leading-relaxed">{scheme.howToApply}</p>
              </div>
            </div>

            <a
              href={scheme.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-4 text-[#5B7A3A] underline text-sm font-medium"
            >
              {scheme.linkLabel}
              <ExternalLink size={13} strokeWidth={2} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
