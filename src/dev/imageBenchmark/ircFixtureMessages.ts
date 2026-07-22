import { FIXTURE_COLORS } from './chatFixtureData';

export type FixtureRole = 'sub' | 'mod' | 'vip' | 'broadcaster';

export interface IrcFixtureMessage {
  /**
   * Display name; login is derived as the lowercased form.
   */
  user: string;
  /**
   * Message body — emote names render as images when the set is loaded.
   */
  text: string;
  /**
   * Badge tier; omitted = plain viewer.
   */
  role?: FixtureRole;
  /**
   * When set, emitted as a reply to this (display name + body).
   */
  replyTo?: { name: string; text: string };
}

export interface BuiltFixtureMessage {
  tags: Record<string, string>;
  text: string;
}

// FNV-1a, stable across runs - used to derive a fixed id/colour per display name.
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const userIdForName = (name: string): string =>
  String(210000000 + (hashString(name) % 80000000));

const colorForName = (name: string): string =>
  FIXTURE_COLORS[hashString(`${name}#color`) % FIXTURE_COLORS.length]!;

const badgesForRole = (role?: FixtureRole): string => {
  switch (role) {
    case 'broadcaster':
      return 'broadcaster/1,subscriber/24';
    case 'mod':
      return 'moderator/1,subscriber/12';
    case 'vip':
      return 'vip/1,subscriber/6';
    case 'sub':
      return 'subscriber/12,premium/1';
    default:
      return '';
  }
};

export function buildIrcFixtureMessage(
  entry: IrcFixtureMessage,
  roomId: string,
): BuiltFixtureMessage {
  const badges = badgesForRole(entry.role);
  const isSubscriber = badges.includes('subscriber');
  const tags: Record<string, string> = {
    'display-name': entry.user,
    login: entry.user.toLowerCase(),
    color: colorForName(entry.user),
    badges,
    'badge-info': isSubscriber ? 'subscriber/12' : '',
    'user-id': userIdForName(entry.user),
    'room-id': roomId,
    // id + tmi-sent-ts are overwritten per emit so every replayed copy is unique.
    id: '',
    'tmi-sent-ts': '0',
    emotes: '',
    mod: entry.role === 'mod' ? '1' : '0',
    subscriber: isSubscriber ? '1' : '0',
    turbo: '0',
    'user-type': entry.role === 'mod' ? 'mod' : '',
  };

  if (entry.replyTo) {
    tags['reply-parent-display-name'] = entry.replyTo.name;
    tags['reply-parent-user-login'] = entry.replyTo.name.toLowerCase();
    tags['reply-parent-msg-body'] = entry.replyTo.text;
    tags['reply-parent-msg-id'] = `fixture-parent-${hashString(
      `${entry.replyTo.name}:${entry.replyTo.text}`,
    )}`;
  }

  return { tags, text: entry.text };
}

/**
 * ~120 messages based on busy chatroom; heavy 7tv emote spam,
 * sentences, mentions and replies
 */
