// What the AI returns — structured data the generator transforms into template fields
export interface AIReportData {
  // Snapshot stats (Section 2)
  median_price_acre: string;        // e.g. "$85,000"
  active_listings: string;          // e.g. "94"
  avg_dom: string;                  // e.g. "38"
  yoy_change: string;               // e.g. "+4.2%" — year-over-year price change

  // County overview prose (Section 2) — 2–4 paragraphs, HTML-safe (<p>, <strong> only)
  county_overview_prose: string;

  // Land area and zoning (Section 3 bar chart)
  land_area_sqmi: string;           // total county area in sq mi, numeric string e.g. "1250"
  land_use_res_pct: string;         // "45%" — residential, includes "%" sign
  land_use_ag_pct: string;          // "35%" — agricultural
  land_use_com_pct: string;         // "20%" — commercial/other; must sum to 100% with above

  // Comparable sales (up to 6; empty string fields if fewer found)
  comp_1_location: string; comp_1_acres: string; comp_1_price: string; comp_1_price_per_acre: string; comp_1_date: string;
  comp_2_location: string; comp_2_acres: string; comp_2_price: string; comp_2_price_per_acre: string; comp_2_date: string;
  comp_3_location: string; comp_3_acres: string; comp_3_price: string; comp_3_price_per_acre: string; comp_3_date: string;
  comp_4_location: string; comp_4_acres: string; comp_4_price: string; comp_4_price_per_acre: string; comp_4_date: string;
  comp_5_location: string; comp_5_acres: string; comp_5_price: string; comp_5_price_per_acre: string; comp_5_date: string;
  comp_6_location: string; comp_6_acres: string; comp_6_price: string; comp_6_price_per_acre: string; comp_6_date: string;

  // Active listings — HONESTY RULE: real listings only, empty string if none found
  listing_no_data_note: string;     // message if no real listings, e.g. "No active land listings found for this county at this time." — empty string if listings ARE populated
  listing_1_location: string; listing_1_acres: string; listing_1_price: string; listing_1_price_per_acre: string; listing_1_status: string;
  listing_2_location: string; listing_2_acres: string; listing_2_price: string; listing_2_price_per_acre: string; listing_2_status: string;
  listing_3_location: string; listing_3_acres: string; listing_3_price: string; listing_3_price_per_acre: string; listing_3_status: string;
  listing_4_location: string; listing_4_acres: string; listing_4_price: string; listing_4_price_per_acre: string; listing_4_status: string;
  listing_5_location: string; listing_5_acres: string; listing_5_price: string; listing_5_price_per_acre: string; listing_5_status: string;
  listing_6_location: string; listing_6_acres: string; listing_6_price: string; listing_6_price_per_acre: string; listing_6_status: string;

  // Prose sections — HTML-safe, may include <p>, <ul>, <li>, <strong>
  rezoning_prose: string;     // Section 4: recent rezoning activity narrative
  permits_prose: string;      // Section 4: building permits summary
  policy_prose: string;       // Section 4: elections, policies, incentives narrative
  risk_prose: string;         // Section 5: market risk assessment
  insight_prose: string;      // Section 5: market insight/outlook
  watch_prose: string;        // Section 5: what to watch (can be <ul><li> list)

  // Sources — HONESTY RULE: only sources actually used; empty strings for unused slots
  source_1_name: string; source_1_url: string; source_1_date: string;
  source_2_name: string; source_2_url: string; source_2_date: string;
  source_3_name: string; source_3_url: string; source_3_date: string;
  source_4_name: string; source_4_url: string; source_4_date: string;
  source_5_name: string; source_5_url: string; source_5_date: string;
  source_6_name: string; source_6_url: string; source_6_date: string;
  source_7_name: string; source_7_url: string; source_7_date: string;
  source_8_name: string; source_8_url: string; source_8_date: string;
}

// What fillTemplate receives — keys match {{UPPERCASE}} placeholders in report.html exactly
export type TemplateData = Record<string, string>;
