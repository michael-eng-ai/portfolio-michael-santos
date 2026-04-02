import { isLocale, type Locale } from "@/lib/site";

export type AnalyticsPageType =
  | "home"
  | "articles_index"
  | "article_detail"
  | "projects_index"
  | "project_detail"
  | "news_index"
  | "news_detail"
  | "newsletter"
  | "contact"
  | "resume"
  | "radar"
  | "other";

export function resolveAnalyticsContext(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];
  const locale = maybeLocale && isLocale(maybeLocale)
    ? (maybeLocale as Locale)
    : undefined;
  const routeSegments = locale ? segments.slice(1) : segments;
  const [section, slug] = routeSegments;

  let pageType: AnalyticsPageType = "other";

  if (routeSegments.length === 0) {
    pageType = "home";
  } else if (section === "articles") {
    pageType = slug ? "article_detail" : "articles_index";
  } else if (section === "projects") {
    pageType = slug ? "project_detail" : "projects_index";
  } else if (section === "news") {
    pageType = slug ? "news_detail" : "news_index";
  } else if (section === "newsletter") {
    pageType = "newsletter";
  } else if (section === "contact") {
    pageType = "contact";
  } else if (section === "resume") {
    pageType = "resume";
  } else if (section === "radar") {
    pageType = "radar";
  }

  return {
    locale,
    pageType,
    section: section ?? "home",
  };
}
