import { ReactNode, useState } from "react";

// type StackLayer<T extends any[]> = {
//   data: T;
//   compute: (...args: T) => any;
// }

// class LayerStack<T extends unknown[]> {
//   private stack: StackLayer<unknown[]>[] = [];

//   constructor(/*initialData: T*/) {
//     //this.stack.push({ data: initialData, compute: () => { return; } });
//     return this;
//   }

//   addLayer<U>(data: U, compute: (...args: [...T, U]) => any): LayerStack<[...T, U]> {
//     const currentData = this.stack[this.stack.length - 1].data;
//     this.stack.push({ data: [...currentData, data], compute });
//     return this as unknown as LayerStack<[...T, U]>;
//   }

//   // pop(): LayerStack<T> {
//   //   if (this.stack.length > 1) {
//   //     this.stack.pop();
//   //   }
//   //   return this;
//   // }

//   // computeLayer(): any {
//   //   const { data, compute } = this.stack[this.stack.length - 1];
//   //   return compute(...data);
//   // }
// }

// // Example Usage
// const stack = new LayerStack<[]>()
//   .addLayer('Hi', (a) => a)
//   .addLayer(20, (a, b) => a + b) 
//   .addLayer(true, (a, b, c) => a + b + c); 

// //console.log(stack.computeLayer()); // Should output 60

// //stack.pop(); // Removes the last layer
// //console.log(stack.computeLayer()); // Should output 30

// type InputSelection = {
//   separator: ',' | ';';
//   privacyFormFilePath: string;
//   surveyFilePath: string;
//   outputDirectoryPath: string;
// };

// type ColumnDefinitionArg = {
//   privacyFormHeaders: string[];
//   surveyHeaders: string[];
// }

// type ColumnDefinition = {
//   privacyFormStudyCodeColumn: string;
//   privacyFormConsentColumn: string;
//   surveyStudyCodeColumn: string;
// };

// type JobResult = {
//   timestamp: Date;
//   stats: object;
//   privacyFormEntries: string[];
//   surveyEntries: string[];
//   uniqueEntries: string[];
// };

type InputStep<T extends unknown[], U> = {
  num: string;
  name: string;
  render: (props: { submitStep: (step: U) => Promise<void>, steps: T }) => ReactNode;
};

type TransformStep<T, U> = (props: { steps: T }) => U | Promise<U>;

type Step = InputStep<unknown[], unknown> | TransformStep<unknown[], unknown>

class MultistepForm<T extends unknown[]> {

  constructor(private steps: unknown[]) {}

  addInputStep<U>(step: InputStep<T, U>) {
    this.steps.push(step);
    return this as unknown as MultistepForm<[...T, U]>;
  }

  addTransformStep<U>(step: TransformStep<T, U>) {
    if (this.steps.length == 0) throw new Error('Cannot add transform step as first step');
    this.steps.push(step);
    return this as unknown as MultistepForm<[...T, U]>;
  }
}

export function useMultistepForm2(populateSteps: (form: MultistepForm<[]>) => MultistepForm<unknown[]>) {
  const steps: Step[] = [];
  populateSteps(new MultistepForm(steps));
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [data, setData] = useState<unknown[]>([]);
  const currentStep = steps.at(currentStepIdx);
  if (!currentStep || typeof currentStep === 'function') throw new Error(`No input step for index ${currentStepIdx}`);
  //console.log(currentStepIdx, currentStep)
  return { 
    steps,
    currentStepIdx,
    renderCurrentStep: () => currentStep.render({ 
      steps: data, 
      submitStep: async (step: unknown) => {
        const currentData = [...data, step];
        setData(currentData); 
        let idx = currentStepIdx + 1;
        while (typeof steps.at(idx) === 'function') {
          //console.log(currentData);
          const newData = await (steps.at(idx) as TransformStep<unknown[], unknown>)({ steps: currentData });
          setData(prev => [...prev, newData]);
          ++idx;
        }
        setCurrentStepIdx(idx);
      }
    }),
    pop: () => {
      let idx = currentStepIdx;
      while (typeof steps.at(idx) === 'function') {
        --idx;
      }
      setData(prev => prev.slice(0, idx));
      setCurrentStepIdx(idx);
    },
  };
}


