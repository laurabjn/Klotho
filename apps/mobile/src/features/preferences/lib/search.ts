/** Combining accents left by NFD ("é" becomes "e" + U+0301). */
const ACCENTS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Lower case, without accents: "Bohème" is found with "boheme". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(ACCENTS, '').toLowerCase().trim();
}

/** Whether a label matches what was typed (everything matches nothing). */
export function matches(label: string, query: string): boolean {
  const wanted = normalize(query);
  return wanted === '' || normalize(label).includes(wanted);
}
