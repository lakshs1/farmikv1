import { useEffect } from "react";

export const useJsonLd = (schemaObj: Record<string, any> | null, id: string) => {
  useEffect(() => {
    if (!schemaObj) return;

    // Remove existing script tag with this id if present
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    // Create and append the new JSON-LD block
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.innerHTML = JSON.stringify(schemaObj);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schemaObj, id]);
};
