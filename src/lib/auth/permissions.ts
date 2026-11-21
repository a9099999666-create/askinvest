export type Permissions = {
  editContent: boolean;
  publish: boolean;
  leads: boolean;
  contacts: boolean;
  campaigns: boolean;
};

export const EMPTY_PERMISSIONS: Permissions = {
  editContent: false,
  publish: false,
  leads: false,
  contacts: false,
  campaigns: false,
};

export const OWNER_PERMISSIONS: Permissions = {
  editContent: true,
  publish: true,
  leads: true,
  contacts: true,
  campaigns: true,
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isOwner: boolean;
  isActive: boolean;
  permissions: Permissions;
};

export function can(user: SessionUser, permission: keyof Permissions): boolean {
  if (!user.isActive) return false;
  if (user.isOwner) return true;
  return Boolean(user.permissions?.[permission]);
}
