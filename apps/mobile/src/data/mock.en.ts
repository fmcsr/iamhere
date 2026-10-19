/**
 * Prototip verisinin İngilizcesi (Ayarlar › Dil › English, T-29). Kimliklerle eşleşir; karşılığı olmayan
 * (ör. kullanıcının kendi yazdığı) metin olduğu gibi kalır. Mekân ve semt adları özel ad olduğu için çevrilmez.
 */
export const EN: {
  /** Paylaşım kimliği → metin. */
  posts: Record<string, string>;
  /** Mesaj kimliği → metin. */
  messages: Record<string, string>;
  /** Kullanıcı kimliği → biyografi ('me' dahil). */
  bios: Record<string, string>;
  /** Mekân kimliği → bu geceki duyuru; saatli olanlar "Başlık · 21:00" biçiminde kalır. */
  events: Record<string, string>;
  /** Plan kartı taşıyan mesajın kimliği → plan başlığı ve buluşma yeri. */
  plans: Record<string, { title: string; place: string }>;
  /** Türkçe takma ad → İngilizcesi ("Sessiz Tilki 58" → "Silent Fox 58"). */
  aliases: Record<string, string>;
} = {
  posts: {
    p1: 'Gece Treni just came back out for a second encore. Right in front of the stage it’s a whole other world, and the sound is crystal clear.',
    p6: 'Fava, haydari, samphire… The meze platter just arrived, and the fasıl music starts at 10 pm. You have to try the fava.',
    p2: 'No room left on the terrace, but the DJ set is spot on. The view’s free.',
    p7: 'Ordered the double smash and the cheddar is oozing. Crispy fries, homemade sauce. Came out in 15 minutes.',
    p3: 'Spicy Adana kebab is legendary, and roasted peppers on the side are a must. A table for 4 just freed up; anyone hungry after the concert, come on over.',
    p8: 'Acoustic night just started. The room’s small but the sound is great, and the front rows are almost full.',
    p4: 'We’re up to 15 people on the seafront, heading out for the run at 11:30 pm. It’s chilly, so bring a windbreaker.',
    p10: 'We’ve set up a rakı-and-fish table at Çınar, and there’s room for two more. Come before the fasıl starts.',
    p5: 'Their flat whites are still the best in Kadıköy. There’s a board game set up at the back table and we’re two players short.',
    p9: 'Doors are open and they’re doing the lighting check. If you’re early, grab the left side of the stage.',
    p13: 'Evening coffee break: four cups, four different designs. The barista’s in top form today.',
    p11: 'Still thinking about last night’s mixed grill. The lamb shish was so tender, and the lavash came out warm.',
    p12: 'Kule Teras’s new cocktail menu: the basil gin is really good, but prices are a bit steep.',
    pm1: 'The fasıl band was so good tonight; the whole meyhane sang along to the last song.',
    pm2: 'Went up to the terrace at sunset; the loveliest hour before the DJ arrives.',
    pm3: 'A quick burger before the concert. Homemade pickles, crispy fries.',
    pm4: 'Late-night coffee and a book. There’s another board game tournament at the back table.',
    pm5: 'Heard a band for the first time at acoustic night; I wrote down their name.',
    pm6: 'The first plan I said “I’m in” to, at Çınar: nine of us showed up and the table got extended twice.',
    pm7: 'Caught our breath on the pier after the run. The lights across the water are stunning.',
    pm8: 'Confetti rained down at the encore, and we lost our voices.',
    pm9: 'Tried the basil gin; turns out Mert was right.',
    pt1: 'On sunset watch with Elif; the view is ours until the DJ gets here.',
    pt2: 'Elif finally came around to the fava. Full line-up at the meze table.',
    pt3: 'The front row was ours; Elif sang along to every song.',
    pt4: 'Pre-concert burger run: Elif ordered hers without cheddar, and we still don’t get it.',
    pt5: 'Night run crew, taking a break on the pier. Elif threw off the pace again.',
    pt6: 'The moment before the encore. Confetti any second now, and Elif’s ready.',
  },
  messages: {
    m1: 'The left side of the stage has more room, head over there',
    m2: 'Think they’ll do an encore?',
    m3: 'The lights are amazing, I put the photos up on the feed',
    m4: 'Anyone up for a walk to the seafront after the concert?',
    m7: 'I’m coming too, let’s meet at the gate',
    g1: 'We’re at the long table by the window, there’s room for two',
    g2: 'We ordered the fava, samphire’s on its way too',
    g3: 'Is the fasıl band definitely starting at 10 pm?',
    g4: 'Yes, the waiter said so. We get the first song request',
    g5: 'The front rows are full, but you can hear really well from the bar side too',
    g6: 'They’re taking a 15 min break, then it’s the second set',
    g7: 'Shall we walk around Bahariye after the set?',
    g8: 'The run starts from the pier at 11:30 pm, easy pace',
    g9: 'I’ll walk along with you, I brought a thermos of tea',
    m5: 'Are you down at the seafront tonight?',
    m6: 'Hey! Want to join the board game table?',
  },
  bios: {
    me: 'Live music, running and good coffee. Moda on weekends.',
    u1: 'Concert photographer. The front row is mine.',
    u2: 'Grill house expert, meyhane regular.',
    u3: 'Night walks and the seaside.',
    u4: 'DJ sets, rooftops.',
    u5: 'Coffee, books, board games.',
    u6: 'Mapping the meze scene. Fava is not up for debate.',
    u7: 'Burgers and late-night cinema.',
    u8: 'Small stages, acoustic nights.',
    u9: 'Rakı-and-fish connoisseur.',
    e1: 'Record shops, jazz nights.',
    e2: 'Code on weekdays, gigs on weekends.',
    e3: 'Moda local, the seafront is mine.',
    e4: 'Grill houses > everything.',
    e5: 'Coffee-brewing obsessive.',
    e6: 'Night runs and morning coffee.',
    e7: 'I keep a list of rooftop bars.',
    e9: 'Wherever there’s fasıl, I’m there.',
    e10: 'Burger reviews.',
    e11: 'All things acoustic.',
    e13: 'Working my way through Kadıköy’s coffee shops.',
    e14: 'Rakı, fish, good conversation.',
    e15: 'DJ, Yeldeğirmeni.',
    e16: 'Stand-up and small stages.',
    e18: 'Night photography.',
  },
  events: {
    v1: 'Gece Treni concert · 21:00',
    v3: 'Night run meetup · 23:30',
    v4: 'Open until 2 am',
    v5: 'DJ set · 22:00',
    v6: 'Fasıl music · 22:00',
    v8: 'Acoustic night · 23:00',
    v9: 'Vinyl night · 22:30',
    v10: 'Electronic night · 23:00',
  },
  plans: {
    m4: { title: 'Walk to the seafront', place: 'Outside Gate 2' },
  },
  aliases: {
    'Uykusuz Baykuş 42': 'Sleepless Owl 42',
    'Sessiz Tilki 58': 'Silent Fox 58',
    'Neşeli Martı 7': 'Jolly Seagull 7',
    'Gezgin Martı 17': 'Wandering Seagull 17',
  },
};
