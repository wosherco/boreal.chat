import { compareDesc, isSameWeek, isThisWeek, isToday, isYesterday, subWeeks } from "date-fns";

let currentDateState = $state(new Date());

setInterval(() => {
  currentDateState = new Date();
}, 30000);

export const currentDate = () => currentDateState;

/**
 * Groups items by date. It will group them by today, yesterday, this week, past week, others.
 *
 * @param items - The items to group.
 * @param now - The current date. This is manually passed so it's reactive.
 * @returns The grouped items.
 */
export function groupByDate<T extends { updatedAt: Date }>(items: T[], now: Date) {
  const sortedItems = [...items].sort((a, b) => compareDesc(a.updatedAt, b.updatedAt));

  const groups: {
    today: T[];
    yesterday: T[];
    thisWeek: T[];
    lastWeek: T[];
    others: T[];
  } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    lastWeek: [],
    others: [],
  };

  for (const item of sortedItems) {
    const itemDate = item.updatedAt;
    if (isToday(itemDate)) {
      groups.today.push(item);
    } else if (isYesterday(itemDate)) {
      groups.yesterday.push(item);
    } else if (isThisWeek(itemDate, { weekStartsOn: 1 })) {
      groups.thisWeek.push(item);
    } else if (isSameWeek(itemDate, subWeeks(now, 1), { weekStartsOn: 1 })) {
      groups.lastWeek.push(item);
    } else {
      groups.others.push(item);
    }
  }

  return groups;
}
