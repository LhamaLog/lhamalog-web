export function filterNavItems<T extends { id: string }>(items: T[], visibleItems?: string[], hiddenItems: string[] = []): T[] {
  return items.filter((item) => (!visibleItems || visibleItems.includes(item.id)) && !hiddenItems.includes(item.id))
}
