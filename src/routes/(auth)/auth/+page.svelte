<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { ArrowLeftIcon } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo title="Sign in | boreal.chat" />

<Button variant="link" href="/" class="absolute top-4 left-4">
  <ArrowLeftIcon class="size-4" />
  Back to home
</Button>
<div class="flex h-screen w-screen items-center justify-center">
  <Card>
    <CardHeader>
      <CardTitle>Sign in</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="default" href="/auth/google">
        <p>G</p>
        Sign in with Google
      </Button>
    </CardContent>
    <CardFooter>
      <p class="text-muted-foreground text-sm">
        By signing in, you agree to our <a href="/terms-of-service" class="underline"
          >Terms of Service</a
        >
        and
        <a href="/privacy-policy" class="underline">Privacy Policy</a>
      </p>
    </CardFooter>
  </Card>
</div>
