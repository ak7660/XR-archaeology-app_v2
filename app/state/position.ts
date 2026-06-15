import { Viro3DPoint, ViroRotation } from "@viro-community/react-viro/dist/components/Types/ViroUtils";
import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

type ModelStage = "lock" | "unlock" | "screenshot";

const init_state = {
  radio: 0.5,
  stage: 'unlock' as ModelStage,
  rotation: [0, 0, 0] as Viro3DPoint,
}

function getWallDistance(radio: number) {
  const maxDistance = 300;
  const minDistance = 50;
  return maxDistance - radio * (maxDistance - minDistance);
}

export class ArModelState {
  radio: number = init_state.radio;
  stage: ModelStage = init_state.stage;
  rotation: ViroRotation = init_state.rotation;
  position: Viro3DPoint = [0, 0, -1 * this.distance];

  constructor() {
    makeAutoObservable(this);
  }

  get distance() {
    return getWallDistance(this.radio);
  }

  reset() {
    this.radio = init_state.radio;
    this.stage = init_state.stage;
    this.rotation = init_state.rotation;
    this.position = [0, 0, -1 * this.distance];
  }

  setRadio(radio: number) {
    this.radio = radio;
  }

  setModelRotation(rotation: ViroRotation) {
    this.rotation = rotation;
  }

  setModelPosition(pos: Viro3DPoint) {
    this.position = pos;
  }

  setStage(stage: ModelStage) {
    this.stage = stage;
  }
}

export const store = new ArModelState();
export const storeContext = createContext(store);
export const useArModelStore = () => useContext(storeContext);

// create store