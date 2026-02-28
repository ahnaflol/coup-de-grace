import { formatCurrency } from "@/lib/formatters";

interface CurrencyDisplayProps {
  amount: number | null;
}

export function CurrencyDisplay({ amount }: CurrencyDisplayProps) {
  return <span>{formatCurrency(amount)}</span>;
}
