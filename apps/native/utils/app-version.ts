export function isOlderVersion(current: string, minimum: string) {
  const currentParts = current.split(".").map(Number);
  const minimumParts = minimum.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (currentParts[index] !== minimumParts[index]) {
      return (currentParts[index] ?? 0) < (minimumParts[index] ?? 0);
    }
  }

  return false;
}
