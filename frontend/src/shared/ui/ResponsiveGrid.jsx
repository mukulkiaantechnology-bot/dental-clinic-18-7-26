export function ResponsiveGrid({ children, cols = 3, className = "" }) {
  const gridCols = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  };
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[cols] || 'lg:grid-cols-3'} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}
export default ResponsiveGrid;
