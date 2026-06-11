import fs from 'fs';
import path from 'path';
import type { ReportData } from './report-schema';

// Fields used as CSS width values — must be bare integers (no % sign)
const PCT_FIELDS = new Set([
  'zoning_residential_pct', 'zoning_agricultural_pct', 'zoning_commercial_pct',
  'zoning_industrial_pct', 'zoning_mixed_use_pct',
  'risk_1_pct', 'risk_2_pct', 'risk_3_pct', 'risk_4_pct', 'risk_5_pct',
]);

export function fillTemplate(templatePath: string, data: ReportData): string {
  let html = fs.readFileSync(templatePath, 'utf-8');
  (Object.entries(data) as [string, string][]).forEach(([key, value]) => {
    const val = PCT_FIELDS.has(key)
      ? (value ?? '').replace(/%+$/, '').trim()
      : (value ?? '');
    html = html.replaceAll(`{{${key}}}`, val);
  });
  return html;
}

export function getTemplatePath(page: 1 | 2 | 3 | 4 | 5 | 6 | 7): string {
  return path.join(process.cwd(), 'lib', 'report-templates', `page${page}.html`);
}
