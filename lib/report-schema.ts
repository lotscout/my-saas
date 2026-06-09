export interface ReportData {
  // ── Page 1: Title & Summary ───────────────────────────────────────────────
  county_name: string;
  metro_area: string;
  report_period: string;
  report_month: string;
  median_price_per_acre: string;
  median_price_trend: string;
  active_listings: string;
  active_listings_note: string;
  avg_days_on_market: string;
  dom_trend_note: string;
  dom_trend_direction: string;
  closed_sales: string;
  closed_sales_note: string;
  executive_summary: string;

  // ── Page 2: Comparable Sales & County Profile ─────────────────────────────
  population: string;
  land_area: string;
  population_growth: string;
  total_households: string;
  median_household_income: string;
  unemployment_rate: string;
  zoning_authority: string;
  comp_1_location: string; comp_1_acres: string; comp_1_zoning: string; comp_1_price: string; comp_1_price_display: string; comp_1_date: string;
  comp_2_location: string; comp_2_acres: string; comp_2_zoning: string; comp_2_price: string; comp_2_price_display: string; comp_2_date: string;
  comp_3_location: string; comp_3_acres: string; comp_3_zoning: string; comp_3_price: string; comp_3_price_display: string; comp_3_date: string;
  comp_4_location: string; comp_4_acres: string; comp_4_zoning: string; comp_4_price: string; comp_4_price_display: string; comp_4_date: string;
  comp_5_location: string; comp_5_acres: string; comp_5_zoning: string; comp_5_price: string; comp_5_price_display: string; comp_5_date: string;
  comp_6_location: string; comp_6_acres: string; comp_6_zoning: string; comp_6_price: string; comp_6_price_display: string; comp_6_date: string;

  // ── Page 3: Development Intelligence ─────────────────────────────────────
  rezoning_1_title: string; rezoning_1_address: string; rezoning_1_prev_zoning: string; rezoning_1_new_zoning: string; rezoning_1_acreage: string; rezoning_1_approving_body: string; rezoning_1_date_approved: string; rezoning_1_description: string; rezoning_1_note: string; rezoning_1_note_type: string;
  rezoning_2_title: string; rezoning_2_address: string; rezoning_2_prev_zoning: string; rezoning_2_new_zoning: string; rezoning_2_acreage: string; rezoning_2_approving_body: string; rezoning_2_date_approved: string; rezoning_2_description: string; rezoning_2_note: string; rezoning_2_note_type: string;
  rezoning_3_title: string; rezoning_3_address: string; rezoning_3_prev_zoning: string; rezoning_3_new_zoning: string; rezoning_3_acreage: string; rezoning_3_approving_body: string; rezoning_3_date_approved: string; rezoning_3_description: string; rezoning_3_status: string;
  permits_residential: string; permits_aggregate_value: string; permits_commercial: string; permits_avg_sqft: string;
  infra_1_title: string; infra_1_agency: string; infra_1_budget: string; infra_1_timeline: string; infra_1_affected_area: string; infra_1_impact: string;
  infra_2_title: string; infra_2_agency: string; infra_2_budget: string; infra_2_timeline: string; infra_2_affected_area: string; infra_2_impact: string;
  infra_3_title: string; infra_3_agency: string; infra_3_budget: string; infra_3_timeline: string; infra_3_affected_area: string; infra_3_impact: string;
  board_meeting_date: string; board_meeting_title: string; board_meeting_warning: string;

  // ── Page 4: Market Intelligence (all new) ─────────────────────────────────
  listings_under_1_acre: string;
  listings_1_to_5_acres: string;
  listings_5_to_20_acres: string;
  listings_over_20_acres: string;
  median_price_under_1_acre: string;
  median_price_1_to_5_acres: string;
  median_price_5_to_20_acres: string;
  median_price_over_20_acres: string;
  price_trend_current: string;
  price_trend_prior_month: string;
  price_trend_6_months: string;
  price_trend_direction: string;
  new_listings_this_month: string;
  listings_under_contract: string;
  zoning_residential_pct: string;
  zoning_agricultural_pct: string;
  zoning_commercial_pct: string;
  zoning_industrial_pct: string;
  zoning_mixed_use_pct: string;

  // ── Page 5: Job Market & Policy ───────────────────────────────────────────
  job_1_title: string; job_1_company: string; job_1_industry: string; job_1_job_count: string; job_1_role_types: string; job_1_timeline: string; job_1_land_impact: string;
  job_2_title: string; job_2_company: string; job_2_industry: string; job_2_job_count: string; job_2_role_types: string; job_2_timeline: string; job_2_land_impact: string;
  job_3_title: string; job_3_company: string; job_3_industry: string; job_3_job_count: string; job_3_role_types: string; job_3_timeline: string; job_3_land_impact: string;
  policy_1_title: string; policy_1_date_badge: string; policy_1_description: string;
  policy_2_title: string; policy_2_date_badge: string; policy_2_description: string;
  incentive_1_label: string; incentive_1_value: string; incentive_1_zone: string; incentive_1_expiry: string; incentive_1_explanation: string;
  incentive_2_label: string; incentive_2_value: string; incentive_2_zone: string; incentive_2_expiry: string; incentive_2_explanation: string;
  incentive_3_label: string; incentive_3_value: string; incentive_3_zone: string; incentive_3_expiry: string; incentive_3_explanation: string;
  incentive_4_label: string; incentive_4_value: string; incentive_4_zone: string; incentive_4_expiry: string; incentive_4_explanation: string;
  comp_county_1_name: string; comp_county_1_growth: string; comp_county_1_relevance: string;
  comp_county_2_name: string; comp_county_2_growth: string; comp_county_2_relevance: string;
  comp_county_3_name: string; comp_county_3_growth: string; comp_county_3_relevance: string;
  comp_county_4_name: string; comp_county_4_growth: string; comp_county_4_relevance: string;

  // ── Page 6: Risk Assessment & Recommendations ────────────────────────────
  risk_1_label: string; risk_1_pct: string; risk_1_color: string; risk_1_display: string;
  risk_2_label: string; risk_2_pct: string; risk_2_color: string; risk_2_display: string;
  risk_3_label: string; risk_3_pct: string; risk_3_color: string; risk_3_display: string;
  risk_4_label: string; risk_4_pct: string; risk_4_color: string; risk_4_display: string;
  risk_5_label: string; risk_5_pct: string; risk_5_color: string; risk_5_display: string;
  insight_paragraph: string;
  watch_1: string; watch_2: string; watch_3: string; watch_4: string; watch_5: string;
  recommendation_signal: string;
  recommendation_body: string;

  // ── Page 7: Sources & Disclaimer ─────────────────────────────────────────
  source_1_name: string; source_1_url: string; source_1_date: string;
  source_2_name: string; source_2_url: string; source_2_date: string;
  source_3_name: string; source_3_url: string; source_3_date: string;
  source_4_name: string; source_4_url: string; source_4_date: string;
  source_5_name: string; source_5_url: string; source_5_date: string;
  source_6_name: string; source_6_url: string; source_6_date: string;
  source_7_name: string; source_7_url: string; source_7_date: string;
  source_8_name: string; source_8_url: string; source_8_date: string;
  disclaimer_para_1: string;
  disclaimer_para_2: string;
}

