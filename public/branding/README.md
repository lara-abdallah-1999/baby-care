# BabyCare artwork

- `babycare-light.png`: supplied transparent full logo with a dark subtitle for light mode.
- `babycare-dark.png`: supplied transparent full logo with a white subtitle for dark mode.
- `babycare-icon.png`: supplied transparent standalone icon shared by both collapsed themes, the favicon, and the touch icon.

`src/components/BrandLogo.tsx` displays the shared icon beside a viewport of the original wordmark, preserving the supplied pixels while independently sizing and spacing the text. The wordmark switches by theme and hides in the collapsed or compact responsive sidebar. The PNGs are not redrawn or recolored.
