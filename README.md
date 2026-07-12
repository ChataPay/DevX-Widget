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

**Usage — npm package / ES module**
Import the shipped module and instantiate the widget in an ESM environment (recommended for DevX apps):

```js
import { FeedbackWidget } from 'devx-web-widget';

const widget = new FeedbackWidget({
  buttonLabel: 'Feedback',
  accentColor: '#2F6FED',
  position: 'right' // 'left' | 'right'
});

// programmatic control
widget.open('visible');
widget.close();
widget.destroy();

window.addEventListener('feedbackwidget:submit', (e) => {
  console.log('feedback payload', e.detail);
});
```

If you are using the package from a local build, the shipped `dist/` files are already available in the repository.

**Configuration options**
Pass the config object directly to the constructor:

- `buttonLabel` (string) — label shown on the side tab (default: `Feedback`)
- `backgroundColor` (string) — widget background color (hex)
- `textColor` (string)
- `accentColor` (string)
- `font` (string)
- `position` (`left` | `right`)
- `widgetType` (`default` | `chatbot`)

The `chatbot` type is available as a widget variant, but it currently renders the same feedback UI as the default type.

**Event payload**
The widget emits `feedbackwidget:submit` with `event.detail` containing:

- `title`
- `body`
- `user_handle`

The `body` text includes the page title, page URL, selected element selector (when available), option type, and submission timestamp.
