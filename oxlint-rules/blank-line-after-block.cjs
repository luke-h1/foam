const BLOCK_LIKE = new Set([
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'SwitchStatement',
  'TryStatement',
]);

function isExpectStatement(statement) {
  if (statement.type !== 'ExpressionStatement') {
    return false;
  }

  return callsExpect(statement.expression);
}

function callsExpect(node) {
  if (node.type === 'AwaitExpression') {
    return callsExpect(node.argument);
  }

  if (node.type === 'ChainExpression') {
    return callsExpect(node.expression);
  }

  if (node.type === 'CallExpression') {
    return callsExpect(node.callee);
  }

  if (node.type === 'MemberExpression') {
    return callsExpect(node.object);
  }

  if (node.type === 'Identifier') {
    return node.name === 'expect';
  }

  return false;
}

function hasBlankLineBetween(sourceCode, prev, next) {
  const prevEnd = prev.loc?.end.line;
  if (prevEnd === undefined) {
    return true;
  }

  const leading = sourceCode
    .getCommentsBefore(next)
    .filter(comment => (comment.loc?.start.line ?? 0) > prevEnd);
  const first = leading[0] ?? next;
  const firstLine = first.loc?.start.line;
  if (firstLine === undefined) {
    return true;
  }

  return firstLine > prevEnd + 1;
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description:
        'Require a blank line after a block-like statement, and between expectations.',
    },
    schema: [],
    messages: {
      missing: 'Add a blank line after this block before the next statement.',
      expects: 'Add a blank line between expectations.',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    function checkList(statements) {
      for (let i = 0; i < statements.length - 1; i += 1) {
        const prev = statements[i];
        const next = statements[i + 1];
        if (!prev || !next) {
          continue;
        }

        const expects = isExpectStatement(prev) && isExpectStatement(next);
        if (!BLOCK_LIKE.has(prev.type) && !expects) {
          continue;
        }

        if (hasBlankLineBetween(sourceCode, prev, next)) {
          continue;
        }

        const leading = sourceCode
          .getCommentsBefore(next)
          .filter(
            comment =>
              (comment.loc?.start.line ?? 0) > (prev.loc?.end.line ?? 0),
          );
        const first = leading[0] ?? next;

        context.report({
          node: prev,
          messageId: expects ? 'expects' : 'missing',
          fix(fixer) {
            const start = first.range?.[0];
            const column = first.loc?.start.column;
            if (start === undefined || column === undefined) {
              return fixer.insertTextBefore(first, '\n');
            }

            const lineStart = start - column;
            return fixer.insertTextBeforeRange([lineStart, lineStart], '\n');
          },
        });
      }
    }

    return {
      BlockStatement(node) {
        checkList(node.body);
      },
      Program(node) {
        checkList(node.body);
      },
      SwitchCase(node) {
        checkList(node.consequent);
      },
    };
  },
};
