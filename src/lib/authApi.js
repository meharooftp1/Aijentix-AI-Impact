export async function getCurrentUser() {
  try {
    const res = await fetch("/.auth/me");
    if (!res.ok) return null;
    const { clientPrincipal } = await res.json();
    return clientPrincipal; // null if not signed in
  } catch {
    return null;
  }
}

export function signIn() {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/.auth/login/aad?post_login_redirect_uri=${redirect}`;
}

export function signOut() {
  window.location.href = "/.auth/logout?post_logout_redirect_uri=/";
}
