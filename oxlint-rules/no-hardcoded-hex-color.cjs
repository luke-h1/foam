const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

module.exports = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      hexColor:
        'Avoid hardcoded hex colors in UI. Use a theme token from src/styles/themes.ts (e.g. theme.color.live, theme.color.surface, theme.colorWhite) so colors stay consistent.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (HEX_COLOR.test(String(node.value))) {
          context.report({ node, messageId: 'hexColor' });
        }
      },
    };
  },
};
