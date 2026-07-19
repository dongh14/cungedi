import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = process.cwd();

function candidatePaths(filePath) {
  const candidates = [filePath];

  if (!path.extname(filePath)) {
    candidates.push(`${filePath}.ts`, `${filePath}.tsx`, `${filePath}.js`, `${filePath}.mjs`);
  }

  candidates.push(
    path.join(filePath, "index.ts"),
    path.join(filePath, "index.tsx"),
    path.join(filePath, "index.js"),
  );

  return candidates;
}

function resolveLocalFile(filePath) {
  return candidatePaths(filePath).find((candidate) => fs.existsSync(candidate));
}

export async function resolve(specifier, context, nextResolve) {
  let localSpecifier = specifier;

  if (specifier.startsWith("@/")) {
    localSpecifier = pathToFileURL(path.join(projectRoot, specifier.slice(2))).href;
  } else if (specifier.startsWith(".")) {
    localSpecifier = new URL(specifier, context.parentURL).href;
  }

  if (localSpecifier.startsWith("file:")) {
    const filePath = fileURLToPath(localSpecifier);
    const resolvedPath = resolveLocalFile(filePath);

    if (resolvedPath) {
      return nextResolve(pathToFileURL(resolvedPath).href, context);
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:")) {
    return nextLoad(url, context);
  }

  const filePath = fileURLToPath(url);

  if (!/\.tsx?$/u.test(filePath)) {
    return nextLoad(url, context);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      sourceMap: false,
    },
    fileName: filePath,
  });

  return {
    format: "module",
    source: transpiled.outputText,
    shortCircuit: true,
  };
}

