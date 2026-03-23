import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { FC } from "react";

export type MagicLinkEmailProps = {
  url: string;
  baseUrl: string;
};

type MagicLinkEmailComponent = FC<MagicLinkEmailProps> & {
  PreviewProps: MagicLinkEmailProps;
};

const MagicLinkEmail: MagicLinkEmailComponent = ({
  url,
  baseUrl = "https://www.getinboxzero.com",
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto w-full max-w-[600px] p-0">
            {/* Header */}
            <Section className="p-4 text-center">
              <Link href={baseUrl} className="text-[15px]">
                <Img
                  src={"https://www.getinboxzero.com/icon.png"}
                  width="40"
                  height="40"
                  alt="Inbox Zero"
                  className="mx-auto my-0"
                />
              </Link>

              <Text className="mx-0 mb-8 mt-4 p-0 text-center text-2xl font-normal">
                <span className="font-semibold tracking-tighter">
                  Inbox Zero
                </span>
              </Text>

              <Text className="mx-0 mb-8 mt-0 p-0 text-center text-2xl font-normal">
                Sign in to your account
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="px-4 pb-4">
              <Text className="text-[16px] text-gray-700 mb-8 mt-0 text-center">
                Click the button below to sign in to Inbox Zero. This link will
                expire in 10 minutes.
              </Text>

              {/* CTA Button */}
              <Section className="text-center mb-8">
                <Button
                  href={url}
                  className="bg-blue-600 text-white px-8 py-4 rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
                >
                  Sign in to Inbox Zero
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-500 mt-4 text-center">
                If you didn't request this email, you can safely ignore it.
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="border-solid border-gray-200 my-6" />
            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default MagicLinkEmail;

function Footer({ baseUrl }: { baseUrl: string }) {
  return (
    <Section className="mt-8 text-center text-sm text-gray-500">
      <Text className="m-0">
        You're receiving this email because a sign-in was requested for your
        account on Inbox Zero.
      </Text>
      <div className="mt-2">
        <Link
          href={`${baseUrl}/support`}
          className="text-gray-500 underline mr-4"
        >
          Support
        </Link>
        <Link href={`${baseUrl}/privacy`} className="text-gray-500 underline">
          Privacy Policy
        </Link>
      </div>
    </Section>
  );
}

MagicLinkEmail.PreviewProps = {
  url: "https://www.getinboxzero.com/api/auth/magic-link/verify?token=abc123",
  baseUrl: "https://www.getinboxzero.com",
};
