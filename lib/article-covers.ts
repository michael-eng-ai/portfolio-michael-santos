import { existsSync } from "node:fs";
import path from "node:path";

const COVER_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

/**
 * Returns a root-relative public URL for a generated article cover on disk,
 * or undefined when no raster cover exists yet.
 */
export function findLocalArticleCoverUrl(slug: string): string | undefined {
  const directory = path.join(process.cwd(), "public", "images", "articles");

  for (const extension of COVER_EXTENSIONS) {
    const fileName = `${slug}.${extension}`;
    if (existsSync(path.join(directory, fileName))) {
      return `/images/articles/${fileName}`;
    }
  }

  return undefined;
}

export function findLocalArticleCoverPath(slug: string): string | undefined {
  const directory = path.join(process.cwd(), "public", "images", "articles");

  for (const extension of COVER_EXTENSIONS) {
    const filePath = path.join(directory, `${slug}.${extension}`);
    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return undefined;
}

export function isRasterArticleCover(imageUrl?: string | null): boolean {
  if (!imageUrl) {
    return false;
  }

  return /\.(jpe?g|png|webp)(\?|$)/i.test(imageUrl);
}

export function isGenericSvgCover(imageUrl?: string | null): boolean {
  if (!imageUrl) {
    return true;
  }

  return imageUrl.toLowerCase().endsWith(".svg");
}
