export interface ReportData {
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
  population: string;
  land_area: string;
  population_growth: string;
  total_households: string;
  median_household_income: string;
  zoning_authority: string;
  comp_1_location: string; comp_1_acres: string; comp_1_price: string; comp_1_price_per_acre: string; comp_1_date: string;
  comp_2_location: string; comp_2_acres: string; comp_2_price: string; comp_2_price_per_acre: string; comp_2_date: string;
  comp_3_location: string; comp_3_acres: string; comp_3_price: string; comp_3_price_per_acre: string; comp_3_date: string;
  comp_4_location: string; comp_4_acres: string; comp_4_price: string; comp_4_price_per_acre: string; comp_4_date: string;
  rezoning_1_title: string; rezoning_1_description: string; rezoning_1_note: string; rezoning_1_note_type: string;
  rezoning_2_title: string; rezoning_2_description: string; rezoning_2_note: string; rezoning_2_note_type: string;
  rezoning_3_title: string; rezoning_3_description: string; rezoning_3_status: string;
  permits_residential: string; permits_aggregate_value: string; permits_commercial: string; permits_avg_sqft: string;
  infra_1_title: string; infra_1_detail: string;
  infra_2_title: string; infra_2_detail: string;
  board_meeting_date: string; board_meeting_title: string; board_meeting_warning: string;
  job_1_title: string; job_1_description: string; job_1_note: string;
  job_2_title: string; job_2_description: string; job_2_note: string;
  job_3_title: string; job_3_description: string; job_3_stat: string; job_3_stat_label: string;
  policy_1_title: string; policy_1_date_badge: string; policy_1_description: string;
  policy_2_title: string; policy_2_date_badge: string; policy_2_description: string;
  incentive_1_label: string; incentive_1_value: string;
  incentive_2_label: string; incentive_2_value: string;
  incentive_3_label: string; incentive_3_value: string;
  incentive_4_label: string; incentive_4_value: string;
  comp_county_1_name: string; comp_county_1_growth: string;
  comp_county_2_name: string; comp_county_2_growth: string;
  comp_county_3_name: string; comp_county_3_growth: string;
  comp_county_4_name: string; comp_county_4_growth: string;
  risk_1_label: string; risk_1_pct: string; risk_1_color: string; risk_1_display: string;
  risk_2_label: string; risk_2_pct: string; risk_2_color: string; risk_2_display: string;
  risk_3_label: string; risk_3_pct: string; risk_3_color: string; risk_3_display: string;
  risk_4_label: string; risk_4_pct: string; risk_4_color: string; risk_4_display: string;
  risk_5_label: string; risk_5_pct: string; risk_5_color: string; risk_5_display: string;
  insight_paragraph: string;
  watch_1: string; watch_2: string; watch_3: string; watch_4: string; watch_5: string;
  recommendation_signal: string;
  recommendation_body: string;
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
  county_name: 'Franklin County, Ohio',
  metro_area: 'Columbus, OH Metro Area',
  report_period: 'May 1 - June 30, 2026',
  report_month: 'June 2026',
  median_price_per_acre: '$8,200',
  median_price_trend: '+6.3% year-over-year',
  active_listings: '142',
  active_listings_note: 'Up 12% from prior month',
  avg_days_on_market: '47',
  dom_trend_note: 'Down 8 days from Q1',
  dom_trend_direction: 'down',
  closed_sales: '38',
  closed_sales_note: 'Highest since Q3 2024',
  population: '1,323,807',
  land_area: '539 sq mi',
  population_growth: '+1.8% annually',
  total_households: '541,200',
  median_household_income: '$62,400',
  zoning_authority: 'Franklin County Board of Commissioners',
  comp_1_location: 'NE Quadrant, Plain Township', comp_1_acres: '42', comp_1_price: '$312,000', comp_1_price_per_acre: '$7,429', comp_1_date: 'May 2026',
  comp_2_location: 'SW Corner, Madison Township', comp_2_acres: '18', comp_2_price: '$162,000', comp_2_price_per_acre: '$9,000', comp_2_date: 'April 2026',
  comp_3_location: 'Central, Jefferson Township', comp_3_acres: '75', comp_3_price: '$525,000', comp_3_price_per_acre: '$7,000', comp_3_date: 'May 2026',
  comp_4_location: 'East Side, Hamilton Township', comp_4_acres: '28', comp_4_price: '$252,000', comp_4_price_per_acre: '$9,000', comp_4_date: 'June 2026',
  rezoning_1_title: 'R-1 to PD Residential Overlay', rezoning_1_description: '180 acres along Route 161 approved for planned development with mixed housing density allowances.', rezoning_1_note: 'Approved unanimously', rezoning_1_note_type: 'approved',
  rezoning_2_title: 'Agricultural to Light Industrial', rezoning_2_description: '64 acres near Rickenbacker International rezoned to support new logistics facility.', rezoning_2_note: 'Under appeal', rezoning_2_note_type: 'warning',
  rezoning_3_title: 'Conservation District Expansion', rezoning_3_description: 'County Commissioners voted to expand Big Darby Creek conservation buffer by 200 acres.', rezoning_3_status: 'Effective July 2026',
  permits_residential: '284',
  permits_aggregate_value: '$68.2M',
  permits_commercial: '41',
  permits_avg_sqft: '3,200 sq ft',
  infra_1_title: 'Route 33 Widening Project', infra_1_detail: '$142M ODOT project extending 4-lane corridor 8 miles west, opening rural tracts to commercial access.',
  infra_2_title: 'Dublin Water Extension', infra_2_detail: 'Municipal water service extended to 3 rural townships, increasing land utility for residential development.',
  board_meeting_date: 'July 15, 2026', board_meeting_title: 'Comprehensive Plan Amendment Vote', board_meeting_warning: 'Could affect future land use classifications in NW quadrant.',
  job_1_title: 'Intel Ohio Fab Campus', job_1_description: 'Phase 2 construction underway at $20B semiconductor facility, adding 3,000 permanent positions.', job_1_note: 'Major demand driver for worker housing',
  job_2_title: 'Amazon Distribution Center', job_2_description: 'New 1.2M sq ft fulfillment center broke ground, creating 1,500 jobs in eastern Franklin County.', job_2_note: 'Increases demand for workforce housing parcels',
  job_3_title: 'Unemployment Rate', job_3_description: 'County unemployment well below national average, supporting strong household formation and land demand.', job_3_stat: '3.1%', job_3_stat_label: 'Unemployment Rate',
  policy_1_title: 'November 2026 Levy Proposal', policy_1_date_badge: 'Nov 2026', policy_1_description: 'Franklin County Park District pursuing 0.5 mill levy that could convert 800 acres of private land to public greenspace.',
  policy_2_title: 'Township Trustee Elections', policy_2_date_badge: 'Nov 2026', policy_2_description: 'Three township trustee seats up for election with candidates divided on rural development density.',
  incentive_1_label: 'TIF Districts', incentive_1_value: '12 active',
  incentive_2_label: 'Opportunity Zones', incentive_2_value: '4 designated',
  incentive_3_label: 'Enterprise Zone Abatements', incentive_3_value: 'Up to 75%',
  incentive_4_label: 'CAUV Agricultural Discount', incentive_4_value: 'Avg 35% reduction',
  comp_county_1_name: 'Delaware County', comp_county_1_growth: '+3.1%',
  comp_county_2_name: 'Licking County', comp_county_2_growth: '+2.7%',
  comp_county_3_name: 'Union County', comp_county_3_growth: '+2.2%',
  comp_county_4_name: 'Pickaway County', comp_county_4_growth: '+1.9%',
  risk_1_label: 'Interest Rate Sensitivity', risk_1_pct: '65', risk_1_color: '#F59E0B', risk_1_display: 'Moderate',
  risk_2_label: 'Regulatory/Zoning Changes', risk_2_pct: '40', risk_2_color: '#10B981', risk_2_display: 'Low-Moderate',
  risk_3_label: 'Supply Increase Risk', risk_3_pct: '55', risk_3_color: '#F59E0B', risk_3_display: 'Moderate',
  risk_4_label: 'Conservation Overlay Expansion', risk_4_pct: '30', risk_4_color: '#10B981', risk_4_display: 'Low',
  risk_5_label: 'Infrastructure Delay Risk', risk_5_pct: '25', risk_5_color: '#10B981', risk_5_display: 'Low',
  insight_paragraph: 'Franklin County presents a compelling buy signal for land investors in the $5,000-$10,000/acre range. Intel campus and Amazon expansion are generating unprecedented employment demand, driving household formation at a rate the housing market cannot absorb. Infrastructure investment is opening previously inaccessible rural tracts. The primary risk is the November levy proposal targeting 800 acres of private land for parkland conversion.',
  watch_1: 'July 15 Board of Commissioners vote on Comprehensive Plan Amendment',
  watch_2: 'Intel Phase 2 hiring announcements expected Q3 2026',
  watch_3: 'Route 33 widening corridor completion - target Q1 2027',
  watch_4: 'November trustee elections - three pro-development incumbents challenged',
  watch_5: 'Dublin Water Service extension completing to remaining 2 townships',
  recommendation_signal: 'BUY',
  recommendation_body: 'Strong infrastructure investment, major employer anchors, and population growth make Franklin County a high-conviction land investment market. Focus on tracts in the Route 33 corridor and townships receiving water service extension. Avoid parcels inside proposed conservation buffer zones until July vote concludes.',
  source_1_name: 'Franklin County Auditor Property Records', source_1_url: 'https://auditor.franklincountyohio.gov', source_1_date: 'June 2026',
  source_2_name: 'Ohio Department of Transportation STIP', source_2_url: 'https://odot.state.oh.us', source_2_date: 'June 2026',
  source_3_name: 'US Census Bureau QuickFacts', source_3_url: 'https://census.gov/quickfacts', source_3_date: 'June 2026',
  source_4_name: 'BLS Local Area Unemployment Statistics', source_4_url: 'https://bls.gov/lau', source_4_date: 'May 2026',
  source_5_name: 'Franklin County Building Services', source_5_url: 'https://franklincountyohio.gov', source_5_date: 'June 2026',
  source_6_name: 'Ohio Development Services Agency', source_6_url: 'https://development.ohio.gov', source_6_date: 'June 2026',
  source_7_name: 'Columbus Dispatch - Business Intel', source_7_url: 'https://dispatch.com', source_7_date: 'June 2026',
  source_8_name: 'Franklin County Planning Commission', source_8_url: 'https://franklincountyohio.gov/planning', source_8_date: 'June 2026',
  disclaimer_para_1: 'This report is generated for informational purposes only and does not constitute financial, legal, or investment advice. All data is sourced from publicly available records and AI-assisted research. LotScout makes no representations or warranties regarding the accuracy or completeness of the information presented.',
  disclaimer_para_2: 'Investors should conduct independent due diligence before making any land purchase decisions. Past market performance does not guarantee future results. Contact a licensed real estate professional or attorney before transacting.',
};
