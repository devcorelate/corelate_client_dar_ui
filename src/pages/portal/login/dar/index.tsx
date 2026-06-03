import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CORELATE_LOGIN_PATH } from '@/utils/constants';
import { Alert, Button, Checkbox, Label, TextInput } from 'flowbite-react';
import { HiEye, HiEyeOff, HiInformationCircle, HiShieldCheck } from 'react-icons/hi';
import { setToken } from '@/utils/headers/token';

type LoginResponse = {
  token?: string;
  token_expired?: number;
  userDetails?: Record<string, unknown>;
  permissions?: unknown;
};

const INVALID_CREDENTIALS_MESSAGE = 'The email and password you entered did not match our records. Please try again.';

export default function DarEmployeeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'failure' | 'success'>('failure');
  const [invalidCredentials, setInvalidCredentials] = useState(false);

  const showAlert = (message: string, type: 'failure' | 'success' = 'failure') => {
    setAlertMessage(message);
    setAlertType(type);
  };

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem('darRememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInvalidCredentials(false);

    if (!email.trim() || !password) {
      showAlert('Please fill in all fields');
      return;
    }

    setLoading(true);
    setAlertMessage('');

    try {
      const response = await fetch('/api/fetch-token-axios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.token) {
        setInvalidCredentials(true);
        showAlert(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      setToken(data.token, data.token_expired);
      window.localStorage.setItem('userSession', JSON.stringify(data.userDetails ?? { email: email.trim() }));
      window.localStorage.setItem('userPermission', JSON.stringify(data.permissions ?? null));
      if (rememberEmail) {
        window.localStorage.setItem('darRememberEmail', email.trim());
      } else {
        window.localStorage.removeItem('darRememberEmail');
      }

      showAlert('Login successful. Redirecting to your dashboard...', 'success');
      await router.push('/portal/login/dar/employee');
    } catch {
      setInvalidCredentials(true);
      showAlert(INVALID_CREDENTIALS_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  const inputColor = invalidCredentials ? 'failure' : 'gray';

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <Image
        src="/images/login-pic.svg"
        alt="DAR login backdrop"
        fill
        priority
        className="object-cover opacity-30 blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/85 to-slate-900/95" />

      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative hidden min-h-[620px] bg-emerald-950 md:block">
            <Image src="/images/login-pic.svg" alt="DAR case monitoring" fill className="object-cover opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">Employee Portal</p>
              <h2 className="mt-3 text-3xl font-bold">Legal Case Monitoring System</h2>
              <p className="mt-3 text-sm leading-6 text-emerald-50/90">
                Securely access assigned legal case work, process updates, and monitoring tools for DAR services.
              </p>
            </div>
          </div>

          <div className="flex min-h-[620px] flex-col justify-between p-6 sm:p-8 lg:p-10">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 p-2">
                  <Image src="/images/dar/dar_logo_login.svg" alt="DAR logo" width={42} height={42} className="" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#007a3d]">DAR</p>
                  <p className="text-sm font-semibold text-slate-700">Employee Access</p>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-slate-950">Employee Log In</h1>
              <p className="mt-2 text-sm text-slate-500">Log in using your official DAR account</p>

              {alertMessage ? (
                <Alert className="mt-5" color={alertType} icon={HiInformationCircle}>
                  {alertMessage}
                </Alert>
              ) : null}

              <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    color={inputColor}
                    placeholder="employee@dar.gov.ph"
                    autoComplete="email"
                    value={email}
                    required
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot" className="text-xs font-semibold text-[#007a3d] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <TextInput
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      color={inputColor}
                      placeholder="********"
                      autoComplete="current-password"
                      value={password}
                      required
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#007a3d]"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <HiEyeOff className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberEmail"
                    checked={rememberEmail}
                    onChange={(event) => setRememberEmail(event.target.checked)}
                  />
                  <Label htmlFor="rememberEmail" className="text-sm text-slate-600">
                    Remember email
                  </Label>
                </div>

                <Button type="submit" className="w-full bg-[#007a3d] hover:bg-emerald-800" disabled={loading}>
                  {loading ? 'Logging in...' : 'Log In'}
                </Button>

                <Link
                  href={CORELATE_LOGIN_PATH}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Corelate Login
                </Link>
              </form>

              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950">
                <div className="flex gap-3">
                  <HiShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#007a3d]" />
                  <p>
                    Authorized DAR employees only. Keep credentials confidential and sign out after completing official case monitoring work.
                  </p>
                </div>
              </div>
            </div>

            <footer className="mt-8 text-center text-xs text-slate-500">
              <p className="font-medium text-slate-600">Contact Us | Terms &amp; Conditions | Privacy Policy</p>
              <p className="mt-2">Copyright 2026 All rights reserved.</p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
