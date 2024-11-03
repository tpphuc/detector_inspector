/**
 * Document for Wikipedia API
 * Reference: https://www.mediawiki.org/wiki/API:Tutorial
 */
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";
const WIKIPEDIA_API_PARAMS = {
  action: "parse",
  format: "json",
  prop: "text",
  origin: "*",
  formatversion: "2",
};

export class WikipediaInspector {
  /**
   * Extract page title from a Wikipedia URL
   * @param url - Wikipedia URL
   * @return Decoded page title as string
   */
  private getPageTitle(url: string): string {
    const parts = url.split("/wiki/");
    return decodeURIComponent(parts[parts.length - 1]);
  }

  /**
   * Fetch and parse table from Wikipedia URL
   * @param url - Wikipedia URL
   * @return A promise array of Element.
   * @throw An error if the fetch failed or no tables are found.
   */
  async getTables(url: string): Promise<Element[]> {
    try {
      // Query params of Wikipedia request
      const params = new URLSearchParams({
        ...WIKIPEDIA_API_PARAMS,
        page: this.getPageTitle(url),
      });

      // Fetching data from Wikipedia API
      const response = await fetch(`${WIKIPEDIA_API_URL}?${params}`);
      const data = await response.json();

      // Check if response contains Wikipedia content
      if (!data?.parse?.text) {
        throw new Error("Failed to fetch Wikipedia Content");
      }

      // Parse response in string format to DOM HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.parse.text, "text/html");

      // Select all tables has class 'wikitable'
      const tables = Array.from(doc.querySelectorAll("table.wikitable"));

      // Check if no table found
      if (tables.length === 0) {
        throw new Error("No table found");
      }

      return tables;
    } catch (error) {
      // Handle errors and throw error message
      const errorMsg =
        error instanceof Error ? error.message : "Something went wrong";
      throw new Error(`Failed to get tables: ${errorMsg}`);
    }
  }
}
