<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { ArrowLeftIcon } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import { m } from '$lib/paraglide/messages.js';
</script>

<SvelteSeo title="Sign in | boreal.chat" />

<Button variant="link" href="/" class="absolute top-4 left-4">
  <ArrowLeftIcon class="size-4" />
  {m.auth_backtohome2()}
</Button>
<div class="flex h-screen w-screen items-center justify-center">
  <Card>
    <CardHeader>
      <CardTitle>{m.auth_signin1()}</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="default" href="/auth/google">
        <p>G</p>
        {m.auth_signinwithgoogle3()}
      </Button>
    </CardContent>
    <CardFooter>
      <p class="text-muted-foreground text-sm">
        {m.auth_bysigninginagree3()} <a href="/terms-of-service" class="underline"
          >{m.auth_termsofservice2()}</a
        >
        {m.auth_and()}
        <a href="/privacy-policy" class="underline">{m.auth_privacypolicy1()}</a>
      </p>
    </CardFooter>
  </Card>
</div>
