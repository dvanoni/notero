export function getMainWindow(): Window {
  const mainWindow = Zotero.getMainWindow();
  if (mainWindow) return mainWindow;
  throw new Error('Zotero main window not available');
}
