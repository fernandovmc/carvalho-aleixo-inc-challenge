import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";
import cors from "cors";
import https from "https";

const app = express();
const PORT = process.env.PORT || 3000;

// Permitir requisições do frontend
app.use(cors({
  origin: ["https://amazon-web-scraper-three.vercel.app"]
}));

// Prevenir cache (evita 304 Not Modified)
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Rota de scraping
app.get(
  "/api/scrape-product",
  (async (req: express.Request, res: express.Response): Promise<void> => {
    const keyword = req.query.keyword as string;
    if (!keyword) {
      res.status(400).json({ error: "Keyword is required" });
      return;
    }

    const url = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;

    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Connection": "keep-alive"
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Verifica se a Amazon bloqueou o acesso com CAPTCHA
      if (
        document.title.includes("Robot Check") ||
        document.body.textContent?.includes("Enter the characters you see below")
      ) {
        res.status(403).json({ error: "Amazon blocked the request with Captcha" });
        return;
      }

      const results: any[] = [];
      const items = document.querySelectorAll("div.s-main-slot > div[data-component-type='s-search-result']");

      items.forEach((item: Element) => {
        const title = item.querySelector("h2 span")?.textContent?.trim() || null;
        const rating = item.querySelector("[aria-label*='out of 5 stars']")?.getAttribute("aria-label") || null;
        const reviews = item.querySelector("span[aria-label$='ratings'], span[aria-label$='rating']")?.textContent?.trim() || null;
        const image = item.querySelector("img")?.getAttribute("src") || null;

        if (title) {
          results.push({ title, rating, reviews, image });
        }
      });

      if (results.length === 0) {
        res.status(204).json({ message: "No products found. Amazon may have changed the structure or blocked the request." });
        return;
      }

      res.status(200).json({ keyword, results });

    } catch (err: any) {
      console.error(err.message);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }) as express.RequestHandler
);

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});