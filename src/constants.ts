import { Module } from './types';

export const INITIAL_MODULES: Module[] = [
  // --- Foundations Track (Ages 5-10) ---
  {
    id: 'power-of-yet',
    title: 'The Magic of "Yet"',
    description: 'Learning that we can grow our brains by trying new things.',
    category: 'Growth Mindset',
    track: 'foundations',
    keyConcept: 'Resilience',
    artifactIcon: 'Mountain',
    content: `Once upon a time, in the Whispering Woods, there was a little squirrel named Pip. Pip wanted to climb the Great Oak, but every time he tried, he slipped. 

"I can't do it!" Pip cried.

His wise friend, Owl, flew down. "Pip, you can't do it... **YET**. Your brain is like a muscle. Every time you try, it gets a little bit stronger, even if you don't reach the top today."

Pip realized that failing was just his brain practicing for the next try.`,
    parentGuide: `### Discussion Points
1. Ask your child: "What is something you find hard right now?"
2. Remind them: "You're just in the 'Not Yet' stage. How can we practice today?"
3. Share a time you struggled with something new and how you kept going.`,
    activity: `### The "Yet" Jar
Find a jar and some small stones or buttons. Every time your child tries something hard, add a stone to the jar. When the jar is full, celebrate the effort with a special treat!`
  },
  {
    id: 'feeling-feelings',
    title: 'The Weather Inside Me',
    description: 'Understanding that emotions are like weather—they come and go.',
    category: 'Emotional Intelligence',
    track: 'foundations',
    keyConcept: 'Self-Awareness',
    artifactIcon: 'CloudLightning',
    content: `Deep in the Valley of Clouds, the sky changes all the time. Sometimes it's sunny and bright, and sometimes it's stormy and grey.

Luna the Cloud-Watcher knows a secret: "The weather isn't who I am, it's just what's happening right now." 

When Luna feels angry, she says, "Oh, look! A thunderstorm is passing through." She knows that soon, the sun will come back.`,
    parentGuide: `### Discussion Points
1. "What kind of weather are you feeling inside right now?"
2. "Is it okay for the weather to be rainy sometimes?"
3. "What can we do to stay cozy while a storm passes through?"`,
    activity: `### Emotion Weather Map
Draw a big sun, a rain cloud, and a lightning bolt. Ask your child to point to which one they feel like today. Draw a new one together for 'Calm' or 'Excited'.`
  },
  {
    id: 'kindness-ripple',
    title: 'The Kindness Ripple',
    description: 'Discovering how small acts of kindness create big waves of change.',
    category: 'Empathy',
    track: 'foundations',
    keyConcept: 'Kindness',
    artifactIcon: 'Flame',
    content: `In the middle of a bustling pond, a little frog named Barnaby dropped a pebble. *Plop.* The ripples started small, but they grew wider and wider, touching the edges of the pond.

"Kindness is just like that pebble," Barnaby thought. "Even a tiny act, like sharing a snack or giving a compliment, can create ripples that touch someone far away."

Barnaby decided to start a ripple. He helped a turtle find his way home, and he watched as the turtle felt happy, then helped a fish, and the fish helped a bird.`,
    parentGuide: `### Discussion Points
1. "What is a small act of kindness you could do today?"
2. "How do you feel when someone is kind to you?"
3. "How can we start a 'kindness ripple' in our family?"`,
    activity: `### The Kindness Chain
Use strips of construction paper to create a paper chain. Every time your child does something kind, write it on a strip and add it to the chain. See how long the chain can grow!`
  },

  // --- Expeditions Track (Ages 11-16) ---
  {
    id: 'social-mirror',
    title: 'The Social Mirror',
    description: 'Navigating identity, peer pressure, and the illusion of social media.',
    category: 'Digital Wellbeing',
    track: 'expeditions',
    keyConcept: 'Authenticity',
    artifactIcon: 'Smartphone',
    content: `Imagine walking through a hall of mirrors. Some make you look taller, some wider, some completely distorted. Social media and peer groups often act like these mirrors. They reflect a version of you, but it's rarely the whole truth.

As we grow, it's natural to look into these mirrors to figure out who we are. The danger comes when we start believing the distorted reflections are real. 

True confidence isn't about finding the perfect mirror; it's about knowing who you are when all the mirrors are taken away.`,
    parentGuide: `### Discussion Points
1. "When you look at social media, do you feel it reflects reality or a 'highlight reel'?"
2. "Have you ever felt pressure to change how you act to fit a certain 'mirror' (friend group)?"
3. "What are three things you value about yourself that no one can see in a photo?"`,
    activity: `### The Reality Check
Take a piece of paper and draw a line down the middle. On the left, write "What people see online/at school". On the right, write "What is actually true about me". Discuss the differences and why the gap exists.`
  },
  {
    id: 'architecture-of-choice',
    title: 'The Architecture of Choice',
    description: 'Understanding how our daily habits build the foundation of our future.',
    category: 'Self-Leadership',
    track: 'expeditions',
    keyConcept: 'Agency',
    artifactIcon: 'Compass',
    content: `Every choice you make is a brick. 

Choosing to study for 20 minutes? A brick. Choosing to scroll on your phone instead of sleeping? Another brick. 

Right now, you are the architect of your own life. You are building the house you will live in five years from now. The tricky part is that a single brick doesn't look like much. It's easy to dismiss one bad choice or ignore one good habit. But over time, those bricks stack up.

You don't need to build a mansion overnight. You just need to make sure today's bricks are laid straight.`,
    parentGuide: `### Discussion Points
1. "What is a 'brick' (habit) you are laying right now that you are proud of?"
2. "Is there a habit you feel is building a room you don't want to live in?"
3. "How can we make it easier to make good choices when you're tired or stressed?"`,
    activity: `### The Habit Audit
Identify one "keystone habit" you want to build this week (e.g., reading 10 pages, sleeping by 10 PM). Track it for 7 days. Notice how this one choice affects your mood and other decisions.`
  },
  {
    id: 'art-of-saying-no',
    title: 'The Art of Saying No',
    description: 'Learning to set healthy boundaries to protect your energy and time.',
    category: 'Boundaries',
    track: 'expeditions',
    keyConcept: 'Self-Respect',
    artifactIcon: 'Shield',
    content: `Saying "yes" feels good in the moment. It makes people happy, it makes you feel included, and it avoids conflict. But every "yes" to someone else is often a "no" to yourself.

If you say "yes" to every party, every favor, and every request, you eventually run out of energy for the things that actually matter to you.

Setting boundaries isn't about being mean or selfish. It's about being clear about what you can and cannot do. It’s a way of showing respect for your own time and well-being.`,
    parentGuide: `### Discussion Points
1. "Is there something you've said 'yes' to recently that you actually wanted to say 'no' to?"
2. "Why is it sometimes hard to say no?"
3. "How can you say no politely but firmly?"`,
    activity: `### The Boundary Script
Practice saying "no" in different scenarios. Write down three ways to decline an invitation or request without being rude (e.g., "I'd love to, but I'm fully booked this week," or "I can't commit to that right now.")`
  }
];
