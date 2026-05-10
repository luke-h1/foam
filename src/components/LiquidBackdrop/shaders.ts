import { Skia } from '@shopify/react-native-skia';

const lavaLampSource = Skia.RuntimeEffect.Make(`
uniform float time;
uniform vec2 size;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,
                        0.366025403784439,
                        -0.577350269189626,
                        0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

vec4 main(vec2 fragCoord) {
    vec2 st = fragCoord.xy / size.xy;
    st.x *= size.x / size.y;
    vec2 pos = st * 3.0;
    float df = 0.0;
    float angle = 0.0;
    vec2 vel = vec2(time * 0.1);

    df += snoise(pos + vel) * 0.25 + 0.25;
    angle = snoise(pos * vec2(cos(time * 0.15), sin(time * 0.1)) * 0.1) * 3.1415;
    vel = vec2(cos(angle), sin(angle));
    df += snoise(pos + vel) * 0.25 + 0.25;

    float blob = smoothstep(0.7, 0.75, fract(df));
    vec3 bgColor = vec3(0.0);
    vec3 blobColor = vec3(0.918, 0.702, 0.031);
    vec3 finalColor = mix(bgColor, blobColor, blob * 0.7);

    return vec4(finalColor, 1.0);
}
`);

if (!lavaLampSource) {
  throw new Error('Failed to compile LiquidBackdrop shader');
}

export const LAVA_LAMP_SOURCE = lavaLampSource;
