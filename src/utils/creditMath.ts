export const PURCHASE_RATE = 10;
export const WITHDRAW_RATE = 20;
export const MIN_WITHDRAW_CREDIT = 200;

export const SIGNUP_BONUS: Record<"supporter" | "creator", number> = {
  supporter: 50,
  creator: 20,
};

export const creditsToDollars = (credits: number): number =>
  credits / WITHDRAW_RATE;
export const dollarsToCredits = (dollars: number): number =>
  dollars * PURCHASE_RATE;
