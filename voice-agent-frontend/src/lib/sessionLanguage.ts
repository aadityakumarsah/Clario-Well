export type SessionLanguage = "en" | "ne";

export const SESSION_LANGUAGES: { id: SessionLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "ne", label: "Nepali" },
];

export function preferredLanguageGreetingPrefix(lang: SessionLanguage): string {
  if (lang === "ne") {
    return (
      "Preferred user language: Nepali. Speak your opening and continue the session in natural Nepali " +
      "(as spoken in Nepal) unless the user clearly switches language. "
    );
  }
  return (
    "Preferred user language: English. Speak your opening and continue the session in clear, natural English " +
    "unless the user clearly switches language. "
  );
}
