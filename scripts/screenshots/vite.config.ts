import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import base from '../../vite.config';

const radio = fileURLToPath(new URL('../../src/lib/radio.ts', import.meta.url));
const mock = fileURLToPath(new URL('./mockRadio.ts', import.meta.url));

export default mergeConfig(base, defineConfig({
  root: fileURLToPath(new URL('../..', import.meta.url)),
  plugins: [{
    name: 'mock-radio',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer === mock) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved?.id === radio ? mock : null;
    },
  }],
}));
