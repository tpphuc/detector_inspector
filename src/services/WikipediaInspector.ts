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

interface ColumnData {
  header: string;
  values: number[];
}

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
   * @return A promise array of Element
   * @throw An error if the fetch failed or no tables are found
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

  /**
   * Retrieve table and extract column data
   * @param url - Wikipedia URL
   * @return A promise array of ColumnData contain extracted column data
   * @throw An error if the fetch failed or no tables are found
   */
  async getColumns(url: string): Promise<ColumnData[]> {
    // Fetch table from Wikipedia URL
    const tables = await this.getTables(url);
    // Initial an array to stored the extracted column data
    const column: ColumnData[] = [];
    // TODO: extract column data and push it to result
    return column;
  }

  /**
   * Generates a chart based on columns extracted
   * @param url - Wikipedia URL
   * @param fileName - Name of image to save after generated graph
   * @return A promise that resolve when the chart generated successfully and saved
   * @throw An error if no columns found or an issue during generation process
   */
  async generateChart(url: string, fileName: string): Promise<void> {
    try {
      // Fetch numeric columns from Wikipedia URL
      const columns = await this.getColumns(url);

      // Check if no numeric columns found then throw an error
      if (columns.length === 0) {
        throw new Error("No numeric columns found in the tables");
      }

      //TODO: save chart as image with fileName
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Something went wrong";
      throw new Error(`Failed to generate chart: ${errorMsg}`);
    }
  }
}
