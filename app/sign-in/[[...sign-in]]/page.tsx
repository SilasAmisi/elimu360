import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <div className="space-y-4">
        <SignIn
          appearance={{ elements: { rootBox: "mx-auto", card: "shadow-xl" } }}
          fallbackRedirectUrl="/after-auth"
          signUpUrl="/sign-up"
        />
        <p className="text-center text-sm text-slate-600">
          Forgot your password? Use the <span className="font-medium text-emerald-700">Forgot password?</span> option
          on the sign-in form.
        </p>
      </div>
    </div>
  );
}
