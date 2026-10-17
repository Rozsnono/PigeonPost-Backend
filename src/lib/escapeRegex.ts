/** Felhasználói bemenet biztonságos beillesztése RegExp-be (regex-injekció / ReDoS ellen). */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
