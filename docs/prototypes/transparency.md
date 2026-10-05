# Transparency prototype: findings

Phase 2 of the development plan: find the limits of transparent windows before building
the v1 on them. The prototype lives on the `proto/transparency` branch, which is never
merged. This note keeps what we learned.

- **Date**: 30 September 2026
- **Machine**: Windows 10 Pro 22H2 (build 19045.7725), one 1920×1080 screen,
  transparency effects enabled in the Windows settings
- **Versions**: Electron 44.4.5, xterm.js 6.0.0, koffi 3.3.2

## Decisions

- **Windows 10 uses the blur effect, not Acrylic.** The window gets the blur-behind
  effect (`ACCENT_ENABLE_BLURBEHIND`) through `SetWindowCompositionAttribute`, an
  undocumented `user32` function, and its frame styles are put back by hand (see below).
  With this combination everything works: blur, moving, resizing, maximizing, snapping
  to screen edges, and a light shadow.
- **Acrylic is dropped on Windows 10.** It makes moving the window lag, and once the
  frame styles are back (needed for snapping) its blur becomes very weak.
- **koffi is enough to call the Windows API** from the main process. It loads in
  Electron without a rebuild (Node-API, prebuilt binaries): no C++ module is needed.
- **Windows 11 is still to be tested.** Mica and Acrylic should come from Electron's
  `backgroundMaterial` option; no Windows 11 machine was available.

## What was learned

### Electron removes the frame styles of transparent windows

A frameless window created with `transparent: true` loses `WS_THICKFRAME` and
`WS_CAPTION`, even with `thickFrame: true` (observed style: `0x14030000`). Without them,
Windows does not snap the window to screen edges and draws no shadow. Resizing by the
edges still works, because Electron handles it itself. A frameless window that is not
transparent keeps these styles, and snapping works.

**Workaround**: once the window is shown, add both styles back with `GetWindowLongPtrW` /
`SetWindowLongPtrW`, then call `SetWindowPos` with `SWP_FRAMECHANGED`. The frame change
removes the blur effect, so apply the effect again about 100 ms later. No system title
bar or border appears.

### Windows 10 effects

| Effect                                      | Without the frame styles                        | With the frame styles                                                                                                |
| ------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Blur (`ACCENT_ENABLE_BLURBEHIND`)           | Works, no snapping, no shadow                   | **Everything works**                                                                                                 |
| Acrylic (`ACCENT_ENABLE_ACRYLICBLURBEHIND`) | Works, but moving lags (see below), no snapping | Very weak blur, even with the workarounds below                                                                      |
| Plain transparency, no blur                 | Works (Chromium transparency), no snapping      | Not shown; shown only after a first snap with `DwmExtendFrameIntoClientArea` and `ACCENT_ENABLE_TRANSPARENTGRADIENT` |

In every working mode, the effect stays when the window loses the focus, and comes back
after minimizing and restoring. Maximizing and restoring work.

### Acrylic makes moving the window lag

With Acrylic, moving the window lags far behind the mouse: after the button is released,
the window keeps moving slowly to where the mouse went. **Workaround**: switch to the blur
effect on `will-move` / `will-resize`, and back to Acrylic on `moved` / `resized`. Moving
becomes smooth, but the look changes visibly at the start and end of each move.

Tried without success to get Acrylic back with the frame styles: applying it again after
the frame change, resizing the window by one pixel, and `DwmExtendFrameIntoClientArea`
with margins of -1.

### Translucent terminal

`xterm.css` paints `.xterm .xterm-viewport` black, and xterm.js 6 no longer replaces that
color with the theme background, so the terminal stays opaque. Overriding it with
`background-color: transparent` fixes it. The terminal also needs `allowTransparency: true`
before `open()`, and a theme background with an alpha channel (`rgba(...)`). The theme,
and so the background opacity, can be changed live.

## Not tested

- Several screens (only one screen available).
- Windows 11 (Mica and Acrylic through `backgroundMaterial`).
- Transparency effects turned off in the Windows settings.
- Display scaling other than the machine's current setting.

## Consequences for the technical stack document

- **6.3, Windows 10 row**: blur effect instead of Acrylic, through
  `SetWindowCompositionAttribute` called with koffi, with the frame styles put back.
- **4, stack**: add koffi (MIT license) to call the Windows API.
- **11, points to watch**: "Acrylic on Windows 10" is replaced by the blur; "Electron
  transparent windows" now has known limits and workarounds; Windows 11 remains to be
  validated.
- **12, decision log**: record the blur on Windows 10 and the use of koffi.

## Update: the blur in ConsolX (1 October 2026)

Building the translucent window of ConsolX showed one more condition. With the frame
styles back, the blur only shows when it is set **before** the frame change and again
after it, **with the tint flag** of `ACCENT_POLICY` (`AccentFlags: 2`, here with a clear
tint, `GradientColor: 0`). Set only after the frame change, or without the tint flag, the
window stays dark. Tried side by side on the same machine:

| Way of setting the blur                                  | Result      |
| -------------------------------------------------------- | ----------- |
| After the frame change, no tint flag                     | Dark        |
| Before and after, no tint flag                           | Dark        |
| After the frame change, tint flag                        | Dark        |
| **Before and after, tint flag**                          | **Blurred** |
| Plain transparency (`ACCENT_ENABLE_TRANSPARENTGRADIENT`) | Black       |

So ConsolX always blurs what is behind its translucent parts: a sharp see-through window
would need to drop the frame styles, and with them snapping and the shadow.

A blur turned on later, in a window already open, or turned off and on again, does not
show reliably: the window stays black behind its translucent parts until it is resized.
So ConsolX sets the blur around the first frame change when the window opens, and never
turns it off: an opaque page hides it, and the opacity settings only change the page.
