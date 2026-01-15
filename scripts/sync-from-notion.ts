import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import * as fs from "fs";
import * as path from "path";
import type {
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

// Load environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATASOURCE_ID = process.env.NOTION_DATASOURCE_ID;

if (!NOTION_API_KEY || !NOTION_DATASOURCE_ID) {
  console.error(
    "Missing required environment variables: NOTION_API_KEY, NOTION_DATASOURCE_ID"
  );
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Timestamp file to track last sync time
const SYNC_STATE_FILE = path.join(process.cwd(), ".notion-sync-state.json");

interface SyncState {
  lastSyncTime: string;
}

function loadSyncState(): SyncState | null {
  try {
    if (fs.existsSync(SYNC_STATE_FILE)) {
      const content = fs.readFileSync(SYNC_STATE_FILE, "utf-8");
      return JSON.parse(content) as SyncState;
    }
  } catch (error) {
    console.warn("Failed to load sync state, will do full sync:", error);
  }
  return null;
}

function saveSyncState(state: SyncState): void {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  date: string;
  tags: string[];
  content: string;
}

function getRichTextContent(richText: RichTextItemResponse[]): string {
  return richText.map((item) => item.plain_text).join("");
}

function getPropertyValue(
  page: PageObjectResponse,
  propertyName: string
): unknown {
  const property = page.properties[propertyName];
  if (!property) return null;

  switch (property.type) {
    case "title":
      return getRichTextContent(property.title);
    case "rich_text":
      return getRichTextContent(property.rich_text);
    case "date":
      return property.date?.start || null;
    case "multi_select":
      return property.multi_select.map((item) => item.name);
    case "select":
      return property.select?.name || null;
    case "checkbox":
      return property.checkbox;
    case "created_time":
      return property.created_time;
    default:
      return null;
  }
}

async function fetchBlogPosts(lastSyncTime?: string): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];

  let hasMore = true;
  let startCursor: string | undefined = undefined;

  // Build filter for incremental sync using timestamp filter
  const filter = lastSyncTime
    ? {
        timestamp: "last_edited_time" as const,
        last_edited_time: {
          after: lastSyncTime,
        },
      }
    : undefined;

  if (lastSyncTime) {
    console.log(`Incremental sync: fetching posts edited after ${lastSyncTime}`);
  } else {
    console.log("Full sync: fetching all posts");
  }

  while (hasMore) {
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATASOURCE_ID!,
      start_cursor: startCursor,
      filter: filter,
      sorts: [
        {
          property: "Published",
          direction: "descending",
        },
      ],
    });

    for (const page of response.results) {
      if (!("properties" in page)) continue;

      const pageObj = page as PageObjectResponse;

      const title = getPropertyValue(pageObj, "Name") as string;
      const slug = getPropertyValue(pageObj, "Slug") as string;
      const publishedDate = getPropertyValue(pageObj, "Published") as string;
      const createdTime = getPropertyValue(pageObj, "Created time") as string;
      const tags = (getPropertyValue(pageObj, "Tags") as string[]) || [];

      // Use Published date if available, otherwise fall back to created time
      const date = publishedDate || createdTime;

      if (!title || !date) {
        console.warn(`Skipping page ${page.id}: missing title or date`);
        continue;
      }

      // Convert Notion blocks to markdown
      const mdBlocks = await n2m.pageToMarkdown(page.id);
      const content = n2m.toMarkdownString(mdBlocks).parent;

      posts.push({
        id: page.id,
        title,
        slug: slug || generateSlug(title),
        date,
        tags,
        content,
      });
    }

    hasMore = response.has_more;
    startCursor = response.next_cursor || undefined;
  }

  return posts;
}

function generateSlug(title: string): string {
  // Simple slug generation for Chinese titles - use pinyin or just hash
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateFrontmatter(post: BlogPost): string {
  const lines = ["---"];
  lines.push(`title: "${post.title.replace(/"/g, '\\"')}"`);
  lines.push(`date: ${post.date}`);
  lines.push(`slug: ${post.slug}`);

  if (post.tags.length > 0) {
    lines.push(`tags: [${post.tags.map((t) => `'${t}'`).join(", ")}]`);
  }

  lines.push(`draft: false`);
  lines.push("---");

  return lines.join("\n");
}

function getYearFromDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.getFullYear().toString();
}

async function syncPosts(): Promise<void> {
  // Load previous sync state
  const syncState = loadSyncState();
  const lastSyncTime = syncState?.lastSyncTime;
  
  // Record current time before fetching (to avoid missing posts created during sync)
  const currentSyncTime = new Date().toISOString();

  console.log("Fetching posts from Notion...");
  const posts = await fetchBlogPosts(lastSyncTime);
  
  if (posts.length === 0) {
    console.log("No new posts to sync");
    // Still update sync time even if no new posts
    saveSyncState({ lastSyncTime: currentSyncTime });
    return;
  }
  
  console.log(`Found ${posts.length} new posts to sync`);

  const contentDir = path.join(process.cwd(), "src/content/blog");

  // Group posts by year
  const postsByYear = new Map<string, BlogPost[]>();
  for (const post of posts) {
    const year = getYearFromDate(post.date);
    if (!postsByYear.has(year)) {
      postsByYear.set(year, []);
    }
    postsByYear.get(year)!.push(post);
  }

  for (const [year, yearPosts] of postsByYear) {
    const yearDir = path.join(contentDir, year);

    // Create year directory if it doesn't exist
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }

    // Get existing files in the year directory to determine next index
    const existingFiles = fs.existsSync(yearDir) 
      ? fs.readdirSync(yearDir).filter(f => f.endsWith('.md'))
      : [];
    
    // Find the highest existing index
    let maxIndex = 0;
    for (const file of existingFiles) {
      const match = file.match(/^(\d+)-/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (index > maxIndex) {
          maxIndex = index;
        }
      }
    }

    // Sort new posts by date within the year
    yearPosts.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let newPostIndex = 0;
    for (let i = 0; i < yearPosts.length; i++) {
      const post = yearPosts[i];
      
      // Check if a file with the same slug already exists
      const existingSlugFile = existingFiles.find(f => f.includes(post.slug));
      
      let filename: string;
      if (existingSlugFile) {
        // Use existing filename to overwrite
        filename = existingSlugFile;
        console.log(`Updating existing file: ${existingSlugFile}`);
      } else {
        // Create new file with next available index
        const index = String(maxIndex + newPostIndex + 1).padStart(2, "0");
        filename = `${index}-${post.slug}.md`;
        newPostIndex++;
      }
      
      const filePath = path.join(yearDir, filename);

      const frontmatter = generateFrontmatter(post);
      const fileContent = `${frontmatter}\n\n${post.content}`;

      fs.writeFileSync(filePath, fileContent, "utf-8");
      console.log(`Written: ${filePath}`);
    }
  }

  // Save sync state after successful sync
  saveSyncState({ lastSyncTime: currentSyncTime });
  console.log(`Sync completed! State saved with timestamp: ${currentSyncTime}`);
}

// Run the sync
syncPosts().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});
