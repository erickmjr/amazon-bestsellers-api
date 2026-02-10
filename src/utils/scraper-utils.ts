import type { Page } from "puppeteer";
import type {
  Product,
  ProductsByCategory,
} from "../models/product.model";

export const AMAZON_BESTSELLERS_URL = "https://www.amazon.com.br/bestsellers";
export const CATEGORY_PREFIX = "Mais Vendidos em ";
export const MAX_PRODUCTS_PER_CATEGORY = 3;

export type ScrapedCard = {
  rank: number;
  title: string;
  href: string;
  categoryTitle: string;
  image?: string;
  priceText?: string;
  starsText?: string;
  reviewsText?: string;
};

export type ScrapeResult = { cards: ScrapedCard[]; categoryTitles: string[] };

type ScrapeOptions = {
  categoryPrefix?: string;
  maxProductsPerCategory?: number;
};

const SELECTORS = {
  heading: "h2.a-carousel-heading",
  carousel: ".a-carousel-container",
  card: "li.a-carousel-card div[data-asin]",
  title: ".p13n-sc-truncate-desktop-type2, .p13n-sc-truncated",
  link: 'a.a-link-normal.aok-block[href*="/dp/"]',
  image: "img.p13n-product-image",
  rank: ".zg-bdg-text",
  price: '[class*="p13n-sc-price"]',
  stars: ".a-icon-star-small .a-icon-alt",
  reviews: ".a-icon-row .a-size-small",
};

const normalizeText = (value?: string | null) =>
  (value ?? "").replace(/\s+/g, " ").trim();

const slugifyCategory = (title: string) =>
  normalizeText(title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseNumberFromText = (raw?: string): number | undefined => {
  const text = normalizeText(raw);
  if (!text) return undefined;

  const normalized = text
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number(normalized);

  return Number.isFinite(value) ? value : undefined;
};

const parsePrice = (raw?: string): Product["price"] | undefined => {
  const value = parseNumberFromText(raw);
  if (value === undefined) return undefined;

  return {
    raw: normalizeText(raw),
    currency: "BRL",
    value,
  };
};

const parseStars = (raw?: string) => {
  const match = normalizeText(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return undefined;

  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
};

const parseReviewCount = (raw?: string) => {
  const digits = normalizeText(raw).replace(/\D/g, "");
  if (!digits) return undefined;

  const value = Number(digits);
  return Number.isFinite(value) ? value : undefined;
};

const mapCardToProduct = (card: ScrapedCard): Product | null => {
  if (!card.title || !card.href || !card.categoryTitle) return null;

  return {
    rank: card.rank,
    title: normalizeText(card.title),
    href: card.href,
    image: card.image,
    category: slugifyCategory(card.categoryTitle),
    price: parsePrice(card.priceText),
    rating: {
      stars: parseStars(card.starsText),
      reviewsCount: parseReviewCount(card.reviewsText),
      rawStarsText: normalizeText(card.starsText) || undefined,
    },
  };
};

export const buildProductsFromCards = (cards: ScrapedCard[]): Product[] =>
  cards
    .map(mapCardToProduct)
    .filter((product): product is Product => Boolean(product));

export const groupTopByCategory = (
  products: Product[],
  limit: number
): ProductsByCategory => {
  const grouped: ProductsByCategory = {};

  for (const product of products) {
    if (!product.category) continue;
    (grouped[product.category] ??= []).push(product);
  }

  for (const category of Object.keys(grouped)) {
    grouped[category] = grouped[category]
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit);
  }

  return grouped;
};

export const getCategoryOrder = (categoryTitles: string[]) =>
  categoryTitles.map(slugifyCategory);

export const scrapeCardsFromPage = async (
  page: Page,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> => {
  const {
    categoryPrefix = CATEGORY_PREFIX,
    maxProductsPerCategory = MAX_PRODUCTS_PER_CATEGORY,
  } = options;

  await page.waitForSelector(SELECTORS.heading, { timeout: 20_000 });

  return page.evaluate(
    (selectors, prefix, maxCards) => {
      const getText = (element?: Element | null) =>
        element?.textContent?.trim() ?? "";

      const carousels = Array.from(
        document.querySelectorAll<HTMLElement>(selectors.carousel)
      );

      const result: ScrapeResult = { cards: [], categoryTitles: [] };

      for (const carousel of carousels) {
        const heading = getText(
          carousel.querySelector<HTMLElement>(selectors.heading)
        );

        if (!heading.startsWith(prefix)) continue;

        const categoryTitle = heading.replace(prefix, "").trim();
        result.categoryTitles.push(categoryTitle);

        const cards = Array.from(
          carousel.querySelectorAll<HTMLDivElement>(selectors.card)
        ).slice(0, maxCards);

        result.cards.push(
          ...cards.map((card, index) => {
            const rankText = getText(
              card.querySelector<HTMLElement>(selectors.rank)
            );
            const rankMatch = rankText.match(/\d+/);

            return {
              rank: rankMatch ? Number(rankMatch[0]) : index + 1,
              title: getText(card.querySelector<HTMLElement>(selectors.title)),
              href:
                card.querySelector<HTMLAnchorElement>(selectors.link)?.href ?? "",
              categoryTitle,
              image: card.querySelector<HTMLImageElement>(selectors.image)?.src,
              priceText: getText(
                card.querySelector<HTMLElement>(selectors.price)
              ),
              starsText: getText(
                card.querySelector<HTMLElement>(selectors.stars)
              ),
              reviewsText: getText(
                card.querySelector<HTMLElement>(selectors.reviews)
              ),
            };
          })
        );
      }

      return result;
    },
    SELECTORS,
    categoryPrefix,
    maxProductsPerCategory
  );
};
