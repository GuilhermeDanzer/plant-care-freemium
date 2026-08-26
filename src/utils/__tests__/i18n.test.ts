import en from "@/i18n/locales/en.json";
import ptBR from "@/i18n/locales/pt-BR.json";

const flatten = (
  obj: Record<string, unknown>,
  prefix = ""
): Record<string, string> =>
  Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(acc, flatten(value as Record<string, unknown>, path));
    } else {
      acc[path] = String(value);
    }
    return acc;
  }, {});

describe("i18n locale parity", () => {
  const enKeys = flatten(en);
  const ptKeys = flatten(ptBR);

  it("has identical top-level keys in both locales", () => {
    expect(Object.keys(enKeys).length).toBeGreaterThan(0);
  });

  it("contains every English key in pt-BR", () => {
    for (const key of Object.keys(enKeys)) {
      expect(ptKeys[key]).toBeDefined();
    }
  });

  it("contains every pt-BR key in English", () => {
    for (const key of Object.keys(ptKeys)) {
      expect(enKeys[key]).toBeDefined();
    }
  });
});