export const reportSchemaExample: ReportData = {
  county_name: 'Denver County, Colorado',
  metro_area: 'Denver-Aurora-Lakewood, CO Metro',
  report_period: 'May/June 2026',
  report_month: 'June 2026',
  median_price_per_acre: '$312,000',
  median_price_trend: '+7.2% year-over-year',
  active_listings: '94',
  active_listings_note: 'Up 11% from prior month',
  avg_days_on_market: '38',
  dom_trend_note: 'Down 6 days from Q1 average',
  dom_trend_direction: 'down',
  closed_sales: '21',
  closed_sales_note: 'Highest month since October 2024',
  executive_summary: 'Denver County land values continue to outpace regional averages, driven by persistent housing demand and constrained infill supply. Recent rezoning activity near the I-70 corridor signals near-term development pressure. Investors should focus on parcels with residential conversion potential in the northwest quadrant.',

  population: '715,522',
  land_area: '153 sq mi',
  population_growth: '+1.4% annually',
  total_households: '310,800',
  median_household_income: '$72,100',
  unemployment_rate: '3.4%',
  zoning_authority: 'Denver Community Planning and Development',

  comp_1_location: 'NW Quadrant, Sunnyside', comp_1_acres: '0.18', comp_1_zoning: 'U-SU-A1', comp_1_price: '$390,000', comp_1_price_display: '$2,167,000/sq ft equiv', comp_1_date: 'May 2026',
  comp_2_location: 'Globeville Neighborhood', comp_2_acres: '0.52', comp_2_zoning: 'I-A', comp_2_price: '$148,000', comp_2_price_display: '$284,615/acre', comp_2_date: 'May 2026',
  comp_3_location: 'Elyria-Swansea, NE Denver', comp_3_acres: '1.1', comp_3_zoning: 'R-2', comp_3_price: '$410,000', comp_3_price_display: '$372,727/acre', comp_3_date: 'April 2026',
  comp_4_location: 'Barnum West', comp_4_acres: '0.33', comp_4_zoning: 'C-MX-3', comp_4_price: '$195,000', comp_4_price_display: '$590,909/acre', comp_4_date: 'April 2026',
  comp_5_location: 'Clayton Neighborhood', comp_5_acres: '0.09', comp_5_zoning: 'G-MU-3', comp_5_price: '$225,000', comp_5_price_display: '$57.87/sq ft', comp_5_date: 'June 2026',
  comp_6_location: 'Villa Park, West Denver', comp_6_acres: '0.46', comp_6_zoning: 'U-MX-2', comp_6_price: '$162,000', comp_6_price_display: '$352,174/acre', comp_6_date: 'June 2026',

  rezoning_1_title: 'Globeville Industrial Overlay Removed', rezoning_1_address: '4800 Washington St, Denver, CO 80216', rezoning_1_prev_zoning: 'I-A (Industrial)', rezoning_1_new_zoning: 'C-MX-5 (Mixed Use Commercial)', rezoning_1_acreage: '3.2', rezoning_1_approving_body: 'Denver City Council', rezoning_1_date_approved: 'May 28, 2026', rezoning_1_description: 'A 3.2-acre industrial parcel approved for mixed-use commercial redevelopment, enabling up to 5-story residential above ground floor retail.', rezoning_1_note: 'Approved 9-2', rezoning_1_note_type: 'approved',
  rezoning_2_title: 'Elyria Residential Density Increase', rezoning_2_address: '5100 Columbine St, Denver, CO 80216', rezoning_2_prev_zoning: 'R-1 (Single Family)', rezoning_2_new_zoning: 'R-3 (Multi-Family)', rezoning_2_acreage: '1.8', rezoning_2_approving_body: 'Denver Planning Board', rezoning_2_date_approved: 'June 3, 2026', rezoning_2_description: 'Density upzoning enabling 8-unit townhomes on previously single-family platted land near the 48th Ave transit corridor.', rezoning_2_note: 'Under appeal by neighbors', rezoning_2_note_type: 'warning',
  rezoning_3_title: 'Stapleton Buffer Conservation Overlay', rezoning_3_address: '8900 E 26th Ave, Denver, CO 80238', rezoning_3_prev_zoning: 'PUD (Planned Development)', rezoning_3_new_zoning: 'OS-B (Open Space Buffer)', rezoning_3_acreage: '12.4', rezoning_3_approving_body: 'Denver Parks and Recreation', rezoning_3_date_approved: 'June 10, 2026', rezoning_3_description: 'Open space buffer designation protects 12.4 acres adjacent to the Montbello corridor from future residential encroachment.', rezoning_3_status: 'Effective August 2026',

  permits_residential: '318',
  permits_aggregate_value: '$74.3M',
  permits_commercial: '47',
  permits_avg_sqft: '2,850 sq ft',

  infra_1_title: 'I-70 East Corridor Reconstruction', infra_1_agency: 'CDOT', infra_1_budget: '$1.2B', infra_1_timeline: 'Completion Q4 2026', infra_1_affected_area: 'Globeville, Elyria-Swansea, Montbello', infra_1_impact: 'Reduces truck traffic on local streets and opens former industrial buffer parcels to residential conversion.',
  infra_2_title: 'Denver Water Northeast Expansion', infra_2_agency: 'Denver Water', infra_2_budget: '$48M', infra_2_timeline: 'Phase 1 complete Q1 2027', infra_2_affected_area: 'Northeast Denver and Commerce City border', infra_2_impact: 'Extends potable water service to 420 acres of currently unserved land, directly enabling residential subdivision.',
  infra_3_title: '40th and Colorado BRT Station Area Plan', infra_3_agency: 'RTD and Denver CPD', infra_3_budget: '$22M', infra_3_timeline: 'Study complete mid-2027', infra_3_affected_area: '0.5-mile radius around 40th and Colorado Station', infra_3_impact: 'Transit-oriented development overlay expected to upzone 80+ parcels within walking distance of new BRT station.',

  board_meeting_date: 'July 22, 2026',
  board_meeting_title: 'Denver Planning Board — Comprehensive Rezoning Review',
  board_meeting_warning: 'Agenda includes proposed changes to ADU allowances and minimum lot sizes that could affect infill parcel values across 6 neighborhoods.',

  listings_under_1_acre: '41',
  listings_1_to_5_acres: '28',
  listings_5_to_20_acres: '15',
  listings_over_20_acres: '10',
  median_price_under_1_acre: '$410,000',
  median_price_1_to_5_acres: '$285,000',
  median_price_5_to_20_acres: '$198,000',
  median_price_over_20_acres: '$145,000',
  price_trend_current: '$312,000',
  price_trend_prior_month: '$298,000',
  price_trend_6_months: '$271,000',
  price_trend_direction: 'up',
  new_listings_this_month: '27',
  listings_under_contract: '18',
  zoning_residential_pct: '52',
  zoning_agricultural_pct: '4',
  zoning_commercial_pct: '21',
  zoning_industrial_pct: '14',
  zoning_mixed_use_pct: '9',

  job_1_title: 'Amazon HQ2 Colorado Campus', job_1_company: 'Amazon', job_1_industry: 'Technology / E-Commerce', job_1_job_count: '2,000', job_1_role_types: 'Software engineers, operations managers, logistics coordinators', job_1_timeline: 'Phase 1 hiring begins Q3 2026', job_1_land_impact: 'Expected to drive 4,000+ household relocations, increasing infill land demand in north and northeast Denver.',
  job_2_title: 'Children\'s Hospital Expansion', job_2_company: 'Children\'s Hospital Colorado', job_2_industry: 'Healthcare', job_2_job_count: '650', job_2_role_types: 'Nurses, physicians, administrative support', job_2_timeline: 'Hiring complete by Q4 2026', job_2_land_impact: 'Increases demand for workforce housing parcels within 3 miles of the Anschutz Medical Campus.',
  job_3_title: 'RTD Transit Expansion Hiring', job_3_company: 'Regional Transportation District', job_3_industry: 'Public Transportation', job_3_job_count: '320', job_3_role_types: 'Operators, maintenance technicians, planners', job_3_timeline: 'Ongoing through 2027', job_3_land_impact: 'Stable public sector employment supports continued housing demand near transit corridors.',

  policy_1_title: 'Denver City Council Affordable Housing Levy', policy_1_date_badge: 'Nov 2026 Ballot', policy_1_description: 'Proposed 0.15% sales tax increase generating $42M annually for affordable housing construction. If passed, could redirect 800 infill acres from market-rate to income-restricted development.',
  policy_2_title: 'State Senate Bill 1147 — Minimum Lot Size Preemption', policy_2_date_badge: 'Signed June 2026', policy_2_description: 'Colorado law preempting local minimum lot sizes above 3,500 sq ft in urban areas. Expected to unlock 1,200 Denver parcels for ADU and small-lot subdivision.',

  incentive_1_label: 'Opportunity Zone Tax Deferral', incentive_1_value: 'Capital gains deferral + 15% reduction', incentive_1_zone: 'Elyria-Swansea OZ (Census Tract 12)', incentive_1_expiry: 'December 2026', incentive_1_explanation: 'If you invest capital gains into this zone, you can delay paying taxes on those gains and reduce the tax owed by 15%. You keep more money working in the deal.',
  incentive_2_label: 'Denver Enterprise Zone Abatement', incentive_2_value: 'Up to $1,600 per new job created', incentive_2_zone: 'Globeville Enterprise Zone', incentive_2_expiry: 'Ongoing', incentive_2_explanation: 'Businesses that create new jobs in this zone receive a direct credit against Colorado income taxes. More jobs created equals a larger tax reduction.',
  incentive_3_label: 'TIF District Infrastructure Reimbursement', incentive_3_value: 'Up to 60% of infrastructure costs', incentive_3_zone: 'Cole Neighborhood TIF District', incentive_3_expiry: '2033', incentive_3_explanation: 'The city reimburses developers for roads, water, and sewer improvements using future tax revenue the project generates. You build now and get reimbursed over time.',
  incentive_4_label: 'LIHTC Low-Income Housing Tax Credit', incentive_4_value: '$1.2M per project average', incentive_4_zone: 'Citywide (income-qualified parcels)', incentive_4_expiry: 'Annual allocation cycle', incentive_4_explanation: 'Federal tax credits given to developers who build housing for lower-income residents. Credits are sold to investors to raise equity, reducing how much you need to borrow.',

  comp_county_1_name: 'Jefferson County', comp_county_1_growth: '+2.8%', comp_county_1_relevance: 'Lower price floor and more available acreage make it a preferred alternative for buyers priced out of Denver.',
  comp_county_2_name: 'Arapahoe County', comp_county_2_growth: '+2.1%', comp_county_2_relevance: 'Similar employment base with faster permitting timeline and fewer zoning restrictions than Denver proper.',
  comp_county_3_name: 'Adams County', comp_county_3_growth: '+3.4%', comp_county_3_relevance: 'Highest growth rate in the metro driven by industrial and logistics expansion along I-76 and I-270 corridors.',
  comp_county_4_name: 'Broomfield County', comp_county_4_growth: '+1.9%', comp_county_4_relevance: 'Strong tech employer anchors with limited land supply creating upward pressure on remaining vacant parcels.',

  risk_1_label: 'Entitlement Risk', risk_1_pct: '55', risk_1_color: '#F59E0B', risk_1_display: 'Moderate',
  risk_2_label: 'Price Volatility', risk_2_pct: '40', risk_2_color: '#10B981', risk_2_display: 'Low-Moderate',
  risk_3_label: 'Supply Pressure', risk_3_pct: '30', risk_3_color: '#10B981', risk_3_display: 'Low',
  risk_4_label: 'Demand Strength', risk_4_pct: '80', risk_4_color: '#10B981', risk_4_display: 'High',
  risk_5_label: 'Election Risk', risk_5_pct: '65', risk_5_color: '#F59E0B', risk_5_display: 'Moderate',

  insight_paragraph: 'Denver County presents a strong but selective buy signal. The convergence of transit-oriented upzoning, tech sector job growth, and constrained infill supply creates favorable conditions for investors targeting parcels in the 0.1 to 2 acre range near BRT corridors. The November affordable housing levy represents the primary risk event this cycle. Investors should close positions on income-restricted-adjacent parcels before the November ballot result.',
  watch_1: 'November affordable housing levy outcome — potential to restrict 800+ infill acres',
  watch_2: 'Senate Bill 1147 implementation — watch for lot size challenges in Sunnyside and Globeville',
  watch_3: 'I-70 East corridor completion Q4 2026 — will immediately open buffer parcels for residential conversion',
  watch_4: 'Amazon Phase 1 hiring absorption — track rental vacancy rates in northeast Denver',
  watch_5: 'July 22 Planning Board meeting — ADU and minimum lot size changes affecting 6 neighborhoods',

  recommendation_signal: 'BUY — Selective',
  recommendation_body: 'Target vacant parcels in the 0.1 to 2 acre range along the 40th and Colorado BRT corridor and within the Elyria-Swansea Opportunity Zone. The infrastructure investment pipeline is unusually strong and the Senate Bill 1147 lot size preemption unlocks hundreds of previously unsubdividable lots. Avoid parcels adjacent to the proposed Stapleton conservation buffer and hold off on industrial-zoned land in Globeville until the appeal on the commercial rezoning resolves.',

  source_1_name: 'Denver Assessor Property Records', source_1_url: 'https://assessor.denvergov.org', source_1_date: 'June 2026',
  source_2_name: 'CDOT Statewide Transportation Improvement Program', source_2_url: 'https://cdot.colorado.gov/stip', source_2_date: 'June 2026',
  source_3_name: 'US Census Bureau QuickFacts — Denver County', source_3_url: 'https://census.gov/quickfacts/denvercountycolorado', source_3_date: 'June 2026',
  source_4_name: 'BLS Local Area Unemployment Statistics — Denver', source_4_url: 'https://bls.gov/regions/mountain-plains/colorado.htm', source_4_date: 'May 2026',
  source_5_name: 'Denver Community Planning and Development', source_5_url: 'https://denvergov.org/cpd', source_5_date: 'June 2026',
  source_6_name: 'Colorado OED Opportunity Zone Registry', source_6_url: 'https://oedit.colorado.gov/opportunity-zones', source_6_date: 'June 2026',
  source_7_name: 'Denver Post Business Intelligence', source_7_url: 'https://denverpost.com/business', source_7_date: 'June 2026',
  source_8_name: 'Denver Planning Board Meeting Minutes', source_8_url: 'https://denvergov.org/planning', source_8_date: 'June 2026',

  disclaimer_para_1: 'This report is generated for informational purposes only and does not constitute financial, legal, or investment advice. All data is sourced from publicly available records and AI-assisted research. LotScout makes no representations or warranties regarding the accuracy or completeness of the information presented.',
  disclaimer_para_2: 'Investors should conduct independent due diligence before making any land purchase decisions. Past market performance does not guarantee future results. Contact a licensed real estate professional or attorney before transacting. LotScout is not a licensed real estate broker or investment advisor.',
};
