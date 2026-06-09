import fs from 'fs';
import path from 'path';
import type { ReportData } from './report-schema';

export function fillTemplate(templatePath: string, data: ReportData): string {
  let html = fs.readFileSync(templatePath, 'utf-8');
  (Object.entries(data) as [string, string][]).forEach(([key, value]) => {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
  });
  return html;
}

export function getTemplatePath(page: 1 | 2 | 3 | 4 | 5 | 6 | 7): string {
  return path.join(process.cwd(), 'lib', 'report-templates', `page${page}.html`);
}
