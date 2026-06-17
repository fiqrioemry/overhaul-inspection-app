import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

const useTheme = () => {
  const darkMode = useUIStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
};

export default useTheme;
