import React from "react";
import { formatSeason, teamInitials } from "@/lib/format";
import { closingLine, outcomeBanner, recordLine } from "@/lib/share-card";
import type { ShareCard, ShareCardRatio } from "@/lib/share-card";
import type { Position } from "@/types/game";

type Props = {
  card: ShareCard;
  ratio: ShareCardRatio;
  // Resolved by the route; `null` where the logo did not come back.
  logos: Record<string, string | null>;
};

// Satori renders none of the app's CSS, so the Dark Trophy Room palette is
// restated here as sRGB — `oklch()` is not part of the subset it parses.
const INK = "#08101c";
const SURFACE = "#121b29";
const SURFACE_EDGE = "#293342";
const TEXT = "#eef2f7";
const TEXT_MUTED = "#8f99a7";
const GOLD = "#edb333";
const GOLD_GLOW = "#f6d56b";
const LOSS = "#f14d4c";
const LOSS_DEEP = "#cc3336";

// Both outcomes get a gradient, so the banner never has to disable one — Satori
// rejects `backgroundImage: "none"` and fails the entire render on it.
const bannerGradient = (champion: boolean): string =>
  champion
    ? `linear-gradient(135deg, ${GOLD}, ${GOLD_GLOW})`
    : `linear-gradient(135deg, ${LOSS_DEEP}, ${LOSS})`;

type Rgb = readonly [number, number, number];

const POSITION_RGB: Record<Position, Rgb> = {
  PG: [0, 209, 218],
  SG: [181, 139, 249],
  SF: [70, 206, 131],
  PF: [255, 144, 68],
  C: [251, 113, 136],
};

const rgb = ([r, g, b]: Rgb): string => `rgb(${r}, ${g}, ${b})`;

const rgba = ([r, g, b]: Rgb, alpha: number): string =>
  `rgba(${r}, ${g}, ${b}, ${alpha})`;

type Scale = (value: number) => number;

type Metrics = {
  pad: number;
  blockGap: number;
  rowGap: number;
  rowHeight: number;
  // Width is fixed at 1080, so a taller canvas is given bigger type rather than
  // the same type in taller boxes — growing the rows alone leaves them hollow.
  scale: number;
};

const METRICS: Record<ShareCardRatio, Metrics> = {
  FEED: { pad: 60, blockGap: 26, rowGap: 12, rowHeight: 108, scale: 1 },
  TALL: { pad: 68, blockGap: 34, rowGap: 18, rowHeight: 124, scale: 1.08 },
  STORY: { pad: 76, blockGap: 44, rowGap: 26, rowHeight: 156, scale: 1.24 },
};

const Wordmark = ({ px }: { px: Scale }) => (
  <div style={{ display: "flex", alignItems: "center", gap: px(18) }}>
    <div
      style={{
        display: "flex",
        width: px(44),
        height: 4,
        backgroundColor: GOLD,
      }}
    />
    <div
      style={{
        display: "flex",
        fontSize: px(25),
        letterSpacing: px(11),
        color: GOLD,
      }}
    >
      LEGACYRUN
    </div>
  </div>
);

const Crest = ({
  size,
  team,
  logo,
}: {
  size: number;
  team: string;
  logo: string | null;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: size * 0.26,
      border: `1px solid ${rgba([237, 179, 51], 0.45)}`,
      backgroundColor: rgba([237, 179, 51], 0.1),
    }}
  >
    {logo ? (
      // Satori renders this, not the browser — `next/image` has nothing to do here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        width={size - 14}
        height={size - 14}
        style={{ objectFit: "contain" }}
        alt=""
      />
    ) : (
      // The DOM badge recovers through `onError`; Satori has none, so the route
      // resolves the logo first and this renders when it did not come back.
      <div style={{ display: "flex", fontSize: size * 0.3, color: GOLD }}>
        {teamInitials(team)}
      </div>
    )}
  </div>
);

