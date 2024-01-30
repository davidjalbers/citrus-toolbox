import { ReactNode, createElement, useEffect, useState } from "react";

export type ViewStepComponent<DataTuple, NewData = void> = (props: { 
  data: DataTuple,
  push: (data: NewData) => Promise<void>,
  pop: () => void,
}) => ReactNode;

export type ViewStep<DataTuple extends unknown[], NewData = void> = {
  num: string;
  name: string;
  element: ViewStepComponent<DataTuple, NewData>;
};

export type DataStep<DataTuple, NewData> = (data: DataTuple) => NewData | Promise<NewData>;

export class MultistepForm<DataTuple extends unknown[]> {

  public steps: (ViewStep<unknown[], unknown> | DataStep<unknown[], unknown>)[] = [];

  addViewStep = <NewData = void>(step: ViewStep<DataTuple, NewData>) => this.addStep<NewData>(step);

  addDataStep = <NewData>(step: DataStep<DataTuple, NewData>) => this.addStep<NewData>(step);

  private addStep<NewData>(step: ViewStep<DataTuple, NewData> | DataStep<DataTuple, NewData>) {
    this.steps.push(step as ViewStep<unknown[], unknown> | DataStep<unknown[], unknown>);
    return this as unknown as MultistepForm<[...DataTuple, NewData]>;
  }
}

export function useMultistepForm<DataTuple extends unknown[]>(addSteps: (form: MultistepForm<[]>) => MultistepForm<DataTuple>) {
  const [data, setData] = useState<unknown[]>([]);
  const form = addSteps(new MultistepForm());
  const steps = form.steps;
  const [index, setIndex] = useState(0);
  const currentStep = steps.at(index);
  if (typeof currentStep !== "object") throw new Error(`Illegal state: No view step for index ${index}`);
  const viewSteps: ViewStep<unknown[], unknown>[] = (steps.filter(step => typeof step !== 'function') as ViewStep<unknown[], unknown>[]);
  const [viewStepStatus, setViewStepStatus] = useState<('completed' | 'current' | 'pending')[]>(viewSteps.map((step, idx) => {
    if (idx == 0) return 'current';
    return 'pending';
  }));
  const viewStepIndex = viewSteps.indexOf(currentStep);
  useEffect(() => {
    setViewStepStatus(prev => {
      prev[viewStepIndex] = 'current';
      return [ ...prev];
    });
  }, [viewStepIndex]);
  return { 
    viewSteps: viewSteps.map((step, idx) => ({ ...step, status: viewStepStatus[idx] })),
    viewStepIndex,
    currentViewStep: createElement(currentStep.element, {
      data: data,
      push: async (step: unknown) => {
        setViewStepStatus(prev => {
          prev[viewStepIndex] = 'completed';
          return [ ...prev ];
        });
        let idx = index;
        data.push(step);
        ++idx;
        while (typeof steps.at(idx) === 'function') {
          data.push(await (steps.at(idx) as DataStep<unknown[], unknown>)(data));
          ++idx;
        }
        setData(data); 
        setIndex(idx);
      },
      pop: () => {
        let idx = index;
        data.pop();
        --idx;
        while (typeof steps.at(idx) === 'function') {
          data.pop();
          --idx;
        }
        setData(data);
        setIndex(idx);
      }
    }),
  };
}
