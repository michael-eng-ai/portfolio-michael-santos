function ensureUrn(prefix: "person" | "organization", value: string) {
  if (value.startsWith("urn:li:")) {
    return value;
  }

  return `urn:li:${prefix}:${value}`;
}

export function resolveLinkedinAuthorUrn(environment: NodeJS.ProcessEnv = process.env) {
  const organizationUrn = environment.LINKEDIN_ORGANIZATION_URN?.trim();
  const personUrn = environment.LINKEDIN_PERSON_URN?.trim();

  if (organizationUrn) {
    return {
      authorUrn: ensureUrn("organization", organizationUrn),
      mode: "organization" as const,
    };
  }

  if (personUrn) {
    return {
      authorUrn: ensureUrn("person", personUrn),
      mode: "person" as const,
    };
  }

  throw new Error("LinkedIn author environment variables are missing.");
}
