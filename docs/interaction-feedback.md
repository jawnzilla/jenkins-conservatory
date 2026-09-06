# Interaction feedback standard

## One place to read

Interaction prompts, latest action results, persistent guidance and fishing callouts share the center-bottom `#interaction-hub`. Only the field-mode connection/lock indicator remains top-left. No interaction result toasts remain bottom-right.

- Target: `E` keycap and object/character name.
- Result: one latest result, labeled FIELD UPDATE, ATTENTION or UNABLE TO COMPLETE; warnings do not rely on color alone.
- Guidance: persistent `setStatus` text returns once a result expires. Results from previous zones are cleared before arrival instructions.
- Tool hints: subordinate text, suppressed when a target/result has priority. All active fishing instructions take priority over the result card. Surge/resume changes clear stale phase-specific results immediately; ambient notifications cannot obscure reeling or bite cues.
- Timing: results last 8–16 seconds based on message length. Repeated identical messages refresh the timer without stacking or re-announcing. A new result replaces the previous result (no delayed queue).
- Readability: opaque dark card, 16px desktop/14px narrow text, wrapping instead of clipping. Prompt and result sit side-by-side in short landscape to preserve the crosshair.
- Modals: same center-bottom result lane, inside the active dialog DOM, above its backdrop, with measured feedback-height clearance rather than a fixed empty band. Prompt/tool chrome is hidden while a modal is open.
- No canvas input interception: hub has pointer-events:none. Messages use textContent and polite atomic live regions.

## Verification

Run the server at `http://127.0.0.1:5193/jenkins-conservatory/`, then `node feedback-qa.mjs`.

The Playwright test presses the real E key near Brynlee, verifies prompt/result, checks duplicate replacement, literal HTML-like text safety, warning labels, fallback expiry, shop feedback visibility, Escape, horizontal bounds and action-dock clearance at 1440x1000, 390x844, 320x568, 844x390, 568x320 and 667x375. It also opens the car via E, buys worms via the actual shop button, and verifies surge/resume/bite priority over ambient notifications. Evidence is saved in ignored `artifacts/feedback/`.

This is desktop Chromium emulation, not a physical phone gameplay certification. Existing keyboard-first controls remain unchanged.
