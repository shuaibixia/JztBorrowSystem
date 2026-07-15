# 摄影器材管理后台

## Local development

```sh
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173`. Local Vite development enables the mock administrator shell. To preview the OAuth-pending production state:

```sh
pnpm build
pnpm preview
```

This application intentionally has no browser-to-database SDK. Block 1 will add the protected `admin-web` HTTP API.
