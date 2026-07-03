import {
  addCreatedClip,
  type CreatedClipRecord,
  createdClips$,
  MAX_CREATED_CLIPS,
  removeCreatedClip,
} from '../state';

function makeRecord(id: string): CreatedClipRecord {
  return {
    id,
    broadcasterLogin: 'zoil',
    broadcasterName: 'Zoil',
    createdAt: 1_700_000_000_000,
  };
}

describe('createdClips state', () => {
  beforeEach(() => {
    createdClips$.clips.set([]);
  });

  test('prepends new clips', () => {
    addCreatedClip(makeRecord('a'));
    addCreatedClip(makeRecord('b'));

    expect(createdClips$.clips.peek().map(clip => clip.id)).toEqual(['b', 'a']);
  });

  test('re-adding an existing clip moves it to the front without duplicating', () => {
    addCreatedClip(makeRecord('a'));
    addCreatedClip(makeRecord('b'));
    addCreatedClip(makeRecord('a'));

    expect(createdClips$.clips.peek().map(clip => clip.id)).toEqual(['a', 'b']);
  });

  test('caps the list at the maximum', () => {
    for (let i = 0; i < MAX_CREATED_CLIPS + 10; i += 1) {
      addCreatedClip(makeRecord(String(i)));
    }

    const clips = createdClips$.clips.peek();
    expect(clips).toHaveLength(MAX_CREATED_CLIPS);
    expect(clips[0]?.id).toEqual(String(MAX_CREATED_CLIPS + 9));
  });

  test('removeCreatedClip drops the record', () => {
    addCreatedClip(makeRecord('a'));
    addCreatedClip(makeRecord('b'));

    removeCreatedClip('a');

    expect(createdClips$.clips.peek().map(clip => clip.id)).toEqual(['b']);
  });
});
