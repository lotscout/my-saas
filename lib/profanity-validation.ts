import { containsProfanity } from './profanity-filter';

export type PublicTextField = {
  label: string;
  value: unknown;
};

export function findProfaneField(fields: PublicTextField[]): string | null {
  for (const field of fields) {
    if (typeof field.value === 'string' && containsProfanity(field.value)) {
      return field.label;
    }
  }
  return null;
}

export function profanityError(fieldLabel?: string | null) {
  return fieldLabel
    ? `Please remove inappropriate language from ${fieldLabel}.`
    : 'Please remove inappropriate language before submitting.';
}
