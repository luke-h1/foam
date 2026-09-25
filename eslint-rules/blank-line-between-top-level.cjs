function isImportLike(node) {
  return (
    node.type === 'ImportDeclaration' ||
    node.type === 'TSImportEqualsDeclaration' ||
    (node.type === 'ExportNamedDeclaration' && node.source !== null) ||
    node.type === 'ExportAllDeclaration'
  );
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description:
        'require a blank line between top-level statements unless both fit on one line',
    },
    schema: [],
    messages: {
      missing: 'Add a blank line between top-level statements.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program(program) {
        const body = program.body;
        for (let i = 1; i < body.length; i++) {
          const prev = body[i - 1];
          const next = body[i];
          if (isImportLike(prev) && isImportLike(next)) {
            continue;
          }
          const prevOneLine = prev.loc.start.line === prev.loc.end.line;
          const nextOneLine = next.loc.start.line === next.loc.end.line;
          if (prevOneLine && nextOneLine) {
            continue;
          }
          const leading = sourceCode
            .getCommentsBefore(next)
            .filter(c => c.loc.start.line > prev.loc.end.line);
          const first = leading[0] ?? next;
          if (first.loc.start.line !== prev.loc.end.line + 1) {
            continue;
          }
          context.report({
            node: next,
            loc: first.loc.start,
            messageId: 'missing',
            fix: fixer => fixer.insertTextBefore(first, '\n'),
          });
        }
      },
    };
  },
};
