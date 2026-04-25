import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <SignIn
        appearance={{ elements: { rootBox: "mx-auto", card: "shadow-xl" } }}
        fallbackRedirectUrl="/after-auth"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
