const COMPONENT_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

function hasJsx(node) {
  if (!node || typeof node !== 'object') {
    return false;
  }

  if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
    return true;
  }

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (!value || key === 'parent') {
      continue;
    }

    if (Array.isArray(value) && value.some(hasJsx)) {
      return true;
    }

    if (!Array.isArray(value) && typeof value === 'object' && hasJsx(value)) {
      return true;
    }
  }

  return false;
}

function unwrapExpression(node) {
  let current = node;
  while (
    current?.type === 'TSAsExpression' ||
    current?.type === 'TSTypeAssertion' ||
    current?.type === 'TSNonNullExpression'
  ) {
    current = current.expression;
  }
  return current;
}

function isMemoCall(node, componentName) {
  const expression = unwrapExpression(node);
  return (
    expression?.type === 'CallExpression' &&
    expression.callee.type === 'Identifier' &&
    expression.callee.name === 'memo' &&
    expression.arguments.length === 1 &&
    expression.arguments[0]?.type === 'Identifier' &&
    expression.arguments[0].name === `${componentName}Component`
  );
}

function getDeclarationPropsComponentName(node) {
  if (
    node?.type !== 'FunctionDeclaration' ||
    !node.id?.name ||
    !COMPONENT_NAME_PATTERN.test(node.id.name) ||
    node.params.length === 0 ||
    !hasJsx(node.body)
  ) {
    return null;
  }

  return node.id.name.endsWith('Component')
    ? node.id.name.slice(0, -'Component'.length)
    : node.id.name;
}

function isPropsComponentExpression(node) {
  const expression = unwrapExpression(node);

  return (
    (expression?.type === 'ArrowFunctionExpression' ||
      expression?.type === 'FunctionExpression') &&
    expression.params.length > 0 &&
    hasJsx(expression.body)
  );
}

function getExportedMemoNames(node) {
  if (node.declaration?.type !== 'VariableDeclaration') {
    return [];
  }

  return node.declaration.declarations
    .filter(
      declarator =>
        declarator.id.type === 'Identifier' &&
        COMPONENT_NAME_PATTERN.test(declarator.id.name) &&
        isMemoCall(declarator.init, declarator.id.name),
    )
    .map(declarator => declarator.id.name);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require exported components with props to use NameComponent plus memo(NameComponent).',
    },
    messages: {
      requireMemo:
        'Export component "{{name}}" as `export const {{name}} = memo({{name}}Component);` with a `{{name}}Component` implementation.',
    },
    schema: [],
  },
  create(context) {
    return {
      Program(program) {
        const memoExportNames = new Set();
        const componentNamesWithProps = new Set();

        for (const node of program.body) {
          if (node.type === 'FunctionDeclaration') {
            const componentName = getDeclarationPropsComponentName(node);
            if (componentName) {
              componentNamesWithProps.add(componentName);
            }
          }

          if (node.type === 'ExportNamedDeclaration') {
            getExportedMemoNames(node).forEach(name =>
              memoExportNames.add(name),
            );
          }
        }

        for (const node of program.body) {
          if (node.type !== 'ExportNamedDeclaration') {
            continue;
          }

          if (node.declaration?.type === 'FunctionDeclaration') {
            const name = getDeclarationPropsComponentName(node.declaration);
            if (name) {
              context.report({
                node,
                messageId: 'requireMemo',
                data: { name },
              });
            }
            continue;
          }

          if (node.declaration?.type !== 'VariableDeclaration') {
            continue;
          }

          for (const declarator of node.declaration.declarations) {
            if (
              declarator.id.type !== 'Identifier' ||
              !COMPONENT_NAME_PATTERN.test(declarator.id.name)
            ) {
              continue;
            }

            const name = declarator.id.name;
            if (isMemoCall(declarator.init, name)) {
              continue;
            }

            if (memoExportNames.has(name)) {
              continue;
            }

            if (
              !componentNamesWithProps.has(name) &&
              !isPropsComponentExpression(declarator.init)
            ) {
              continue;
            }

            context.report({
              node: declarator,
              messageId: 'requireMemo',
              data: { name },
            });
          }
        }
      },
    };
  },
};
