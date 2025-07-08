<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { ArrowLeftIcon } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import * as m from "$lib/paraglide/messages";
</script>

<SvelteSeo title="{m.auth_signIn()} | boreal.chat" />

<Button variant="link" href="/" class="absolute top-4 left-4">
  <ArrowLeftIcon class="size-4" />
  {m.auth_backToHome()}
</Button>
<div class="flex h-screen w-screen items-center justify-center">
  <Card>
    <CardHeader>
      <CardTitle>{m.auth_signIn()}</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="default" href="/auth/google">
        <p>G</p>
        {m.auth_signInWithGoogle()}
      </Button>
    </CardContent>
    <CardFooter>
      <p class="text-muted-foreground text-sm">
        {m.auth_termsAndPrivacy()}
      </p>
    </CardFooter>
  </Card>
</div>
