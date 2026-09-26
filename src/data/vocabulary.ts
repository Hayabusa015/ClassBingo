import type { BingoItem, DeckConfig, DeckId } from './types';

export function vocabularyDeck(
  id: DeckId,
  title: string,
  subject: string,
  grades: string,
  description: string,
  items: BingoItem[],
): DeckConfig {
  return {
    id,
    title,
    shortTitle: title,
    subject,
    grades,
    description,
    items,
    filters: [{ id: 'all', label: 'All items', predicate: () => true }],
    defaultFilterId: 'all',
    cardFaceOptions: [{ id: 'name', label: 'Answer / term' }],
    defaultCardFaceId: 'name',
    supportsChallenge: items.every((item) => Boolean(item.clue?.trim())),
    callHeadline: (item) => item.name,
    callSubline: (item) => item.clue || 'Find this item on your card.',
    squareText: (item) => item.name,
    challengeHiddenField: () => 'headline',
  };
}

export function curriculumDeck(
  slug: string,
  title: string,
  subject: string,
  grades: string,
  description: string,
  rows: string,
): DeckConfig {
  const items = rows
    .trim()
    .split('\n')
    .map((line, index) => {
      const [name, clue] = line.split('|').map((part) => part.trim());
      return { id: `${slug}-${index + 1}`, name, clue, tags: [subject] };
    });
  return vocabularyDeck(`curriculum:${slug}`, title, subject, grades, description, items);
}
