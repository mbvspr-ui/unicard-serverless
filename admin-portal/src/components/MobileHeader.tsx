export default function MobileHeader() {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/unicraft-logo.svg" alt="Unicraft" className="w-8 h-8" />
          <div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Unicraft
            </span>
            <p className="text-xs text-muted-foreground -mt-1">Admin Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
