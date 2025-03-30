export interface StvPaintShadow {
  x_offset: number;
  y_offset: number;
  radius: number;
  color: number;
}

export interface StvPaint {
  id: string;
  name: string;
  users: string[];
  function: string;
  color: number | null;
  stops: { at: number; color: number }[];
  repeat: boolean;
  angle: number;
  image_url?: string;
  shape?: string;
  drop_shadow: StvPaintShadow;
  drop_shadows?: StvPaintShadow[];
  animation: {
    speed: 0;
    keyframes: null;
  };
}
