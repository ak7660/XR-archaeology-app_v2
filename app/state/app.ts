import { makeAutoObservable } from "mobx";
import { createContext, useContext } from "react";

export class AppState {
  bar_status: "hidden" | "show" = "show";
  tripPlan: string = "";
  conversationId: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setAppBar(status: "hidden" | "show") {
    this.bar_status = status;
  }

  setTripPlan(plan: string) {
    this.tripPlan = plan;
  }

  clearTripPlan() {
    this.tripPlan = "";
  }

  setConversationId(id: string) {
    this.conversationId = id;
  }

  clearConversationId() {
    this.conversationId = null;
  }
}

export const store = new AppState();
export const storeContext = createContext(store);
export const useAppStore = () => useContext(storeContext);

// create store
