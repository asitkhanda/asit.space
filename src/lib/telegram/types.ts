export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type TelegramDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type TelegramLocation = {
  latitude: number;
  longitude: number;
};

export type TelegramVenue = {
  location: TelegramLocation;
  title: string;
  address?: string;
};

export type TelegramMessage = {
  message_id: number;
  date: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  location?: TelegramLocation;
  venue?: TelegramVenue;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

export type BotDraftStep =
  | "awaiting_date"
  | "awaiting_location"
  | "awaiting_location_name"
  | "awaiting_people";

export type BotDraft = {
  chat_id: number;
  step: BotDraftStep;
  file_id: string;
  file_unique_id: string | null;
  mime_type: string | null;
  occurred_at: string;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  location_name: string | null;
};
