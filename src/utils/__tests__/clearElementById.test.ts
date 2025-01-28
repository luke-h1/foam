import { clearElementById } from '../clearElementById';

describe('clearElementById', () => {
  test('should clear the innerHTML of the element with the given id', () => {
    document.body.innerHTML = `<div id="test">Hello, world!</div>`;
    clearElementById('test');
    const container = document.getElementById('test');
    expect(container?.innerHTML).toBe('');
  });

  test('should not throw an error if the element does not exist', () => {
    expect(() => clearElementById('nonexistent')).not.toThrow();
  });
});