export const IRC_FIXTURE_MESSAGES: IrcFixtureMessage[] = [
  { user: 'cinna', text: 'hi chat cinnaW peepoHey', role: 'broadcaster' },
  {
    user: 'sodapoppin',
    text: 'OMEGADANCEBUTFAST OMEGADANCEBUTFAST OMEGADANCEBUTFAST',
    role: 'sub',
  },
  { user: 'hvdras501', text: 'catJAM catJAM catJAM ratJAM', role: 'sub' },
  { user: 'wholesome_andy803', text: 'LETSGO PogU' },
  { user: 'venmocubee', text: 'peepoClap peepoClap peepoClap', role: 'sub' },
  { user: 'mald_merchant', text: 'ReallyMad MODS this chat is unmoderated' },
  {
    user: 'copium_dealer709',
    text: 'GAMBA gimme that copium dawg Clueless',
    role: 'sub',
  },
  { user: 'oddlyvibing163', text: 'cinnaGroove cinnaGroove RaveTime' },
  {
    user: 'spirited_paige',
    text: 'sheesh that was actually insane GIGACHAD',
    role: 'vip',
  },
  { user: 'trailblazun579', text: 'L + ratio + Clueless', role: 'sub' },
  { user: 'kekw33', text: 'LMAOOOOOOOOOO ICANT', role: 'sub' },
  { user: 'timthetatman647', text: 'first time? LULE' },
  {
    user: 'cynical_cat',
    text: 'peepoComfy peepoComfy comfy stream',
    role: 'sub',
  },
  { user: 'spamGod907', text: 'BASED BASED BASED BASED BASED' },
  {
    user: 'valkyrae',
    text: '@cinna you are so silly SillyChamp',
    role: 'sub',
    replyTo: { name: 'cinna', text: 'hi chat cinnaW peepoHey' },
  },
  {
    user: 'emoteLord881',
    text: 'WICKED WICKED steer WickedSteer',
    role: 'sub',
  },
  { user: 'lurker99855', text: 'lurkk just lurking lurkk' },
  { user: 'KROW_LX189', text: 'monkaW monkaW monkaSTEER', role: 'sub' },
  { user: 'nymn751', text: 'Aware', role: 'mod' },
  { user: 'pepega_andy49', text: 'PepegaReading uh what did she say' },
  {
    user: 'feliciamcsticky137',
    text: 'cinnaSmoke cinnaSmoke ppSmoke',
    role: 'sub',
  },
  { user: 'forsen75', text: 'LULE Plotge' },
  { user: 'wackman293', text: 'WHAT NOIDONTTHINKSO', role: 'sub' },
  { user: 'nancyreetz475', text: 'peepoCinna so cute SoCute' },
  { user: 'destiny101', text: 'gambaaaa GAMBA GAMBAADDICT', role: 'sub' },
  { user: 'aceclips553', text: 'clipped it Recording' },
  {
    user: 'QG_Demi241',
    text: 'CinnaStare CinnaStare WideStarege',
    role: 'sub',
  },
  { user: 'Sk1vx605', text: 'YESSS LETSGO LETSGO' },
  { user: 'blastoise_b631', text: 'RIPBOZO RIPBOZO get clapped', role: 'sub' },
  { user: 'dustin_ek449', text: 'peepoRiot peepoRiot peepoRiot MODS' },
  {
    user: 'cinna',
    text: 'stop bullying me chat Smadge stopbeingMean',
    role: 'broadcaster',
  },
  {
    user: 'LadyDub267',
    text: 'Sadge we are not bullying SadCat',
    role: 'sub',
    replyTo: {
      name: 'cinna',
      text: 'stop bullying me chat Smadge stopbeingMean',
    },
  },
  { user: 'kidmysticc423', text: 'GIGACHAD GIGACHAD', role: 'sub' },
  { user: 'mizkif309', text: 'BRUH BRUH BRUH what is happening' },
  { user: 'talha_silver371', text: 'catKISS catKISS mwah', role: 'sub' },
  { user: 'yohannes319', text: 'peepoFAT peepoFAT eating again' },
  { user: 'Rondyy59', text: 'WeirdChamp report this guy', role: 'sub' },
  {
    user: 'PizzaGoddess85',
    text: 'peepoHey hi everyone heyy peepoHey',
    role: 'sub',
  },
  { user: 'KillerAngel111', text: 'Madgeclap Madgeclap PLEASE' },
  {
    user: 'Gsharma345',
    text: 'WeWaiting WeWaiting WaitingTooLong',
    role: 'sub',
  },
  {
    user: 'cluelessroses527',
    text: 'Clueless what is going on Clueless',
    role: 'sub',
  },
  { user: 'moonmoon205', text: 'donkWalk donkWalk peepoRun' },
  { user: 'shroud283', text: 'BUSSIN this is bussin fr', role: 'sub' },
  { user: 'hasanabi335', text: 'BASED political streamer arc Chatting' },
  { user: 'pokimane361', text: 'cinnaHop cinnaHop catHop', role: 'sub' },
  { user: 'tarik387', text: 'GOAT GOAT she is the goat' },
  { user: 'ludwig439', text: 'GAMBA time on stake STAKE', role: 'sub' },
  { user: 'sykkuno491', text: 'peepoShy peepoShy hii peepoCute' },
  { user: 'amouranth517', text: 'slayyyed slayyy WICKED', role: 'sub' },
  { user: 'clix543', text: 'W W W W W' },
  { user: 'tfue569', text: 'L streamer Clueless', role: 'sub' },
  { user: 'nickmercs595', text: 'LETSGO LETSGO PogU' },
  { user: 'drlupo621', text: 'o7 o7 respect', role: 'sub' },
  { user: 'courage673', text: 'LETSGO peepoCheer peepoClap' },
  { user: 'scarra699', text: 'Hmmge Hmmge interesting', role: 'sub' },
  { user: 'fed725', text: 'AINTNOWAY AINTNOWAY no way bro' },
  { user: 'nani777', text: 'NOWAYING NOWAYING', role: 'sub' },
  { user: 'chatter829', text: 'Chatting Chatting Chatting' },
  { user: 'venmocubee', text: 'peepoGiggles peepoGiggles HEHE', role: 'sub' },
  {
    user: 'hvdras501',
    text: '@wholesome_andy803 stop spamming LULE',
    role: 'sub',
    replyTo: { name: 'wholesome_andy803', text: 'LETSGO PogU' },
  },
  { user: 'sodapoppin', text: 'Deadge stream is dead Deadge', role: 'sub' },
  { user: 'mald_merchant', text: 'UltraMad UltraMad UNMODDED' },
  {
    user: 'copium_dealer709',
    text: 'one more gamba GAMBA KEEPGAMBLING',
    role: 'sub',
  },
  { user: 'oddlyvibing163', text: 'kittyJam ratJAM catRAVE catJAM' },
  { user: 'spirited_paige', text: 'monkaW wait what happened', role: 'vip' },
  { user: 'emoteLord881', text: 'POGGIES POGGIES PogU', role: 'sub' },
  { user: 'spamGod907', text: 'WICKED WICKED WICKED WICKED WICKED WICKED' },
  { user: 'kekw33', text: 'LULE LULE LULE', role: 'sub' },
  { user: 'cynical_cat', text: 'Susge Susge kinda sus Susge', role: 'sub' },
  { user: 'KROW_LX189', text: 'monkaW thats crazy monkaW', role: 'sub' },
  { user: 'cinna', text: 'guys i hit my mic Erm', role: 'broadcaster' },
  {
    user: 'oddlyvibing163',
    text: 'we heard it Aware',
    replyTo: { name: 'cinna', text: 'guys i hit my mic Erm' },
  },
  { user: 'wholesome_andy803', text: 'peepoComfy love this stream cinnaW' },
  { user: 'nymn751', text: 'chill in chat Chatting', role: 'mod' },
  { user: 'lurker99855', text: 'donowall donowall' },
  {
    user: 'feliciamcsticky137',
    text: 'cinnaSwag cinnaSwag GIGACHAD',
    role: 'sub',
  },
  { user: 'forsen75', text: 'LULE Plotge Plotge' },
  {
    user: 'wackman293',
    text: 'ICANT i literally cant ICANTFUCKINGTAKEITANYMORE',
    role: 'sub',
  },
  { user: 'nancyreetz475', text: 'SoCute peepoCute aww' },
  { user: 'destiny101', text: 'BASED take honestly BASED', role: 'sub' },
  { user: 'QG_Demi241', text: 'WonkyStare WonkyStare', role: 'sub' },
  { user: 'Sk1vx605', text: 'LETSGO POGGIES' },
  { user: 'blastoise_b631', text: 'crabRave crabRave RaveTime', role: 'sub' },
  { user: 'dustin_ek449', text: 'peepoBONK no horny NOHORNY' },
  { user: 'LadyDub267', text: 'catKISS mwah cinNya', role: 'sub' },
  { user: 'kidmysticc423', text: 'GIGACHAD chad behaviour BASED', role: 'sub' },
  { user: 'mizkif309', text: 'WhatChamp what is she doing WhatChamp' },
  { user: 'talha_silver371', text: 'peepoHey heyy peepoHey hiii', role: 'sub' },
  { user: 'yohannes319', text: 'BUSSIN BUSSIN food is bussin' },
  { user: 'Rondyy59', text: 'WICKED steering WickedSteer', role: 'sub' },
  { user: 'PizzaGoddess85', text: 'YIPPEE YIPPEE peepoCheer', role: 'sub' },
  {
    user: 'spamGod907',
    text: 'OMEGADANCEBUTFAST OMEGADANCEBUTFAST catJAM catJAM RaveTime',
  },
  { user: 'KillerAngel111', text: 'pepeJAM pepeJAM widepeepoHug' },
  { user: 'Gsharma345', text: 'monkaSTEER monkaSTEER monkaW', role: 'sub' },
  { user: 'cluelessroses527', text: 'Okayge fair enough Okayge', role: 'sub' },
  {
    user: 'copium_dealer709',
    text: '@spamGod907 calm down with the spam ReallyMad',
    role: 'sub',
    replyTo: { name: 'spamGod907', text: 'BASED BASED BASED BASED BASED' },
  },
  { user: 'venmocubee', text: 'peepoClap peepoClap GG gg', role: 'sub' },
  { user: 'hvdras501', text: 'cinnaPoint cinnaPoint look', role: 'sub' },
  {
    user: 'sodapoppin',
    text: 'Sadge stream ending soon Sadge SadgeCry',
    role: 'sub',
  },
  { user: 'oddlyvibing163', text: 'NOOOO dont end NOOO Sadge' },
  { user: 'mald_merchant', text: 'finally a mod Aware NODRAMA', role: 'sub' },
  {
    user: 'cinna',
    text: 'ok one more game GAMBA then bed',
    role: 'broadcaster',
  },
  {
    user: 'destiny101',
    text: 'LETSGO one more LETSGO',
    role: 'sub',
    replyTo: { name: 'cinna', text: 'ok one more game GAMBA then bed' },
  },
  { user: 'kekw33', text: 'ICANT she always says that LULE', role: 'sub' },
  { user: 'wholesome_andy803', text: 'peepoComfy good night soon peepoSleepy' },
  { user: 'emoteLord881', text: 'PogU PogU PogU PogU', role: 'sub' },
  { user: 'spirited_paige', text: 'GIGACHAD what a play GOAT', role: 'vip' },
  { user: 'cynical_cat', text: 'Aware Aware', role: 'sub' },
  { user: 'forsen75', text: 'Bedge Bedge go to Bedge' },
  { user: 'KROW_LX189', text: 'monkaW that was close monkaW', role: 'sub' },
  { user: 'timthetatman647', text: 'LULE LULE good one' },
  { user: 'nancyreetz475', text: 'cinnaVanish cinnaVanish she gone' },
  { user: 'valkyrae', text: 'peepoLeave peepoLeave bye chat', role: 'sub' },
  { user: 'lurker99855', text: 'buhbye o7 buhbye' },
  { user: 'wackman293', text: 'GG GG GG good stream', role: 'sub' },
  { user: 'spamGod907', text: 'cinnaW cinnaW cinnaW cinnaW' },
  { user: 'oddlyvibing163', text: 'catJAM one last catJAM ratJAM' },
];
