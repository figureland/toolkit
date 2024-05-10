import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: [
    // './src/index.ts',
    './src/device.ts',
    './src/clipboard.ts',
    './src/filedrop.ts',
    './src/fullscreen.ts',
    './src/keycommands.ts',
    './src/pointer.ts',
    './src/screen.ts',
    './src/sfx.ts',
    './src/dom.ts'
  ],
  outdir: './dist',
  minify: false,
  plugins: [dts()],
  external: [
    '@figureland/mathkit',
    '@figureland/statekit',
    '@figureland/typekit',
    '@figureland/toolkit'
  ]
})
