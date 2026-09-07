/** Invisible drag strip for Electron `titleBarStyle: "hiddenInset"`. */
export function DesktopDragRegion() {
  return (
    <div
      aria-hidden
      className="desktop-drag-region fixed inset-x-0 top-0 z-[100] h-[52px]"
    />
  );
}
