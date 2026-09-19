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
