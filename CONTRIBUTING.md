# Contributing to boreal.chat

First of all, thank you for your interest in contributing to boreal.chat!

Currently boreal.chat is in beta, and many things are still in flux. From broken things, needed refactors, or developing new features. Those are the main priorities for now.

## Initial setup

To contribute to boreal.chat, you need to have the following tools installed:

- pnpm
- node (check .nvmrc for the version, use of nvm is recommended)
- caddy
- Docker

Once you have that, start by copying the .env.example file to .env and filling in the values.

Then, run `pnpm install` to install the dependencies.

### Running the server

To run the server, you first need to execute the docker compose file:

```bash
docker compose up -d
```

After that, you'll also need the caddy server running.

```bash
pnpm dev:caddy
```

Then, run `pnpm dev` to start the development server. You can access the server at [https://localhost:5174](https://localhost:5174).
