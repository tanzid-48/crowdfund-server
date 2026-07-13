export type UserRole = "supporter" | "creator" | "admin";
export type CampaignStatus = "pending" | "approved" | "rejected" | "suspended";
export type ContributionStatus = "pending" | "approved" | "rejected";
export type WithdrawalStatus = "pending" | "approved";
export type ReportStatus = "pending" | "resolved";
export type PaymentSystem = "stripe" | "bkash" | "rocket" | "nagad";

export interface User {
  _id?: string;
  name: string;
  email: string;
  photoURL: string;
  role: UserRole;
  credits: number;
  creditsGranted: boolean;
  createdAt: Date;
}

export interface Campaign {
  _id?: string;
  campaign_title: string;
  campaign_story: string;
  category: string;
  funding_goal: number;
  minimum_contribution: number;
  deadline: Date;
  reward_info: string;
  campaign_image_url: string;
  amount_raised: number;
  status: CampaignStatus;
  creator_name: string;
  creator_email: string;
  createdAt: Date;
}

export interface Contribution {
  _id?: string;
  campaign_id: string;
  campaign_title: string;
  contribution_amount: number;
  supporter_email: string;
  supporter_name: string;
  creator_name: string;
  creator_email: string;
  message?: string;
  status: ContributionStatus;
  current_date: Date;
}

export interface Withdrawal {
  _id?: string;
  creator_email: string;
  creator_name: string;
  withdrawal_credit: number;
  withdrawal_amount: number;
  payment_system: PaymentSystem;
  account_number: string;
  withdraw_date: Date;
  status: WithdrawalStatus;
}

export interface Notification {
  _id?: string;
  message: string;
  toEmail: string;
  actionRoute: string;
  time: Date;
  seen: boolean;
}

export interface Payment {
  _id?: string;
  email: string;
  amount: number;
  credits: number;
  transactionId: string;
  date: Date;
}

export interface Report {
  _id?: string;
  campaign_id: string;
  campaign_title: string;
  reporter_name: string;
  reporter_email: string;
  reason: string;
  date: Date;
  status: ReportStatus;
}
