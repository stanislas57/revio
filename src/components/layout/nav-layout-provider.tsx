"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ActionResult } from "@/lib/contracts";
import { saveNavLayout } from "@/modules/profile/server/nav-layout-actions";
import { DEFAULT_NAV_LAYOUT, isNavLayout, NAV_LAYOUT_STORAGE_KEY, type NavLayout } from "./nav-layout";

type Value = {
  layout: NavLayout;
  /** Applies the choice at once, keeps a copy on this device and saves it on the account. */
  choose: (layout: NavLayout) => Promise<ActionResult<NavLayout>>;
};

const Context = createContext<Value | null>(null);

function readDevice(): NavLayout | null {
  try {
    const value = localStorage.getItem(NAV_LAYOUT_STORAGE_KEY);
    return isNavLayout(value) ? value : null;
  } catch {
    return null;
  }
}

function writeDevice(layout: NavLayout) {
  try {
    localStorage.setItem(NAV_LAYOUT_STORAGE_KEY, layout);
  } catch {
    // Private mode or blocked storage: the account copy still applies.
  }
}

/**
 * Holds the navigation layout. The server gives the saved value (no flash on load); a choice is applied at once,
 * copied to localStorage and saved with `saveNavLayout`. When the account has no saved choice yet but this device
 * has one, the device choice is applied and saved once.
 */
export function NavLayoutProvider({
  initial,
  children,
}: {
  initial: NavLayout | null;
  children: React.ReactNode;
}) {
  const [layout, setLayout] = useState<NavLayout>(initial ?? DEFAULT_NAV_LAYOUT);
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    if (initial) {
      writeDevice(initial);
      return;
    }
    const device = readDevice();
    if (device && device !== DEFAULT_NAV_LAYOUT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with the device copy (external store)
      setLayout(device);
      void saveNavLayout(device);
    }
  }, [initial]);

  const choose = useCallback(async (next: NavLayout) => {
    setLayout(next);
    writeDevice(next);
    return saveNavLayout(next);
  }, []);

  const value = useMemo(() => ({ layout, choose }), [layout, choose]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNavLayout(): Value {
  const value = useContext(Context);
  if (!value) throw new Error("useNavLayout must be used inside <NavLayoutProvider>.");
  return value;
}
