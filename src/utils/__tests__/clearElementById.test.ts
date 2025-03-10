import { clearElementById } from '../clearElementById';

describe('clearElementById', () => {
  test('should clear the innerHTML of the element with the given id', () => {
    // eslint-disable-next-line no-undef
    document.body.innerHTML = '<div id="test">Hello, world!</div>';
    clearElementById('test');
    // eslint-disable-next-line no-undef
    const container = document.getElementById('test');
    expect(container?.innerHTML).toBe('');
  });

  test('should not throw an error if the element does not exist', () => {
    expect(() => clearElementById('nonexistent')).not.toThrow();
  });
});
