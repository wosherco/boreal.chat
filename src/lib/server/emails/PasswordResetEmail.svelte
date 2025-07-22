<script lang="ts">
  import { Button, Html, Text, Container, Section, Head, Preview } from "svelty-email";

  interface PasswordResetEmailProps {
    resetUrl: string;
    userEmail?: string;
    resetCode: string;
  }

  const { resetUrl, userEmail, resetCode }: PasswordResetEmailProps = $props();
</script>

<Html>
  <Head />
  <Preview preview="Reset your password" />
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
        Reset your password
      </Text>
      <Text
        style={{
          fontSize: "16px",
          color: "#666",
          marginBottom: "20px",
        }}
      >
        {userEmail
          ? `We received a request to reset the password for your account (${userEmail}).`
          : "We received a request to reset your password."}
      </Text>
      <Text
        style={{
          fontSize: "14px",
          color: "#666",
          marginBottom: "20px",
        }}
      >
        Click the button below to create a new password. This link will expire in 5 minutes.
      </Text>
    </Section>

    <Section style={{ textAlign: "center", marginBottom: "30px" }}>
      <Button
        href={resetUrl}
        style={{
          background: "#dc3545",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "16px",
          fontWeight: "bold",
          display: "inline-block",
        }}
      >
        Reset Password
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
        Or enter this reset code:
      </Text>
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: "#dc3545",
          letterSpacing: "4px",
          fontFamily: "monospace",
          backgroundColor: "#f8f9fa",
          padding: "10px 20px",
          borderRadius: "6px",
          display: "inline-block",
        }}
      >
        {resetCode}
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
          color: "#dc3545",
          wordBreak: "break-all",
        }}
      >
        {resetUrl}
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
          marginBottom: "10px",
        }}
      >
        If you didn't request a password reset, you can safely ignore this email. Your password will
        remain unchanged.
      </Text>
      <Text
        style={{
          fontSize: "12px",
          color: "#999",
          textAlign: "center",
        }}
      >
        For security reasons, this reset link will expire in 5 minutes. This email was sent from
        no-reply@boreal.chat.
      </Text>
    </Section>
  </Container>
</Html>
