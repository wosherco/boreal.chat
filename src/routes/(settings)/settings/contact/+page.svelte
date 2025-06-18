<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo title="Contact Us | boreal.chat" />

<h2 class="text-xl font-semibold">Contact Us</h2>
<p class="text-muted-foreground">Reach out to us with any questions.</p>

<div class="flex w-full flex-wrap gap-4 pt-4">
  <a href="mailto:contact@boreal.chat">
    <Card class="hover:bg-accent hover:text-accent-foreground w-[300px]">
      <CardHeader>
        <CardTitle>Email</CardTitle>
      </CardHeader>
      <CardContent>
        Reach us at <p class="font-mono">contact@boreal.chat</p>
      </CardContent>
    </Card>
  </a>

  <a href="https://x.com/boreal_chat">
    <Card class="hover:bg-accent hover:text-accent-foreground w-[300px]">
      <CardHeader>
        <CardTitle>X</CardTitle>
      </CardHeader>
      <CardContent>
        Find us on x at <p class="font-mono">@boreal_chat</p>
      </CardContent>
    </Card>
  </a>

  <a href="https://discord.com/invite/knDFUB5UtU">
    <Card class="hover:bg-accent hover:text-accent-foreground w-[300px]">
      <CardHeader>
        <CardTitle>Discord</CardTitle>
      </CardHeader>
      <CardContent>
        Join our Discord server and get the latest updates and support. You can also suggest new
        features!
      </CardContent>
    </Card>
  </a>
</div>
