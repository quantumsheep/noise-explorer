export function clickOutside(node: Node, onEventFunction: () => void): { destroy(): void; } {
  const handleClick = (event: Event) => {
    const path = event.composedPath();

    if (!path.includes(node)) {
      onEventFunction();
    }
  }

  document.addEventListener("click", handleClick);

  return {
    destroy() {
      document.removeEventListener("click", handleClick);
    }
  }
}
