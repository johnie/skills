export { cn } from "cn";

const plurals = new Intl.PluralRules("en");
const numbers = new Intl.NumberFormat("en");

/**
 * One whole message per plural category, ICU style: `#` is the formatted count, so a form can be a full sentence
 * whose verb agrees with it (`"# skill matches."`). The form comes from the locale's rules, never `count === 1`.
 */
export const plural = (
  count: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
) =>
  (forms[plurals.select(count)] ?? forms.other).replaceAll(
    "#",
    numbers.format(count)
  );
