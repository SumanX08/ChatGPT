import { tool } from "ai";
import { z } from "zod";

export const webSearchTool = tool({
  description:
    "Search the web for current events, news and recent information.",

  inputSchema: z.object({
    query: z.string(),
  }),

  execute: async ({ query }) => {
    console.log("Searching:", query);

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error("Search failed");
    }

    const data = await response.json();

    console.log(data);

    return data.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));
  },
});