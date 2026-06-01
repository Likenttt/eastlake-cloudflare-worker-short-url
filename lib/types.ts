export type LinkRecord = {
  id: string;
  slug: string;
  longUrl: string;
  passwordHash?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LinkStats = {
  slug: string;
  total: number;
  lastClickedAt?: string;
};

export type PublicLink = LinkRecord & {
  shortUrl: string;
  clicks: number;
  lastClickedAt?: string;
};

export type ClickEvent = {
  slug: string;
  at: string;
  referer?: string;
  userAgent?: string;
  ipHash?: string;
};

export type HistoryPoint = {
  date: string;
  clicks: number;
};

export type CreateLinkInput = {
  longUrl: string;
  slug?: string;
  password?: string;
  shortUrlLength?: number;
  expirationMinutes?: number;
};
