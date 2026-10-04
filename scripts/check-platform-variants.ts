/**
 * A platform variant (`x.ios.tsx`, `x.android.tsx`, `x.web.tsx`,
 * `x.native.tsx`) must export every value its base file `x.tsx` exports and
 * accept every prop the base accepts.
 *
 * tsc checks every caller against the base file, but Metro renders the
 * variant. A prop added only to the base type-checks, then the variant drops
 * it at runtime on that platform. `reservedCharacters` on the chat composer
 * went missing on iOS this way.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import ts from 'typescript';

const VARIANT_PATTERN = /\.(ios|android|web|native)\.tsx$/;

function variantPairs(): [string, string][] {
  const tracked = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter(file => VARIANT_PATTERN.test(file));

  return tracked
    .map((variant): [string, string] => [
      variant.replace(VARIANT_PATTERN, '.tsx'),
      variant,
    ])
    .filter(([base]) => existsSync(base));
}

function loadProgram(files: string[]): ts.Program {
  const { config } = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, '.');

  return ts.createProgram(files, { ...parsed.options, noEmit: true });
}

/**
 * The prop names of every exported value, keyed by export name. An export that
 * takes no object parameter has no props.
 */
function exportedProps(
  program: ts.Program,
  file: string,
): Map<string, Set<string>> {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  const result = new Map<string, Set<string>>();

  const moduleSymbol = source && checker.getSymbolAtLocation(source);

  if (!moduleSymbol) {
    return result;
  }

  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    // A type import resolves against the base file on every platform.
    const symbol =
      exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;

    if (!(symbol.flags & ts.SymbolFlags.Value)) {
      continue;
    }

    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];

    if (!declaration) {
      continue;
    }

    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const [signature] = type.getCallSignatures();
    const [parameter] = signature?.getParameters() ?? [];

    if (!parameter) {
      result.set(exported.getName(), new Set());
      continue;
    }

    const parameterType = checker.getTypeOfSymbolAtLocation(
      parameter,
      declaration,
    );

    result.set(
      exported.getName(),
      new Set(
        checker
          .getPropertiesOfType(checker.getNonNullableType(parameterType))
          .map(property => property.getName()),
      ),
    );
  }

  return result;
}

function compare(
  base: Map<string, Set<string>>,
  variant: Map<string, Set<string>>,
): string[] {
  return [...base].flatMap(([name, baseProps]) => {
    const variantProps = variant.get(name);

    if (!variantProps) {
      return [`export \`${name}\` is missing`];
    }

    const missing = [...baseProps].filter(prop => !variantProps.has(prop));

    return missing.length > 0
      ? [`\`${name}\` does not accept: ${missing.join(', ')}`]
      : [];
  });
}

function main(): void {
  const pairs = variantPairs();
  const program = loadProgram(pairs.flat());
  const failures: string[] = [];

  for (const [base, variant] of pairs) {
    const problems = compare(
      exportedProps(program, base),
      exportedProps(program, variant),
    );

    problems.forEach(problem => failures.push(`${variant}: ${problem}`));
  }

  if (failures.length > 0) {
    console.error(`${failures.length} platform variant mismatch(es):\n`);
    failures.forEach(failure => console.error(`  ${failure}`));
    console.error(
      '\nGive the variant every export and prop its base file has.',
    );
    process.exit(1);
  }

  console.log(`All ${pairs.length} platform variants match their base file.`);
}

main();
