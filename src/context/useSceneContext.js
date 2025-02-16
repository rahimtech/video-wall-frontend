// useSceneContext.js
import { useMyContext } from "@/context/MyContext"; // استفاده از useMyContext برای دسترسی به context

// این hook داده‌های مورد نیاز برای توابع مختلف را از context دریافت می‌کند
export const useSceneContext = () => {
  const {
    setIsLoading,
    scenes,
    setScenes,
    setCollections,
    selectedCollection,
    setSelectedScene,
    url,
  } = useMyContext(); // دسترسی به context

  return {
    setIsLoading,
    scenes,
    setScenes,
    setCollections,
    selectedCollection,
    setSelectedScene,
    url,
  };
};
