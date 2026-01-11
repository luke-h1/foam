import type { PaintData } from '@app/utils/color/seventv-ws-service';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { PaintedUsername } from './CosmeticUsername';

function rgbaToSevenTvColor(
  r: number,
  g: number,
  b: number,
  a: number,
): number {
  // eslint-disable-next-line no-bitwise
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

const meta = {
  title: 'components/Chat/PaintedUsername',
  component: PaintedUsername,
  decorators: [
    Story => (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0E0E10',
          padding: 16,
        }}
      >
        <Story />
      </View>
    ),
  ],
  argTypes: {
    username: {
      control: 'text',
    },
    fallbackColor: {
      control: 'color',
    },
  },
} satisfies Meta<typeof PaintedUsername>;

export default meta;

type Story = StoryObj<typeof meta>;

const createPaintData = (overrides: Partial<PaintData> = {}): PaintData => ({
  id: 'paint-1',
  name: 'Test Paint',
  color: null,
  gradients: { length: 0 },
  shadows: { length: 0 },
  text: null,
  function: 'LINEAR_GRADIENT',
  repeat: false,
  angle: 90,
  shape: 'circle',
  image_url: '',
  stops: { length: 0 },
  ...overrides,
});

const roseGold: PaintData = createPaintData({
  id: '01GANW3J500008J4JYR3TQ84DG',
  name: 'Rose Gold',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(254, 118, 148, 255) }, // #FE7694
    1: { at: 0.5, color: rgbaToSevenTvColor(255, 200, 180, 255) }, // Light pink-gold
    2: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) }, // #FF4D73
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(254, 118, 148, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    1: {
      color: rgbaToSevenTvColor(255, 77, 115, 255),
      radius: 4,
      x_offset: 0,
      y_offset: 0,
    },
    length: 2,
  },
});

