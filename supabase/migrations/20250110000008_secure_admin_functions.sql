/*
  # Secure Admin Functions
  
  This migration updates the admin functions to be more secure and configurable.
*/

-- =============================================
-- 1. DROP EXISTING FUNCTIONS
-- =============================================

DROP FUNCTION IF EXISTS is_admin_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS is_admin_by_id(uuid) CASCADE;

-- =============================================
-- 2. CREATE SECURE ADMIN FUNCTIONS
-- =============================================

-- Function to check if user is admin (by email) - more secure version
CREATE OR REPLACE FUNCTION is_admin_by_email(user_email text)
RETURNS boolean AS $$
DECLARE
  admin_emails text[];
BEGIN
  -- Get admin emails from environment variable or use default
  -- In production, set ADMIN_EMAILS environment variable
  admin_emails := string_to_array(
    COALESCE(
      current_setting('app.admin_emails', true),
      'abumahilkerim@gmail.com,admin@example.com'
    ),
    ','
  );
  
  -- Check if user email is in admin list (case-insensitive)
  RETURN lower(user_email) = ANY(
    SELECT lower(trim(email)) FROM unnest(admin_emails) AS email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin (by user ID) - more secure version
CREATE OR REPLACE FUNCTION is_admin_by_id(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_email text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  -- Return false if user not found
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN is_admin_by_email(user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to add admin email (for super admins only)
CREATE OR REPLACE FUNCTION add_admin_email(new_email text)
RETURNS boolean AS $$
DECLARE
  current_admins text;
  updated_admins text;
BEGIN
  -- Only allow if current user is admin
  IF NOT is_admin_by_id(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get current admin emails
  current_admins := COALESCE(
    current_setting('app.admin_emails', true),
    'abumahilkerim@gmail.com,admin@example.com'
  );
  
  -- Add new email if not already present
  IF position(lower(new_email) in lower(current_admins)) = 0 THEN
    updated_admins := current_admins || ',' || new_email;
    
    -- Update the setting (this would need to be done at database level in production)
    PERFORM set_config('app.admin_emails', updated_admins, false);
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin email (for super admins only)
CREATE OR REPLACE FUNCTION remove_admin_email(email_to_remove text)
RETURNS boolean AS $$
DECLARE
  current_admins text;
  updated_admins text;
  admin_list text[];
  filtered_list text[];
BEGIN
  -- Only allow if current user is admin
  IF NOT is_admin_by_id(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get current admin emails
  current_admins := COALESCE(
    current_setting('app.admin_emails', true),
    'abumahilkerim@gmail.com,admin@example.com'
  );
  
  -- Convert to array and filter out the email to remove
  admin_list := string_to_array(current_admins, ',');
  filtered_list := array_remove(admin_list, email_to_remove);
  
  -- Update the setting
  updated_admins := array_to_string(filtered_list, ',');
  PERFORM set_config('app.admin_emails', updated_admins, false);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. CREATE AUDIT LOGGING
-- =============================================

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON admin_audit_log FOR SELECT
  TO authenticated
  USING (is_admin_by_id(auth.uid()));

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type text,
  target_type text DEFAULT NULL,
  target_id uuid DEFAULT NULL,
  action_details jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  admin_email text;
BEGIN
  -- Get current admin email
  SELECT email INTO admin_email 
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Insert audit log entry
  INSERT INTO admin_audit_log (
    admin_id,
    admin_email,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    admin_email,
    action_type,
    target_type,
    target_id,
    action_details,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. UPDATE EXISTING POLICIES TO INCLUDE AUDIT LOGGING
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Only admins can insert movies" ON movies;
DROP POLICY IF EXISTS "Only admins can update movies" ON movies;
DROP POLICY IF EXISTS "Only admins can delete movies" ON movies;
DROP POLICY IF EXISTS "Only admins can insert music" ON music;
DROP POLICY IF EXISTS "Only admins can update music" ON music;
DROP POLICY IF EXISTS "Only admins can delete music" ON music;

-- Create new policies with audit logging
CREATE POLICY "Only admins can insert movies"
  ON movies FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can update movies"
  ON movies FOR UPDATE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  )
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can delete movies"
  ON movies FOR DELETE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can insert music"
  ON music FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can update music"
  ON music FOR UPDATE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  )
  WITH CHECK (
    is_admin_by_id(auth.uid())
  );

CREATE POLICY "Only admins can delete music"
  ON music FOR DELETE
  TO authenticated
  USING (
    is_admin_by_id(auth.uid())
  );

-- =============================================
-- 6. CREATE TRIGGERS FOR AUDIT LOGGING
-- =============================================

-- Function to automatically log admin actions
CREATE OR REPLACE FUNCTION trigger_admin_audit()
RETURNS trigger AS $$
BEGIN
  -- Log the action
  PERFORM log_admin_action(
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for movies table
CREATE TRIGGER movies_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_audit();

-- Create triggers for music table
CREATE TRIGGER music_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON music
  FOR EACH ROW
  EXECUTE FUNCTION trigger_admin_audit();

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION is_admin_by_email IS 'Check if email is in admin allowlist (secure version)';
COMMENT ON FUNCTION is_admin_by_id IS 'Check if user ID belongs to admin email (secure version)';
COMMENT ON FUNCTION add_admin_email IS 'Add new admin email (admin only)';
COMMENT ON FUNCTION remove_admin_email IS 'Remove admin email (admin only)';
COMMENT ON FUNCTION log_admin_action IS 'Log admin actions for audit trail';
COMMENT ON TABLE admin_audit_log IS 'Audit log for admin actions';
