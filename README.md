**DevX Web Feedback Widget**

A small, dependency-free feedback widget you can drop into any website. It provides a side tab that opens two feedback flows:
- "Feedback on this page" — pick an element on the page and include a selector in the feedback
- "Quick feedback" — general feedback (selector hidden)

**Features**
- **Style-isolated**: runs inside a Shadow DOM to avoid style collisions
**DevX Web Feedback Widget**

A small, dependency-free feedback widget you can drop into any website. It provides a side tab that opens two feedback flows:
- "Feedback on this page" — pick an element on the page and include a selector in the feedback
- "Quick feedback" — general feedback (selector hidden)

**Features**
- **Style-isolated**: runs inside a Shadow DOM to avoid style collisions
- **Two flows**: element picker and quick feedback
- **Lightweight**: no runtime dependencies for the browser build
- **Event-driven**: emits a `feedbackwidget:submit` event with the payload

**Install (npm / pnpm / yarn)**
Install the package from the registry (package name from `package.json` is `devx-web-widget`):

```bash
# npm
npm install devx-web-widget

# pnpm
pnpm add devx-web-widget

# yarn
yarn add devx-web-widget
```

**Quick usage — Browser script (drop-in)**
Serve `src/feedback-widget.js` or bundle/publish it to a CDN and include it directly on pages where you want feedback capture.

```html
<script>
  window.FeedbackWidgetConfig = {
    endpoint: 'https://your-api.example.com/feedback', // optional: your ingestion endpoint
    buttonLabel: 'Feedback',                            // optional
    accentColor: '#2F6FED'                             // optional
  };
</script>
<script src="/path/to/feedback-widget.js"></script>
```

Notes:
- The browser build reads `window.FeedbackWidgetConfig`. If `endpoint` is provided, submissions will be POSTed to it.
- The browser build exposes a minimal global: `window.FeedbackWidget.open()` and `window.FeedbackWidget.close()`.

**Usage — npm package / ES module (DevX projects)**
Import the shipped module and instantiate the widget in an ESM environment (recommended for DevX apps):

```js
import { FeedbackWidget } from 'devx-web-widget';

// Pass an API key and a config object when appropriate
const widget = new FeedbackWidget(/* apiKeyOrEmpty */ '', {
  buttonLabel: 'Feedback',
  accentColor: '#2F6FED',
  position: 'right' // 'left' | 'right'
});

// programmatic control
widget.open('visible');
widget.close();
// widget.destroy();

window.addEventListener('feedbackwidget:submit', (e) => {
  console.log('feedback payload', e.detail);
});
```

Important: do not hard-code sensitive API keys into browser bundles. See the "For DevX users" section below for recommended patterns.

**Configuration options**
Pass the config as the second constructor argument (or use `window.FeedbackWidgetConfig` for the browser build):

- `buttonLabel` (string) — label shown on the side tab (default: `Feedback`)
- `backgroundColor` (string) — widget background color (hex)
- `textColor` (string)
- `accentColor` (string)
- `font` (string)
- `position` (`left` | `right`)
- `widgetType` (`default` | `chatbot`)

**API / endpoint and API Key**
- Browser build: set `window.FeedbackWidgetConfig.endpoint` to have the widget POST the submitted payload directly to your endpoint.
- npm/TS class: passing a non-empty API key to `new FeedbackWidget(apiKey, config)` causes the widget to POST a formatted message body to `https://devx.today/v1/widget/ingest` with `Authorization: Bearer <API_KEY>`.

Security recommendations (for DevX teams)
- Do not embed production API keys in client bundles. Instead use a server-side ingestion proxy:
  1. Client widget posts to your internal endpoint (no secret in client)
  2. Your server validates, augments, and forwards to DevX ingestion (`https://devx.today/v1/widget/ingest`) using a server-side-stored API key

Example Node/Express forwarder (DevX pattern):

```js
// server.js
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.post('/api/widget-feedback', async (req, res) => {
  const payload = req.body;
  // perform validation, rate-limiting, enrich payload as needed
  await fetch('https://devx.today/v1/widget/ingest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEVX_API_KEY}`
    },
    body: JSON.stringify(payload)
  });
  res.status(202).end();
});

app.listen(3000);
```

Then configure the client/browser widget to use `/api/widget-feedback` as `endpoint`.

**Event payload**
The widget emits `feedbackwidget:submit` with `event.detail` containing:

- `optionType`: `page_item_visible` | `page_item_hidden`
- `elementSelector`: CSS selector string or `null`
- `pageUrl`, `pageTitle`, `title`, `feedback`, `email`, `submittedAt`

**Build & development**
- Install dependencies (pnpm recommended):

```bash
pnpm install
```

- Dev (live watch):

```bash
pnpm run dev
```

- Build to `dist`:

```bash
pnpm run build
```

**Publishing notes (npm / DevX registry)**
- Verify `package.json.name` is `devx-web-widget` and update `version`, `license`, and `repository` fields.
- If publishing to an internal DevX registry, update `.npmrc` with the registry authentication and scope as required.

**Contributing / Extending**
- To add a configurable `endpoint` to the TypeScript constructor I can implement that change and update tests.
- Consider adding unit tests for selector generation, and an optional E2E demo page for QA.

---

If you'd like, I can implement any of the following now:
- add `endpoint` to the TypeScript constructor (so consumers can pass a custom endpoint from code),
- produce a UMD build for CDN consumption,
- create a small demo HTML page that loads the built file and demonstrates submissions.
