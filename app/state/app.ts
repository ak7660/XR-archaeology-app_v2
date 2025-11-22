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
    console.log("=== AppStore.setTripPlan called ===");
    console.log("Old plan length:", this.tripPlan.length);
    console.log("New plan length:", plan.length);
    console.log("New plan preview (first 200):", plan.substring(0, 200));
    this.tripPlan = plan;
    console.log("Updated! Current tripPlan length:", this.tripPlan.length);
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
