export type Person = {
  id: string;
  post_id: string;
  name: string;
  twitter_handle: string | null;
  linkedin_url: string | null;
  sort_order: number;
};

export type Post = {
  id: string;
  occurred_at: string;
  location_name: string;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  photo_path: string;
  like_count: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  people?: Person[];
};

export type PostWithPeople = Post & { people: Person[] };

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  icon: "portfolio" | "linkedin" | "ai" | "twitter" | "email" | "blog";
};

export type GuestInvite = {
  id: string;
  token: string;
  label: string | null;
  created_at: string;
  used_at: string | null;
  entry_id: string | null;
  max_uses: number;
  use_count: number;
};

export type GuestEntry = {
  id: string;
  invite_id: string;
  name: string;
  note: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  photo_path: string | null;
  created_at: string;
};
