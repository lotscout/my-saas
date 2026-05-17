'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserTier } from '@/hooks/useUserTier';
import Header from '@/components/Header';

// ─── Types ────────────────────────────────────────────────────────────────────

type DirectoryView = 'grid' | 'national' | 'by-state' | 'active';

interface BuyerRequest {
  id: string;
  user_id: string;
  status: string;
  target_state: string | null;
  target_regions: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  min_acreage: number | null;
  max_acreage: number | null;
  use_case: string | null;
  zoning_preference: string[] | null;
  timeline: string | null;
  additional_notes: string | null;
  display_name: string | null;
  display_company: string | null;
  contact_phone: string | null;
  contact_phone_type: string | null;
  contact_email: string | null;
  contact_website: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
    is_test_profile: boolean | null;
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

const SELECT_CLS = 'bg-surface-container-low px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBudget(min: number | null, max: number | null): string {
  const f = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}K`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `${f(min)}+`;
  if (max) return `Up to ${f(max)}`;
  return 'Flexible';
}

function getBuyerName(req: BuyerRequest) {
  if (req.display_name) return req.display_name;
  const p = req.profiles;
  return [p?.first_name, p?.last_name].filter(Boolean).join(' ') || req.display_company || 'Anonymous Buyer';
}

function getInitials(req: BuyerRequest) {
  if (req.display_company) return req.display_company.substring(0, 2).toUpperCase();
  const p = req.profiles;
  return ([p?.first_name?.[0], p?.last_name?.[0]].filter(Boolean).join('').toUpperCase()) || 'AB';
}

function applyBudgetFilter(req: BuyerRequest, f: string): boolean {
  const max = req.budget_max ?? 0;
  const min = req.budget_min ?? 0;
  if (!f) return true;
  if (f === 'under50k') return max < 50_000;
  if (f === '50k-100k') return max >= 50_000 && max < 100_000;
  if (f === '100k-500k') return max >= 100_000 && max < 500_000;
  if (f === '500k-1m') return max >= 500_000 && max < 1_000_000;
  if (f === '1m-5m') return max >= 1_000_000 && max < 5_000_000;
  if (f === '5m+') return (max || min) >= 5_000_000;
  return true;
}

function applyAcreageFilter(req: BuyerRequest, f: string): boolean {
  const acres = req.min_acreage ?? 0;
  if (!f) return true;
  if (f === 'under5') return acres < 5;
  if (f === '5-25') return acres >= 5 && acres < 25;
  if (f === '25-100') return acres >= 25 && acres < 100;
  if (f === '100-500') return acres >= 100 && acres < 500;
  if (f === '500+') return acres >= 500;
  return true;
}

// ─── Shared BuyerRow ─────────────────────────────────────────────────────────

interface BuyerRowProps {
  req: BuyerRequest;
  canViewContact: boolean;
  onUpgrade: () => void;
  showTimeline?: boolean;
}

function BuyerRow({ req, canViewContact, onUpgrade, showTimeline = true }: BuyerRowProps) {
  const name = getBuyerName(req);
  const initials = getInitials(req);
  const company = req.profiles?.company_name || null;
  const blur = !canViewContact;

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">
      {/* Avatar + identity */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${blur ? 'blur-sm' : ''}`}>
          {req.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-primary font-bold text-sm">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`font-bold text-primary text-sm truncate ${blur ? 'blur-sm select-none' : ''}`}>{name}</p>
          {(req.display_company || company) && (
            <p className={`text-xs text-secondary truncate ${blur ? 'blur-sm select-none' : ''}`}>{req.display_company || company}</p>
          )}
          {req.contact_website && (
            <a href={`https://${req.contact_website}`} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-xs text-primary/70 hover:text-primary font-medium transition-colors">
              {req.contact_website}
            </a>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs shrink-0">
        {req.target_state && (
          <span className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-sm">location_on</span>
            {req.target_state}
          </span>
        )}
        <span className="font-semibold text-on-surface">{fmtBudget(req.budget_min, req.budget_max)}</span>
        {req.use_case && (
          <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full font-bold capitalize">{req.use_case.split(' — ')[0]}</span>
        )}
        {showTimeline && req.timeline && (
          <span className="text-secondary hidden md:inline">{req.timeline}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/buyer-requests/${req.id}`}
          className="text-xs font-semibold text-secondary border border-outline-variant/40 px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          View
        </Link>
        {canViewContact ? (
          <Link
            href={`/messaging?recipient=${req.profiles?.is_test_profile ? '43489074-71ec-4ba3-a03a-f1e47a8ba768' : req.user_id}`}
            className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Contact
          </Link>
        ) : (
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
          >
            <span className="material-symbols-outlined text-xs">lock</span>
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BuyerRequestCard (for Requests tab) ──────────────────────────────────────

interface BuyerCardProps {
  req: BuyerRequest;
  canViewContact: boolean;
  isFreeUser: boolean;
  onUpgrade: () => void;
}

function BuyerRequestCard({ req, canViewContact, isFreeUser, onUpgrade }: BuyerCardProps) {
  const name = getBuyerName(req);
  const initials = getInitials(req);
  const blur = !canViewContact;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${blur ? 'blur-sm' : ''}`}>
            {req.profiles?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={req.profiles.avatar_url} alt="Buyer" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <p className={`font-bold text-primary text-sm ${blur ? 'blur-sm select-none' : ''}`}>{name}</p>
            <p className="text-[10px] text-secondary uppercase tracking-widest font-bold">Verified Buyer</p>
          </div>
        </div>

      </div>

      <div className="space-y-2.5 text-sm">
        {(req.target_regions?.length ?? 0) > 0 && (
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-base mt-0.5">location_on</span>
            <span className="text-on-surface-variant">{req.target_regions!.join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-base">payments</span>
          <span className="text-on-surface-variant">{fmtBudget(req.budget_min, req.budget_max)}</span>
        </div>
        {req.min_acreage && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">landscape</span>
            <span className="text-on-surface-variant">
              {req.min_acreage}{req.max_acreage ? ` – ${req.max_acreage}` : '+'} acres
            </span>
          </div>
        )}
        {req.use_case && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">agriculture</span>
            <span className="bg-primary/8 text-primary px-2 py-0.5 rounded-full text-xs font-bold capitalize">{req.use_case.split(' — ')[0]}</span>
          </div>
        )}
        {req.timeline && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">schedule</span>
            <span className="text-on-surface-variant text-xs">{req.timeline}</span>
          </div>
        )}
      </div>

      <div className="pt-2 mt-auto border-t border-outline-variant/20 flex flex-col gap-2">
        {/* Contact info for institutional/seeded buyers */}
        {(req.contact_phone || req.contact_email || req.contact_website) && (
          <div className="bg-surface-container-low rounded-xl px-4 py-3 space-y-1.5 text-xs">
            {req.contact_phone && (
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-secondary" style={{fontSize:'14px'}}>call</span>
                <a href={`tel:${req.contact_phone}`} className="hover:text-primary transition-colors">
                  {req.contact_phone}
                </a>
                {req.contact_phone_type && (
                  <span className="text-secondary">({req.contact_phone_type})</span>
                )}
              </div>
            )}
            {req.contact_email && (
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-secondary" style={{fontSize:'14px'}}>mail</span>
                <a href={`mailto:${req.contact_email}`} className="hover:text-primary transition-colors truncate">{req.contact_email}</a>
              </div>
            )}
            {req.contact_website && (
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-secondary" style={{fontSize:'14px'}}>language</span>
                <a href={`https://${req.contact_website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors font-medium">{req.contact_website}</a>
              </div>
            )}
          </div>
        )}
        <Link
          href={`/buyer-requests/${req.id}`}
          className="w-full flex items-center justify-center gap-2 border border-outline-variant/40 text-secondary py-2 rounded-xl font-semibold text-xs hover:bg-surface-container-low transition-colors"
        >
          View Buying Criteria
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
        {canViewContact ? (
          <Link
            href={`/messaging?recipient=${req.profiles?.is_test_profile ? '43489074-71ec-4ba3-a03a-f1e47a8ba768' : req.user_id}`}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-base">mail</span>
            Contact Buyer
          </Link>
        ) : isFreeUser ? (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">lock</span>
            Upgrade to Contact Buyer
          </button>
        ) : (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-secondary py-2.5 rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
          >
            <span className="material-symbols-outlined text-base">lock</span>
            Upgrade to Contact
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Sub-view back header ─────────────────────────────────────────────────────

function ViewHeader({ title, subtitle, count, onBack }: { title: string; subtitle: string; count?: number; onBack: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-secondary hover:text-primary text-sm font-semibold mb-3 transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to Directory
        </button>
        <h2 className="font-headline text-2xl font-extrabold text-primary">{title}</h2>
        <p className="text-secondary text-sm mt-1">{subtitle}</p>
      </div>
      {count !== undefined && (
        <div className="bg-primary/8 text-primary px-4 py-2 rounded-xl text-sm font-bold shrink-0">
          {count} buyer{count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}


// ─── Top National Builders (static) ──────────────────────────────────────────
const TOP_BUILDERS = [
  { rank:1,  company:"D.R. Horton",              tier:"Public Giants",   hq:"Fort Worth, TX",    website:"drhorton.com",           phone:"(817) 390-8200", contacts:["VP Land Acquisition","Director of Land","Land Acquisition Manager"],        notes:"Largest US builder by volume; active in 30+ states" },
  { rank:2,  company:"Lennar Corporation",        tier:"Public Giants",   hq:"Miami, FL",         website:"lennar.com",              phone:"(305) 559-4000", contacts:["VP Acquisitions","Land Acquisition Director","Regional Land Manager"],        notes:"Multi-family + single-family; heavy FL, TX, CA" },
  { rank:3,  company:"PulteGroup",                tier:"Public Giants",   hq:"Atlanta, GA",       website:"pultegroup.com",          phone:"(404) 978-6400", contacts:["VP Land","Director of Land Acquisition","Land Acquisition Manager"],         notes:"Del Webb, Centex, DiVosta brands; sunbelt + Southeast" },
  { rank:4,  company:"NVR Inc.",                  tier:"Public Giants",   hq:"Reston, VA",        website:"nvrinc.com",              phone:"(703) 956-4000", contacts:["Land Acquisition Manager","Director of Real Estate","VP of Real Estate"],     notes:"Ryan Homes, NVHomes; East Coast + Mid-Atlantic" },
  { rank:5,  company:"Taylor Morrison",           tier:"Public Giants",   hq:"Scottsdale, AZ",    website:"taylormorrison.com",      phone:"(480) 840-8100", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"Active in AZ, TX, FL, CO, GA; master-planned + greenfield" },
  { rank:6,  company:"Toll Brothers",             tier:"Public Giants",   hq:"Fort Washington, PA",website:"tollbrothers.com",       phone:"(215) 938-8000", contacts:["VP Land Acquisition","Director of Land","Land Division President"],            notes:"Luxury segment; premium suburban and coastal markets" },
  { rank:7,  company:"KB Home",                   tier:"Public Giants",   hq:"Los Angeles, CA",   website:"kbhome.com",              phone:"(310) 231-4000", contacts:["VP Land","Director of Land Acquisitions","Land Manager"],                     notes:"First-time buyer focus; CA, TX, AZ, FL heavy" },
  { rank:8,  company:"Meritage Homes",            tier:"Public Giants",   hq:"Scottsdale, AZ",    website:"meritagehomes.com",       phone:"(480) 515-8100", contacts:["VP Land","Land Acquisition Director","Land Manager"],                         notes:"Energy-efficient builds; TX, AZ, FL, CO, CA" },
  { rank:9,  company:"Smith Douglas Homes",       tier:"Public Giants",   hq:"Woodstock, GA",     website:"smithdouglas.com",        phone:"(770) 627-2323", contacts:["VP of Land","Director of Land","Land Acquisition Manager"],                    notes:"Entry-level focus; SE US heavy; growing national" },
  { rank:10, company:"Century Communities",       tier:"Public Giants",   hq:"Greenwood Village, CO",website:"centurycommunities.com",phone:"(303) 793-4999", contacts:["VP Land","Director of Land Acquisition","Land Acquisition Manager"],         notes:"Affordable + first-time buyer; CO, TX, GA, NV, WA, UT" },
  { rank:11, company:"Clayton Properties Group",  tier:"Large Private",   hq:"Maryville, TN",     website:"claytonhomes.com",        phone:"(865) 380-3000", contacts:["Director of Land","VP Land","Land Development Manager"],                      notes:"Berkshire Hathaway subsidiary; Southeast focus" },
  { rank:12, company:"David Weekley Homes",       tier:"Large Private",   hq:"Houston, TX",       website:"davidweekleyhomes.com",   phone:"(713) 963-0500", contacts:["Land Acquisition Manager","VP Land","Director of Real Estate"],               notes:"TX, FL, CO, GA, MN; quality-focused; city/infill" },
  { rank:13, company:"Shea Homes",                tier:"Large Private",   hq:"Walnut, CA",        website:"sheahomes.com",           phone:"(909) 594-9500", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"CA, AZ, CO, WA; active 55+ (Trilogy brand)" },
  { rank:14, company:"Tri Pointe Homes",          tier:"Large Private",   hq:"Incline Village, NV",website:"tripointehomes.com",     phone:"(775) 826-1400", contacts:["VP Land","Land Acquisition Director","Land Manager"],                         notes:"Premium segment; CA, CO, WA, AZ, TX" },
  { rank:15, company:"Beazer Homes",              tier:"Large Private",   hq:"Atlanta, GA",       website:"beazer.com",              phone:"(770) 829-3700", contacts:["VP Land","Director of Land Acquisitions","Land Manager"],                     notes:"Entry-to-mid; FL, TX, CA, AZ, SE focus" },
  { rank:16, company:"LGI Homes",                 tier:"Large Private",   hq:"The Woodlands, TX", website:"lgihomes.com",            phone:"(281) 362-8998", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"Entry-level/affordable; TX, AZ, FL, CO, NM — high velocity" },
  { rank:17, company:"Stanley Martin Homes",      tier:"Large Private",   hq:"Reston, VA",        website:"stanleymartin.com",       phone:"(703) 821-2600", contacts:["VP Land","Director of Land Acquisition","Land Manager"],                      notes:"Mid-Atlantic; DC metro, VA, MD, NC, SC, GA" },
  { rank:18, company:"Mattamy Homes",             tier:"Large Private",   hq:"Orlando, FL",       website:"mattamyhomes.com",        phone:"(407) 206-9200", contacts:["VP Land","Director of Land Development","Land Acquisition Manager"],           notes:"Canadian-owned; FL, AZ, NC, MN, GA; active land buyer" },
  { rank:19, company:"Dream Finders Homes",       tier:"Large Private",   hq:"Jacksonville, FL",  website:"dreamfindershomes.com",   phone:"(904) 337-7858", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"SE and Mid-Atlantic; FL, NC, SC, GA, VA, CO" },
  { rank:20, company:"K. Hovnanian Homes",        tier:"Large Private",   hq:"Matawan, NJ",       website:"khov.com",                phone:"(732) 747-7800", contacts:["VP Land","Director of Land Acquisition","Land Manager"],                      notes:"Multi-state; NJ, FL, PA, TX, CA; varied price points" },
  { rank:21, company:"Chesmar Homes",             tier:"Large Regional",  hq:"Houston, TX",       website:"chesmarhomes.com",        phone:"(713) 714-4800", contacts:["Director of Land","VP Land","Land Manager"],                                   notes:"TX-focused; Houston, San Antonio, Austin, Dallas" },
  { rank:22, company:"Epcon Communities",         tier:"Large Regional",  hq:"Dublin, OH",        website:"epconfranchising.com",    phone:"(614) 766-3000", contacts:["Director of Land","Land Development Manager","VP of Development"],             notes:"55+ active adult; franchise model; OH, Midwest, Southeast" },
  { rank:23, company:"Fischer Homes",             tier:"Large Regional",  hq:"Erlanger, KY",      website:"fischerhomes.com",        phone:"(859) 282-0950", contacts:["Director of Land","VP Land","Land Acquisition Manager"],                      notes:"Midwest + Southeast; OH, KY, IN, GA, TN, MO" },
  { rank:24, company:"Eastwood Homes",            tier:"Large Regional",  hq:"Charlotte, NC",     website:"eastwoodhomes.com",       phone:"(704) 321-1789", contacts:["VP Land","Director of Land","Land Manager"],                                   notes:"SE focus; NC, SC, TN; growing into VA, GA" },
  { rank:25, company:"Ashton Woods Homes",        tier:"Large Regional",  hq:"Atlanta, GA",       website:"ashtonwoods.com",         phone:"(770) 246-6300", contacts:["Director of Land","VP Land","Land Acquisition Manager"],                      notes:"GA, TX, FL, AZ, NC, SC; design-forward mid-market" },
  { rank:26, company:"Landsea Homes",             tier:"Large Regional",  hq:"Dallas, TX",        website:"landseahomes.com",        phone:"(949) 345-8080", contacts:["VP Land","Director of Land","Land Manager"],                                   notes:"TX, AZ, FL, CA, CO; sustainability focus" },
  { rank:27, company:"Empire Communities",        tier:"Large Regional",  hq:"Atlanta, GA",       website:"empirecommunities.com",   phone:"(404) 301-3560", contacts:["VP Land","Director of Land Acquisition","Land Manager"],                      notes:"GA, TX, TN, NC US markets; Canadian parent" },
  { rank:28, company:"Landmark Homes",            tier:"Large Regional",  hq:"Lititz, PA",        website:"landmarkhomes.net",       phone:"(717) 626-8002", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"PA, MD, NJ markets; custom and semi-custom" },
  { rank:29, company:"Trumark Homes",             tier:"Large Regional",  hq:"San Ramon, CA",     website:"trumarkhomes.com",        phone:"(925) 244-7000", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"CA and CO; infill and suburban; design-forward" },
  { rank:30, company:"Thomas James Homes",        tier:"Large Regional",  hq:"Newport Beach, CA", website:"thomasjameshomes.com",    phone:"(949) 478-8047", contacts:["Director of Acquisitions","VP Acquisitions","Land Acquisition Manager"],       notes:"Infill teardown/rebuild; CA, CO, WA, AZ; high-margin lots" },
  { rank:31, company:"Forestar Group",            tier:"Land Developers", hq:"Arlington, TX",     website:"forestar.com",            phone:"(817) 769-1860", contacts:["VP Land","Director of Land Development","Land Development Manager"],           notes:"D.R. Horton subsidiary; pure-play land banking" },
  { rank:32, company:"Brookfield Residential",    tier:"Land Developers", hq:"Denver, CO",        website:"brookfieldresidential.com",phone:"(720) 449-6000",contacts:["VP Land","Director of Land Acquisition","Land Development Manager"],           notes:"Master-planned communities; CO, CA, AZ, TX, MD" },
  { rank:33, company:"The Howard Hughes Corp.",   tier:"Land Developers", hq:"The Woodlands, TX", website:"howardhughes.com",        phone:"(281) 364-2500", contacts:["VP Development","Director of Land","VP Real Estate"],                         notes:"Master-planned; Summerlin NV, Woodlands TX, Columbia MD" },
  { rank:34, company:"Irvine Company",            tier:"Land Developers", hq:"Newport Beach, CA", website:"irvinecompany.com",       phone:"(949) 720-2000", contacts:["VP Acquisitions","Director of Land","VP Development"],                        notes:"CA-centric; massive land holdings in Orange County" },
  { rank:35, company:"Newland Communities",       tier:"Land Developers", hq:"San Diego, CA",     website:"newlandco.com",           phone:"(858) 618-1500", contacts:["VP Land","Director of Land Development","Development Manager"],               notes:"National master-planned; TX, FL, MD, CA, SC, NC" },
  { rank:36, company:"Sunstone Land Partners",    tier:"Land Developers", hq:"Denver, CO",        website:"sunstoneland.com",        phone:"",               contacts:["Principal","VP Acquisitions","Land Acquisition Manager"],                      notes:"Land banking and development; Rocky Mountain + West" },
  { rank:37, company:"Vestar Development",        tier:"Land Developers", hq:"Phoenix, AZ",       website:"vestar.com",              phone:"(602) 866-8500", contacts:["VP Development","Director of Acquisitions","Development Manager"],             notes:"Mixed-use and retail/residential land; AZ, West" },
  { rank:38, company:"Brookfield Properties",     tier:"Land Developers", hq:"New York, NY",      website:"brookfieldproperties.com",phone:"(212) 417-7000", contacts:["VP Development","Director of Acquisitions","Land Development VP"],             notes:"Large-scale mixed-use; national presence" },
  { rank:39, company:"NexMetro Communities",      tier:"Land Developers", hq:"Phoenix, AZ",       website:"nexmetro.com",            phone:"(602) 441-5300", contacts:["VP Acquisitions","Director of Land","Land Acquisition Manager"],               notes:"Build-to-rent land buyer; AZ, TX, FL, CO, GA" },
  { rank:40, company:"NexPoint Real Estate",      tier:"Land Developers", hq:"Dallas, TX",        website:"nexpointrei.com",         phone:"(214) 276-6300", contacts:["VP Acquisitions","Director of Development","Land Manager"],                    notes:"BTR and multi-family land; TX-centric with national reach" },
  { rank:41, company:"Thrive Home Builders",      tier:"Emerging",        hq:"Denver, CO",        website:"thrivehomebuilders.com",  phone:"(303) 345-5687", contacts:["VP Land","Director of Land","Land Manager"],                                   notes:"Sustainability-focused; CO and Mountain West" },
  { rank:42, company:"Coventry Homes",            tier:"Emerging",        hq:"Houston, TX",       website:"coventryhomes.com",       phone:"(713) 783-3710", contacts:["Director of Land","VP Land","Land Acquisition Manager"],                      notes:"TX-focused; Houston and Austin markets" },
  { rank:43, company:"Presidio Residential Capital",tier:"Emerging",      hq:"San Diego, CA",     website:"presidiorc.com",          phone:"(858) 875-4900", contacts:["Director of Acquisitions","VP Acquisitions","Investment Manager"],             notes:"Capital partner for builders; lot-banking model; CA" },
  { rank:44, company:"Century Land Holdings",     tier:"Emerging",        hq:"Phoenix, AZ",       website:"centurylandholdings.com", phone:"",               contacts:["VP Land","Director of Acquisitions","Land Manager"],                          notes:"Land development and lot finishing; AZ, TX, UT" },
  { rank:45, company:"Sumeer Homes",              tier:"Emerging",        hq:"Irving, TX",        website:"sumeerhomes.com",         phone:"(972) 870-0990", contacts:["VP Land","Director of Land","Land Manager"],                                   notes:"DFW-focused; growing suburban TX markets" },
  { rank:46, company:"Grenadier Homes",           tier:"Emerging",        hq:"Dallas, TX",        website:"grenadierhomes.com",      phone:"(214) 389-2999", contacts:["Director of Land","VP Acquisitions","Land Manager"],                          notes:"TX-focused; DFW and Austin infill and suburban" },
  { rank:47, company:"Oakwood Homes",             tier:"Emerging",        hq:"Greenwood Village, CO",website:"oakwoodhomesco.com",   phone:"(303) 799-3300", contacts:["VP Land","Director of Land","Land Acquisition Manager"],                      notes:"CO and Mountain West; attainable housing focus" },
  { rank:48, company:"Nexus Residential",         tier:"Emerging",        hq:"Tempe, AZ",         website:"nexusresidential.com",    phone:"",               contacts:["VP Acquisitions","Director of Land","Land Manager"],                          notes:"AZ, CO, TX; emerging BTR and entry-level lot buyer" },
  { rank:49, company:"Landmark 24 Homes",         tier:"Emerging",        hq:"Savannah, GA",      website:"landmark24homes.com",     phone:"(912) 353-2424", contacts:["VP Land","Director of Land","Land Manager"],                                   notes:"SE focus; GA, SC, NC; first-time and move-up buyer" },
  { rank:50, company:"Armadillo Homes",           tier:"Emerging",        hq:"San Antonio, TX",   website:"armadillohomes.com",      phone:"(210) 764-4663", contacts:["Director of Land","VP Land","Land Manager"],                                   notes:"TX-focused; San Antonio and Austin suburban markets" },
] as const;

const TIER_COLORS: Record<string, string> = {
  "Public Giants":   "bg-blue-50 text-blue-700 border-blue-200",
  "Large Private":   "bg-violet-50 text-violet-700 border-violet-200",
  "Large Regional":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Land Developers": "bg-amber-50 text-amber-700 border-amber-200",
  "Emerging":        "bg-rose-50 text-rose-700 border-rose-200",
};

function BuilderCard({ b }: { b: typeof TOP_BUILDERS[number] }) {
  const tierCls = TIER_COLORS[b.tier] ?? "bg-surface-container text-secondary border-outline-variant/20";
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">#{b.rank}</span>
          <h3 className="font-headline text-base font-extrabold text-primary leading-tight mt-0.5">{b.company}</h3>
          <p className="text-xs text-secondary mt-0.5">{b.hq}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${tierCls}`}>{b.tier}</span>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 text-xs">
        <a
          href={`https://${b.website}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1.5 text-primary hover:underline font-semibold"
        >
          <span className="material-symbols-outlined text-sm">language</span>
          {b.website}
        </a>
        {b.phone && (
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">call</span>
            {b.phone}
          </div>
        )}
      </div>

      {/* Contact titles */}
      <div className="flex flex-wrap gap-1.5">
        {b.contacts.map((c, i) => (
          <span key={i} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-secondary font-semibold border border-outline-variant/20">{c}</span>
        ))}
      </div>

      {/* Notes */}
      <p className="text-[11px] text-secondary leading-relaxed border-t border-outline-variant/15 pt-2">{b.notes}</p>
    </div>
  );
}


// ─── Top Builders by State (static) ──────────────────────────────────────────
interface StateBuilder {
  rank: number;
  company: string;
  pub: string;
  hq: string;
  website: string;
  phone: string;
  contacts: string[];
  notes: string;
}

const STATE_BUILDERS: Record<string, StateBuilder[]> = {
  'Alabama': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Largest national builder; strong Birmingham and Huntsville presence' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Active in Birmingham, Huntsville, Mobile metro areas' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Centex brand active; Birmingham and Huntsville focus' },
    { rank:4, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Entry-level focus; growing SE Alabama market presence' },
    { rank:5, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Strong Alabama coastal and metro presence; FL-based operator' },
    { rank:6, company:'MasterCraft Builder Group', pub:'Private', hq:'Birmingham, AL', website:'mastercraftbuildergroup.com', phone:'(205) 972-0441', contacts:["President", "Director of Development", "Land Acquisition Manager"], notes:'Birmingham-based; custom and semi-custom; active lot buyer' },
    { rank:7, company:'Signature Homes', pub:'Private', hq:'Hoover, AL', website:'signaturehomes.com', phone:'(205) 988-6677', contacts:["President", "VP of Development", "Land Manager"], notes:'AL-focused; Birmingham and surrounding markets' },
    { rank:8, company:'Truland Homes', pub:'Private', hq:'Birmingham, AL', website:'trulandhomes.com', phone:'(205) 776-7600', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Birmingham metro; attainable housing focus' },
    { rank:9, company:'LGI Homes', pub:'Public', hq:'The Woodlands, TX', website:'lgihomes.com', phone:'(281) 362-8998', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Entry-level; expanding Alabama markets' },
    { rank:10, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'SE expansion; AL entry-level and mid-market' },
  ],
  'Alaska': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Limited national builder presence; Anchorage primary market' },
    { rank:2, company:'Spinell Homes', pub:'Private', hq:'Anchorage, AK', website:'spinellhomes.com', phone:'(907) 337-0000', contacts:["Owner", "VP of Development", "Land Manager"], notes:'Largest local builder in AK; Anchorage and MatSu Valley focus' },
    { rank:3, company:'Midnight Sun Builders', pub:'Private', hq:'Anchorage, AK', website:'', phone:'(907) 563-8600', contacts:["Owner", "Project Manager", "Land Manager"], notes:'Anchorage-based; residential and light commercial' },
    { rank:4, company:'Great Land Trust', pub:'Private', hq:'Anchorage, AK', website:'greatlandtrust.org', phone:'(907) 278-4998', contacts:["Executive Director", "Director of Acquisitions", "Land Manager"], notes:'Conservation land focus; land acquisition active' },
    { rank:5, company:'Alaska Pacific Builders', pub:'Private', hq:'Anchorage, AK', website:'', phone:'(907) 272-5400', contacts:["Principal", "Project Manager", "Land Manager"], notes:'Local builder; Anchorage and surrounding communities' },
  ],
  'Arizona': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Top volume builder in AZ; Phoenix and Tucson heavy' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Phoenix, Tucson; multi-family and SF active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Del Webb 55+ major operator in AZ; Sun City brand' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in AZ; Phoenix and Tucson top priority markets' },
    { rank:5, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'HQ in AZ; very active Phoenix metro land buyer' },
    { rank:6, company:'KB Home', pub:'Public', hq:'Los Angeles, CA', website:'kbhome.com', phone:'(310) 231-4000', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'Phoenix and Tucson active; first-time buyer focus' },
    { rank:7, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Phoenix metro; active lot buyer' },
    { rank:8, company:'Beazer Homes', pub:'Public', hq:'Atlanta, GA', website:'beazer.com', phone:'(770) 829-3700', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'Phoenix active; entry to mid-market lots' },
    { rank:9, company:'Shea Homes', pub:'Private', hq:'Walnut, CA', website:'sheahomes.com', phone:'(909) 594-9500', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Scottsdale and Phoenix; Trilogy 55+ active' },
    { rank:10, company:'Tri Pointe Homes', pub:'Public', hq:'Incline Village, NV', website:'tripointehomes.com', phone:'(775) 826-1400', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Scottsdale and Phoenix; premium lots targeted' },
  ],
  'Arkansas': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Dominant in Little Rock and Fayetteville/NWA markets' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Northwest Arkansas and Little Rock presence' },
    { rank:3, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Active in AR metro markets' },
    { rank:4, company:'Simmons Homes', pub:'Private', hq:'Fayetteville, AR', website:'simmonshomes.com', phone:'(479) 521-5500', contacts:["President", "VP of Development", "Land Manager"], notes:'NW Arkansas focused; large regional builder' },
    { rank:5, company:'Riverdale Homes', pub:'Private', hq:'Little Rock, AR', website:'', phone:'(501) 374-4000', contacts:["Owner", "Project Manager", "Land Manager"], notes:'Little Rock metro; residential land buyer' },
  ],
  'California': [
    { rank:1, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Top CA builder; Bay Area, SoCal, Inland Empire active' },
    { rank:2, company:'KB Home', pub:'Public', hq:'Los Angeles, CA', website:'kbhome.com', phone:'(310) 231-4000', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'HQ in CA; largest markets SoCal and Bay Area' },
    { rank:3, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Active across CA; Inland Empire and Central Valley focus' },
    { rank:4, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury land buyer; Bay Area, LA, OC, San Diego' },
    { rank:5, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Inland Empire, Sacramento, Bay Area active' },
    { rank:6, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Bay Area and SoCal; premium infill and master-planned' },
    { rank:7, company:'Shea Homes', pub:'Private', hq:'Walnut, CA', website:'sheahomes.com', phone:'(909) 594-9500', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in CA; SoCal, Bay Area, San Diego active' },
    { rank:8, company:'Tri Pointe Homes', pub:'Public', hq:'Incline Village, NV', website:'tripointehomes.com', phone:'(775) 826-1400', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'CA-heavy; Bay Area, SoCal, Sacramento' },
    { rank:9, company:'Trumark Homes', pub:'Private', hq:'San Ramon, CA', website:'trumarkhomes.com', phone:'(925) 244-7000', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Bay Area and SoCal infill focus; CA specialist' },
    { rank:10, company:'Thomas James Homes', pub:'Private', hq:'Newport Beach, CA', website:'thomasjameshomes.com', phone:'(949) 478-8047', contacts:["Director of Acquisitions", "VP Acquisitions", "Land Acquisition Manager"], notes:'Infill teardown model; LA, OC, Bay Area, San Diego' },
  ],
  'Colorado': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Top volume builder in Denver metro and Front Range' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Denver, Fort Collins, Colorado Springs active' },
    { rank:3, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'HQ in CO; Denver metro and Front Range top priority' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Denver metro; master-planned and suburban lots' },
    { rank:5, company:'Richmond American Homes', pub:'Private', hq:'Denver, CO', website:'richmondamerican.com', phone:'(303) 773-1200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in CO; one of the most active CO land buyers' },
    { rank:6, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Denver and Front Range; energy-efficient lots' },
    { rank:7, company:'Brookfield Residential', pub:'Private', hq:'Denver, CO', website:'brookfieldresidential.com', phone:'(720) 449-6000', contacts:["VP Land", "Director of Land Acquisition", "Land Development Manager"], notes:'US HQ in Denver; master-planned community developer' },
    { rank:8, company:'Oakwood Homes', pub:'Private', hq:'Greenwood Village, CO', website:'oakwoodhomesco.com', phone:'(303) 799-3300', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'CO-focused; attainable and entry-level lots' },
    { rank:9, company:'Thrive Home Builders', pub:'Private', hq:'Denver, CO', website:'thrivehomebuilders.com', phone:'(303) 345-5687', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Denver-based; net-zero and sustainability focus; active lot buyer' },
    { rank:10, company:'Dream Finders Homes', pub:'Public', hq:'Jacksonville, FL', website:'dreamfindershomes.com', phone:'(904) 337-7858', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Expanding Colorado front range; active lot acquisition' },
  ],
  'Connecticut': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Limited CT presence; Hartford and New Haven focus' },
    { rank:2, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury buyer; Fairfield County and Hartford suburbs' },
    { rank:3, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'CT presence; option-lot model' },
    { rank:4, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Hartford and Fairfield County presence' },
    { rank:5, company:'Keystone Builders', pub:'Private', hq:'Grand Rapids, MI', website:'keystonebuilder.com', phone:'(616) 698-5000', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Regional builder with CT presence' },
  ],
  'Delaware': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Wilmington and Sussex County active' },
    { rank:2, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'Strong DE presence; option-lot model; Mid-Atlantic specialist' },
    { rank:3, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury lots in northern DE and Wilmington suburbs' },
    { rank:4, company:'Schell Brothers', pub:'Private', hq:'Lewes, DE', website:'schellbrothers.com', phone:'(302) 227-5100', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'DE-focused builder; coastal and inland active; major local player' },
    { rank:5, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Mid-Atlantic footprint includes DE' },
  ],
  'Florida': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Top FL builder by volume; Tampa, Orlando, Jacksonville, Miami' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'HQ in FL; most active land buyer statewide' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Del Webb 55+ dominant in FL; Tampa and Orlando key' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Tampa, Orlando, Sarasota; master-planned lots' },
    { rank:5, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Active statewide; Tampa, Jacksonville, Orlando' },
    { rank:6, company:'GL Homes', pub:'Private', hq:'Sunrise, FL', website:'glhomes.com', phone:'(954) 753-1730', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'FL-only builder; South FL and Orlando; active lot buyer' },
    { rank:7, company:'Dream Finders Homes', pub:'Public', hq:'Jacksonville, FL', website:'dreamfindershomes.com', phone:'(904) 337-7858', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in FL; Jacksonville, Orlando, NE FL heavy' },
    { rank:8, company:'Mattamy Homes', pub:'Private', hq:'Orlando, FL', website:'mattamyhomes.com', phone:'(407) 206-9200', contacts:["VP Land", "Director of Land Development", "Land Acquisition Manager"], notes:'US HQ in FL; Orlando and Tampa major markets' },
    { rank:9, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'FL-based; Panhandle and North FL active land buyer' },
    { rank:10, company:'Maronda Homes', pub:'Private', hq:'Cincinnati, OH', website:'marondahomes.com', phone:'(513) 422-9430', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OH-based with strong FL operations; active lot buyer' },
  ],
  'Georgia': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Top GA builder; Atlanta metro and secondary markets' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Atlanta and Savannah; active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'HQ in GA; Atlanta metro dominant' },
    { rank:4, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in GA; entry-level; very active Atlanta lot buyer' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Atlanta metro active; entry-level focus' },
    { rank:6, company:'Ashton Woods Homes', pub:'Private', hq:'Atlanta, GA', website:'ashtonwoods.com', phone:'(770) 246-6300', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'HQ in GA; Atlanta, design-forward mid-market lots' },
    { rank:7, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Atlanta expansion; SE growth strategy' },
    { rank:8, company:'Empire Communities', pub:'Private', hq:'Atlanta, GA', website:'empirecommunities.com', phone:'(404) 301-3560', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'US HQ in Atlanta; active GA land buyer' },
    { rank:9, company:'LGI Homes', pub:'Public', hq:'The Woodlands, TX', website:'lgihomes.com', phone:'(281) 362-8998', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Entry-level; Atlanta and secondary GA markets' },
    { rank:10, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'SE expansion; active Atlanta metro lot buyer' },
  ],
  'Hawaii': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'National builder with HI presence; Oahu primary market' },
    { rank:2, company:'Gentry Homes', pub:'Private', hq:'Honolulu, HI', website:'gentryhomes.com', phone:'(808) 599-9311', contacts:["President", "VP of Development", "Land Acquisition Manager"], notes:'Local HI builder; Oahu-focused; active lot buyer' },
    { rank:3, company:'Castle &amp; Cooke Hawaii', pub:'Private', hq:'Honolulu, HI', website:'castleandcookehawaii.com', phone:'(808) 548-4811', contacts:["VP Development", "Director of Land", "Land Manager"], notes:'Large landowner and developer; Oahu and Lanai' },
    { rank:4, company:'Schuler Homes', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'D.R. Horton subsidiary; HI operations' },
    { rank:5, company:'ProsPac Holdings', pub:'Private', hq:'Honolulu, HI', website:'', phone:'(808) 585-3000', contacts:["Director of Development", "VP Acquisitions", "Land Manager"], notes:'HI-based land developer and community builder' },
  ],
  'Idaho': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Top Boise metro builder by volume' },
    { rank:2, company:'Hubble Homes', pub:'Private', hq:'Meridian, ID', website:'hubblehomes.com', phone:'(208) 846-7700', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'ID-based; Boise metro dominant; very active lot buyer' },
    { rank:3, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury Boise metro lots; strong ID expansion' },
    { rank:4, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Boise and Treasure Valley active' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Boise and Treasure Valley lots; active buyer' },
  ],
  'Illinois': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Chicago suburbs and downstate active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Chicago metro and collar counties' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Chicago suburbs; Del Webb 55+ active' },
    { rank:4, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Chicago luxury suburbs; North Shore and DuPage' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Chicago metro active' },
    { rank:6, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Chicago suburbs active; varied price points' },
    { rank:7, company:'Lexington Homes', pub:'Private', hq:'Northbrook, IL', website:'lexingtonhomes.com', phone:'(847) 291-5810', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Chicago-focused; north and northwest suburbs' },
    { rank:8, company:'Meadowbrook Builders', pub:'Private', hq:'Schaumburg, IL', website:'', phone:'(847) 882-0888', contacts:["President", "VP of Development", "Land Manager"], notes:'IL-focused; suburban Chicago land buyer' },
    { rank:9, company:'William Ryan Homes', pub:'Private', hq:'Schaumburg, IL', website:'williamryanhomes.com', phone:'(847) 490-5000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Chicago suburbs focused; active lot buyer' },
    { rank:10, company:'Calatlantic/Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Absorbed CalAtlantic IL operations; active Chicago lot buyer' },
  ],
  'Indiana': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Indy metro and Fort Wayne active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Indianapolis metro heavy' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Indianapolis suburbs; Del Webb active' },
    { rank:4, company:'Fischer Homes', pub:'Private', hq:'Erlanger, KY', website:'fischerhomes.com', phone:'(859) 282-0950', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'Indianapolis and SE Indiana active' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Indianapolis metro active lot buyer' },
    { rank:6, company:'Arbor Homes', pub:'Private', hq:'Indianapolis, IN', website:'arborhomes.com', phone:'(317) 819-5100', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'IN-focused; Indianapolis metro dominant; active lot buyer' },
    { rank:7, company:'Estridge Homes', pub:'Private', hq:'Carmel, IN', website:'estridgehomes.com', phone:'(317) 580-5500', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'IN-focused; north Indianapolis suburbs; active buyer' },
    { rank:8, company:'M/I Homes', pub:'Public', hq:'Columbus, OH', website:'mihomes.com', phone:'(614) 418-8000', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Indianapolis active; expanding IN presence' },
    { rank:9, company:'Drees Homes', pub:'Private', hq:'Fort Mitchell, KY', website:'dreeshomes.com', phone:'(859) 578-4200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'IN expansion; custom and semi-custom lots' },
    { rank:10, company:'Old Town Design Group', pub:'Private', hq:'Indianapolis, IN', website:'oldtowndesigngroup.com', phone:'(317) 283-7000', contacts:["Director of Development", "VP Acquisitions", "Land Manager"], notes:'Indy infill and custom; active urban lot buyer' },
  ],
  'Iowa': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Des Moines and Cedar Rapids active' },
    { rank:2, company:'Hubbell Homes', pub:'Private', hq:'Des Moines, IA', website:'hubbellhomes.com', phone:'(515) 243-2178', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'IA-focused; Des Moines metro dominant; major local player' },
    { rank:3, company:'Kimberley Development', pub:'Private', hq:'Des Moines, IA', website:'', phone:'(515) 276-2800', contacts:["President", "VP Development", "Land Manager"], notes:'Des Moines metro; active lot and land buyer' },
    { rank:4, company:'Regency Homes', pub:'Private', hq:'Des Moines, IA', website:'', phone:'(515) 422-4500', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Iowa-focused residential builder' },
    { rank:5, company:'Destiny Homes', pub:'Private', hq:'Clive, IA', website:'destinyhomes.net', phone:'(515) 978-2330', contacts:["Owner", "VP Development", "Land Manager"], notes:'Des Moines suburb focus; entry-level and move-up' },
  ],
  'Kansas': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Kansas City KS and Wichita active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Kansas City market active' },
    { rank:3, company:'Journey Homes', pub:'Private', hq:'Wichita, KS', website:'', phone:'(316) 425-4663', contacts:["President", "VP Development", "Land Manager"], notes:'Wichita-focused; entry-level land buyer' },
    { rank:4, company:'Rodrock Homes', pub:'Private', hq:'Overland Park, KS', website:'rodrockdevelopment.com', phone:'(913) 345-8400', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Kansas City KS side; active lot and land developer' },
    { rank:5, company:'Starr Homes', pub:'Private', hq:'Wichita, KS', website:'', phone:'(316) 250-1111', contacts:["President", "VP Development", "Land Manager"], notes:'Wichita metro; regional builder and lot buyer' },
  ],
  'Kentucky': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Louisville and Lexington markets active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Louisville metro active land buyer' },
    { rank:3, company:'Fischer Homes', pub:'Private', hq:'Erlanger, KY', website:'fischerhomes.com', phone:'(859) 282-0950', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'HQ in KY; Cincinnati/NKY and Louisville active' },
    { rank:4, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Louisville suburbs active' },
    { rank:5, company:'Drees Homes', pub:'Private', hq:'Fort Mitchell, KY', website:'dreeshomes.com', phone:'(859) 578-4200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in KY; NKY and Louisville active land buyer' },
    { rank:6, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Expanding KY presence; entry-level lots' },
    { rank:7, company:'Weyland Ventures', pub:'Private', hq:'Louisville, KY', website:'weylandventures.com', phone:'(502) 581-0707', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'KY-based developer; Louisville urban and suburban' },
    { rank:8, company:'Don Lewis Homes', pub:'Private', hq:'Louisville, KY', website:'', phone:'(502) 244-6200', contacts:["President", "VP Development", "Land Manager"], notes:'Louisville-focused builder and lot buyer' },
    { rank:9, company:'Arbor Homes', pub:'Private', hq:'Indianapolis, IN', website:'arborhomes.com', phone:'(317) 819-5100', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Expanding Louisville market' },
    { rank:10, company:'Old Kentucky Home Builders', pub:'Private', hq:'Lexington, KY', website:'', phone:'(859) 277-1000', contacts:["Owner", "VP Development", "Land Manager"], notes:'Lexington metro; custom and semi-custom lots' },
  ],
  'Louisiana': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Baton Rouge and New Orleans active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Baton Rouge and suburban New Orleans' },
    { rank:3, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Gulf Coast and Louisiana market active' },
    { rank:4, company:'Level Homes', pub:'Private', hq:'Baton Rouge, LA', website:'levelhomes.com', phone:'(225) 296-0099', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'LA-focused; Baton Rouge and surrounding parishes active' },
    { rank:5, company:'Rêve Builders', pub:'Private', hq:'Mandeville, LA', website:'', phone:'(985) 624-5555', contacts:["Owner", "VP Development", "Land Manager"], notes:'North Shore New Orleans; active land and lot buyer' },
  ],
  'Maine': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Limited ME presence; Portland area focus' },
    { rank:2, company:'Chinburg Properties', pub:'Private', hq:'Newmarket, NH', website:'chinburg.com', phone:'(603) 659-1766', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'NH/ME regional builder; Portland and southern ME' },
    { rank:3, company:'Risbara Brothers', pub:'Private', hq:'Gorham, ME', website:'risbarabrothers.com', phone:'(207) 839-5595', contacts:["President", "VP Development", "Land Manager"], notes:'ME-based; Portland metro active builder and lot buyer' },
    { rank:4, company:'Benchmark Homes', pub:'Private', hq:'South Portland, ME', website:'', phone:'(207) 799-6500', contacts:["Owner", "VP Development", "Land Manager"], notes:'ME-focused; southern Maine residential' },
    { rank:5, company:'Keiser Homes', pub:'Private', hq:'Wells, ME', website:'', phone:'(207) 641-2444', contacts:["Owner", "Project Manager", "Land Manager"], notes:'Coastal Maine builder; York County lots' },
  ],
  'Maryland': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Baltimore and DC suburbs active' },
    { rank:2, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'Dominant Mid-Atlantic builder; MD top market' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Baltimore and DC suburbs active' },
    { rank:4, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Baltimore suburbs and DC market' },
    { rank:5, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'DC Metro including MD; active suburban lot buyer' },
    { rank:6, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury MD suburbs; Montgomery and Howard County' },
    { rank:7, company:'Brookfield Residential', pub:'Private', hq:'Denver, CO', website:'brookfieldresidential.com', phone:'(720) 449-6000', contacts:["VP Land", "Director of Land Acquisition", "Land Development Manager"], notes:'Master-planned communities in MD; DC suburb focus' },
    { rank:8, company:'EYA', pub:'Private', hq:'Bethesda, MD', website:'eya.com', phone:'(301) 215-9400', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'MD-based; DC metro urban and transit-oriented lots' },
    { rank:9, company:'Miller &amp; Smith', pub:'Private', hq:'McLean, VA', website:'millerandsmith.com', phone:'(703) 506-2300', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'DC metro including MD; move-up and luxury lots' },
    { rank:10, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in MD; Baltimore and DC suburb active lot buyer' },
  ],
  'Massachusetts': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Boston suburbs and eastern MA active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Boston metro and multi-family land' },
    { rank:3, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury MA suburbs; Boston\'s premium communities' },
    { rank:4, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'New England presence including MA' },
    { rank:5, company:'National Development', pub:'Private', hq:'Newton, MA', website:'natdev.com', phone:'(617) 559-4600', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'MA-based; mixed-use and residential land developer' },
    { rank:6, company:'New England Development', pub:'Private', hq:'Newton, MA', website:'nedevelopment.com', phone:'(617) 965-4500', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'MA-based developer; Boston area land focus' },
    { rank:7, company:'Pulte', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Boston suburbs; active 55+ and family land' },
    { rank:8, company:'Corcoran Jennison', pub:'Private', hq:'Boston, MA', website:'corcoranjennison.com', phone:'(617) 457-4000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'Boston-based developer; residential and mixed-use' },
    { rank:9, company:'John M. Corcoran Company', pub:'Private', hq:'Braintree, MA', website:'jmcorcoran.com', phone:'(617) 380-9800', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'MA-focused developer; South Shore and Boston area' },
    { rank:10, company:'Cabot Industrial Value Fund', pub:'Private', hq:'Boston, MA', website:'', phone:'(617) 226-7000', contacts:["VP Acquisitions", "Director of Development", "Land Manager"], notes:'Institutional land buyer; Boston and eastern MA' },
  ],
  'Michigan': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Detroit metro and Grand Rapids active' },
    { rank:2, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Detroit suburbs; Del Webb Michigan active' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Detroit metro active land buyer' },
    { rank:4, company:'Robertson Brothers Homes', pub:'Private', hq:'Bloomfield Hills, MI', website:'robertsonbrothershomes.com', phone:'(248) 644-6700', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'SE Michigan; luxury and mid-market lots' },
    { rank:5, company:'Eastbrook Homes', pub:'Private', hq:'Grand Rapids, MI', website:'eastbrookhomes.com', phone:'(616) 455-3000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'West MI focused; Grand Rapids and surrounding markets' },
    { rank:6, company:'Allen Edwin Homes', pub:'Private', hq:'Portage, MI', website:'allenedhomes.com', phone:'(269) 342-8944', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'SW Michigan; entry-level active lot buyer' },
    { rank:7, company:'Infinity Homes', pub:'Private', hq:'Grand Rapids, MI', website:'', phone:'(616) 213-8500', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'West MI builder; active lot buyer' },
    { rank:8, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Detroit suburbs active' },
    { rank:9, company:'Singh Development', pub:'Private', hq:'Bloomfield Hills, MI', website:'singhlife.com', phone:'(248) 334-8000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'SE Michigan developer; master-planned and suburban' },
    { rank:10, company:'Silverman Companies', pub:'Private', hq:'Bingham Farms, MI', website:'silvermancompanies.com', phone:'(248) 642-0120', contacts:["VP Development", "Director of Land", "Land Manager"], notes:'MI-based developer; Detroit suburb lots' },
  ],
  'Minnesota': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Twin Cities metro and St. Cloud active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Twin Cities metro active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Twin Cities suburbs; Del Webb active' },
    { rank:4, company:'David Weekley Homes', pub:'Private', hq:'Houston, TX', website:'davidweekleyhomes.com', phone:'(713) 963-0500', contacts:["Land Acquisition Manager", "VP Land", "Director of Real Estate"], notes:'Twin Cities active' },
    { rank:5, company:'Mattamy Homes', pub:'Private', hq:'Orlando, FL', website:'mattamyhomes.com', phone:'(407) 206-9200', contacts:["VP Land", "Director of Land Development", "Land Acquisition Manager"], notes:'Twin Cities active; Canadian builder with strong MN ops' },
    { rank:6, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Twin Cities suburban lots' },
    { rank:7, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Twin Cities active' },
    { rank:8, company:'Donnay Homes', pub:'Private', hq:'Albertville, MN', website:'donnayhomes.com', phone:'(763) 497-1500', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'MN-focused; western Twin Cities suburbs' },
    { rank:9, company:'Hanson Builders', pub:'Private', hq:'Eden Prairie, MN', website:'hansonbuilders.com', phone:'(952) 707-1111', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Twin Cities; active suburban lot buyer' },
    { rank:10, company:'Tradition Homes', pub:'Private', hq:'Woodbury, MN', website:'', phone:'(651) 738-5830', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'East metro Twin Cities; active lot buyer' },
  ],
  'Mississippi': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Jackson and coastal MS active' },
    { rank:2, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Gulf Coast MS; Biloxi and Gulfport active' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Limited MS presence; Jackson metro' },
    { rank:4, company:'Ard Builders', pub:'Private', hq:'Madison, MS', website:'', phone:'(601) 856-4663', contacts:["President", "VP Development", "Land Manager"], notes:'MS-focused; Madison and Rankin County lots' },
    { rank:5, company:'Southern Lifestyle Development', pub:'Private', hq:'Baton Rouge, LA', website:'southernlifestyledevelopment.com', phone:'(225) 767-0880', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'LA/MS operator; Gulf Coast and Jackson area lots' },
  ],
  'Missouri': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Kansas City and St. Louis metros active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'KC and St. Louis active land buyer' },
    { rank:3, company:'Fischer Homes', pub:'Private', hq:'Erlanger, KY', website:'fischerhomes.com', phone:'(859) 282-0950', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'St. Louis and KC active' },
    { rank:4, company:'McBride &amp; Son Homes', pub:'Private', hq:'Chesterfield, MO', website:'mcbrideandsons.com', phone:'(636) 536-1500', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'MO-focused; St. Louis metro dominant; active lot buyer' },
    { rank:5, company:'New Mark Homes', pub:'Private', hq:'Kansas City, MO', website:'', phone:'(816) 453-0400', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'KC focused; suburban and entry-level lots' },
    { rank:6, company:'Consort Homes', pub:'Private', hq:'Kansas City, MO', website:'', phone:'(913) 681-9630', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'KC metro; active suburban lot buyer' },
    { rank:7, company:'Payne Family Homes', pub:'Private', hq:'Chesterfield, MO', website:'paynefamilyhomes.com', phone:'(636) 536-8400', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'St. Louis suburb focus; active lot buyer' },
    { rank:8, company:'Summit Custom Homes', pub:'Private', hq:'Overland Park, KS', website:'', phone:'(913) 897-7777', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'KC market; luxury and custom lots' },
    { rank:9, company:'Whittaker Homes', pub:'Private', hq:'Kansas City, MO', website:'', phone:'(816) 781-4300', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'KC metro; entry-level and move-up lots' },
    { rank:10, company:'Bridgewater Communities', pub:'Private', hq:'St. Louis, MO', website:'', phone:'(314) 579-9000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'St. Louis master-planned and suburban developer' },
  ],
  'Montana': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Billings and Bozeman active; fast-growing MT markets' },
    { rank:2, company:'Legends Homes', pub:'Private', hq:'Bozeman, MT', website:'', phone:'(406) 586-3030', contacts:["President", "VP Development", "Land Manager"], notes:'Bozeman-focused; fast-growing market; active lot buyer' },
    { rank:3, company:'Mosaic Homes', pub:'Private', hq:'Missoula, MT', website:'', phone:'(406) 543-4600', contacts:["Owner", "VP Development", "Land Manager"], notes:'Missoula market; residential lot buyer' },
    { rank:4, company:'Big Sky Development', pub:'Private', hq:'Bozeman, MT', website:'', phone:'(406) 587-4891', contacts:["Principal", "Director of Development", "Land Manager"], notes:'Bozeman and Big Sky area land developer' },
    { rank:5, company:'Sletten Construction', pub:'Private', hq:'Great Falls, MT', website:'sletten.com', phone:'(406) 761-7920', contacts:["VP Development", "Director of Construction", "Project Manager"], notes:'MT-based commercial and residential developer' },
  ],
  'Nebraska': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Omaha metro active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Omaha market active' },
    { rank:3, company:'Broadmoor Development', pub:'Private', hq:'Omaha, NE', website:'', phone:'(402) 333-6900', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'NE-focused; Omaha metro lots and development' },
    { rank:4, company:'Richland Homes', pub:'Private', hq:'Omaha, NE', website:'', phone:'(402) 431-7766', contacts:["President", "VP Development", "Land Manager"], notes:'Omaha metro; entry-level and move-up lots' },
    { rank:5, company:'NP Dodge Real Estate', pub:'Private', hq:'Omaha, NE', website:'npdodge.com', phone:'(402) 255-1500', contacts:["VP Development", "Director of Land", "Land Manager"], notes:'Omaha-based; residential land and development arm' },
  ],
  'Nevada': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Las Vegas dominant; Reno secondary market' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Las Vegas and Reno active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Las Vegas; Del Webb Sun City very active in NV' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Las Vegas active; master-planned lots' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Las Vegas and Reno active' },
    { rank:6, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Las Vegas luxury lots; Summerlin and Henderson' },
    { rank:7, company:'KB Home', pub:'Public', hq:'Los Angeles, CA', website:'kbhome.com', phone:'(310) 231-4000', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'Las Vegas active; first-time buyer lots' },
    { rank:8, company:'Beazer Homes', pub:'Public', hq:'Atlanta, GA', website:'beazer.com', phone:'(770) 829-3700', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'Las Vegas entry-level and mid lots' },
    { rank:9, company:'Tri Pointe Homes', pub:'Public', hq:'Incline Village, NV', website:'tripointehomes.com', phone:'(775) 826-1400', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'HQ in NV; Las Vegas premium lots; Pardee brand' },
    { rank:10, company:'William Lyon (Taylor Morrison)', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Absorbed William Lyon NV operations; Las Vegas and Reno' },
  ],
  'New Hampshire': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Southern NH and Manchester area active' },
    { rank:2, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Southern NH luxury lots; Nashua and Manchester suburbs' },
    { rank:3, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'NH presence; option-lot model' },
    { rank:4, company:'Chinburg Properties', pub:'Private', hq:'Newmarket, NH', website:'chinburg.com', phone:'(603) 659-1766', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'NH-based; Seacoast and southern NH lots' },
    { rank:5, company:'Brookstone Builders', pub:'Private', hq:'Manchester, NH', website:'', phone:'(603) 314-1001', contacts:["President", "VP Development", "Land Manager"], notes:'NH-focused; Manchester and Concord area lots' },
  ],
  'New Jersey': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Central and South NJ active' },
    { rank:2, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'NJ luxury buyer; Bergen, Morris, Monmouth Counties' },
    { rank:3, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'HQ in NJ; most active NJ land buyer across segments' },
    { rank:4, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'NJ presence; option-lot model' },
    { rank:5, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Central and South NJ markets' },
    { rank:6, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'NJ active; Del Webb 55+ community lots' },
    { rank:7, company:'Sharbell Development', pub:'Private', hq:'Robbinsville, NJ', website:'sharbell.com', phone:'(609) 448-7770', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'NJ-focused; Central NJ lots and communities' },
    { rank:8, company:'Woodmont Properties', pub:'Private', hq:'Parsippany, NJ', website:'woodmont.com', phone:'(973) 394-1000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'NJ-based developer; multi-family and residential lots' },
    { rank:9, company:'Ingerman Group', pub:'Private', hq:'Collingswood, NJ', website:'ingerman.com', phone:'(856) 858-8500', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'South NJ focus; affordable and market-rate lots' },
    { rank:10, company:'Hovbros Building', pub:'Private', hq:'Matawan, NJ', website:'', phone:'(732) 583-1200', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'NJ-focused; Central and Monmouth County lots' },
  ],
  'New Mexico': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Albuquerque dominant; Santa Fe secondary' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Albuquerque active land buyer' },
    { rank:3, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Albuquerque active' },
    { rank:4, company:'Sivage Homes', pub:'Private', hq:'Albuquerque, NM', website:'sivagehomes.com', phone:'(505) 823-2100', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'NM-focused; Albuquerque metro dominant local builder' },
    { rank:5, company:'Twilight Homes', pub:'Private', hq:'Albuquerque, NM', website:'', phone:'(505) 839-9600', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'NM-focused; Albuquerque suburban lots' },
  ],
  'New York': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Long Island, Hudson Valley, suburban NY active' },
    { rank:2, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Westchester, Long Island, Hudson Valley luxury lots' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Long Island and suburban NY active' },
    { rank:4, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'Upstate NY and suburban NY active' },
    { rank:5, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Long Island and suburban NY active' },
    { rank:6, company:'Beechwood Organization', pub:'Private', hq:'Old Westbury, NY', website:'beechwoodorganization.com', phone:'(516) 626-7600', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'LI-based; Long Island\'s largest private builder' },
    { rank:7, company:'Robertson Anschutz Schleier', pub:'Private', hq:'New York, NY', website:'', phone:'(212) 867-2000', contacts:["VP Acquisitions", "Director of Development", "Land Manager"], notes:'NYC metro land acquisitions; urban sites' },
    { rank:8, company:'BRT Realty Trust', pub:'Public', hq:'Great Neck, NY', website:'brtrealty.com', phone:'(516) 466-3100', contacts:["VP Acquisitions", "Director of Land", "Land Manager"], notes:'NY-based; multi-family land development' },
    { rank:9, company:'Fairfield Properties', pub:'Private', hq:'Melville, NY', website:'', phone:'(631) 694-7000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'Long Island builder and developer; active lot buyer' },
    { rank:10, company:'Rochester Communities', pub:'Private', hq:'Rochester, NY', website:'', phone:'(585) 334-2444', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Upstate NY; Rochester and Buffalo metro lots' },
  ],
  'North Carolina': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Charlotte, Raleigh, Greensboro, Wilmington active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Charlotte and Raleigh metro active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Charlotte and Raleigh; Del Webb active in NC' },
    { rank:4, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Charlotte and Raleigh luxury lots' },
    { rank:5, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Entry-level; Charlotte, Raleigh, Triad active' },
    { rank:6, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Charlotte and Raleigh active; growing NC presence' },
    { rank:7, company:'Dream Finders Homes', pub:'Public', hq:'Jacksonville, FL', website:'dreamfindershomes.com', phone:'(904) 337-7858', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Charlotte and Raleigh active' },
    { rank:8, company:'Eastwood Homes', pub:'Private', hq:'Charlotte, NC', website:'eastwoodhomes.com', phone:'(704) 321-1789', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'HQ in NC; Charlotte and Triad dominant local builder' },
    { rank:9, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Charlotte and Raleigh active; SE expansion' },
    { rank:10, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Charlotte and Raleigh lots; expanding NC presence' },
  ],
  'North Dakota': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Fargo and Bismarck active' },
    { rank:2, company:'Kilbourne Group', pub:'Private', hq:'Fargo, ND', website:'kilbournegroup.com', phone:'(701) 232-5500', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'ND-based developer; downtown Fargo and suburban lots' },
    { rank:3, company:'Lloyd Companies', pub:'Private', hq:'Sioux Falls, SD', website:'lloydcompanies.com', phone:'(605) 977-4000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'Regional developer; ND and SD markets' },
    { rank:4, company:'T&amp;R Contracting', pub:'Private', hq:'Bismarck, ND', website:'trcontracting.net', phone:'(701) 255-4350', contacts:["President", "VP Development", "Land Manager"], notes:'ND-based; Bismarck and Mandan area lots' },
    { rank:5, company:'Enclave Companies', pub:'Private', hq:'Fargo, ND', website:'', phone:'(701) 478-7246', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'Fargo metro; residential and mixed-use lots' },
  ],
  'Ohio': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Columbus, Cincinnati, Cleveland, Dayton active' },
    { rank:2, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Columbus and Cincinnati active; Del Webb OH active' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Columbus and Cincinnati metro active' },
    { rank:4, company:'Fischer Homes', pub:'Private', hq:'Erlanger, KY', website:'fischerhomes.com', phone:'(859) 282-0950', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'Cincinnati and Dayton markets; KY-based operator' },
    { rank:5, company:'M/I Homes', pub:'Public', hq:'Columbus, OH', website:'mihomes.com', phone:'(614) 418-8000', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in OH; Columbus dominant; active statewide' },
    { rank:6, company:'Drees Homes', pub:'Private', hq:'Fort Mitchell, KY', website:'dreeshomes.com', phone:'(859) 578-4200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Cincinnati/NKY primary; Dayton secondary' },
    { rank:7, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Columbus and Cleveland active' },
    { rank:8, company:'Maronda Homes', pub:'Private', hq:'Cincinnati, OH', website:'marondahomes.com', phone:'(513) 422-9430', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OH-based; Columbus, Cincinnati, Pittsburgh footprint' },
    { rank:9, company:'Epcon Communities', pub:'Private', hq:'Dublin, OH', website:'epconfranchising.com', phone:'(614) 766-3000', contacts:["Director of Land", "Land Development Manager", "VP of Development"], notes:'HQ in OH; 55+ franchise model; active OH lot buyer' },
    { rank:10, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Expanding OH presence; Columbus and Cincinnati' },
  ],
  'Oklahoma': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Oklahoma City and Tulsa active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'OKC metro active land buyer' },
    { rank:3, company:'Homes by Taber', pub:'Private', hq:'Oklahoma City, OK', website:'homesbytaber.com', phone:'(405) 721-1600', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OK-focused; OKC metro dominant local builder; active lot buyer' },
    { rank:4, company:'Mashburn Homes', pub:'Private', hq:'Oklahoma City, OK', website:'', phone:'(405) 722-5000', contacts:["President", "VP Development", "Land Manager"], notes:'OKC-based; move-up and custom lots' },
    { rank:5, company:'Landmark Fine Homes', pub:'Private', hq:'Tulsa, OK', website:'landmarkfinehomes.com', phone:'(918) 461-2100', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Tulsa-focused; luxury and move-up lots' },
  ],
  'Oregon': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Portland metro and Bend active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Portland metro active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Portland suburbs active' },
    { rank:4, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Portland luxury lots; Lake Oswego and West Hills' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Portland metro active' },
    { rank:6, company:'Hayden Homes', pub:'Private', hq:'Redmond, OR', website:'haydenhomes.com', phone:'(541) 923-6607', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OR-based; Central OR and Willamette Valley active lot buyer' },
    { rank:7, company:'Pacific Lifestyle Homes', pub:'Private', hq:'Vancouver, WA', website:'pacificlifestylehomes.com', phone:'(360) 823-2250', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OR/WA border builder; Portland metro and SW WA' },
    { rank:8, company:'Pahlisch Homes', pub:'Private', hq:'Bend, OR', website:'pahlischhomes.com', phone:'(541) 389-0900', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'OR-focused; Bend, Redmond, Willamette Valley lots' },
    { rank:9, company:'Polygon Northwest', pub:'Private', hq:'Redmond, WA', website:'polygonnw.com', phone:'(425) 896-1410', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'OR/WA builder; Portland metro lots' },
    { rank:10, company:'William Lyon/Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Portland metro via Taylor Morrison absorption' },
  ],
  'Pennsylvania': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Philadelphia suburbs and Pittsburgh active' },
    { rank:2, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'PA is one of NVR\'s top markets; Philadelphia and Pittsburgh' },
    { rank:3, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'HQ in PA; Philadelphia suburb luxury dominant' },
    { rank:4, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Philadelphia metro and Pittsburgh active' },
    { rank:5, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Philadelphia suburbs and eastern PA active' },
    { rank:6, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Philadelphia suburbs; Del Webb PA active' },
    { rank:7, company:'Landmark Homes', pub:'Private', hq:'Lititz, PA', website:'landmarkhomes.net', phone:'(717) 626-8002', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'PA-focused; Lancaster and Harrisburg area dominant' },
    { rank:8, company:'Keystone Custom Homes', pub:'Private', hq:'Lancaster, PA', website:'keystonecustomhomes.com', phone:'(717) 687-8100', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'PA-focused; Lancaster, York, Chester County lots' },
    { rank:9, company:'Berks Homes', pub:'Private', hq:'Wyomissing, PA', website:'berkshomes.com', phone:'(610) 374-1988', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Berks County and surrounding PA markets' },
    { rank:10, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Pittsburgh and western PA active' },
  ],
  'Rhode Island': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Providence area active' },
    { rank:2, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'RI luxury lots; Newport and Providence suburbs' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Providence metro active' },
    { rank:4, company:'Stonebridge Homes', pub:'Private', hq:'Providence, RI', website:'', phone:'(401) 421-7000', contacts:["President", "VP Development", "Land Manager"], notes:'RI-focused; Providence metro lots' },
    { rank:5, company:'Cornish Associates', pub:'Private', hq:'Providence, RI', website:'cornishassociates.com', phone:'(401) 273-1331', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'RI-based developer; Providence urban and suburban' },
  ],
  'South Carolina': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Charleston, Myrtle Beach, Greenville, Columbia active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Charleston and Myrtle Beach active' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Charleston and Myrtle Beach; Del Webb SC active' },
    { rank:4, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Entry-level; Charleston and Columbia active' },
    { rank:5, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Charleston expansion; SE growth strategy' },
    { rank:6, company:'Eastwood Homes', pub:'Private', hq:'Charlotte, NC', website:'eastwoodhomes.com', phone:'(704) 321-1789', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'SC expansion; Greenville and Charlotte market lots' },
    { rank:7, company:'Dream Finders Homes', pub:'Public', hq:'Jacksonville, FL', website:'dreamfindershomes.com', phone:'(904) 337-7858', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Charleston and Myrtle Beach active' },
    { rank:8, company:'Mungo Homes', pub:'Private', hq:'Irmo, SC', website:'mungohomes.com', phone:'(803) 781-9000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'SC-based; Columbia, Myrtle Beach, Greenville dominant' },
    { rank:9, company:'Centex/PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Centex brand in SC; Myrtle Beach and coastal lots' },
    { rank:10, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Expanding SC; Charleston and Greenville markets' },
  ],
  'South Dakota': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Sioux Falls active; limited SD national presence' },
    { rank:2, company:'Lloyd Companies', pub:'Private', hq:'Sioux Falls, SD', website:'lloydcompanies.com', phone:'(605) 977-4000', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'SD-based dominant developer; Sioux Falls land and lots' },
    { rank:3, company:'Journey Homes', pub:'Private', hq:'Sioux Falls, SD', website:'', phone:'(605) 271-0080', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Sioux Falls builder and lot buyer' },
    { rank:4, company:'Van Buskirk Companies', pub:'Private', hq:'Sioux Falls, SD', website:'', phone:'(605) 334-2371', contacts:["VP Development", "Director of Land", "Land Manager"], notes:'SD-based; Sioux Falls residential developer' },
    { rank:5, company:'Foundation Homes', pub:'Private', hq:'Rapid City, SD', website:'', phone:'(605) 348-0111', contacts:["President", "VP Development", "Land Manager"], notes:'Western SD; Rapid City residential lots' },
  ],
  'Tennessee': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Nashville, Knoxville, Chattanooga, Memphis active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Nashville metro active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Nashville suburbs; Del Webb TN active' },
    { rank:4, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Nashville and Chattanooga active; entry-level lots' },
    { rank:5, company:'Fischer Homes', pub:'Private', hq:'Erlanger, KY', website:'fischerhomes.com', phone:'(859) 282-0950', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'Nashville and Knoxville expansion' },
    { rank:6, company:'Empire Communities', pub:'Private', hq:'Atlanta, GA', website:'empirecommunities.com', phone:'(404) 301-3560', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Nashville active; SE strategy market' },
    { rank:7, company:'Goodall Homes', pub:'Private', hq:'Gallatin, TN', website:'goodallhomes.com', phone:'(615) 206-0010', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'TN-focused; Nashville suburbs dominant; active lot buyer' },
    { rank:8, company:'Adams Homes', pub:'Private', hq:'Pensacola, FL', website:'adamshomes.com', phone:'(850) 484-8200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Memphis and West TN active' },
    { rank:9, company:'Old South Construction', pub:'Private', hq:'Nashville, TN', website:'', phone:'(615) 591-6600', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'Nashville-based; suburban and infill lots' },
    { rank:10, company:'Dream Finders Homes', pub:'Public', hq:'Jacksonville, FL', website:'dreamfindershomes.com', phone:'(904) 337-7858', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Nashville expansion; active TN lot buyer' },
  ],
  'Texas': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'HQ in TX; DFW, Houston, Austin, San Antonio dominant' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'DFW, Houston, Austin, San Antonio active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'DFW and Houston; Del Webb TX very active' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Houston, Austin, DFW master-planned lots' },
    { rank:5, company:'Meritage Homes', pub:'Public', hq:'Scottsdale, AZ', website:'meritagehomes.com', phone:'(480) 515-8100', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'DFW, Houston, Austin active; energy-efficient focus' },
    { rank:6, company:'KB Home', pub:'Public', hq:'Los Angeles, CA', website:'kbhome.com', phone:'(310) 231-4000', contacts:["VP Land", "Director of Land Acquisitions", "Land Manager"], notes:'DFW, Houston, Austin, San Antonio active' },
    { rank:7, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'DFW and Houston active; entry-level lots' },
    { rank:8, company:'LGI Homes', pub:'Public', hq:'The Woodlands, TX', website:'lgihomes.com', phone:'(281) 362-8998', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'HQ in TX; Houston, DFW, San Antonio high-volume lot buyer' },
    { rank:9, company:'David Weekley Homes', pub:'Private', hq:'Houston, TX', website:'davidweekleyhomes.com', phone:'(713) 963-0500', contacts:["Land Acquisition Manager", "VP Land", "Director of Real Estate"], notes:'HQ in TX; Houston, Austin, DFW active lot buyer' },
    { rank:10, company:'Coventry Homes', pub:'Private', hq:'Houston, TX', website:'coventryhomes.com', phone:'(713) 783-3710', contacts:["Director of Land", "VP Land", "Land Acquisition Manager"], notes:'Houston and Austin focus; active TX lot buyer' },
  ],
  'Utah': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Salt Lake and Utah County active; fast-growing market' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Wasatch Front active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'SL County and Utah County active' },
    { rank:4, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Wasatch Front lots; master-planned focus' },
    { rank:5, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Utah Valley and Davis County active' },
    { rank:6, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury UT lots; Park City and SL County' },
    { rank:7, company:'Richmond American Homes', pub:'Private', hq:'Denver, CO', website:'richmondamerican.com', phone:'(303) 773-1200', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Wasatch Front active; UT expansion from CO base' },
    { rank:8, company:'Ivory Homes', pub:'Private', hq:'Salt Lake City, UT', website:'ivoryhomes.com', phone:'(801) 747-7000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'UT-based; SL and Utah County dominant local builder' },
    { rank:9, company:'Perry Homes', pub:'Private', hq:'Draper, UT', website:'', phone:'(801) 969-2000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'UT-focused; Wasatch Front lots; active buyer' },
    { rank:10, company:'Edge Homes', pub:'Private', hq:'American Fork, UT', website:'edgehomes.com', phone:'(801) 796-0087', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'UT-focused; Utah County and surrounding areas' },
  ],
  'Vermont': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Very limited VT presence; Burlington area' },
    { rank:2, company:'Bread Loaf Corporation', pub:'Private', hq:'Middlebury, VT', website:'breadloafcorp.com', phone:'(802) 388-9871', contacts:["VP Development", "Director of Construction", "Project Manager"], notes:'VT-based; Burlington and central VT developer' },
    { rank:3, company:'Snyder Homes', pub:'Private', hq:'Burlington, VT', website:'', phone:'(802) 658-4588', contacts:["Owner", "VP Development", "Land Manager"], notes:'VT-focused; Chittenden County residential lots' },
    { rank:4, company:'Donahue &amp; Assoc.', pub:'Private', hq:'South Burlington, VT', website:'', phone:'(802) 864-7000', contacts:["President", "VP Development", "Land Manager"], notes:'Burlington metro; residential land buyer' },
    { rank:5, company:'Wagner Homes', pub:'Private', hq:'Essex Junction, VT', website:'', phone:'(802) 878-5141', contacts:["Owner", "Project Manager", "Land Manager"], notes:'VT-focused; Chittenden County lots' },
  ],
  'Virginia': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Northern VA, Hampton Roads, Richmond active' },
    { rank:2, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'HQ in VA; DC metro and Richmond dominant' },
    { rank:3, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Northern VA and Richmond active land buyer' },
    { rank:4, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Luxury Northern VA and Richmond lots' },
    { rank:5, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Northern VA and Hampton Roads; Del Webb active' },
    { rank:6, company:'Stanley Martin Homes', pub:'Private', hq:'Reston, VA', website:'stanleymartin.com', phone:'(703) 821-2600', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'HQ in VA; DC metro and Richmond dominant local builder' },
    { rank:7, company:'EYA', pub:'Private', hq:'Bethesda, MD', website:'eya.com', phone:'(301) 215-9400', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'Northern VA urban and transit-oriented lots' },
    { rank:8, company:'Smith Douglas Homes', pub:'Public', hq:'Woodstock, GA', website:'smithdouglas.com', phone:'(770) 627-2323', contacts:["VP of Land", "Director of Land", "Land Acquisition Manager"], notes:'Richmond and Hampton Roads active' },
    { rank:9, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'VA expansion; Richmond and Hampton Roads active' },
    { rank:10, company:'K. Hovnanian Homes', pub:'Private', hq:'Matawan, NJ', website:'khov.com', phone:'(732) 747-7800', contacts:["VP Land", "Director of Land Acquisition", "Land Manager"], notes:'Northern VA and Richmond active' },
  ],
  'Washington': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Seattle metro and Spokane active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Seattle metro and eastern WA active' },
    { rank:3, company:'Toll Brothers', pub:'Public', hq:'Fort Washington, PA', website:'tollbrothers.com', phone:'(215) 938-8000', contacts:["VP Land Acquisition", "Director of Land", "Land Division President"], notes:'Seattle luxury lots; Eastside and South Sound' },
    { rank:4, company:'Century Communities', pub:'Public', hq:'Greenwood Village, CO', website:'centurycommunities.com', phone:'(303) 793-4999', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Seattle metro suburbs active' },
    { rank:5, company:'Tri Pointe Homes', pub:'Public', hq:'Incline Village, NV', website:'tripointehomes.com', phone:'(775) 826-1400', contacts:["VP Land", "Land Acquisition Director", "Land Manager"], notes:'Seattle metro active; premium lots' },
    { rank:6, company:'Taylor Morrison', pub:'Public', hq:'Scottsdale, AZ', website:'taylormorrison.com', phone:'(480) 840-8100', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'Seattle and Puget Sound suburban lots' },
    { rank:7, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Puget Sound active; Del Webb WA active' },
    { rank:8, company:'Polygon Northwest', pub:'Private', hq:'Redmond, WA', website:'polygonnw.com', phone:'(425) 896-1410', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'WA-based; Seattle metro and Puget Sound specialist' },
    { rank:9, company:'MainVue Homes', pub:'Private', hq:'Sammamish, WA', website:'mainvuehomes.com', phone:'(425) 654-9700', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'WA-focused; King and Pierce County premium lots' },
    { rank:10, company:'Pacific Lifestyle Homes', pub:'Private', hq:'Vancouver, WA', website:'pacificlifestylehomes.com', phone:'(360) 823-2250', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'SW WA and Portland OR border market active' },
  ],
  'West Virginia': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Charleston and Morgantown active' },
    { rank:2, company:'NVR/Ryan Homes', pub:'Public', hq:'Reston, VA', website:'nvrinc.com', phone:'(703) 956-4000', contacts:["Land Acquisition Manager", "Director of Real Estate", "VP of Real Estate"], notes:'WV presence; northern panhandle and Morgantown' },
    { rank:3, company:'Dan Ryan Builders', pub:'Private', hq:'Gaithersburg, MD', website:'danryanbuilders.com', phone:'(301) 990-7970', contacts:["VP Land", "Director of Land", "Land Acquisition Manager"], notes:'WV active; Charleston and Huntington area lots' },
    { rank:4, company:'Heartland Homes', pub:'Private', hq:'Wexford, PA', website:'heartlandhomespa.com', phone:'(724) 935-1150', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'PA/WV operator; northern WV lots' },
    { rank:5, company:'Edgewood Homes', pub:'Private', hq:'Charleston, WV', website:'', phone:'(304) 925-3600', contacts:["President", "VP Development", "Land Manager"], notes:'WV-focused; Kanawha Valley lots' },
  ],
  'Wisconsin': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Milwaukee and Madison metro active' },
    { rank:2, company:'Lennar', pub:'Public', hq:'Miami, FL', website:'lennar.com', phone:'(305) 559-4000', contacts:["VP Acquisitions", "Land Acquisition Director", "Regional Land Manager"], notes:'Milwaukee metro active land buyer' },
    { rank:3, company:'PulteGroup', pub:'Public', hq:'Atlanta, GA', website:'pultegroup.com', phone:'(404) 978-6400', contacts:["VP Land", "Director of Land Acquisition", "Land Acquisition Manager"], notes:'Milwaukee suburbs; Del Webb WI active' },
    { rank:4, company:'Veridian Homes', pub:'Private', hq:'Madison, WI', website:'veridianhomes.com', phone:'(608) 827-9941', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'WI-focused; Madison dominant; active lot buyer' },
    { rank:5, company:'Tim O\'Brien Homes', pub:'Private', hq:'Pewaukee, WI', website:'timobrienhomes.com', phone:'(262) 695-9500', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'Milwaukee suburbs; entry-level and move-up lots' },
    { rank:6, company:'Neumann Companies', pub:'Private', hq:'Waukesha, WI', website:'neumannco.com', phone:'(262) 542-7000', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'SE WI; Milwaukee suburbs active lot buyer' },
    { rank:7, company:'Stepping Stone Homes', pub:'Private', hq:'Germantown, WI', website:'', phone:'(262) 309-0565', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'SE WI focus; suburban Milwaukee lots' },
    { rank:8, company:'Bielinski Homes', pub:'Private', hq:'Menomonee Falls, WI', website:'bielinskihomes.com', phone:'(262) 783-9000', contacts:["VP Land", "Director of Land", "Land Manager"], notes:'WI-focused; Milwaukee and Fox Valley area lots' },
    { rank:9, company:'Dermond Construction', pub:'Private', hq:'Stevens Point, WI', website:'', phone:'(715) 341-9800', contacts:["President", "VP Development", "Land Manager"], notes:'Central WI; Stevens Point and Wausau area lots' },
    { rank:10, company:'Briohn Building Corp', pub:'Private', hq:'Brookfield, WI', website:'briohn.com', phone:'(262) 797-9400', contacts:["VP Development", "Director of Acquisitions", "Land Manager"], notes:'SE WI; commercial and residential developer' },
  ],
  'Wyoming': [
    { rank:1, company:'D.R. Horton', pub:'Public', hq:'Fort Worth, TX', website:'drhorton.com', phone:'(817) 390-8200', contacts:["VP Land Acquisition", "Director of Land", "Land Acquisition Manager"], notes:'Cheyenne and Casper active; limited WY national presence' },
    { rank:2, company:'Knobel Construction', pub:'Private', hq:'Cheyenne, WY', website:'', phone:'(307) 637-8200', contacts:["President", "VP Development", "Land Manager"], notes:'WY-based; Cheyenne residential lots' },
    { rank:3, company:'Baessler Homes', pub:'Private', hq:'Cheyenne, WY', website:'baesslerhomes.com', phone:'(307) 630-9600', contacts:["VP Land", "Director of Development", "Land Manager"], notes:'WY-focused; Cheyenne and Laramie area lots' },
    { rank:4, company:'Ridgeline Development', pub:'Private', hq:'Jackson, WY', website:'', phone:'(307) 733-3900', contacts:["Principal", "VP Development", "Land Manager"], notes:'WY luxury; Jackson Hole and Teton County lots' },
    { rank:5, company:'Five Star Construction', pub:'Private', hq:'Casper, WY', website:'', phone:'(307) 472-4777', contacts:["President", "Project Manager", "Land Manager"], notes:'Central WY; Casper residential builder and lot buyer' },
  ],
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BuyerDirectoryPage() {
  const { tier, isAdmin, isAtLeast, loading: permLoading } = useUserTier();
  const router = useRouter();

  const canViewContact = !permLoading && (isAtLeast('priority') || !!isAdmin);
  const isFreeUser = !permLoading && !tier && !isAdmin;

  // ── Navigation state ──
  const [view, setView] = useState<DirectoryView>('grid');

  // ── Global search ──
  const [globalSearch, setGlobalSearch] = useState('');

  // ── Upgrade modal ──
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // ── National buyers ──

  // ── By-state buyers ──
  const [selectedState, setSelectedState] = useState('');


  // ── Active buyers ──
  const [activeBuyers, setActiveBuyers] = useState<BuyerRequest[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeStateFilter, setActiveStateFilter] = useState('');
  const [activeUseCaseFilter, setActiveUseCaseFilter] = useState('');
  const [activeRoadAccess, setActiveRoadAccess] = useState('');

  const [buyerRequests, setBuyerRequests] = useState<BuyerRequest[]>([]);
  const [brLoading, setBrLoading] = useState(false);
  const [brSearch, setBrSearch] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterAcreage, setFilterAcreage] = useState('');
  const [filterZoning, setFilterZoning] = useState('');
  const [filterUseCase, setFilterUseCase] = useState('');
  const [filterTimeline, setFilterTimeline] = useState('');
  const [filterRoadAccessBR, setFilterRoadAccessBR] = useState('');

  // ── Data fetching ──



  useEffect(() => {
    if (view !== 'active') return;
    setActiveLoading(true);
    fetch(`/api/buyer-directory?status=active&timeline=${encodeURIComponent('Actively Buying (0–30 days)')}`)
      .then(r => r.json())
      .then(({ requests }) => { setActiveBuyers((requests ?? []) as BuyerRequest[]); setActiveLoading(false); })
      .catch(() => setActiveLoading(false));
  }, [view]);


  // ── Filtered lists ──


  const filteredActive = useMemo(() => {
    const q = globalSearch.toLowerCase();
    return activeBuyers.filter(r => {
      const name = getBuyerName(r).toLowerCase();
      const co = (r.profiles?.company_name ?? '').toLowerCase();
      const state = (r.target_state ?? '').toLowerCase();
      const uc = (r.use_case ?? '').toLowerCase();
      const matchSearch = !q || name.includes(q) || co.includes(q) || state.includes(q) || uc.includes(q);
      const matchState = !activeStateFilter || state === activeStateFilter.toLowerCase();
      const matchUC = !activeUseCaseFilter || uc.includes(activeUseCaseFilter.toLowerCase());
      const roads = ((r as unknown as Record<string, unknown>).road_access ?? []) as string[];
      const matchRoad = !activeRoadAccess || roads.some(rd => rd.toLowerCase().includes(activeRoadAccess.toLowerCase()));
      return matchSearch && matchState && matchUC && matchRoad;
    });
  }, [activeBuyers, globalSearch, activeStateFilter, activeUseCaseFilter, activeRoadAccess]);


  // ── Helpers ──

  function openView(v: DirectoryView) {
    setGlobalSearch('');
    setView(v);
  }

  function backToGrid() {
    setView('grid');
    setGlobalSearch('');
  }

  const searchPlaceholder = view === 'active' ? 'Filter active buyers by name, company, or state...' : 'Search buyers by name, company, state, or use case...';

  const handleSearchChange = (val: string) => {
    setGlobalSearch(val);
    setGlobalSearch(val);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Header />

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-secondary hover:text-on-surface">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>crown</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary mb-2">Upgrade to Contact Buyers</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              Direct buyer contact requires a Priority or Exclusive plan. Upgrade to see full contact details and message buyers directly.
            </p>
            <div className="flex gap-3">
              <Link href="/pricing" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/90 transition-colors">
                View Plans →
              </Link>
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 border border-surface-container-high text-secondary py-3 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="font-headline text-4xl font-extrabold text-primary tracking-tight mb-1">Buyer Directory</h1>
            <p className="text-secondary text-sm">Connect with verified land buyers actively seeking properties across the US.</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-5">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl pointer-events-none">search</span>
            <input
              type="text"
              value={globalSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white border border-outline-variant/25 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-on-surface placeholder:text-secondary shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>

              {/* Grid view — 3 category cards */}
              {view === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Top National Builders */}
                  <button
                    onClick={() => openView('national')}
                    className="group text-left bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 hover:shadow-lg hover:border-primary/25 transition-all"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
                    </div>
                    <h3 className="font-headline text-lg font-extrabold text-primary mb-1">Top National Builders</h3>
                    <p className="text-secondary text-sm leading-relaxed">Top 50 homebuilders and land developers actively acquiring land across the US.</p>
                    <div className="mt-4 flex items-center gap-1 text-primary text-sm font-bold">
                      View builders <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </div>
                  </button>

                  {/* Card 2: Top Buyers by State */}
                  <button
                    onClick={() => openView('by-state')}
                    className="group text-left bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 hover:shadow-lg hover:border-primary/25 transition-all"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                    </div>
                    <h3 className="font-headline text-lg font-extrabold text-primary mb-1">Top Buyers by State</h3>
                    <p className="text-secondary text-sm leading-relaxed">Find the most active land buyers in any state. Filter by location and use case.</p>
                    <div className="mt-4 flex items-center gap-1 text-primary text-sm font-bold">
                      Browse by state <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </div>
                  </button>

                  {/* Card 3: Active Buyers */}
                  <button
                    onClick={() => openView('active')}
                    className="group text-left bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-6 hover:shadow-lg hover:border-primary/25 transition-all"
                  >
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 transition-colors">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                    <h3 className="font-headline text-lg font-extrabold text-primary mb-1">Active Buyers</h3>
                    <p className="text-secondary text-sm leading-relaxed">Buyers with a purchase timeline under 30 days — sorted by most recently posted.</p>
                    <div className="mt-4 flex items-center gap-1 text-emerald-600 text-sm font-bold">
                      View active <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </div>
                  </button>
                </div>
              )}

              {/* National buyers view */}
              {view === 'national' && (
                <div>
                  <ViewHeader
                    title="Top National Builders"
                    subtitle="Top 50 US homebuilders and land developers actively acquiring land nationwide"
                    count={TOP_BUILDERS.length}
                    onBack={backToGrid}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TOP_BUILDERS.map(b => (
                      <BuilderCard key={b.rank} b={b} />
                    ))}
                  </div>
                </div>
              )}

                            {/* By-state view */}
              {view === 'by-state' && (
                <div>
                  <ViewHeader
                    title="Top Builders by State"
                    subtitle="Top land-buying homebuilders and developers in each state"
                    count={selectedState ? (STATE_BUILDERS[selectedState]?.length ?? 0) : undefined}
                    onBack={backToGrid}
                  />

                  {/* State selector */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {US_STATES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedState(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border ${
                          selectedState === s
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface-container-lowest border-outline-variant/20 text-secondary hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {selectedState && STATE_BUILDERS[selectedState] ? (
                    <>
                      <p className="text-sm text-secondary mb-6">
                        Showing top <strong className="text-on-surface">{STATE_BUILDERS[selectedState].length}</strong> builders in <strong className="text-on-surface">{selectedState}</strong>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STATE_BUILDERS[selectedState].map(b => (
                          <div key={b.rank} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-black text-secondary/50 uppercase tracking-widest">#{b.rank}</span>
                                <h3 className="font-headline text-base font-extrabold text-primary leading-tight mt-0.5">{b.company}</h3>
                                <p className="text-xs text-secondary mt-0.5">{b.hq}</p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${b.pub === 'Public' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>{b.pub}</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              {b.website && (
                                <a href={`https://${b.website}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-primary hover:underline font-semibold">
                                  <span className="material-symbols-outlined text-sm">language</span>{b.website}
                                </a>
                              )}
                              {b.phone && (
                                <div className="flex items-center gap-1.5 text-on-surface-variant">
                                  <span className="material-symbols-outlined text-sm">call</span>{b.phone}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {b.contacts.map((c, i) => (
                                <span key={i} className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-secondary font-semibold border border-outline-variant/20">{c}</span>
                              ))}
                            </div>
                            <p className="text-[11px] text-secondary leading-relaxed border-t border-outline-variant/15 pt-2">{b.notes}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">map</span>
                      <p className="font-semibold">Select a state to see top builders</p>
                    </div>
                  )}
                </div>
              )}

{/* Active buyers view */}
              {view === 'active' && (
                <div>
                  <ViewHeader
                    title="Active Buyers"
                    subtitle='Buyers with a purchase timeline under 30 days — sorted by most recently posted'
                    count={filteredActive.length}
                    onBack={backToGrid}
                  />

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <select value={activeStateFilter} onChange={e => setActiveStateFilter(e.target.value)} className={SELECT_CLS}>
                      <option value="">All States</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={activeUseCaseFilter} onChange={e => setActiveUseCaseFilter(e.target.value)} className={SELECT_CLS}>
                      <option value="">All Use Cases</option>
                      <option value="row crop">Row Crop</option>
                      <option value="livestock">Livestock/Ranching</option>
                      <option value="timber">Timber</option>
                      <option value="recreational">Recreational</option>
                      <option value="residential development">Residential Development</option>
                      <option value="commercial development">Commercial Development</option>
                      <option value="conservation">Conservation</option>
                      <option value="investment">Investment</option>
                    </select>
                    <select value={activeRoadAccess} onChange={e => setActiveRoadAccess(e.target.value)} className={SELECT_CLS}>
                      <option value="">Road Access</option>
                      <option value="Paved Road">Paved Road</option>
                      <option value="Gravel Road">Gravel Road</option>
                      <option value="Dirt Road">Dirt Road</option>
                      <option value="Private Road">Private Road</option>
                      <option value="Easement">Easement</option>
                      <option value="No Road Access">No Road Access</option>
                    </select>
                    {(activeStateFilter || activeUseCaseFilter || activeRoadAccess) && (
                      <button onClick={() => { setActiveStateFilter(''); setActiveUseCaseFilter(''); setActiveRoadAccess(''); }} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">close</span> Clear filters
                      </button>
                    )}
                  </div>

                  {activeLoading ? (
                    <div className="space-y-3">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="bg-surface-container-low rounded-xl h-16 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredActive.length === 0 ? (
                    <div className="text-center py-16 text-secondary">
                      <span className="material-symbols-outlined text-5xl mb-3 block text-primary/20">hourglass_empty</span>
                      <p className="font-semibold">No active buyers match your filters</p>
                      <p className="text-sm mt-1">Try clearing your filters or check back soon</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredActive.map(req => (
                        <BuyerRequestCard
                          key={req.id}
                          req={req}
                          canViewContact={canViewContact}
                          isFreeUser={isFreeUser}
                          onUpgrade={() => setShowUpgradeModal(true)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

        </div>
      </main>
    </div>
  );
}
