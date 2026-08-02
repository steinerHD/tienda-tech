const STOPWORDS = [
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "de", "del", "en", "que", "y", "o", "a", "para", "con",
  "tienes", "tiene", "hay", "algun", "alguna", "algunos", "algunas",
  "necesito", "busco", "quiero", "me", "si", "tengo", "puedo",
  "cuanto", "cuantos", "cuantas", "cuesta", "precio", "stock",
  "disponible", "hola", "buenas",
];

export function extractKeywords(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.includes(word));
}

export function searchItems(keywords, items) {
  if (keywords.length === 0) return [];

  return items.filter((item) => {
    const haystack = [
      item.nombre,
      item.categoria,
      item.marca,
      item.modeloCompatible,
      item.modelo,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return keywords.some((kw) => haystack.includes(kw));
  });
}