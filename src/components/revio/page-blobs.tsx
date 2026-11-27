/**
 * Two soft organic shapes behind the pages (Revio's organic touch): lavender at the top right, pink at the bottom
 * left. Decorative only: hidden from screen readers, never in the way of a click, clipped sideways so they never
 * make the page scroll.
 */
export function PageBlobs() {
  return (
    <>
      <svg
        width="320"
        height="320"
        viewBox="-100 -100 200 200"
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-32 fill-brand-soft opacity-70 dark:opacity-40"
      >
        <path d="M44.7,-58.6C57.3,-48.4,66.7,-34.5,71.1,-18.9C75.5,-3.3,74.9,14,67.6,27.7C60.3,41.4,46.3,51.5,31.2,58.8C16.1,66.1,0,70.6,-17.3,69.3C-34.6,68,-53.1,60.9,-63.8,47.6C-74.5,34.3,-77.4,14.8,-74.3,-3.1C-71.2,-21,-62.1,-37.3,-49,-47.7C-35.9,-58.1,-18.9,-62.6,-1.4,-60.8C16.1,-59,32.1,-68.8,44.7,-58.6Z" />
      </svg>
      <svg
        width="240"
        height="240"
        viewBox="-100 -100 200 200"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 -left-28 fill-revio-social opacity-10"
      >
        <path d="M38.5,-52.1C49.2,-44.2,56.6,-32,62.3,-18.1C68,-4.2,72,11.4,67.4,24.3C62.8,37.2,49.6,47.4,35.5,55.6C21.4,63.8,6.4,70,-9.6,70.6C-25.6,71.2,-42.6,66.2,-53.2,55C-63.8,43.8,-68,26.4,-69.8,9.4C-71.6,-7.6,-71,-24.2,-63.2,-36.5C-55.4,-48.8,-40.4,-56.8,-26.2,-62.6C-12,-68.4,1.4,-72,14.4,-68.6C27.4,-65.2,27.8,-60,38.5,-52.1Z" />
      </svg>
    </>
  );
}
