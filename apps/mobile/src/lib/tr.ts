/** "Zeynep'in", "Emre'nin", "Can'ın": özel ada iyelik eki (ünlü uyumu). */
export function genitive(name: string): string {
  const vowels = 'aıoueiöü';
  const lower = name.toLocaleLowerCase('tr');
  const last = [...lower].reverse().find((c) => vowels.includes(c)) ?? 'e';
  const vowel = 'aı'.includes(last) ? 'ı' : 'ei'.includes(last) ? 'i' : 'ou'.includes(last) ? 'u' : 'ü';
  return `${name}'${vowels.includes(lower.at(-1) ?? '') ? 'n' : ''}${vowel}n`;
}

/** "Can", "Can ve Deniz", "Can, Deniz ve Ece" */
export function joinNames(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} ve ${names.at(-1)}`;
}