// Popsicle - Purple gradient with purple glow
const popsicle: PaintData = createPaintData({
  id: '01H6PWABE00001XFYVRFENNHQM',
  name: 'Popsicle',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(160, 59, 254, 255) }, // #A03BFE
    1: { at: 0.5, color: rgbaToSevenTvColor(180, 100, 255, 255) }, // Lighter purple
    2: { at: 1, color: rgbaToSevenTvColor(140, 40, 220, 255) }, // Darker purple
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(160, 59, 254, 255),
      radius: 0.5,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Magma - Orange/red gradient with fiery glow
const magma: PaintData = createPaintData({
  id: '01J8WBN1D80006G7P3TC1QF62P',
  name: 'Magma',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(196, 57, 1, 255) }, // #C43901
    1: { at: 0.3, color: rgbaToSevenTvColor(255, 100, 0, 255) }, // Orange
    2: { at: 0.7, color: rgbaToSevenTvColor(255, 180, 50, 255) }, // Yellow-orange
    3: { at: 1, color: rgbaToSevenTvColor(196, 57, 1, 255) }, // #C43901
    length: 4,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(196, 57, 1, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Lobster - Red gradient with crimson glow
const lobster: PaintData = createPaintData({
  id: '01G8GM63KR0004XP39FXMV7HNX',
  name: 'Lobster',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(181, 30, 54, 255) }, // #B51E36
    1: { at: 0.5, color: rgbaToSevenTvColor(220, 60, 80, 255) }, // Lighter red
    2: { at: 1, color: rgbaToSevenTvColor(160, 20, 40, 255) }, // Darker red
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(181, 30, 54, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Jawbreaker - Pink/magenta gradient with pink glow
const jawbreaker: PaintData = createPaintData({
  id: '01HSVKJME8000AP74DR1X42MK4',
  name: 'Jawbreaker',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(255, 41, 205, 255) }, // #FF29CD
    1: { at: 0.5, color: rgbaToSevenTvColor(255, 100, 220, 255) }, // Light pink
    2: { at: 1, color: rgbaToSevenTvColor(200, 30, 160, 255) }, // Darker magenta
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(255, 41, 205, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Flowerchild oA - Radial gradient with teal glow
const flowerchildOa: PaintData = createPaintData({
  id: '01HQE7KJWG0000D7GK7EKRAPN3',
  name: 'Flowerchild oA',
  function: 'RADIAL_GRADIENT',
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(100, 200, 220, 255) }, // Light teal
    1: { at: 0.5, color: rgbaToSevenTvColor(0, 150, 180, 255) }, // Teal
    2: { at: 1, color: rgbaToSevenTvColor(0, 96, 128, 255) }, // #006080
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(0, 96, 128, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Division oA - Orange/brown gradient with black outline and orange glow
const divisionOa: PaintData = createPaintData({
  id: '01HYM88S80000A9JQ25Y1DG7JS',
  name: 'Division oA',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(156, 76, 22, 255) }, // #9C4C16
    1: { at: 0.5, color: rgbaToSevenTvColor(200, 120, 50, 255) }, // Light orange
    2: { at: 1, color: rgbaToSevenTvColor(130, 60, 15, 255) }, // Dark brown-orange
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(0, 0, 0, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    1: {
      color: rgbaToSevenTvColor(156, 76, 22, 255),
      radius: 1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 2,
  },
});

// Cirus oA - Blue/purple gradient with blue glow
const cirusOa: PaintData = createPaintData({
  id: '01J5V9R8ZG000AT7NVA2E5GD1X',
  name: 'Cirus oA',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(52, 60, 162, 255) }, // #343CA2
    1: { at: 0.5, color: rgbaToSevenTvColor(80, 100, 200, 255) }, // Lighter blue
    2: { at: 1, color: rgbaToSevenTvColor(60, 70, 180, 255) }, // Medium blue
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(52, 60, 162, 255),
      radius: 0.1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Ripe oA - Yellow/gold gradient with golden glow
const ripeOa: PaintData = createPaintData({
  id: '01H3R6VHGG0004C01V1Q5SCE1Y',
  name: 'Ripe oA',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(194, 168, 0, 255) }, // #C2A800
    1: { at: 0.5, color: rgbaToSevenTvColor(230, 200, 50, 255) }, // Bright gold
    2: { at: 1, color: rgbaToSevenTvColor(180, 150, 0, 255) }, // Dark gold
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(194, 168, 0, 255),
      radius: 2,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Chestnut S - Brown gradient with dark shadow
const chestnutS: PaintData = createPaintData({
  id: '01GH7JJPJ80001YTAFZTC863HC',
  name: 'Chestnut S',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(120, 60, 30, 255) }, // Brown
    1: { at: 0.5, color: rgbaToSevenTvColor(160, 90, 50, 255) }, // Light chestnut
    2: { at: 1, color: rgbaToSevenTvColor(90, 45, 20, 255) }, // Dark brown
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(60, 24, 9, 255),
      radius: 0.5,
      x_offset: 0,
      y_offset: 0,
    },
    1: {
      color: rgbaToSevenTvColor(60, 24, 9, 255),
      radius: 1,
      x_offset: 0,
      y_offset: 0,
    },
    length: 2,
  },
});

// Ginger Tabby S - Orange/ginger gradient with black shadow
const gingerTabbyS: PaintData = createPaintData({
  id: '01GHA42XER0001KT343YQ6DM2E',
  name: 'Ginger Tabby S',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(230, 130, 50, 255) }, // Ginger
    1: { at: 0.5, color: rgbaToSevenTvColor(255, 170, 80, 255) }, // Light ginger
    2: { at: 1, color: rgbaToSevenTvColor(200, 100, 30, 255) }, // Dark ginger
    length: 3,
  },
  shadows: {
    0: {
      color: rgbaToSevenTvColor(0, 0, 0, 255),
      radius: 0.5,
      x_offset: 0,
      y_offset: 0,
    },
    length: 1,
  },
});

// Crocus - Purple/violet gradient (no shadow)
const crocus: PaintData = createPaintData({
  id: '01GRFACFQ800062ZG67VX7B0X7',
  name: 'Crocus',
  angle: 90,
  stops: {
    0: { at: 0, color: rgbaToSevenTvColor(150, 100, 200, 255) }, // Light purple
    1: { at: 0.5, color: rgbaToSevenTvColor(180, 120, 220, 255) }, // Crocus purple
    2: { at: 1, color: rgbaToSevenTvColor(130, 80, 180, 255) }, // Darker purple
    length: 3,
  },
});

export const Default: Story = {
  args: {
    username: 'TestUser',
    fallbackColor: '#FFFFFF',
  },
};

export const RoseGold: Story = {
  args: {
    username: 'RoseGoldUser',
    paint: roseGold,
  },
};

export const Popsicle: Story = {
  args: {
    username: 'PopsicleUser',
    paint: popsicle,
  },
};

export const Magma: Story = {
  args: {
    username: 'MagmaUser',
    paint: magma,
  },
};

export const Lobster: Story = {
  args: {
    username: 'LobsterUser',
    paint: lobster,
  },
};

export const Jawbreaker: Story = {
  args: {
    username: 'JawbreakerUser',
    paint: jawbreaker,
  },
};

export const FlowerchildRadial: Story = {
  args: {
    username: 'FlowerchildUser',
    paint: flowerchildOa,
  },
};

export const Division: Story = {
  args: {
    username: 'DivisionUser',
    paint: divisionOa,
  },
};

export const Cirus: Story = {
  args: {
    username: 'CirusUser',
    paint: cirusOa,
  },
};

export const Ripe: Story = {
  args: {
    username: 'RipeUser',
    paint: ripeOa,
  },
};

export const Chestnut: Story = {
  args: {
    username: 'ChestnutUser',
    paint: chestnutS,
  },
};

export const GingerTabby: Story = {
  args: {
    username: 'GingerTabbyUser',
    paint: gingerTabbyS,
  },
};

export const Crocus: Story = {
  args: {
    username: 'CrocusUser',
    paint: crocus,
  },
};

export const WithFallbackColor: Story = {
  args: {
    username: 'FallbackUser',
    fallbackColor: '#9B59B6',
  },
};

export const AllRealistic7tvPaints: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => (
    <View style={{ gap: 12 }}>
      <PaintedUsername username="RoseGold" paint={roseGold} />
      <PaintedUsername username="Popsicle" paint={popsicle} />
      <PaintedUsername username="Magma" paint={magma} />
      <PaintedUsername username="Lobster" paint={lobster} />
      <PaintedUsername username="Jawbreaker" paint={jawbreaker} />
      <PaintedUsername username="Flowerchild" paint={flowerchildOa} />
      <PaintedUsername username="Division" paint={divisionOa} />
      <PaintedUsername username="Cirus" paint={cirusOa} />
      <PaintedUsername username="Ripe" paint={ripeOa} />
      <PaintedUsername username="Chestnut" paint={chestnutS} />
      <PaintedUsername username="GingerTabby" paint={gingerTabbyS} />
      <PaintedUsername username="Crocus" paint={crocus} />
    </View>
  ),
};

export const PaintsWithMultipleShadows: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => (
    <View style={{ gap: 16 }}>
      <PaintedUsername username="RoseGold" paint={roseGold} />
      <PaintedUsername username="Division" paint={divisionOa} />
      <PaintedUsername username="Chestnut" paint={chestnutS} />
    </View>
  ),
};

export const LinearGradientPaints: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => (
    <View style={{ gap: 12 }}>
      <PaintedUsername username="Popsicle" paint={popsicle} />
      <PaintedUsername username="Magma" paint={magma} />
      <PaintedUsername username="Lobster" paint={lobster} />
      <PaintedUsername username="Jawbreaker" paint={jawbreaker} />
      <PaintedUsername username="Division" paint={divisionOa} />
      <PaintedUsername username="Cirus" paint={cirusOa} />
      <PaintedUsername username="Ripe" paint={ripeOa} />
      <PaintedUsername username="GingerTabby" paint={gingerTabbyS} />
    </View>
  ),
};

export const RadialGradientPaint: Story = {
  args: {
    username: 'FlowerchildRadialGlow',
    paint: flowerchildOa,
  },
};

export const DifferentAngles: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <View style={{ gap: 8 }}>
        {angles.map(angle => (
          <PaintedUsername
            key={angle}
            username={`Angle${angle}`}
            paint={createPaintData({
              id: `angle-${angle}`,
              name: `Angle ${angle}`,
              angle,
              stops: {
                0: { at: 0, color: rgbaToSevenTvColor(160, 59, 254, 255) }, // Popsicle purple
                1: { at: 1, color: rgbaToSevenTvColor(255, 77, 115, 255) }, // Rose gold pink
                length: 2,
              },
            })}
          />
        ))}
      </View>
    );
  },
};

export const WithGlowEffects: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => (
    <View style={{ gap: 16 }}>
      <PaintedUsername username="RoseGoldGlow" paint={roseGold} />
      <PaintedUsername username="PopsicleGlow" paint={popsicle} />
      <PaintedUsername username="RipeGoldGlow" paint={ripeOa} />
    </View>
  ),
};

export const LongUsernames: Story = {
  args: {
    username: 'Placeholder',
  },
  render: () => (
    <View style={{ gap: 8 }}>
      <PaintedUsername username="ShortName" paint={roseGold} />
      <PaintedUsername username="MediumLengthUsername" paint={popsicle} />
      <PaintedUsername username="VeryLongUsernameForTesting" paint={magma} />
    </View>
  ),
};
