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
  label: string | null;
};

export function GuestEntryForm({ token, label }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const previewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );

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
              address?: { city?: string; town?: string; suburb?: string; neighbourhood?: string };
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
    if (submitting) return;
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
      if (photo) body.set("photo", photo);

      const response = await fetch("/api/guest/submit", {
        method: "POST",
        body,
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
        <span className="flex size-14 items-center justify-center rounded-full bg-black text-white">
          <HugeiconsIcon icon={Tick02Icon} size={28} strokeWidth={2.2} color="currentColor" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Postcard sent</h1>
        <p className="text-sm text-black/55">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}. Your mini-postcard is in the gallery.
        </p>
        <a
          href="/postcards"
          className="mt-2 inline-flex rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
        >
          See the wall
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/5 md:p-8"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/40">
        Guest postcard
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Leave a mark</h1>
      <p className="mt-2 text-sm text-black/55">
        {label
          ? `From ${label} — one-time invite.`
          : "One-time invite from Asit’s postcard."}{" "}
        Name is required; note, location, and photo are recommended.
      </p>

      <label className="mt-8 block text-sm font-medium">
        Name
        <input
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="What should we call you?"
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 py-3 text-base outline-none focus:border-black/30"
        />
      </label>

      <label className="mt-5 block text-sm font-medium">
        Short note
        <span className="ml-2 text-xs font-normal text-black/40">optional</span>
        <textarea
          maxLength={280}
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="A line from tonight…"
          className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 py-3 text-base outline-none focus:border-black/30"
        />
        <span className="mt-1 block text-right text-[11px] text-black/35">
          {note.length}/280
        </span>
      </label>

      <div className="mt-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium">
            Location
            <span className="ml-2 text-xs font-normal text-black/40">recommended</span>
          </label>
          <button
            type="button"
            onClick={captureLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            <HugeiconsIcon icon={Location01Icon} size={14} strokeWidth={2.2} color="currentColor" />
            {locating ? "Finding…" : "Use current"}
          </button>
        </div>
        <input
          maxLength={120}
          value={locationName}
          onChange={(event) => setLocationName(event.target.value)}
          placeholder="Where are you right now?"
          className="mt-2 w-full rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 py-3 text-base outline-none focus:border-black/30"
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">
          Photo
          <span className="ml-2 text-xs font-normal text-black/40">recommended</span>
        </p>
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[22px] border border-dashed border-black/15 bg-[#f7f7f8] aspect-[4/3]">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <HugeiconsIcon icon={Camera01Icon} size={28} strokeWidth={1.8} color="currentColor" />
              <span className="text-sm text-black/50">Tap to add a photo</span>
            </>
          )}
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
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="mt-6 w-full rounded-full bg-black py-3.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {submitting ? "Sending…" : "Send postcard"}
      </button>
    </form>
  );
}
