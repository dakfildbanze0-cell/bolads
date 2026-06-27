export function formatPrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null) return "0 MT";
  
  // If it's a number, format it
  if (typeof price === 'number') {
    return `${price.toLocaleString('pt-MZ')} MT`;
  }
  
  // If it's a string, try to extract the number
  let cleanStr = price.toString().trim();
  
  // Check if it already has MT or MZN
  if (cleanStr.toUpperCase().includes('MT') || cleanStr.toUpperCase().includes('MZN')) {
    return cleanStr;
  }
  
  // Remove currency symbols like $, €, etc.
  cleanStr = cleanStr.replace(/[€$R\$£]/g, '').trim();
  
  // Try to parse as float to properly format
  const parsed = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
  
  if (!isNaN(parsed)) {
    return `${parsed.toLocaleString('pt-MZ')} MT`;
  }
  
  return `${cleanStr} MT`;
}
