import { supabase } from './supabase';

export interface SupabaseUser {
  id: string;
  uid: string;
  email?: string;
  isAnonymous?: boolean;
}

export const auth = {
  currentUser: null as SupabaseUser | null,
};

/**
 * Ensure the customer has an active auth session via Supabase Auth.
 * Does NOT create anonymous users if no session exists.
 */
export async function ensureCustomerAuthSession(): Promise<SupabaseUser | null> {
  if (!supabase) {
    auth.currentUser = null;
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      if (error.message?.includes('402') || (error as any).status === 402) {
        console.warn('خدمة قاعدة البيانات متوقفة مؤقتاً (HTTP 402)');
      }
      auth.currentUser = null;
      return null;
    }

    if (session?.user) {
      const user: SupabaseUser = {
        id: session.user.id,
        uid: session.user.id,
        email: session.user.email,
        isAnonymous: session.user.is_anonymous ?? false,
      };
      auth.currentUser = user;
      return user;
    }

    auth.currentUser = null;
    return null;
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      console.warn('خدمة قاعدة البيانات متوقفة مؤقتاً (HTTP 402)');
    } else {
      console.warn('Auth session note:', err);
    }
    auth.currentUser = null;
    return null;
  }
}

/**
 * Listen to auth state changes in real time
 */
export function subscribeToAuth(callback: (user: SupabaseUser | null) => void) {
  if (!supabase) {
    auth.currentUser = null;
    callback(null);
    return () => {};
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user: SupabaseUser = {
        id: session.user.id,
        uid: session.user.id,
        email: session.user.email,
        isAnonymous: session.user.is_anonymous ?? false,
      };
      auth.currentUser = user;
      callback(user);
    } else {
      auth.currentUser = null;
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Customer email & password Sign In
 */
export async function signInCustomerWithEmail(email: string, password: string): Promise<{ user: SupabaseUser | null; error?: string }> {
  if (!supabase) return { user: null, error: 'خدمة قاعدة البيانات غير متوفرة' };
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (error.message?.includes('402') || (error as any).status === 402) {
        return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
      return { user: null, error: 'بيانات الدخول غير صحيحة — تحقق من البريد وكلمة المرور' };
    }
    if (data.user) {
      const user: SupabaseUser = {
        id: data.user.id,
        uid: data.user.id,
        email: data.user.email,
        isAnonymous: false,
      };
      auth.currentUser = user;
      return { user };
    }
    return { user: null, error: 'فشل تسجيل الدخول' };
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }
    return { user: null, error: 'خطأ أثناء الاتصال بالخادم' };
  }
}

/**
 * Customer Sign Up
 */
export async function signUpCustomerWithEmail(
  email: string,
  password: string,
  fullName?: string,
  phone?: string
): Promise<{ user: SupabaseUser | null; message?: string; error?: string }> {
  if (!supabase) return { user: null, error: 'خدمة قاعدة البيانات غير متوفرة' };
  try {
    const redirectUrl = window.location.origin + (import.meta.env.BASE_URL || '').replace(/\/$/, '') + '/auth';
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName, phone: phone || null },
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      if (error.message?.includes('402') || (error as any).status === 402) {
        return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
      return { user: null, error: error.message };
    }

    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { user: null, error: 'هذا البريد الإلكتروني مسجل مسبقاً' };
    }

    if (data.user && !data.session) {
      return { user: null, message: 'تم إنشاء الحساب بنجاح! افتح بريدك الإلكتروني واضغط رابط التأكيد.' };
    }

    if (data.user) {
      const user: SupabaseUser = {
        id: data.user.id,
        uid: data.user.id,
        email: data.user.email,
        isAnonymous: false,
      };
      auth.currentUser = user;
      return { user };
    }

    return { user: null, error: 'فشل إنشاء الحساب' };
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      return { user: null, error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }
    return { user: null, error: 'حدث خطأ أثناء الاتصال بالخادم' };
  }
}

/**
 * Google OAuth Sign In
 */
export async function signInCustomerWithGoogle(): Promise<{ error?: string }> {
  if (!supabase) return { error: 'خدمة قاعدة البيانات غير متوفرة' };
  try {
    const redirectUrl = window.location.origin + (import.meta.env.BASE_URL || '').replace(/\/$/, '') + '/auth';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      if (error.message?.includes('402') || (error as any).status === 402) {
        return { error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
      }
      return { error: error.message };
    }
    return {};
  } catch (err: any) {
    if (err?.status === 402 || err?.message?.includes('402')) {
      return { error: 'خدمة قاعدة البيانات متوقفة مؤقتاً (Payment Required)' };
    }
    return { error: 'تعذر الاتصال بخدمة المصادقة' };
  }
}

/**
 * Sign out customer and clear session
 */
export async function logoutCustomer(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err: any) {
      if (err?.status === 402 || err?.message?.includes('402')) {
        console.warn('خدمة قاعدة البيانات متوقفة مؤقتاً (HTTP 402)');
      } else {
        console.warn('Logout error:', err);
      }
    }
  }
  auth.currentUser = null;
}