const Stat = ({
  label,
  value,
  tone,
  px,
}: {
  label: string;
  value: string;
  tone: string;
  px: Scale;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
      paddingTop: px(18),
      paddingBottom: px(18),
      paddingLeft: px(26),
      paddingRight: px(26),
      borderRadius: 20,
      border: `1px solid ${SURFACE_EDGE}`,
      backgroundColor: SURFACE,
    }}
  >
    <div
      style={{
        display: "flex",
        fontSize: px(20),
        letterSpacing: px(4),
        color: TEXT_MUTED,
      }}
    >
      {label}
    </div>
    <div
      style={{
        display: "flex",
        marginTop: px(8),
        fontSize: px(52),
        color: tone,
      }}
    >
      {value}
    </div>
  </div>
);

const PlayerRow = ({
  player,
  logo,
  metrics,
  px,
}: {
  player: ShareCard["five"][number];
  logo: string | null;
  metrics: Metrics;
  px: Scale;
}) => {
  const tone = POSITION_RGB[player.pos];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: metrics.rowHeight,
        paddingLeft: px(26),
        paddingRight: px(26),
        borderRadius: 20,
        border: `1px solid ${SURFACE_EDGE}`,
        backgroundColor: SURFACE,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: px(62),
          height: px(62),
          borderRadius: px(31),
          fontSize: px(23),
          color: rgb(tone),
          backgroundColor: rgba(tone, 0.16),
        }}
      >
        {player.pos}
      </div>

      <div style={{ display: "flex", marginLeft: px(22) }}>
        <Crest size={px(62)} team={player.team} logo={logo} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          marginLeft: px(22),
        }}
      >
        <div style={{ display: "flex", fontSize: px(34), color: TEXT }}>
          {player.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: px(6),
            fontSize: px(23),
            color: TEXT_MUTED,
          }}
        >
          {formatSeason(player.year)} {player.team}
        </div>
      </div>

      <div style={{ display: "flex", fontSize: px(44), color: GOLD }}>
        {player.rating}
      </div>
    </div>
  );
};

const ShareCardImage = ({ card, ratio, logos }: Props) => {
  const metrics = METRICS[ratio];
  const px: Scale = (value) => Math.round(value * metrics.scale);
  const accent = card.champion ? GOLD : LOSS;

  return (
    // `space-between` with a floor gap: a taller canvas opens the margins between
    // blocks, which reads as deliberate, rather than hollowing out the rows.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: metrics.blockGap,
        width: "100%",
        height: "100%",
        padding: metrics.pad,
        backgroundColor: INK,
        backgroundImage: `linear-gradient(158deg, #1b2942 0%, ${INK} 58%)`,
        color: TEXT,
        fontFamily: "Geist",
      }}
    >
      <Wordmark px={px} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: px(62),
            letterSpacing: 3,
            color: TEXT,
          }}
        >
          {card.name.toUpperCase()}
        </div>

        {/* Full width — this is the one thing that must read at thumbnail size. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: px(22),
            height: px(92),
            borderRadius: 18,
            backgroundColor: accent,
            backgroundImage: bannerGradient(card.champion),
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: px(44),
              letterSpacing: px(14),
              color: INK,
            }}
          >
            {outcomeBanner(card.champion)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: metrics.rowGap,
        }}
      >
        {card.five.map((player) => (
          <PlayerRow
            key={`${player.pos}-${player.name}`}
            player={player}
            logo={logos[player.slug] ?? null}
            metrics={metrics}
            px={px}
          />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: px(16) }}>
          <Stat
            label="SQUAD RATING"
            value={String(card.avg)}
            tone={GOLD}
            px={px}
          />
          <Stat
            label="PLAYOFF RECORD"
            value={recordLine(card)}
            tone={TEXT}
            px={px}
          />
        </div>

        {/* Deliberately unscaled: the longest sentence this can hold already
            wraps on a taller card, and a second line here reads as a mistake. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginTop: px(22),
            paddingTop: px(22),
            borderTop: `1px solid ${SURFACE_EDGE}`,
            fontSize: 26,
            lineHeight: 1.35,
            color: TEXT_MUTED,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 10,
              height: 10,
              marginTop: 13,
              marginRight: 14,
              borderRadius: 5,
              backgroundColor: accent,
            }}
          />
          {closingLine(card)}
        </div>
      </div>
    </div>
  );
};

export default ShareCardImage;
