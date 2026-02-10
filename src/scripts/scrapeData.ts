import path from "path";
import dotenv from "dotenv";
import axios from "axios";
import puppeteer from "puppeteer";
import type { BestsellersData } from "../models/product.model";
import {
  AMAZON_BESTSELLERS_URL,
  MAX_PRODUCTS_PER_CATEGORY,
  buildProductsFromCards,
  getCategoryOrder,
  groupTopByCategory,
  scrapeCardsFromPage,
} from "../utils/scraper-utils";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requireEnv = (key: string) => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing ${key}. Set it in .env.`);
  }

  return value;
};

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

export async function scrapeBestSellers(): Promise<BestsellersData> {
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(AMAZON_BESTSELLERS_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });

    const { cards, categoryTitles } = await scrapeCardsFromPage(page);
    const products = buildProductsFromCards(cards);

    return {
      categories: groupTopByCategory(products, MAX_PRODUCTS_PER_CATEGORY),
      categoryOrder: getCategoryOrder(categoryTitles),
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const data = await scrapeBestSellers();
  const refreshUrl = requireEnv("REFRESH_URL");
  const apiKeyToUse = requireEnv("INTERNAL_API_KEY");

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
