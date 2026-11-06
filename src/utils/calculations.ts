import { ContractPricing, InstallmentItem } from '../types/index.ts';

export interface CalculationInput {
  cashPrice: number;
  purchaseCost: number;
  downPayment: number;
  months: number;
  monthlyProfitRate?: number;
  ownerFee?: number;
  enableOwnerFee?: boolean;
  customMonthlyAmount?: number;
}

export function calculateInstallment(input: CalculationInput): ContractPricing {
  const cashPrice = Math.max(0, Number(input.cashPrice) || 0);
  const purchaseCost = Math.max(0, Number(input.purchaseCost) || 0);
  const downPayment = Math.max(0, Number(input.downPayment) || 0);
  const months = Math.max(1, Number(input.months) || 1);
  const monthlyProfitRate = input.monthlyProfitRate !== undefined ? Number(input.monthlyProfitRate) : 2.5;
  const ownerFee = input.enableOwnerFee ? (input.ownerFee !== undefined ? Number(input.ownerFee) : 50000) : 0;

  // Amount before profit that needs financing
  const baseFinanced = Math.max(0, (cashPrice + ownerFee) - downPayment);

  // Profit calculation: (Profit Rate % * months) applied to financed balance
  const totalProfitRate = (monthlyProfitRate / 100) * months;
  const totalProfit = Number((baseFinanced * totalProfitRate).toFixed(2));

  // Remaining debt to pay in monthly installments
  let remainingBalance = Number((baseFinanced + totalProfit).toFixed(2));

  // Monthly installment calculation:
  // If user explicitly provided a custom monthly amount (e.g. 800, 200, 86666.67)
  let monthlyInstallmentAmount: number;
  if (input.customMonthlyAmount !== undefined && Number(input.customMonthlyAmount) > 0) {
    monthlyInstallmentAmount = Number(Number(input.customMonthlyAmount).toFixed(2));
    // When custom monthly installment is explicitly set, remaining debt is months * monthlyInstallmentAmount
    remainingBalance = Number((monthlyInstallmentAmount * months).toFixed(2));
  } else {
    // Exact monthly installment calculation down to cents without artificial rounding (no forced 250s or 5000s)
    monthlyInstallmentAmount = Number((remainingBalance / months).toFixed(2));
  }

  // Total price buyer pays with installments
  const totalInstallmentPrice = Number((downPayment + remainingBalance).toFixed(2));

  // Net profit = Total customer payment - Actual purchase cost of mobile
  const expectedNetProfit = Number((totalInstallmentPrice - purchaseCost).toFixed(2));

  return {
    cashPrice,
    purchaseCost,
    ownerFee,
    downPayment,
    months,
    monthlyProfitRate,
    totalProfit,
    totalInstallmentPrice,
    remainingBalance,
    monthlyInstallmentAmount,
    expectedNetProfit,
  };
}

export function generateInstallmentSchedule(
  months: number,
  monthlyAmount: number,
  firstDateStr: string,
  dueDayNumber?: number,
  totalRemainingBalance?: number
): InstallmentItem[] {
  const schedule: InstallmentItem[] = [];
  const firstDate = new Date(firstDateStr || getDefaultFirstInstallmentDate());
  const numMonths = Math.max(1, months);
  const baseMonthly = Number((monthlyAmount || 0).toFixed(2));
  let runningTotal = 0;

  for (let i = 1; i <= numMonths; i++) {
    const dueDate = new Date(firstDate);
    dueDate.setMonth(firstDate.getMonth() + (i - 1));

    if (dueDayNumber && dueDayNumber >= 1 && dueDayNumber <= 31) {
      // Ensure day does not overflow month
      const daysInMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
      dueDate.setDate(Math.min(dueDayNumber, daysInMonth));
    }

    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const day = String(dueDate.getDate()).padStart(2, '0');
    const dueDateFormatted = `${year}-${month}-${day}`;

    let itemAmount = baseMonthly;

    // In the last month, balance with the exact remainder so total sum strictly equals totalRemainingBalance down to the cent!
    if (totalRemainingBalance !== undefined && totalRemainingBalance > 0 && i === numMonths) {
      itemAmount = Number((totalRemainingBalance - runningTotal).toFixed(2));
    }

    runningTotal = Number((runningTotal + itemAmount).toFixed(2));

    schedule.push({
      installmentNumber: i,
      dueDate: dueDateFormatted,
      amount: itemAmount,
      status: 'pending',
    });
  }

  return schedule;
}

export function getDefaultFirstInstallmentDate(): string {
  const d = new Date();
  // Next month same day
  d.setMonth(d.getMonth() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount: number): string {
  const val = Number(amount) || 0;
  const hasCents = Math.abs(val % 1) > 0.0001;
  return (
    val.toLocaleString('en-US', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }) + ' دینار'
  );
}
