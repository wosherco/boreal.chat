<script lang="ts">
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";
  import ContactCard from "$lib/components/settings/ContactCard.svelte";
  import { MailIcon, XIcon, MessageCircleIcon, TextIcon, ShieldIcon } from "@lucide/svelte";
</script>

<SettingsLayout title="Contact Us" description="Reach out to us with any questions.">
  <div class="flex w-full flex-col gap-4 pt-4">
    <ContactCard
      title="Email"
      description="Reach us at contact@boreal.chat"
      icon={MailIcon}
      href="mailto:contact@boreal.chat"
    />
    <ContactCard
      title="X"
      description="Find us on x at @borealchat"
      icon={XIcon}
      href="https://x.com/borealchat"
    />
    <ContactCard
      title="Discord"
      description="Join our Discord server and get the latest updates and support. You can also suggest new features!"
      icon={MessageCircleIcon}
      href="https://discord.com/invite/knDFUB5UtU"
    />

    <hr class="my-4" />

    <ContactCard
      title="Terms of Service"
      description="Read our Terms of Service"
      icon={TextIcon}
      href="/terms-of-service"
    />
    <ContactCard
      title="Privacy Policy"
      description="Read our Privacy Policy"
      icon={ShieldIcon}
      href="/privacy-policy"
    />
  </div>
</SettingsLayout>
