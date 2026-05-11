const ADMIN_PORTAL_ACCESS_KEY = "spice-root-admin-portal-access";

export function hasAdminPortalAccess() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(ADMIN_PORTAL_ACCESS_KEY) === "granted";
}

export function grantAdminPortalAccess() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ADMIN_PORTAL_ACCESS_KEY, "granted");
}

export function clearAdminPortalAccess() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ADMIN_PORTAL_ACCESS_KEY);
}
