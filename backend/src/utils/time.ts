export function getCurrentTime(): string {
  const now = new Date();
  return now.toISOString();
}

export function getCurrentDateFormatted(): string {
  const now = new Date();
  // Returns YYYY-MM-DD format
  return now.toISOString().split('T')[0];
}

export function getHumanReadableTime(): string {
  const now = new Date();
  return now.toLocaleString();
}
