import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import type {
  BestsellersData,
  Product,
  ProductsByCategory,
} from "../models/product.model";

const AMAZON_BESTSELLERS_URL = "https://www.amazon.com.br/bestsellers";
const CATEGORY_PREFIX = "Mais Vendidos em ";
const MAX_PRODUCTS_PER_CATEGORY = 3;

type ScrapedCard = {
  rank: number;
  title: string;
  href: string;
  categoryTitle: string;
  image?: string;
  priceText?: string;
  starsText?: string;
  reviewsText?: string;
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
  const text = normalizeText(raw);
  if (!text) return undefined;

  const match = text.match(/(\d+(?:[.,]\d+)?)/);
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

const groupTopByCategory = (
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

const scrapeCardsFromPage = async (page: Page): Promise<ScrapedCard[]> => {
  await page.waitForSelector("h2.a-carousel-heading", { timeout: 20_000 });

  return page.evaluate(
    (categoryPrefix: string, maxProductsPerCategory: number | undefined) => {
      const headingSelector = "h2.a-carousel-heading";
      const carouselSelector = ".a-carousel-container";
      const cardSelector = "li.a-carousel-card div[data-asin]";
      const titleSelector = ".p13n-sc-truncate-desktop-type2, .p13n-sc-truncated";
      const linkSelector = 'a.a-link-normal.aok-block[href*="/dp/"]';
      const imageSelector = "img.p13n-product-image";
      const rankSelector = ".zg-bdg-text";
      const priceSelector = '[class*="p13n-sc-price"]';
      const starsSelector = ".a-icon-star-small .a-icon-alt";
      const reviewsSelector = ".a-icon-row .a-size-small";

      const carousels = Array.from(
        document.querySelectorAll<HTMLElement>(carouselSelector)
      );

      return carousels.flatMap((carousel) => {
        const headingText =
          carousel.querySelector<HTMLHeadingElement>(headingSelector)?.textContent ??
          "";
        const heading = headingText.trim();

        if (!heading.startsWith(categoryPrefix)) return [];

        const categoryTitle = heading.replace(categoryPrefix, "").trim();
        const cards = Array.from(
          carousel.querySelectorAll<HTMLDivElement>(cardSelector)
        ).slice(0, maxProductsPerCategory);

        return cards.map((card, index) => {
          const title = card.querySelector<HTMLElement>(titleSelector)?.textContent;
          const link = card.querySelector<HTMLAnchorElement>(linkSelector)?.href;
          const image = card.querySelector<HTMLImageElement>(imageSelector)?.src;

          const rankText =
            card.querySelector<HTMLElement>(rankSelector)?.textContent ?? "";
          const rankMatch = rankText.match(/\d+/);

          return {
            rank: rankMatch ? Number(rankMatch[0]) : index + 1,
            title: title?.trim() ?? "",
            href: link ?? "",
            categoryTitle,
            image,
            priceText:
              card.querySelector<HTMLElement>(priceSelector)?.textContent?.trim(),
            starsText:
              card.querySelector<HTMLElement>(starsSelector)?.textContent?.trim(),
            reviewsText:
              card.querySelector<HTMLElement>(reviewsSelector)?.textContent?.trim(),
          };
        });
      });
    },
    CATEGORY_PREFIX,
    MAX_PRODUCTS_PER_CATEGORY
  );
};

export async function scrapeBestSellers(): Promise<BestsellersData> {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(AMAZON_BESTSELLERS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    const cards = await scrapeCardsFromPage(page);
    const products: Product[] = [];

    for (const card of cards) {
      const product = mapCardToProduct(card);
      if (product) products.push(product);
    }

    return {
      categories: groupTopByCategory(products, MAX_PRODUCTS_PER_CATEGORY),
    };
  } finally {
    await browser.close();
  }
}

export default scrapeBestSellers;

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const sendData = async (
  url: string,
  apiKey: string,
  data: BestsellersData
) => {
  try {
    await axios.post(url, data, {
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? "unknown";
      const data = error.response?.data;
      const detail =
        typeof data === "string"
          ? data
          : data
          ? JSON.stringify(data)
          : error.message;

      throw new Error(`Refresh failed (${status}): ${detail}`);
    }

    throw error;
  }
};

async function main() {
  const data = await scrapeBestSellers();
  const refreshUrl = process.env.REFRESH_URL?.trim();
  const apiKeyToUse = process.env.INTERNAL_API_KEY?.trim();

  if (!refreshUrl) {
    throw new Error("Missing REFRESH_URL. Set it in .env.");
  }

  if (!apiKeyToUse) {
    throw new Error("Missing INTERNAL_API_KEY. Set it in .env.");
  }

  await sendData(refreshUrl, apiKeyToUse, data);
  console.log(
    "Scrape ok. Make a GET request to the getBestsellers endpoint to see the result."
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

