# Color Theme — Dark Trophy Room

> Hex values below were derived from the OKLCH values via manual OKLab→sRGB
> conversion (D65, standard sRGB gamma), since the code execution tool was
> unavailable when this was generated. They should be accurate to within
> about ±1 unit per channel — worth spot-checking a few against a proper
> tool (e.g. an oklch() color picker in browser devtools) if pixel-exact
> hex matters for your build.

## Core Theme (Dark Trophy Room)

| Token | OKLCH Value | Hex | Approximate Role |
|---|---|---|---|
| `--background` | `oklch(0.17 0.028 258)` | `#08101C` | Deep room backdrop |
| `--foreground` | `oklch(0.96 0.008 250)` | `#EEF2F7` | Primary text |
| `--card` | `oklch(0.221 0.03 258)` | `#121B29` | Card / panel surfaces |
| `--card-foreground` | `oklch(0.96 0.008 250)` | `#EEF2F7` | Text on cards |
| `--primary` | `oklch(0.8 0.15 82)` | `#EDB333` | Gold accent (CTAs, highlights) |
| `--primary-foreground` | `oklch(0.2 0.04 60)` | `#231103` | Text on gold buttons |
| `--primary-glow` | `oklch(0.88 0.13 92)` | `#F6D56B` | Lighter gold for gradients |
| `--secondary` | `oklch(0.28 0.032 258)` | `#1F2939` | Secondary surfaces |
| `--muted` | `oklch(0.26 0.028 258)` | `#1C2432` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.68 0.024 258)` | `#9099A7` | Secondary / helper text |
| `--accent` | `oklch(0.32 0.04 258)` | `#263347` | Accent surfaces |
| `--destructive` | `oklch(0.6 0.2 25)` | `#DE3B3D` | Error / destructive |
| `--border` | `oklch(0.32 0.03 258)` | `#293342` | Borders |
| `--ring` | `oklch(0.8 0.15 82)` | `#EDB333` | Focus ring (gold) |

## Court-Specific Tokens

| Token | OKLCH Value | Hex | Role |
|---|---|---|---|
| `--court` | `oklch(0.245 0.035 262)` | `#172031` | Court floor base |
| `--court-line` | `oklch(0.62 0.035 258 / 45%)` | `#79879C` at 45% → `#79879C73` | Court markings |

## Position Colors

| Position | Token | OKLCH Value | Hex |
|---|---|---|---|
| PG | `--pos-pg` | `oklch(0.78 0.14 200)` | `#00D1DA` |
| SG | `--pos-sg` | `oklch(0.72 0.16 300)` | `#B58BF9` |
| SF | `--pos-sf` | `oklch(0.76 0.16 155)` | `#46CE83` |
| PF | `--pos-pf` | `oklch(0.76 0.16 52)` | `#FF9045` |
| C | `--pos-c` | `oklch(0.72 0.17 12)` | `#FB7188` |

## Gradients & Effects

| Name | Definition | Hex Equivalent |
|---|---|---|
| `--gradient-gold` | `linear-gradient(135deg, var(--primary), var(--primary-glow))` | `linear-gradient(135deg, #EDB333, #F6D56B)` |
| `--gradient-room` | `radial-gradient(120% 90% at 50% -10%, oklch(0.28 0.05 262), oklch(0.15 0.025 258) 70%)` | `radial-gradient(120% 90% at 50% -10%, #1B2942, #050B16 70%)` |
| `--shadow-trophy` | `0 24px 60px -24px oklch(0.8 0.15 82 / 45%)` | `0 24px 60px -24px #EDB33373` |
| `--shadow-panel` | `0 24px 60px -30px oklch(0 0 0 / 80%)` | `0 24px 60px -30px #000000CC` |