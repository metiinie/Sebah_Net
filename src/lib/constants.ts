// Admin email configuration
export const ADMIN_EMAILS = [
  'abumahilkerim@gmail.com',
  'admin@example.com',
];

// Permission types
export type Permission = 
  | 'view_content'
  | 'upload_movies'
  | 'upload_music'
  | 'delete_content'
  | 'manage_users'
  | 'access_admin_panel'
  | 'view_analytics'
  | 'manage_settings';

// Default permissions for admin users
export const ADMIN_PERMISSIONS: Permission[] = [
  'view_content',
  'upload_movies',
  'upload_music',
  'delete_content',
  'manage_users',
  'access_admin_panel',
  'view_analytics',
  'manage_settings'
];

// Default permissions for regular users
export const USER_PERMISSIONS: Permission[] = [
  'view_content'
];
