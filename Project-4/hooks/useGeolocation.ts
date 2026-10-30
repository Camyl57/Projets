"use client";

import { useCallback, useState } from "react";
import type { Coords } from "@/lib/types";

export type GeoErrorKind =
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "insecure";

export type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success" }
  | { status: "error"; error: GeoErrorKind };

export const GEO_MESSAGES: Record<GeoErrorKind, string> = {
  denied:
    "Tu as refusé l'accès à ta position. Autorise-la dans les réglages du navigateur, ou choisis une ville ci-dessous.",
  unavailable:
    "Impossible de te localiser pour l'instant (GPS ou réseau indisponible). Choisis une ville ci-dessous.",
  timeout: "La localisation a pris trop de temps. Réessaie, ou choisis une ville.",
  unsupported: "Ce navigateur ne sait pas se géolocaliser. Choisis une ville.",
  insecure:
    "La géolocalisation demande une connexion sécurisée (https). Choisis une ville en attendant.",
};

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle" });

  /** Demande la position ; `onSuccess` reçoit les coordonnées. À appeler depuis un clic. */
  const request = useCallback((onSuccess: (coords: Coords) => void) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error", error: "unsupported" });
      return;
    }
    if (!window.isSecureContext) {
      setState({ status: "error", error: "insecure" });
      return;
    }
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({ status: "success" });
        onSuccess({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        const error: GeoErrorKind =
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable";
        setState({ status: "error", error });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, request, reset };
}
