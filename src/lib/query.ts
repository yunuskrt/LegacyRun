// Only the transform is shared — each endpoint pipes it into its own constraints.
export const splitIds = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
