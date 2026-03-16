export type ReviewStatus = "pending" | "approved" | "rejected";

export type Review = {
  id: string;
  name: string;
  location: string;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  moderatedAt: string | null;
};

export type ReviewInput = {
  name: string;
  location?: string;
  rating: number;
  message: string;
};

export type ReviewMetrics = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageApprovedRating: number;
};

