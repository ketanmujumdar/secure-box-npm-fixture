# Secure-box npm simulation

A standalone, clearly labeled mock interview-project repository for testing npm
lifecycle execution and outbound HTTP controls. It has no external dependencies.
Nothing is published or pushed by this project.

## What happens

- `npm run dev` starts a small website at `http://127.0.0.1:3000` and imports
  the probe on the server, triggering one POST at startup with phase `dev`.
- `npm install` runs a `postinstall` hook that attempts one JSON POST.
- `npm start` attempts the same POST with phase `run`.
- `npm run preview` prints the synthetic payload without accessing the network.
- All payload values are hardcoded fake canaries. No real environment variables,
  credentials, files, or machine metadata are collected. The only environment
  variable read is `SIMULATION_TARGET`, which configures the destination.
- Requests stop after five seconds, with no retries or redirect following.
- Default destination: `https://egress-test.invalid/collect`. This reserved invalid
  domain should fail resolution; that failure is NOT proof of sandbox protection.

## Test your secure box

Use an HTTP(S) receiver you control to distinguish blocked egress from a broken
destination. Run these commands inside this folder in the secure box:

```sh
npm run preview
SIMULATION_TARGET=https://YOUR-CONTROLLED-HOST/collect npm install
SIMULATION_TARGET=https://YOUR-CONTROLLED-HOST/collect npm start
```

Replace the placeholder URL first. Check both your receiver logs and the secure
box's policy logs. An HTTP response shows a reachable server, but a proxy may have
responded; receiver logs confirm payload delivery. Failure can also mean DNS,
TLS, routing, or receiver failure. The probe exits 2 on network failure, so npm
install may intentionally fail. Invalid endpoint configuration exits 1.

## Website startup test

```sh
SIMULATION_TARGET=https://YOUR-CONTROLLED-HOST/collect npm run dev
```

Open `http://127.0.0.1:3000` to view the website. The server imports
`scripts/probe.cjs`, which triggers the attempt even before you open the page.
Refreshing the page does not repeat it; restarting the server does. A failed
network request is logged and the website keeps running. Stop with Ctrl+C.
The website uses built-in Node modules and needs no dependency download.

This is server-side execution: the request originates inside the secure box
when the server runs there. A browser-side import would run on the visitor's
machine and cannot directly read the Node server's environment.

To verify lifecycle suppression independently:

```sh
npm install --ignore-scripts
```

That command should not run the probe. It does not establish network isolation;
`npm start` remains a separate execution test.

## Optional local baseline

In one terminal:

```sh
npm run collector
```

In a second terminal, in this folder:

```sh
SIMULATION_TARGET=http://127.0.0.1:8787/collect npm start
```

The collector prints the fake payload and returns HTTP 200. Loopback is useful
for checking the fixture, but does not test internet egress. Inside an isolated
box, loopback points at that box, not necessarily your host machine.

## Uploading

Upload only this folder as your separate test repository. It contains no real
secrets and needs no parent-project files. Keep this README and the simulation
labels so anyone inspecting the repository knows its purpose. `private: true`
prevents accidental npm publication; it does not prevent Git repository uploads.

This fixture tests a root-project lifecycle hook and direct execution, not hidden
transitive dependency behavior or actual secret-read detection.
