export interface SchemaCheckResult {
  passed: boolean;
  warnings: string[];
}

// ponytail: detect obvious destructive patterns; full parsing deferred to v2
export function checkSchemaChanges(
  before: string,
  after: string,
): SchemaCheckResult {
  const warnings: string[] = [];

  // Simple pattern matching for destructive SQL
  const destructivePatterns = [
    /DROP\s+TABLE/i,
    /DROP\s+COLUMN/i,
    /DELETE\s+FROM/i,
    /TRUNCATE/i,
  ];

  // Check if after has destructive patterns that before didn't
  for (const pattern of destructivePatterns) {
    const beforeMatch = pattern.test(before);
    const afterMatch = pattern.test(after);

    if (afterMatch && !beforeMatch) {
      warnings.push(`Potentially destructive SQL detected: ${pattern.source}`);
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  };
}
