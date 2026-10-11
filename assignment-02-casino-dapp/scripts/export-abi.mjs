import { mkdir, readFile, writeFile } from "node:fs/promises";

const artifactPath = new URL(
  "../artifacts/contracts/Casino.sol/Casino.json",
  import.meta.url,
);
const outputDirectory = new URL("../frontend/src/abi/", import.meta.url);
const outputPath = new URL("Casino.json", outputDirectory);
const artifact = JSON.parse(await readFile(artifactPath, "utf8"));

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(artifact.abi, null, 2)}\n`);
console.log("Exported Casino ABI to frontend/src/abi/Casino.json");
