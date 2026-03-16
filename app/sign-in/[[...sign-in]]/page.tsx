import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="authPage">
      <div className="authShell">
        <div className="authIntro">
          <span className="sectionLabel">Admin sign-in</span>
          <h1>Enter the Let&apos;s Fix review dashboard.</h1>
          <p>Clerk protects the moderation tools so only approved admins can publish reader reviews.</p>
        </div>

        <div className="authCard">
          <SignIn fallbackRedirectUrl="/admin" />
        </div>
      </div>
    </main>
  );
}

