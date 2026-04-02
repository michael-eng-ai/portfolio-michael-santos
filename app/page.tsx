import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { resolveRequestLocale } from "@/lib/site";

export default async function RootPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveRequestLocale({
    preferredLocale: cookieStore.get("preferred_locale")?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });

  redirect(`/${locale}`);
}
