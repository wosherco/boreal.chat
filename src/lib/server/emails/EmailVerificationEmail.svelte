<script lang="ts">
  import { Button, Hr, Html, Text, Container, Section, Head, Preview } from "svelty-email";

  interface EmailVerificationEmailProps {
    verificationUrl: string;
    userEmail?: string;
    verificationCode: string;
  }

  const { verificationUrl, userEmail, verificationCode }: EmailVerificationEmailProps = $props();
</script>

<Html>
  <Head />
  <Preview preview="Verify your email address" />
  <Container
    style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <Section style={{ textAlign: "center", marginBottom: "30px" }}>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#333",
          marginBottom: "10px",
        }}
      >
        Verify your email address
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px",
        }}
      >
        {userEmail
          ? `Please verify your email address (${userEmail}) to complete your registration.`
          : "Please verify your email address to complete your registration."}
      </Text>
    </Section>

    <Section style={{ textAlign: "center", marginBottom: "30px" }}>
      <Button
        href={verificationUrl}
        style={{
          background: "#007bff",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "16px",
          fontWeight: "bold",
          display: "inline-block",
        }}
      >
        Verify Email Address
      </Button>
    </Section>

    <Section style={{ textAlign: "center", marginBottom: "30px" }}>
      <Text
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "10px",
        }}
      >
        Or enter this verification code:
      </Text>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#007bff",
          letterSpacing: "4px",
          fontFamily: "monospace",
          backgroundColor: "#f8f9fa",
          padding: "10px 20px",
          borderRadius: "6px",
          display: "inline-block",
        }}
      >
        {verificationCode}
      </Text>
    </Section>

    <Section style={{ textAlign: "center", marginBottom: "20px" }}>
      <Text
        style={{
          fontSize: "14px",
          color: "#999",
          marginBottom: "10px",
        }}
      >
        If the button above doesn't work, you can also copy and paste this link into your browser:
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: "#007bff",
          wordBreak: "break-all",
        }}
      >
        {verificationUrl}
      </Text>
    </Section>

    <Section
      style={{
        borderTop: "1px solid #eee",
        paddingTop: "20px",
        marginTop: "30px",
      }}
    >
      <Text
        style={{
          fontSize: "12px",
          color: "#999",
          textAlign: "center",
        }}
      >
        This verification link will expire in 24 hours. If you didn't create an account, you can
        safely ignore this email.
      </Text>
    </Section>
  </Container>
</Html>
