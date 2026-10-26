import { useTutoringActions } from "./useTutoringActions";
import { useTutoringData } from "./useTutoringData";
import { useTutoringState } from "./useTutoringState";

export function useTutoringPage() {
  const state = useTutoringState();
  const data = useTutoringData(state);
  const actions = useTutoringActions(state, data);

  return { ...state, ...data, ...actions };
}

export type TutoringController = ReturnType<typeof useTutoringPage>;
