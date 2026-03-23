"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Button as UIButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionDescription } from "@/components/Typography";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { signIn } from "@/utils/auth-client";
import { WELCOME_PATH } from "@/utils/config";
import { toastError } from "@/components/Toast";
import { isInternalPath } from "@/utils/path";
import { getPossessiveBrandName } from "@/utils/branding";

export function LoginForm({
  showLocalBypass,
  showMagicLink,
}: {
  showLocalBypass: boolean;
  showMagicLink: boolean;
}) {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next");
  const { callbackURL, errorCallbackURL } = getAuthCallbackUrls(next);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMicrosoft, setLoadingMicrosoft] = useState(false);
  const [loadingLocalBypass, setLoadingLocalBypass] = useState(false);

  const handleGoogleSignIn = async () => {
    await handleSocialSignIn({
      provider: "google",
      providerName: "Google",
      callbackURL,
      errorCallbackURL,
      setLoading: setLoadingGoogle,
    });
  };

  const handleMicrosoftSignIn = async () => {
    await handleSocialSignIn({
      provider: "microsoft",
      providerName: "Microsoft",
      callbackURL,
      errorCallbackURL,
      setLoading: setLoadingMicrosoft,
    });
  };

  const handleLocalBypassSignIn = async () => {
    setLoadingLocalBypass(true);
    try {
      const response = await fetch("/api/auth/sign-in/local-bypass", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ callbackURL }),
      });

      if (!response.ok) {
        throw new Error("Local bypass login failed");
      }

      const result: { callbackURL?: string } = await response.json();

      window.location.assign(
        result.callbackURL && isInternalPath(result.callbackURL)
          ? result.callbackURL
          : callbackURL,
      );
    } catch (error) {
      console.error("Error signing in with local bypass:", error);
      toastError({
        title: "Error bypassing login",
        description:
          "Ensure LOCAL_AUTH_BYPASS_ENABLED=true in your local environment.",
      });
    } finally {
      setLoadingLocalBypass(false);
    }
  };

  return (
    <div className="flex flex-col justify-center gap-2 px-4 sm:px-16">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="2xl">
            <span className="flex items-center justify-center">
              <Image
                src="/images/google.svg"
                alt=""
                width={24}
                height={24}
                unoptimized
              />
              <span className="ml-2">Sign in with Google</span>
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
          </DialogHeader>
          <SectionDescription>
            {getPossessiveBrandName()} use and transfer of information received
            from Google APIs to any other app will adhere to{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="underline underline-offset-4 hover:text-gray-900"
            >
              Google API Services User Data
            </a>{" "}
            Policy, including the Limited Use requirements.
          </SectionDescription>
          <div>
            <Button loading={loadingGoogle} onClick={handleGoogleSignIn}>
              I agree
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        size="2xl"
        loading={loadingMicrosoft}
        onClick={handleMicrosoftSignIn}
      >
        <span className="flex items-center justify-center">
          <Image
            src="/images/microsoft.svg"
            alt=""
            width={24}
            height={24}
            unoptimized
          />
          <span className="ml-2">Sign in with Microsoft</span>
        </span>
      </Button>

      <UIButton
        variant="ghost"
        size="lg"
        className="w-full hover:scale-105 transition-transform"
        asChild
      >
        <Link href="/login/sso">Sign in with SSO</Link>
      </UIButton>

      {showMagicLink && <MagicLinkForm callbackURL={callbackURL} />}

      {showLocalBypass && (
        <Button
          size="2xl"
          color="white"
          loading={loadingLocalBypass}
          onClick={handleLocalBypassSignIn}
        >
          Bypass login (local only)
        </Button>
      )}
    </div>
  );
}

function MagicLinkForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toastError({ description: "Please enter your email address." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.magicLink({
        email,
        callbackURL,
      });

      if (error) {
        toastError({
          title: "Error sending magic link",
          description: error.message || "Please try again.",
        });
        return;
      }

      setSent(true);
    } catch (error) {
      console.error("Error sending magic link:", error);
      toastError({
        title: "Error sending magic link",
        description: "Please try again or use another sign-in method.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-800 dark:text-green-200">
          Check your inbox for a sign-in link.
        </p>
        <button
          type="button"
          className="mt-2 text-sm text-green-600 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
        >
          Try a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
        <Button size="2xl" color="white" loading={loading} type="submit">
          Send magic link
        </Button>
      </form>
    </>
  );
}

function getAuthCallbackUrls(next: string | null) {
  const callbackURL = next && isInternalPath(next) ? next : WELCOME_PATH;
  const errorCallbackURL = isOrganizationInvitationPath(callbackURL)
    ? "/login/error?reason=org_invite"
    : "/login/error";

  return { callbackURL, errorCallbackURL };
}

function isOrganizationInvitationPath(path: string) {
  const pathname = path.split("?")[0];
  return /^\/organizations\/invitations\/[^/]+\/accept\/?$/.test(pathname);
}

async function handleSocialSignIn({
  provider,
  providerName,
  callbackURL,
  errorCallbackURL,
  setLoading,
}: {
  provider: "google" | "microsoft";
  providerName: "Google" | "Microsoft";
  callbackURL: string;
  errorCallbackURL: string;
  setLoading: (loading: boolean) => void;
}) {
  setLoading(true);
  try {
    await signIn.social({
      provider,
      errorCallbackURL,
      callbackURL,
    });
  } catch (error) {
    console.error(`Error signing in with ${providerName}:`, error);
    toastError({
      title: `Error signing in with ${providerName}`,
      description: "Please try again or contact support",
    });
  } finally {
    setLoading(false);
  }
}
