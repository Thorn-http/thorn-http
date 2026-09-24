# Browser Extension (MV3)

This is based on Chrome Manifest V3.

## Install dependencies

```sh
npm install
```

## Local development

### Configuration

```sh
BROWSER=chrome ENV=local npm run config
```

### Run on Chrome

```sh
npm run build
```

### Load extension in Chrome

- Open [chrome://extensions](chrome://extensions), enable Developer mode, and choose `Load unpacked`.
- Select and upload `dist` folder

### Build in watch mode

To build automatically on doing changes in source files (Watch mode):

```sh
npm run watch
```

Open another terminal instance, navigate to `browser-extension/common` and run: `npm run watch`.

## Release process

See [release-process.md](./release-process.md).
