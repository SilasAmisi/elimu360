import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <SignUp
        appearance={{ elements: { rootBox: "mx-auto", card: "shadow-xl" } }}
        forceRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
    </div>
  );
}
