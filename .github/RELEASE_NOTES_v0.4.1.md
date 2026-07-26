# Chrono Defender v0.4.1

Completes the user-facing features introduced architecturally in v0.4.0.

## Play Now

https://robinsonalexanderquiroz-droid.github.io/chrono-defender/

## What's New

### Full Options Screen

- Interactive settings across 5 sections: Audio, Display, Gameplay, Accessibility, Data
- Volume sliders (0-100%), toggles, multi-choice selections
- Left/right adjustment, up/down navigation, Enter to toggle
- In-game confirmation modal for destructive actions (clear scores, reset data)
- No browser-native dialogs — all UI is rendered in Phaser

### Mobile Touch Controls (Visible)

- Virtual joystick rendered on left side with movable knob
- Fire button on right side with pressed-state feedback
- Pause and mute buttons in top corners
- Weapon cycle buttons ("<" / ">")
- Only visible on touch-capable devices
- Multi-touch support for simultaneous move + fire

### Weapon Switching

- Keys 1-6 for direct weapon selection (laser, triple, spread, rapid, piercing, plasma)
- E/Q keys for next/prev cycling
- Gamepad bumpers (LB/RB) for cycling
- Edge-detected to prevent repeat on held keys
- Audio click on switch
- HUD weapon name updates immediately

### Achievement Notifications

- Animated toast slides in from top-right on unlock
- Shows "ACHIEVEMENT UNLOCKED" header, title, and description
- Category-colored border (combat=red, survival=green, collection=gold, mastery=purple, dedication=blue)
- Queued display (one at a time)
- Respects "Reduced Motion" setting (instant appear/disappear)
- Plays unlock sound
- Prevents duplicate notifications

## Testing

- 40 unit tests passing (SaveManager, AchievementManager, GamepadManager, DifficultyManager, ScoreManager, SettingsManager)
- 26 E2E tests passing (pause, quit, mute, gameplay, menu, options)

## Known Limitations

- Touch overlay visual is functional but basic (circles/rectangles, no polished sprites)
- Options navigation by gamepad not yet wired (keyboard only for now)
- Achievement notifications require gameplay events to trigger (no test-mode trigger button)
- Weapon availability is not gated by progression (all 6 weapons accessible immediately)
