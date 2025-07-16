export function getAddressColor(balance: number | null) {
  if (balance === null) return "text-gray-500";
  if (balance < 1000) return "text-yellow-800";
  if (balance < 25000) return "text-yellow-400";
  if (balance < 100000) return "text-green-400";
  if (balance < 500000) return "text-green-800";
  return "text-blue-800";
}
