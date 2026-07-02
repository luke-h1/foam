const path = require('path');

const DEEP_RELATIVE = /^\.\.\/\.\.\//;

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer the @app/* alias over deep (../../) relative imports that cross feature boundaries.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      preferAlias:
        "Use the '@app/*' alias instead of the deep relative import '{{source}}'.",
    },
  },
  create(context) {
    const cwd =
      typeof context.getCwd === 'function' ? context.getCwd() : context.cwd;
    const srcRoot = path.join(cwd, 'src');
    const filename =
      typeof context.getFilename === 'function'
        ? context.getFilename()
        : context.filename;

    function check(node) {
      const sourceNode = node.source;
      if (!sourceNode || typeof sourceNode.value !== 'string') {
        return;
      }

      const value = sourceNode.value;
      if (!DEEP_RELATIVE.test(value)) {
        return;
      }

      const resolved = path.resolve(path.dirname(filename), value);
      if (!resolved.startsWith(srcRoot + path.sep)) {
        return;
      }

      const aliased = `@app/${path
        .relative(srcRoot, resolved)
        .split(path.sep)
        .join('/')}`;

      context.report({
        node: sourceNode,
        messageId: 'preferAlias',
        data: { source: value },
        fix(fixer) {
          const quote = sourceNode.raw ? sourceNode.raw[0] : "'";
          return fixer.replaceText(sourceNode, `${quote}${aliased}${quote}`);
        },
      });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
