import { Chart, registerables } from "chart.js";

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

const METRES_REGEX = /(\d+[.,]?\d*)\s*m/; // Regex to match meters
const FEET_REGEX = /(\d+)\s*ft\s*(\d+)?\s*in/; // Regex to match feet and inches

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
   * Extract column data from HTML table element.
   * @param table - HTML table element
   * @return An array of ColumnData contain height value.
   */
  private extractColumnData(table: Element): ColumnData[] {
    // Initial an array to store column data
    const columns: ColumnData[] = [];
    // Create a ColumnData for "Height" column
    columns.push({
      header: "Height",
      values: [],
    });
    // Get all rows in the table
    const rows = table.querySelectorAll("tr");
    // Iterate each row, start from the 2nd row to skip the header
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll("td")); // Get all cells of current row
      if (cells.length > 0) {
        const markCell = cells[0]; // Get Mark column
        const value = markCell.textContent?.trim() || ""; // Get cell content and trim

        // Handle cell value
        const meterValue = value.match(METRES_REGEX);
        if (meterValue) {
          const numValue = parseFloat(meterValue[1].replace(",", ".")); // Convert to number
          if (!isNaN(numValue)) {
            columns[0].values.push(numValue); // Push meters value to column
          }
        } else {
          // Handle feet and inches values
          const feetValue = value.match(FEET_REGEX);
          if (feetValue) {
            const feet = parseFloat(feetValue[1]); // Extract feet value
            const inches = feetValue[2] ? parseFloat(feetValue[2]) : 0; // Extract inches value
            const meters = feet * 0.3048 + inches * 0.0254; // Convert to meters
            columns[0].values.push(meters); // Push meters value to column
          }
        }
      }
    }

    return columns[0].values.length > 0 ? [columns[0]] : [];
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
    // Iterate each table and extract column data
    tables.forEach((table) => {
      const columnDatas = this.extractColumnData(table);
      // Push the result into column array
      column.push(...columnDatas);
    });

    return column;
  }

  /**
   * Save a chart as image based on column data
   * @param url - Wikipedia URL
   * @param columnData - An array of ColumnData contain height value
   * @param fileName - Name of image to save after generated graph
   * @return A promise that resolve when the chart generated successfully and saved
   * @throw An error if cannot get the canvas context
   */
  async saveChart(
    url: string,
    columnData: ColumnData[],
    fileName: string
  ): Promise<void> {
    Chart.register(...registerables);

    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array.from(
          { length: columnData[0].values.length },
          (_, i) => `Record ${i + 1}`
        ),
        datasets: [
          {
            label: "Height (meters)",
            data: columnData[0].values,
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Height (meters)",
            },
            ticks: {
              callback: (value) => Number(value).toFixed(2),
            },
          },
          x: {
            title: {
              display: true,
              text: "Record Progression",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: this.getPageTitle(url),
            font: {
              size: 16,
              weight: "bold",
            },
          },
          legend: {
            display: true,
            position: "bottom",
          },
        },
      },
    });

    // IMPORTANT: add setTimeout to wait the chart render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get the data URL and create download
    const dataUrl = canvas.toDataURL("image/png");
    // Create and trigger download
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    // Simulate a click on the link to trigger the download
    link.dispatchEvent(new MouseEvent("click"));
    // Clean up
    chart.destroy();
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
      // Generate chart and save as image
      await this.saveChart(url, columns, fileName);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Something went wrong";
      throw new Error(`Failed to generate chart: ${errorMsg}`);
    }
  }
}
