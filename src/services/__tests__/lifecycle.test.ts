import { createLifecycle } from '../lifecycle';

describe('app lifecycle', () => {
  it('a system prompt (inactive then active) is not a return', () => {
    const l = createLifecycle();
    expect(l.next('inactive')).toBeNull();
    expect(l.next('active')).toBeNull();
  });

  it('a real background gives one left and one returned', () => {
    const l = createLifecycle();
    expect(l.next('inactive')).toBeNull();
    expect(l.next('background')).toBe('left');
    expect(l.next('background')).toBeNull();
    expect(l.next('inactive')).toBeNull();
    expect(l.next('active')).toBe('returned');
    expect(l.next('active')).toBeNull();
  });

  it('works again for the next background', () => {
    const l = createLifecycle();
    l.next('background');
    l.next('active');
    expect(l.next('background')).toBe('left');
    expect(l.next('active')).toBe('returned');
  });
});
