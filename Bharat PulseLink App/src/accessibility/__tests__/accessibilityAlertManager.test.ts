import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  triggerAccessibilityAlert,
  subscribeAccessibilityAlert,
  AccessibilityAlertPayload,
} from "../accessibilityAlertEvents";

describe("AccessibilityAlert Events & Bus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a listener and receives triggered alert", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAccessibilityAlert(listener);

    const payload: AccessibilityAlertPayload = {
      type: "SUCCESS",
      title: "Check-in Complete",
      message: "Patient successfully admitted.",
    };

    triggerAccessibilityAlert(payload);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(payload);

    unsubscribe();
  });

  it("unsubscribes cleanly and stops receiving alerts (no listener leaks)", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAccessibilityAlert(listener);

    triggerAccessibilityAlert({
      type: "WARNING",
      title: "Battery Low",
      message: "Connect to charger.",
    });
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();

    triggerAccessibilityAlert({
      type: "ERROR",
      title: "Network Failure",
      message: "Failed to sync data.",
    });
    // Should still be 1, not 2
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("handles multiple listeners independently", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    const unsubA = subscribeAccessibilityAlert(listenerA);
    const unsubB = subscribeAccessibilityAlert(listenerB);

    triggerAccessibilityAlert({
      type: "EMERGENCY",
      title: "CODE RED",
      message: "Emergency response required.",
    });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(1);

    unsubA();

    triggerAccessibilityAlert({
      type: "INFORMATION",
      title: "Update",
      message: "System running smoothly.",
    });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).toHaveBeenCalledTimes(2);

    unsubB();
  });

  it("does not crash if a listener throws an error", () => {
    const faultyListener = vi.fn(() => {
      throw new Error("Simulated listener failure");
    });
    const healthyListener = vi.fn();

    const unsub1 = subscribeAccessibilityAlert(faultyListener);
    const unsub2 = subscribeAccessibilityAlert(healthyListener);

    expect(() => {
      triggerAccessibilityAlert({
        type: "SUCCESS",
        title: "Test",
        message: "Should not crash",
      });
    }).not.toThrow();

    expect(faultyListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("supports all alert severity tiers", () => {
    const received: string[] = [];
    const unsub = subscribeAccessibilityAlert((alert) => {
      received.push(alert.type);
    });

    triggerAccessibilityAlert({ type: "SUCCESS", title: "S", message: "m" });
    triggerAccessibilityAlert({ type: "WARNING", title: "W", message: "m" });
    triggerAccessibilityAlert({ type: "ERROR", title: "E", message: "m" });
    triggerAccessibilityAlert({ type: "EMERGENCY", title: "EM", message: "m" });
    triggerAccessibilityAlert({ type: "INFORMATION", title: "I", message: "m" });

    expect(received).toEqual(["SUCCESS", "WARNING", "ERROR", "EMERGENCY", "INFORMATION"]);
    unsub();
  });
});
