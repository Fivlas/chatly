import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDate } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date();

  const isToday =
    from.getDate() === currentDate.getDate() &&
    from.getMonth() === currentDate.getMonth() &&
    from.getFullYear() === currentDate.getFullYear();

  const isSameYear = from.getFullYear() === currentDate.getFullYear();

  if (isToday) {
    return formatDate(from, "k:mm");
  } else if (isSameYear) {
    return formatDate(from, "d MMMM, k:mm");
  } else {
    return formatDate(from, "d MMMM, yyyy, k:mm");
  }
}


export function chatHrefConstructor(id1: string, id2: string) {
  const sortedIds = [id1, id2].sort()
  return `${sortedIds[0]}--${sortedIds[1]}`
}
