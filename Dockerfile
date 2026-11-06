FROM node:22-alpine

WORKDIR /app

# No dependencies to install. Do not run the install-time probe during build.
COPY --chown=node:node package.json index.html server.cjs ./
COPY --chown=node:node .env.simulation ./
COPY --chown=node:node scripts/ ./scripts/

USER node
EXPOSE 3000

# Same startup import as npm run dev; bind to the container network interface.
CMD ["node", "server.cjs", "dev", "--container"]
