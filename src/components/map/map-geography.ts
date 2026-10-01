import type { PostWithPeople } from "@/lib/types";

export type GeoPost = PostWithPeople & { lat: number; lng: number };

export type MapTarget = {
  id: string;
  label: string;
  lat: number | null;
  lng: number | null;
  located: boolean;
};

export type CameraTarget = {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
};

/** Fixed oceanic “island” for posts without GPS — intentional, not latest-geo. */
export const UNLOCATED_CENTER: [number, number] = [-28.65, 38.45];
export const UNLOCATED_LABEL = "Unlocated memories";

const NEAR_KM = 90;
const BEARING = -22;

export function isGeoPost(post: PostWithPeople): post is GeoPost {
  return (
    typeof post.lat === "number" &&
    typeof post.lng === "number" &&
    Number.isFinite(post.lat) &&
    Number.isFinite(post.lng)
  );
}

export function targetForPost(post: PostWithPeople): MapTarget {
  return isGeoPost(post)
    ? {
        id: post.id,
        label: post.location_name,
        lat: post.lat,
        lng: post.lng,
        located: true,
      }
    : {
        id: post.id,
        label: post.location_name || UNLOCATED_LABEL,
        lat: null,
        lng: null,
        located: false,
      };
}

export function centerForTarget(target: MapTarget): [number, number] {
  if (target.located && target.lng != null && target.lat != null) {
    return [target.lng, target.lat];
  }
  return UNLOCATED_CENTER;
}

export function cameraForTarget(target: MapTarget): CameraTarget {
  if (target.located && target.lng != null && target.lat != null) {
    return {
      center: [target.lng, target.lat],
      zoom: 15.2,
      pitch: 52,
      bearing: BEARING,
    };
  }
  return {
    center: UNLOCATED_CENTER,
    zoom: 5.2,
    pitch: 42,
    bearing: BEARING,
  };
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  from: [number, number],
  to: [number, number],
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function greatCircleMidpoint(
  from: [number, number],
  to: [number, number],
): [number, number] {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const [lng1, lat1] = [toRad(from[0]), toRad(from[1])];
  const [lng2, lat2] = [toRad(to[0]), toRad(to[1])];
  const bx = Math.cos(lat2) * Math.cos(lng2 - lng1);
  const by = Math.cos(lat2) * Math.sin(lng2 - lng1);
  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2),
  );
  const lng3 = lng1 + Math.atan2(by, Math.cos(lat1) + bx);
  return [toDeg(lng3), toDeg(lat3)];
}

export type CameraMotion =
  | { kind: "jump"; camera: CameraTarget }
  | { kind: "ease"; camera: CameraTarget; duration: number }
  | {
      kind: "travel";
      overview: CameraTarget;
      midpoint: CameraTarget;
      settle: CameraTarget;
      durationMs: number;
    };

/**
 * Build a camera motion plan from the previous frame to the next target.
 * Near hops ease; long hops zoom out → midpoint → settle.
 */
export function planCameraMotion(
  previous: CameraTarget | null,
  next: MapTarget,
  reducedMotion: boolean,
): CameraMotion {
  const settle = cameraForTarget(next);
  if (reducedMotion || !previous) {
    return { kind: "jump", camera: settle };
  }

  const distance = haversineKm(previous.center, settle.center);
  if (distance < 0.05) {
    return { kind: "jump", camera: settle };
  }
  if (distance < NEAR_KM) {
    return {
      kind: "ease",
      camera: settle,
      duration: Math.min(1600, 700 + distance * 8),
    };
  }

  const mid = greatCircleMidpoint(previous.center, settle.center);
  const overviewZoom = Math.max(3.8, Math.min(8.5, 11 - Math.log10(distance + 1) * 1.6));
  return {
    kind: "travel",
    overview: {
      center: previous.center,
      zoom: overviewZoom,
      pitch: 28,
      bearing: BEARING,
    },
    midpoint: {
      center: mid,
      zoom: overviewZoom,
      pitch: 32,
      bearing: BEARING,
    },
    settle,
    durationMs: Math.min(3600, 1800 + distance * 0.4),
  };
}

export function interpolateTargets(
  from: MapTarget | undefined,
  to: MapTarget | undefined,
  amount: number,
): MapTarget {
  const start = from ?? to;
  const end = to ?? from;
  if (!start || !end) {
    return {
      id: "empty",
      label: UNLOCATED_LABEL,
      lat: null,
      lng: null,
      located: false,
    };
  }

  if (
    !start.located ||
    !end.located ||
    start.lat == null ||
    start.lng == null ||
    end.lat == null ||
    end.lng == null
  ) {
    return amount < 0.5 ? start : end;
  }

  return {
    id: amount < 0.5 ? start.id : end.id,
    label: amount < 0.5 ? start.label : end.label,
    lat: start.lat + (end.lat - start.lat) * amount,
    lng: start.lng + (end.lng - start.lng) * amount,
    located: true,
  };
}

export function realTargets(posts: PostWithPeople[]) {
  return posts.filter(isGeoPost).map((post) => targetForPost(post));
}
