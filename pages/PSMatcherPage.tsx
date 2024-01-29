import React, { useEffect } from "react";

import { useTitleContext } from "@/components/title-context";
import { MultiStepForm } from "@/components/ps-matcher/MultiStepForm";


export function PSMatcherPage() {
  const { setTitle } = useTitleContext();
  useEffect(() => setTitle('P+S Matcher'), []);

  return (
    <main>
      <MultiStepForm />
    </main>
  );
}
