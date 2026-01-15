import * as fs from "fs";
import * as path from "path";

// Load environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATASOURCE_ID = process.env.NOTION_DATASOURCE_ID;
const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";

if (!NOTION_API_KEY || !NOTION_DATASOURCE_ID) {
  console.error(
    "Missing required environment variables: NOTION_API_KEY, NOTION_DATASOURCE_ID"
  );
  process.exit(1);
}

interface BlogFrontmatter {
  title: string;
  date: string;
  slug?: string;
  tags?: string[];
  categories?: string[];
  description?: string;
  draft?: boolean;
}

interface ParsedMarkdown {
  frontmatter: BlogFrontmatter;
  content: string;
}

async function notionRequest(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: unknown
): Promise<unknown> {
  const response = await fetch(`${NOTION_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function parseFrontmatter(fileContent: string): ParsedMarkdown {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    throw new Error("Invalid markdown file: no frontmatter found");
  }

  const [, frontmatterStr, content] = match;
  const frontmatter: BlogFrontmatter = { title: "", date: "" };

  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Parse arrays
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      const items = arrayContent.split(",").map((item) => {
        item = item.trim();
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          item = item.slice(1, -1);
        }
        return item;
      });
      (frontmatter as Record<string, unknown>)[key] = items.filter(
        (i) => i.length > 0
      );
    } else if (value === "true") {
      (frontmatter as Record<string, unknown>)[key] = true;
    } else if (value === "false") {
      (frontmatter as Record<string, unknown>)[key] = false;
    } else {
      (frontmatter as Record<string, unknown>)[key] = value;
    }
  }

  return { frontmatter, content: content.trim() };
}

function markdownToNotionBlocks(
  markdown: string
): Array<{
  object: "block";
  type: string;
  [key: string]: unknown;
}> {
  const blocks: Array<{
    object: "block";
    type: string;
    [key: string]: unknown;
  }> = [];
  const lines = markdown.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Headers
    if (line.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: line.slice(4) } }],
        },
      });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: line.slice(3) } }],
        },
      });
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "plain text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      blocks.push({
        object: "block",
        type: "code",
        code: {
          rich_text: [{ type: "text", text: { content: codeLines.join("\n") } }],
          language: language,
        },
      });
      continue;
    }

    // Bullet list items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
      i++;
      continue;
    }

    // Numbered list items
    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      blocks.push({
        object: "block",
        type: "numbered_list_item",
        numbered_list_item: {
          rich_text: [{ type: "text", text: { content: numberedMatch[1] } }],
        },
      });
      i++;
      continue;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      blocks.push({
        object: "block",
        type: "quote",
        quote: {
          rich_text: [{ type: "text", text: { content: line.slice(2) } }],
        },
      });
      i++;
      continue;
    }

    // Regular paragraphs
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: line } }],
      },
    });
    i++;
  }

  return blocks;
}

async function createNotionPage(
  frontmatter: BlogFrontmatter,
  content: string
): Promise<string> {
  // Combine tags and categories for Notion tags field
  const allTags = [
    ...(frontmatter.tags || []),
    ...(frontmatter.categories || []),
  ];

  const properties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: frontmatter.title } }],
    },
    Published: {
      date: { start: frontmatter.date.split(" ")[0].split("T")[0] }, // Use just the date part
    },
  };

  // Add Tags if present (capital T to match Notion property name)
  if (allTags.length > 0) {
    properties.Tags = {
      multi_select: allTags.map((tag) => ({ name: tag })),
    };
  }

  // Add Slug if present (capital S to match Notion property name)
  if (frontmatter.slug) {
    properties.Slug = {
      rich_text: [{ text: { content: frontmatter.slug } }],
    };
  }

  // Create the page with content blocks
  const blocks = markdownToNotionBlocks(content);
  
  // Notion API limits to 100 blocks per request
  // Include first 100 blocks in page creation, append the rest later
  const firstChunk = blocks.slice(0, 100);
  const remainingBlocks = blocks.slice(100);

  const page = (await notionRequest("/pages", "POST", {
    parent: {
      type: "data_source_id",
      data_source_id: NOTION_DATASOURCE_ID,
    },
    properties,
    children: firstChunk,
  })) as { id: string };

  // Append remaining blocks if any
  const chunkSize = 100;
  for (let i = 0; i < remainingBlocks.length; i += chunkSize) {
    const chunk = remainingBlocks.slice(i, i + chunkSize);
    await notionRequest(`/blocks/${page.id}/children`, "PATCH", {
      children: chunk,
    });
  }

  return page.id;
}

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function migrateToNotion(): Promise<void> {
  const contentDir = path.join(process.cwd(), "src/content/blog");

  console.log("Scanning for markdown files...");
  const markdownFiles = await getAllMarkdownFiles(contentDir);
  console.log(`Found ${markdownFiles.length} markdown files`);

  let successCount = 0;
  let errorCount = 0;

  for (const filePath of markdownFiles) {
    const relativePath = path.relative(contentDir, filePath);
    console.log(`\nProcessing: ${relativePath}`);

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(fileContent);

      if (!frontmatter.title || !frontmatter.date) {
        console.warn(`  Skipping: missing title or date`);
        errorCount++;
        continue;
      }

      const pageId = await createNotionPage(frontmatter, content);
      console.log(`  Created Notion page: ${pageId}`);
      successCount++;

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  Error: ${error}`);
      errorCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration completed!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
}

// Run the migration
migrateToNotion().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
