/**
 * Vite Plugin for JavaScript Obfuscation
 *
 * This plugin integrates javascript-obfuscator with Vite build process
 * to protect the frontend code from reverse engineering.
 */

const JavaScriptObfuscator = require("javascript-obfuscator");

/**
 * Create obfuscation plugin
 * @param {Object} options - Obfuscation options
 * @returns {Object} Vite plugin
 */
function obfuscatePlugin(options = {}) {
  const defaultOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.3,
    debugProtection: false,
    disableConsoleOutput: true,
    identifierNamesGenerator: "hexadecimal",
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: ["base64"],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: "function",
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,
  };

  const obfuscationOptions = { ...defaultOptions, ...options };

  return {
    name: "vite-plugin-obfuscate",
    enforce: "post",
    apply: "build",

    generateBundle(outputOptions, bundle) {
      console.log("\n🔒 Obfuscating JavaScript bundles...\n");

      let obfuscatedCount = 0;
      const startTime = Date.now();

      for (const fileName in bundle) {
        const chunk = bundle[fileName];

        // Only obfuscate JavaScript chunks
        if (chunk.type === "chunk" && fileName.endsWith(".js")) {
          try {
            console.log(`  Obfuscating: ${fileName}`);

            // Obfuscate the code
            const obfuscated = JavaScriptObfuscator.obfuscate(
              chunk.code,
              obfuscationOptions
            );

            // Replace the code with obfuscated version
            chunk.code = obfuscated.getObfuscatedCode();
            obfuscatedCount++;

            console.log(
              `  ✓ ${fileName} (${(chunk.code.length / 1024).toFixed(2)} KB)`
            );
          } catch (error) {
            console.error(
              `  ✗ Failed to obfuscate ${fileName}:`,
              error.message
            );
          }
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n✅ Obfuscated ${obfuscatedCount} files in ${duration}s\n`);
    },
  };
}

module.exports = obfuscatePlugin;
