"use client";

import { useMemo, useState, useTransition } from "react";
import { compressPhoto } from "@/lib/photo";
import { createPostAction } from "@/app/studio/actions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Delete02Icon,
  Location01Icon,
  Camera01Icon,
} from "@hugeicons/core-free-icons";

type PersonDraft = {
  name: string;
  twitter_handle: string;
  linkedin_url: string;
};

function defaultOccurredAt() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ComposeForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAt);
  const [published, setPublished] = useState(true);
  const [people, setPeople] = useState<PersonDraft[]>([
    { name: "", twitter_handle: "", linkedin_url: "" },
  ]);
  const [error, setError] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [pending, startTransition] = useTransition();

  const peopleJson = useMemo(
    () =>
      JSON.stringify(
        people.filter((p) => p.name.trim()).map((p) => ({
          name: p.name,
          twitter_handle: p.twitter_handle || undefined,
          linkedin_url: p.linkedin_url || undefined,
        })),
      ),
    [people],
  );

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setCompressing(true);
    setError("");
    try {
      const compressed = await compressPhoto(raw);
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Could not compress that photo. Try another.");
    } finally {
      setCompressing(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setMapsUrl(
          `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`,
        );
      },
      () => setError("Could not get location. Enter it manually."),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Add a photo first.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    fd.set("photo", file);
    fd.set("people_json", peopleJson);
    if (!published) fd.delete("published");
    else fd.set("published", "on");

    startTransition(async () => {
      try {
        await createPostAction(fd);
      } catch (err) {
        // Next.js redirect() throws; ignore digest redirects
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to post");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <label className="metal-pill flex flex-col items-center justify-center gap-3 rounded-[28px] p-6 min-h-[220px] cursor-pointer text-ink">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 w-full object-cover rounded-2xl"
          />
        ) : (
          <>
            <HugeiconsIcon
              icon={Camera01Icon}
              size={32}
              strokeWidth={1.5}
              color="currentColor"
              className="opacity-60"
            />
            <span className="text-sm font-medium">
              {compressing ? "Compressing…" : "Tap to add photo"}
            </span>
            <span className="text-xs opacity-60">Camera or library · auto WebP</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onFileChange}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-chrome/80">
        Date & time
        <input
          type="datetime-local"
          name="occurred_at"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="metal-pill rounded-2xl px-4 py-3 text-ink"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-chrome/80">
        Location name
        <input
          type="text"
          name="location_name"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="PVR Phoenix, Mumbai"
          className="metal-pill rounded-2xl px-4 py-3 text-ink"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          className="metal-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
        >
          <HugeiconsIcon
            icon={Location01Icon}
            size={16}
            strokeWidth={1.5}
            color="currentColor"
          />
          Use my location
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2 text-xs text-chrome/70">
          Lat
          <input
            name="lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="metal-pill rounded-xl px-3 py-2 text-ink text-sm"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs text-chrome/70">
          Lng
          <input
            name="lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="metal-pill rounded-xl px-3 py-2 text-ink text-sm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm text-chrome/80">
        Maps URL (optional)
        <input
          type="url"
          name="maps_url"
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          className="metal-pill rounded-2xl px-4 py-3 text-ink"
        />
      </label>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-chrome/90">People</h3>
          <button
            type="button"
            onClick={() =>
              setPeople((p) => [
                ...p,
                { name: "", twitter_handle: "", linkedin_url: "" },
              ])
            }
            className="metal-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              size={14}
              strokeWidth={1.5}
              color="currentColor"
            />
            Add
          </button>
        </div>
        {people.map((person, i) => (
          <div
            key={i}
            className="metal-surface rounded-2xl p-3 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                placeholder="Name"
                value={person.name}
                onChange={(e) => {
                  const next = [...people];
                  next[i] = { ...person, name: e.target.value };
                  setPeople(next);
                }}
                className="metal-pill flex-1 rounded-xl px-3 py-2 text-sm text-ink"
              />
              {people.length > 1 ? (
                <button
                  type="button"
                  aria-label="Remove person"
                  onClick={() =>
                    setPeople((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="metal-pill flex size-10 items-center justify-center rounded-full"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={16}
                    strokeWidth={1.5}
                    color="currentColor"
                  />
                </button>
              ) : null}
            </div>
            <input
              placeholder="Twitter @handle"
              value={person.twitter_handle}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...person, twitter_handle: e.target.value };
                setPeople(next);
              }}
              className="metal-pill rounded-xl px-3 py-2 text-sm text-ink"
            />
            <input
              placeholder="LinkedIn URL"
              value={person.linkedin_url}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...person, linkedin_url: e.target.value };
                setPeople(next);
              }}
              className="metal-pill rounded-xl px-3 py-2 text-sm text-ink"
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm text-chrome/80">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        Publish immediately
      </label>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || compressing}
        className="accent-dial relative rounded-full py-4 text-ink font-semibold text-base disabled:opacity-50"
      >
        {pending ? "Posting…" : "Post moment"}
      </button>
    </form>
  );
}
