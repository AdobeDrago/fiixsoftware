# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Testing

Install Chromium once, then run the network-free Playwright migration framework tests:

```sh
npx playwright install chromium
npm run test:migration:unit
```

Push CI runs linting and all 27 migration unit tests. The complete public-site comparison remains a
manual workflow because it depends on mutable WordPress and EDS environments.

## Migration validation

The Playwright suite generates semantic, responsive, and visual comparisons for 67 WordPress-to-EDS
page mappings. Run it against the default develop preview with:

```sh
npm run test:migration
```

Target another EDS environment by supplying its exact origin:

```sh
MIGRATION_EDS_ORIGIN=https://my-feature--fiixsoftware--adobedrago.aem.page \
  npm run test:migration -- --grep "@product"
```

See the [Playwright migration validation guide](tests/migration/README.md) for the test inventory,
architecture, debugging, reports, CI workflow, environment targeting, accepted-difference policy,
troubleshooting, runtime estimates, and known limitations.

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
