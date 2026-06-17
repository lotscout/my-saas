import fs from 'fs';
import path from 'path';
import type { TemplateData } from './report-schema';

// Fills {{UPPERCASE_KEY}} placeholders in the report template.
export function fillTemplate(templatePath: string, data: TemplateData): string {
  let html = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
  }
  return html;
}

export function getReportTemplatePath(): string {
  return path.join(process.cwd(), 'lib', 'report-templates', 'report.html');
}
