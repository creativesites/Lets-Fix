import { auth, currentUser } from "@clerk/nextjs/server";

function getAdminUserIds() {
  return (process.env.CLERK_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function getAdminAccess() {
  const authState = await auth();
  const configuredAdminIds = getAdminUserIds();

  if (!authState.userId) {
    return {
      isSignedIn: false,
      isAdmin: false,
      userId: null,
      user: null,
      hasConfiguredAdmins: configuredAdminIds.length > 0
    };
  }

  const user = await currentUser();
  const publicRole = typeof user?.publicMetadata?.role === "string" ? user.publicMetadata.role : null;
  const privateRole = typeof user?.privateMetadata?.role === "string" ? user.privateMetadata.role : null;
  const isAdmin = configuredAdminIds.includes(authState.userId) || publicRole === "admin" || privateRole === "admin";

  return {
    isSignedIn: true,
    isAdmin,
    userId: authState.userId,
    user,
    hasConfiguredAdmins: configuredAdminIds.length > 0
  };
}

export async function requireAdminAccess() {
  const access = await getAdminAccess();

  if (!access.isSignedIn || !access.isAdmin) {
    throw new Error("Unauthorized");
  }

  return access;
}

