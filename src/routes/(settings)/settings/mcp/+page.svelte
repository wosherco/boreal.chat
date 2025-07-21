<script lang="ts">
  import { orpc, orpcQuery } from "$lib/client/orpc";
  import { Alert } from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
  import { Switch } from "$lib/components/ui/switch";
  import { Separator } from "$lib/components/ui/separator";
  import { Badge } from "$lib/components/ui/badge";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "$lib/components/ui/dialog";
  import { AlertCircleIcon, ExternalLinkIcon, Loader2Icon, PlusIcon, EditIcon, TrashIcon, ServerIcon } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";

  interface MCPServer {
    id: string;
    name: string;
    description: string | null;
    url: string | null;
    command: string | null;
    args: string[] | null;
    transport: string;
    authMethod: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  const { data }: PageProps = $props();

  let isCreateDialogOpen = $state(false);
  let editingServer = $state<MCPServer | null>(null);
  let isEditDialogOpen = $state(false);

  // Form state
  let formData = $state({
    name: "",
    description: "",
    url: "",
    command: "",
    args: [] as string[],
    transport: "streamable_http" as "stdio" | "streamable_http",
    apiKey: "",
    authMethod: "api_key" as "api_key" | "none",
    enabled: true,
  });

  let argsText = $state("");

  // Queries and mutations
  const mcpServersQuery = createQuery(
    orpcQuery.v1.mcp.list.queryOptions()
  ) as { data?: MCPServer[]; isPending: boolean; error?: any; refetch: () => void };

  const createMCPMutation = createMutation(
    orpcQuery.v1.mcp.create.mutationOptions({
      onSuccess: () => {
        toast.success("MCP server created successfully");
        resetForm();
        isCreateDialogOpen = false;
        $mcpServersQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to create MCP server");
      },
    })
  );

  const updateMCPMutation = createMutation(
    orpcQuery.v1.mcp.update.mutationOptions({
      onSuccess: () => {
        toast.success("MCP server updated successfully");
        resetForm();
        isEditDialogOpen = false;
        editingServer = null;
        $mcpServersQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update MCP server");
      },
    })
  );

  const deleteMCPMutation = createMutation(
    orpcQuery.v1.mcp.delete.mutationOptions({
      onSuccess: () => {
        toast.success("MCP server deleted successfully");
        $mcpServersQuery.refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete MCP server");
      },
    })
  );

  function resetForm() {
    formData = {
      name: "",
      description: "",
      url: "",
      command: "",
      args: [],
      transport: "streamable_http",
      apiKey: "",
      authMethod: "api_key",
      enabled: true,
    };
    argsText = "";
  }

  function openEditDialog(server: MCPServer) {
    editingServer = server;
    formData = {
      name: server.name,
      description: server.description || "",
      url: server.url || "",
      command: server.command || "",
      args: server.args || [],
      transport: server.transport as "stdio" | "streamable_http",
      apiKey: "",
      authMethod: server.authMethod as "api_key" | "none",
      enabled: server.enabled,
    };
    argsText = server.args?.join("\n") || "";
    isEditDialogOpen = true;
  }

  function handleSubmit() {
    const args = argsText.trim() ? argsText.split("\n").map(arg => arg.trim()).filter(Boolean) : [];
    
    const submitData = {
      ...formData,
      args,
      description: formData.description || undefined,
      url: formData.url || undefined,
      command: formData.command || undefined,
      apiKey: formData.apiKey || undefined,
    };

    if (editingServer) {
      $updateMCPMutation.mutate({
        id: editingServer.id,
        ...submitData,
      });
    } else {
      $createMCPMutation.mutate(submitData);
    }
  }

  function handleDelete(serverId: string) {
    if (confirm("Are you sure you want to delete this MCP server?")) {
      $deleteMCPMutation.mutate({ id: serverId });
    }
  }

  $effect(() => {
    if (formData.transport === "stdio") {
      formData.url = "";
    } else {
      formData.command = "";
      argsText = "";
      formData.args = [];
    }
  });
</script>

<SvelteSeo title="MCP Servers | boreal.chat" />

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-semibold">MCP Servers</h1>
    <p class="text-muted-foreground">
      Configure Model Context Protocol (MCP) servers to extend your AI agent with custom tools and resources.
    </p>
  </div>

  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm text-muted-foreground">
        {$mcpServersQuery.data?.length || 0} server{($mcpServersQuery.data?.length || 0) !== 1 ? 's' : ''} configured
      </p>
    </div>
    
    <Dialog bind:open={isCreateDialogOpen}>
      <DialogTrigger>
        <Button onclick={() => resetForm()}>
          <PlusIcon class="mr-2 h-4 w-4" />
          Add MCP Server
        </Button>
      </DialogTrigger>
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add MCP Server</DialogTitle>
        </DialogHeader>
        
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="name">Name *</Label>
              <Input
                id="name"
                bind:value={formData.name}
                placeholder="My MCP Server"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="transport">Transport *</Label>
              <Select value={formData.transport} onValueChange={(value: any) => formData.transport = value as "stdio" | "streamable_http"}>
                <SelectTrigger>
                  {formData.transport === "streamable_http" ? "HTTP (Streamable)" : "Standard I/O"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streamable_http">HTTP (Streamable)</SelectItem>
                  <SelectItem value="stdio">Standard I/O</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              bind:value={formData.description}
              placeholder="Optional description of this MCP server..."
              rows={2}
            />
          </div>

          {#if formData.transport === "streamable_http"}
            <div class="space-y-2">
              <Label for="url">URL *</Label>
              <Input
                id="url"
                bind:value={formData.url}
                placeholder="http://localhost:8000/mcp"
                type="url"
                required
              />
            </div>
          {:else}
            <div class="space-y-2">
              <Label for="command">Command *</Label>
              <Input
                id="command"
                bind:value={formData.command}
                placeholder="python"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="args">Arguments (one per line) *</Label>
              <Textarea
                id="args"
                bind:value={argsText}
                placeholder={`/path/to/server.py\n--port\n8080`}
                rows={3}
                required
              />
              <p class="text-xs text-muted-foreground">
                Enter each argument on a separate line
              </p>
            </div>
          {/if}

          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="authMethod">Authentication Method</Label>
              <Select value={formData.authMethod} onValueChange={(value: any) => formData.authMethod = value as "api_key" | "none"}>
                <SelectTrigger>
                  {formData.authMethod === "api_key" ? "API Key" : "None"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {#if formData.authMethod === "api_key"}
              <div class="space-y-2">
                <Label for="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  bind:value={formData.apiKey}
                  placeholder="Enter API key..."
                  type="password"
                />
              </div>
            {/if}

            <div class="flex items-center space-x-2">
              <Switch bind:checked={formData.enabled} id="enabled" />
              <Label for="enabled">Enable this server</Label>
            </div>
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onclick={() => isCreateDialogOpen = false}>
              Cancel
            </Button>
            <Button type="submit" disabled={$createMCPMutation.isPending}>
              {#if $createMCPMutation.isPending}
                <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              Create Server
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>

  {#if $mcpServersQuery.isPending}
    <div class="text-muted-foreground flex items-center justify-center py-8">
      <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
      Loading MCP servers...
    </div>
  {:else if $mcpServersQuery.error}
    <Alert variant="destructive">
      <AlertCircleIcon class="h-4 w-4" />
      <p>Error loading MCP servers: {$mcpServersQuery.error.message}</p>
    </Alert>
  {:else if !$mcpServersQuery.data?.length}
    <Card class="text-center py-8">
      <CardContent>
        <ServerIcon class="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">No MCP servers configured</h3>
        <p class="text-muted-foreground mb-4">
          Add your first MCP server to start using custom tools and resources in your chats.
        </p>
        <Button onclick={() => isCreateDialogOpen = true}>
          <PlusIcon class="mr-2 h-4 w-4" />
          Add Your First Server
        </Button>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-4">
      {#each $mcpServersQuery.data as server (server.id)}
        <Card>
          <CardHeader>
            <div class="flex items-start justify-between">
              <div>
                <CardTitle class="flex items-center gap-2">
                  {server.name}
                  <Badge variant={server.enabled ? "default" : "secondary"}>
                    {server.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">{server.transport}</Badge>
                </CardTitle>
                {#if server.description}
                  <p class="text-sm text-muted-foreground mt-1">{server.description}</p>
                {/if}
              </div>
              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" onclick={() => openEditDialog(server)}>
                  <EditIcon class="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onclick={() => handleDelete(server.id)}
                  disabled={$deleteMCPMutation.isPending}
                >
                  <TrashIcon class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              {#if server.transport === "streamable_http" && server.url}
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-medium">URL:</span>
                  <span class="text-muted-foreground">{server.url}</span>
                  <Button variant="ghost" size="sm" href={server.url} target="_blank">
                    <ExternalLinkIcon class="h-3 w-3" />
                  </Button>
                </div>
              {:else if server.transport === "stdio" && server.command}
                <div class="space-y-1 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">Command:</span>
                    <span class="text-muted-foreground font-mono">{server.command}</span>
                  </div>
                  {#if server.args?.length}
                    <div class="flex items-center gap-2">
                      <span class="font-medium">Args:</span>
                      <span class="text-muted-foreground font-mono">{server.args.join(" ")}</span>
                    </div>
                  {/if}
                </div>
              {/if}
              
              <div class="flex items-center gap-2 text-sm">
                <span class="font-medium">Auth:</span>
                <Badge variant="outline" class="text-xs">
                  {server.authMethod === "api_key" ? "API Key" : "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      {/each}
    </div>
  {/if}

  <!-- Edit Dialog -->
  <Dialog bind:open={isEditDialogOpen}>
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit MCP Server</DialogTitle>
      </DialogHeader>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="edit-name">Name *</Label>
            <Input
              id="edit-name"
              bind:value={formData.name}
              placeholder="My MCP Server"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-transport">Transport *</Label>
            <Select value={formData.transport} onValueChange={(value: any) => formData.transport = value as "stdio" | "streamable_http"}>
              <SelectTrigger>
                {formData.transport === "streamable_http" ? "HTTP (Streamable)" : "Standard I/O"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streamable_http">HTTP (Streamable)</SelectItem>
                <SelectItem value="stdio">Standard I/O</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            bind:value={formData.description}
            placeholder="Optional description of this MCP server..."
            rows={2}
          />
        </div>

        {#if formData.transport === "streamable_http"}
          <div class="space-y-2">
            <Label for="edit-url">URL *</Label>
            <Input
              id="edit-url"
              bind:value={formData.url}
              placeholder="http://localhost:8000/mcp"
              type="url"
              required
            />
          </div>
        {:else}
          <div class="space-y-2">
            <Label for="edit-command">Command *</Label>
            <Input
              id="edit-command"
              bind:value={formData.command}
              placeholder="python"
              required
            />
          </div>
          
          <div class="space-y-2">
            <Label for="edit-args">Arguments (one per line) *</Label>
            <Textarea
              id="edit-args"
              bind:value={argsText}
              placeholder={`/path/to/server.py\n--port\n8080`}
              rows={3}
              required
            />
            <p class="text-xs text-muted-foreground">
              Enter each argument on a separate line
            </p>
          </div>
        {/if}

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="edit-authMethod">Authentication Method</Label>
            <Select value={formData.authMethod} onValueChange={(value: any) => formData.authMethod = value as "api_key" | "none"}>
              <SelectTrigger>
                {formData.authMethod === "api_key" ? "API Key" : "None"}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {#if formData.authMethod === "api_key"}
            <div class="space-y-2">
              <Label for="edit-apiKey">API Key</Label>
              <Input
                id="edit-apiKey"
                bind:value={formData.apiKey}
                placeholder="Leave empty to keep existing key..."
                type="password"
              />
            </div>
          {/if}

          <div class="flex items-center space-x-2">
            <Switch bind:checked={formData.enabled} id="edit-enabled" />
            <Label for="edit-enabled">Enable this server</Label>
          </div>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onclick={() => isEditDialogOpen = false}>
            Cancel
          </Button>
                      <Button type="submit" disabled={$updateMCPMutation.isPending}>
              {#if $updateMCPMutation.isPending}
                <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              Update Server
            </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>

  <Alert>
    <AlertCircleIcon class="h-4 w-4" />
    <div>
      <p class="font-medium">About MCP (Model Context Protocol)</p>
      <p class="text-sm text-muted-foreground mt-1">
        MCP allows you to connect custom tools and resources to your AI agent. You can create your own MCP servers 
        or connect to existing ones. Each server provides tools that will appear in your chat when the corresponding 
        MCP server is selected.
      </p>
    </div>
  </Alert>
</div>