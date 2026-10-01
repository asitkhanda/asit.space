"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Camera01Icon,
  Location01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

type Props = {
  token: string;
};

const lineField =
  "w-full border-0 border-b border-[var(--color-postcard-ink)]/40 bg-transparent px-0 py-2 text-base text-black/80 outline-none placeholder:text-black/30 focus:border-[var(--color-postcard-ink)]";

export function GuestEntryForm({ token }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const previewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );

  const day = String(new Date().getDate()).padStart(2, "0");
  const year = new Date().getFullYear();
  const ink = "text-[var(--color-postcard-ink)]";

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError("Location isn’t available on this device.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude;
        const nextLng = position.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextLat}&lon=${nextLng}`,
            { headers: { Accept: "application/json" } },
          );
          if (response.ok) {
            const data = (await response.json()) as {
              name?: string;
              address?: {
                city?: string;
                town?: string;
                suburb?: string;
                neighbourhood?: string;
              };
            };
            const place =
              data.name ||
              data.address?.neighbourhood ||
              data.address?.suburb ||
              data.address?.town ||
              data.address?.city;
            if (place) setLocationName(place);
            else setLocationName(`${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`);
          } else {
            setLocationName(`${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`);
          }
        } catch {
          setLocationName(`${nextLat.toFixed(4)}, ${nextLng.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError("Couldn’t read your location. You can type it instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || compressing) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("token", token);
      body.set("name", name);
      body.set("note", note);
      body.set("location_name", locationName);
      if (lat != null) body.set("lat", String(lat));
      if (lng != null) body.set("lng", String(lng));

      let uploadPhoto = photo;
      if (photo) {
        setCompressing(true);
        try {
          const { compressGuestPhoto } = await import(
            "@/lib/compress-guest-photo"
          );
          const result = await compressGuestPhoto(photo);
          uploadPhoto = result.file;
        } finally {
          setCompressing(false);
        }
      }

      if (uploadPhoto) body.set("photo", uploadPhoto);

      const response = await fetch("/api/guest/submit", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(45000),
      });
      const data = (await response.json()) as { error?: string; ok?: boolean };

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
      router.refresh();
    } catch (error) {
      const timedOut =
        error instanceof DOMException && error.name === "TimeoutError";
      setError(
        timedOut
          ? "That took too long — try again without a huge photo."
          : error instanceof Error
            ? error.message
            : "Network error — try again.",
      );
      setCompressing(false);
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-2xl [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.16))]">
        <div className="stamp-perforation bg-[var(--color-postcard-cream)] !p-3">
          <div className="flex flex-col items-center gap-4 px-10 py-14 text-center sm:px-14">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-postcard-ink)] text-white">
              <HugeiconsIcon
                icon={Tick02Icon}
                size={28}
                strokeWidth={2.2}
                color="currentColor"
              />
            </span>
            <h1 className="font-postcard-serif text-3xl font-bold tracking-tight text-[var(--color-postcard-ink)]">
              Postcard sent
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-black/55">
              Thanks{name ? `, ${name.split(" ")[0]}` : ""}. Your mini-postcard
              is in the gallery.
            </p>
            <a
              href="/postcards"
              className="mt-2 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
            >
              See the wall
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl [filter:drop-shadow(0_18px_40px_rgba(0,0,0,0.16))]">
      <form
        onSubmit={onSubmit}
        className="stamp-perforation bg-[var(--color-postcard-cream)] !p-3"
      >
        <div className="px-6 py-6 sm:px-8 sm:py-7 md:px-10 md:py-8">
          <div>
            <h1
              className={`font-postcard-serif text-3xl font-bold tracking-tight sm:text-4xl ${ink}`}
            >
              Post Card
            </h1>
            <p
              className={`mt-1 text-[9px] font-medium uppercase tracking-[0.16em] ${ink}`}
            >
              Leave a mark
            </p>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-relaxed text-black/60">
            Welcome to my small corner of the Internet. Since you have received a
            postcard from me, it would amazing if you leave a note on my corner as
            well! Completely optional. Pinky Promise.
          </p>

          <label className="group mt-5 block cursor-pointer">
            <span className="sr-only">Add a photo</span>
            <div className="stamp-perforation !p-2 transition group-hover:brightness-[0.98]">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#3a3530] sm:aspect-[3/2]">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/80">
                    <HugeiconsIcon
                      icon={Camera01Icon}
                      size={36}
                      strokeWidth={1.6}
                      color="currentColor"
                    />
                    <div className="text-center">
                      <p className="font-mono text-2xl font-semibold tracking-wide">
                        {day}
                      </p>
                      <p className="mt-1 text-sm text-white/65">Tap to add a photo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPhoto(file);
              }}
            />
          </label>

          <p className={`mt-3 text-[10px] leading-snug ${ink}`}>
            *Highly encouraging you. Visuals always make lasting memories*
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-[1.15fr_1px_0.95fr] md:gap-0">
            <div className="md:pr-7">
              <p
                className={`text-[10px] font-medium uppercase tracking-[0.18em] ${ink}`}
              >
                This space for writing
              </p>
              <p className="mt-1 text-xs text-black/40">
                Optional but don&apos;t you wanna leave a message?
              </p>
              <textarea
                maxLength={280}
                rows={6}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What did you think of me or how did you feel about today?"
                className="mt-3 w-full resize-none border-0 bg-[repeating-linear-gradient(transparent,transparent_27px,rgba(91,132,177,0.28)_28px)] bg-[length:100%_28px] bg-origin-content px-0 py-0 text-[15px] leading-7 text-black/80 outline-none placeholder:text-black/30"
              />
              <span className="mt-1 block text-right text-[11px] text-black/35">
                {note.length}/280
              </span>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 w-px bg-[var(--color-postcard-ink)]/70" />
              <p
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.22em] ${ink}`}
              >
                Hey There! · {year}
              </p>
            </div>

            <div className="border-t border-[var(--color-postcard-ink)]/30 pt-5 md:border-t-0 md:pl-7 md:pt-0">
              <p
                className={`text-[10px] font-medium uppercase tracking-[0.18em] ${ink}`}
              >
                This side is for the address
              </p>

              <label className={`mt-4 block text-[10px] font-medium uppercase tracking-[0.14em] ${ink}`}>
                Name
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="What should we call you?"
                  className={`mt-1 ${lineField}`}
                />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <label
                    className={`text-[10px] font-medium uppercase tracking-[0.14em] ${ink}`}
                  >
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={locating}
                    className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] ${ink} disabled:opacity-50`}
                  >
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={12}
                      strokeWidth={2.2}
                      color="currentColor"
                    />
                    {locating ? "Finding…" : "Use current"}
                  </button>
                </div>
                <input
                  maxLength={120}
                  value={locationName}
                  onChange={(event) => setLocationName(event.target.value)}
                  placeholder="Where are you right now?"
                  className={`mt-1 ${lineField}`}
                />
              </div>

              {error ? (
                <p
                  className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || compressing || !name.trim()}
                className="mt-8 w-full rounded-full bg-black py-3 text-sm font-medium text-white disabled:opacity-40 md:mt-10"
              >
                {compressing
                  ? "Compressing photo…"
                  : submitting
                    ? "Sending…"
                    : "Send postcard"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
