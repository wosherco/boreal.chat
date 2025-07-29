<script lang="ts">
  import type { ChangeEventHandler } from "svelte/elements";
  import { Input } from "../ui/input";
  import { uploadFile } from "$lib/client/services/files.svelte";

  const onFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      uploadFile(file);
    }
  };
</script>

<Input type="file" onchange={onFileChange} />
