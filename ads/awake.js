// Keeps the Mac from idle-sleeping while ads are editing. On 2026-10-27 the Mac slept for ~80 minutes in the middle of
// Claude's plan request; when it woke, the request timed out and the ad was built from the bare fallback plan (one
// graphic, no camera moves, two sounds). macOS's own `caffeinate -i` holds the "prevent idle sleep" assertion; `-w`
// ties it to this server, so it can never outlive us. Closing the laptop lid still sleeps the Mac (macOS doesn't let an
// app stop that on battery); ads/index.js retries a plan that fails for that reason.
import { spawn } from "node:child_process";

let hold = null;

/** Hold (true) or release (false) the no-idle-sleep assertion. A no-op off macOS. Returns whether it's held. */
export function holdAwake(on) {
  if (process.platform !== "darwin") return false;
  if (on && !hold) {
    try {
      hold = spawn("caffeinate", ["-i", "-w", String(process.pid)], { stdio: "ignore" });
      hold.on("exit", () => (hold = null));
      hold.on("error", () => (hold = null));
    } catch {
      hold = null;
    }
  } else if (!on && hold) {
    hold.kill();
    hold = null;
  }
  return Boolean(hold);
}

export const isHeldAwake = () => Boolean(hold);
