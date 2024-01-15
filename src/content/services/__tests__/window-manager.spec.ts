import { createWindowMock } from '../../../../test/utils/window-mock';
import { WindowManager } from '../window-manager';

describe('WindowManager.getLatestWindow', () => {
  it('returns the latest available window', () => {
    const windowManager = new WindowManager();

    const window1 = createWindowMock();
    const window2 = createWindowMock();
    const window3 = createWindowMock();

    windowManager.addToWindow(window1);
    windowManager.addToWindow(window2);
    windowManager.addToWindow(window3);
    windowManager.removeFromWindow(window2);

    expect(windowManager.getLatestWindow()).toBe(window3);

    windowManager.removeFromWindow(window3);

    expect(windowManager.getLatestWindow()).toBe(window1);
  });

  it('returns undefined when all windows have been removed', () => {
    const windowManager = new WindowManager();

    const window1 = createWindowMock();
    const window2 = createWindowMock();

    windowManager.addToWindow(window1);
    windowManager.addToWindow(window2);
    windowManager.removeFromWindow(window1);

    expect(windowManager.getLatestWindow()).toBe(window2);

    windowManager.removeFromWindow(window2);

    expect(windowManager.getLatestWindow()).toBeUndefined();
  });
});
