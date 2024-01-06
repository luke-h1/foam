import { render, screen } from '@testing-library/react-native';
import Tags from '../Tags';

describe('Tags', () => {
  it('should render the tags correctly', () => {
    const tags = ['tag1', 'tag2', 'tag3'];
    render(<Tags tags={tags} />);
    expect(screen.getByText('tag1')).toBeVisible();
    expect(screen.getByText('tag2')).toBeVisible();
    expect(screen.getByText('tag3')).toBeVisible();
  });
});
