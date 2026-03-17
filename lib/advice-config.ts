import type { AdviceFaithStyle, AdviceLanguage } from "@/lib/advice-types";

export type AdviceLanguageOption = {
  value: AdviceLanguage;
  label: string;
  nativeLabel: string;
  speechLang: string;
  promptName: string;
};

export const DEFAULT_ADVICE_LANGUAGE: AdviceLanguage = "en-ZM";
export const DEFAULT_FAITH_STYLE: AdviceFaithStyle = "gentle_christian";

export const adviceLanguageOptions: AdviceLanguageOption[] = [
  {
    value: "en-ZM",
    label: "English",
    nativeLabel: "English",
    speechLang: "en-ZM",
    promptName: "English as used in Zambia"
  },
  {
    value: "bem-ZM",
    label: "Bemba",
    nativeLabel: "Ichibemba",
    speechLang: "bem-ZM",
    promptName: "Bemba"
  },
  {
    value: "ny-ZM",
    label: "Nyanja",
    nativeLabel: "Chinyanja",
    speechLang: "ny-ZM",
    promptName: "Nyanja"
  },
  {
    value: "toi-ZM",
    label: "Tonga",
    nativeLabel: "Chitonga",
    speechLang: "toi-ZM",
    promptName: "Tonga"
  },
  {
    value: "loz-ZM",
    label: "Lozi",
    nativeLabel: "Silozi",
    speechLang: "loz-ZM",
    promptName: "Lozi"
  }
];

export const adviceFaithStyleLabels: Record<AdviceFaithStyle, string> = {
  bible_forward: "Bible-forward",
  gentle_christian: "Gentle Christian",
  prayer_heavy: "Prayer-heavy",
  practical_faith: "Practical with faith"
};

export const zambiaSupportContacts = [
  "Zambia Police emergency: 991",
  "Zambia ambulance and medical emergency: 992",
  "Zambia fire emergency: 993",
  "Victim Support Unit at the nearest police station",
  "A trusted pastor, family elder, counselor, or church leader"
];

export function isAdviceLanguage(value: unknown): value is AdviceLanguage {
  return adviceLanguageOptions.some((option) => option.value === value);
}

export function isAdviceFaithStyle(value: unknown): value is AdviceFaithStyle {
  return typeof value === "string" && value in adviceFaithStyleLabels;
}

export function getAdviceLanguageOption(language: AdviceLanguage) {
  return adviceLanguageOptions.find((option) => option.value === language) ?? adviceLanguageOptions[0];
}
