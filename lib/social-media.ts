import { promises as fs } from "node:fs";
import path from "node:path";

import { TwitterApi } from "twitter-api-v2";

import { findLocalArticleCoverPath, isRasterArticleCover } from "@/lib/article-covers";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export function resolvePublicMediaPath(mediaPath?: string | null): string | null {
  if (!mediaPath || !isRasterArticleCover(mediaPath)) {
    return null;
  }

  if (mediaPath.startsWith("/images/")) {
    return path.join(process.cwd(), "public", mediaPath.replace(/^\//, ""));
  }

  return null;
}

export function resolveArticleCoverDiskPath(slug: string, mediaPath?: string | null): string | null {
  return findLocalArticleCoverPath(slug) ?? resolvePublicMediaPath(mediaPath);
}

/**
 * Upload a local image to X and return the media_id string.
 * Requires user-context credentials already configured on TwitterApi.
 */
export async function uploadXMedia(
  twitter: TwitterApi,
  filePath: string,
): Promise<string> {
  const mediaId = await twitter.v1.uploadMedia(filePath);
  return String(mediaId);
}

type LinkedInRegisterUploadResponse = {
  value?: {
    uploadMechanism?: {
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
        uploadUrl?: string;
      };
    };
    asset?: string;
  };
};

/**
 * Upload a raster image to LinkedIn Assets API and return the digitalmedia asset URN.
 * Requires `w_member_social` (and typically media upload permissions on the app).
 * Falls back by throwing — callers should keep ARTICLE share as backup.
 */
export async function uploadLinkedinImageAsset({
  accessToken,
  ownerUrn,
  filePath,
}: {
  accessToken: string;
  ownerUrn: string;
  filePath: string;
}): Promise<string> {
  const bytes = await fs.readFile(filePath);
  const registerResponse = await fetch(`${LINKEDIN_API_BASE}/assets?action=registerUpload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: ownerUrn,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  });

  if (!registerResponse.ok) {
    const message = await registerResponse.text();
    throw new Error(`LinkedIn registerUpload failed: ${registerResponse.status} ${message.slice(0, 240)}`);
  }

  const registered = (await registerResponse.json()) as LinkedInRegisterUploadResponse;
  const uploadUrl =
    registered.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const asset = registered.value?.asset;

  if (!uploadUrl || !asset) {
    throw new Error("LinkedIn registerUpload response missing uploadUrl or asset.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`LinkedIn binary upload failed: ${uploadResponse.status} ${message.slice(0, 240)}`);
  }

  return asset;
}
