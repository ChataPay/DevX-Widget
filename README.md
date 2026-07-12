**DevX Web Feedback Widget**

A small, dependency-free feedback widget you can drop into any website. It provides a side tab that opens two feedback flows:
- "Feedback on this page" — pick an element on the page and include a selector in the feedback
- "Quick feedback" — general feedback (selector hidden)

**Features**
- **Style-isolated**: runs inside a Shadow DOM to avoid style collisions
- **Two flows**: element picker and quick feedback
- **Lightweight**: no runtime dependencies for the module
- **Event-driven**: emits a `feedbackwidget:submit` event with the payload

**About DevX**
DevX is a platform for developer experience tooling and integrations — learn more at https://devx.today/. This repository provides the official web feedback widget used by DevX for collecting lightweight feedback from web pages.

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

CDN (recommended for quick start):

Include the prebuilt CDN-hosted bundle directly from unpkg:

```html
<script src="https://app.unpkg.com/devx-web-widget@1.1.0/files/dist/feedback-widget.js"></script>
<script>

    const DEFAULT_CONFIG = {
        buttonLabel: 'Feedback',
        backgroundColor: '#111827',
        textColor: '#ffffff',
        accentColor: '#2F6FED',
        font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        position: 'right',
        widgetType: 'default'
    };

    const feedbackWidget = new FeedbackWidget("api_key", DEFAULT_CONFIG);

    window.addEventListener('feedbackwidget:submit', (event) => {
        console.log(event)
    });
  </script>
```

Note: using the CDN is the simplest way to get started; it serves the built `dist/feedback-widget.js` for versioned consumption.

Local bundle (if you need to customize or avoid CDN):


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


**Event payload**
The widget emits `feedbackwidget:submit` with `event.detail` containing:

- `optionType`: `page_item_visible` | `page_item_hidden`
- `elementSelector`: CSS selector string or `null`
- `pageUrl`, `pageTitle`, `title`, `feedback`, `email`, `submittedAt`
