import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type SetTitle = (key: string, title: string | null) => void;

const TitleContext = createContext<string | null>(null);
const SetTitleContext = createContext<SetTitle>(() => {});

export function BreadcrumbTitleProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const [entry, setEntry] = useState<{ key: string; title: string | null }>({ key: "", title: null });
  const setTitle = useCallback<SetTitle>((key, title) => setEntry({ key, title }), []);
  // A title only applies to the exact URL that set it, so it can never leak onto another route.
  const title = entry.key === pathname + search ? entry.title : null;
  return (
    <SetTitleContext.Provider value={setTitle}>
      <TitleContext.Provider value={title}>{children}</TitleContext.Provider>
    </SetTitleContext.Provider>
  );
}

/** Layout side: the page-provided label for the last crumb, if any. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBreadcrumbTitleValue() {
  return useContext(TitleContext);
}

/** Page side: replaces the last crumb label while mounted. */
// eslint-disable-next-line react-refresh/only-export-components
export function useBreadcrumbTitle(title?: string | null) {
  const setTitle = useContext(SetTitleContext);
  const { pathname, search } = useLocation();
  useEffect(() => {
    const key = pathname + search;
    setTitle(key, title?.trim() || null);
    return () => setTitle(key, null);
  }, [title, pathname, search, setTitle]);
}
