import { supabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'manager' | 'staff';
  name: string;
  lastLogin: string;
  loginMethod: 'supabase';
}

const FAILED_ATTEMPTS_KEY = 'indexes_admin_failed_attempts';

/**
 * Check current active admin session directly from Supabase Auth + user_roles table.
 * Does NOT rely on hardcoded passwords or unauthenticated local storage.
 */
export async function checkAdminSession(): Promise<{ user: AdminUser | null; error?: string }> {
  if (!supabase) return { user: null };

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      if (sessionError.message?.includes('402') || (sessionError as any).status === 402) {
        return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
      return { user: null };
    }

    if (!session?.user) {
      return { user: null };
    }

    // Query user_roles table in Supabase to verify permissions
    const { data: roles, error: rolesError, status } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (status === 402 || rolesError?.message?.includes('402')) {
      return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }

    if (rolesError) {
      console.warn('user_roles query note:', rolesError.message);
      return { user: null, error: 'تعذر التحقق من الصلاحيات الإدارية من جدول user_roles.' };
    }

    const allowedRoles = ['admin', 'owner', 'manager', 'staff'];
    const matchingRoleObj = (roles || []).find((r: any) =>
      allowedRoles.includes(String(r.role || '').toLowerCase().trim())
    );

    if (!matchingRoleObj) {
      return { user: null, error: 'حسابك لا يملك صلاحيات إدارية في جدول user_roles.' };
    }

    const roleName = String(matchingRoleObj.role).toLowerCase().trim() as 'admin' | 'owner' | 'manager' | 'staff';

    const adminUser: AdminUser = {
      id: session.user.id,
      email: session.user.email || '',
      role: roleName,
      name: session.user.user_metadata?.full_name || session.user.email || 'مدير النظام',
      lastLogin: new Date().toISOString(),
      loginMethod: 'supabase',
    };

    return { user: adminUser };
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }
    return { user: null };
  }
}

/**
 * Clear admin session (Sign Out from Supabase)
 */
export async function clearAdminSession(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      if (err?.status === 402 || err?.message?.includes('402')) {
        console.warn('خدمة قاعدة البيانات متوقفة مؤقتاً (HTTP 402)');
      }
    }
  }
}

/**
 * Rate limiting check for failed login attempts
 */
export function getRateLimitStatus(): { isBlocked: boolean; attemptsLeft: number; cooldownSeconds: number } {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (!raw) return { isBlocked: false, attemptsLeft: 5, cooldownSeconds: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    const elapsedTime = (now - data.lastFailedTime) / 1000;

    if (data.count >= 5) {
      if (elapsedTime < 180) { // 3 minutes block
        return {
          isBlocked: true,
          attemptsLeft: 0,
          cooldownSeconds: Math.ceil(180 - elapsedTime),
        };
      } else {
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        return { isBlocked: false, attemptsLeft: 5, cooldownSeconds: 0 };
      }
    }
    return { isBlocked: false, attemptsLeft: 5 - data.count, cooldownSeconds: 0 };
  } catch (err) {
    return { isBlocked: false, attemptsLeft: 5, cooldownSeconds: 0 };
  }
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(): number {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    let count = 1;
    if (raw) {
      const data = JSON.parse(raw);
      count = (data.count || 0) + 1;
    }
    localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({
      count,
      lastFailedTime: Date.now(),
    }));
    return count;
  } catch (err) {
    return 1;
  }
}

/**
 * Perform login against Supabase Auth and verify role from user_roles table.
 * STRICTLY NO HARDCODED PASSWORDS OR LOCAL FALLBACKS.
 */
export async function loginAdminWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    return { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
  }

  const rateLimit = getRateLimitStatus();
  if (rateLimit.isBlocked) {
    return {
      success: false,
      error: `تم حظر المحاولات مؤقتا لحماية النظام. يرجى الانتظار ${rateLimit.cooldownSeconds} ثانية.`,
    };
  }

  if (!supabase) {
    return { success: false, error: 'خدمة قاعدة البيانات غير متوفرة.' };
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.includes('402') || (error as any).status === 402) {
        return { success: false, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
      recordFailedAttempt();
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
    }

    if (!data.user) {
      recordFailedAttempt();
      return { success: false, error: 'فشل تسجيل الدخول.' };
    }

    // 2. Query user_roles table for permissions (strictly allowed: admin, owner, manager, staff)
    const { data: roles, error: rolesError, status } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);

    if (status === 402 || rolesError?.message?.includes('402')) {
      return { success: false, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }

    if (rolesError) {
      recordFailedAttempt();
      return { success: false, error: 'خطأ في استعلام الصلاحيات من جدول user_roles: ' + rolesError.message };
    }

    const allowedRoles = ['admin', 'owner', 'manager', 'staff'];
    const matchingRoleObj = (roles || []).find((r: any) =>
      allowedRoles.includes(String(r.role || '').toLowerCase().trim())
    );

    if (!matchingRoleObj) {
      recordFailedAttempt();
      return {
        success: false,
        error: 'حسابك مسجَّل بنجاح ولكن لا يملك صلاحية إدارية في جدول user_roles.',
      };
    }

    // Clear failed attempts on success
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);

    const roleName = String(matchingRoleObj.role).toLowerCase().trim() as 'admin' | 'owner' | 'manager' | 'staff';

    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email || email,
      role: roleName,
      name: data.user.user_metadata?.full_name || data.user.email || 'مدير النظام',
      lastLogin: new Date().toISOString(),
      loginMethod: 'supabase',
    };

    return { success: true, user: adminUser };
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      return { success: false, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }
    return { success: false, error: 'حدث خطأ غير متوقع أثناء الاتصال بـ Supabase.' };
  }
}

/**
 * Send Password Reset Email via Supabase Auth
 */
export async function sendAdminPasswordReset(emailInput: string): Promise<{ success: boolean; message: string }> {
  const email = emailInput.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { success: false, message: 'يرجى إدخال بريد إلكتروني صحيح' };
  }

  if (supabase) {
    try {
      const redirectUrl = window.location.origin + (import.meta.env.BASE_URL || '').replace(/\/$/, '') + '/auth';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) {
        if (error.message?.includes('402') || (error as any).status === 402) {
          return { success: false, message: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
        }
        return { success: false, message: error.message };
      }
      return {
        success: true,
        message: `تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى ${email}. يرجى فحص صندوق الوارد.`,
      };
    } catch (err: any) {
      if (err?.status === 402 || err?.message?.includes('402')) {
        return { success: false, message: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
    }
  }

  return {
    success: false,
    message: 'خدمة قاعدة البيانات غير متوفرة',
  };
}

