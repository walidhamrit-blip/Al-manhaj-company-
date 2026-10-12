export const MAX_HERO_SLIDES = 5;

export function limitHeroSlides<T>(slides: readonly T[] | null | undefined): T[] {
  return Array.isArray(slides) ? slides.slice(0, MAX_HERO_SLIDES) : [];
}
