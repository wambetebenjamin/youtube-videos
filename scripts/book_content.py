# -*- coding: utf-8 -*-
"""Canonical content for CHRISCO Youth Aflame, Book One: UNUSED IS LOST.

Single source of truth used by build_book.py to emit book.md, the print-ready
PDF interior and the editable DOCX.

Block language
--------------
plain strings  -> body paragraphs
("h2", text)   -> section sub-head
("pull", text, attribution) -> pull quote
("num", n, title, text)     -> numbered card
("list", [items])           -> bullet list
("rule",)      -> short orange rule
("space", pts) -> vertical space
("scripture", text, ref)    -> scripture panel
("lines", n)   -> n ruled writing lines
("table", headers, rows, widths) -> tracked table
("img", file, caption, height_pts) -> framed image
"""

BOOK = {
    "title": "UNUSED IS LOST",
    "subtitle": "The Law of Use and the Law of Sowing &amp; Reaping",
    "series": "CHRISCO YOUTH AFLAME",
    "book_no": "BOOK ONE",
    "ministry": "A Ministry of CHRISCO Fellowship of Churches",
    "tagline": "For young people who are done watching their gift sit in a drawer.",
}

CONTENTS = [
    ("Foreword", "A Word Before You Begin", "foreword"),
    ("Part One", "The Law of Use", "pt1"),
    ("One", "Nobody Votes On It", "ch1"),
    ("Two", "Seven Things That Leak", "ch2"),
    ("Three", "The Servant Who Played It Safe", "ch3"),
    ("Four", "Take a New Inventory of Yourself", "ch4"),
    ("Part Two", "The Law of Sowing and Reaping", "pt2"),
    ("Five", "Look in the Mirror", "ch5"),
    ("Six", "Seven Keys to Sowing and Reaping", "ch6"),
    ("Seven", "The Seed Already in Your Hand", "ch7"),
    ("Eight", "Thirty Days of Sowing", "ch8"),
    ("Charge", "Don&rsquo;t Let the Springs Pass", "close"),
    ("", "Notes", "notes"),
    ("", "Credits and Acknowledgements", "credits"),
]

FOREWORD = [
    "Some sentences are so small that you walk past them, and so true that you never do.",
    "This book is built on one of those sentences. An older man handed it to a younger one a long time ago, "
    "and the younger man spent the rest of his life proving it: <b>whatever you don&rsquo;t use, you lose.</b>",
    "That is not a proverb about money. It is a law about everything you have been given: your mind, your body, "
    "your voice, your ambition, your faith, the people who poured into you, the years in front of you. "
    "It is quiet and it is ruthless. It does not send you a warning letter. It simply takes back what you refuse to put to work.",
    "We are a youth movement inside CHRISCO Fellowship of Churches, and we are writing this little library because we have "
    "watched too many young people with real gifts arrive at twenty-five with nothing to show for them, not because "
    "they were wicked, but because nobody told them the rules.",
    "So here are two of the rules. Two basic laws, older than any of us, written into the ground we walk on and into the "
    "Scripture we read. The first is the <b>law of use</b>. The second is the <b>law of sowing and reaping</b>.",
    "Read it in one sitting. Then read it again with a pen in your hand. This is not a book to admire. It is a book to obey.",
    ("h2", "How to use this book"),
    ("list", [
        "Read one chapter a day, not more. Small and obeyed beats large and forgotten.",
        "Do the writing. Chapter Four and Chapter Eight are meant to be filled in, not skimmed.",
        "Take it to somebody. A gift that is only talked about in private is still a buried gift.",
    ]),
]

PART1 = {
    "number": "PART ONE",
    "title": "The Law of Use",
    "blurb": "Nothing you own stays yours by accident. Every gift has a maintenance cost, and the fee is use.",
    "image": "02-leap.jpg",
    "caption": "There is a version of your life on the other side of the effort you keep postponing.",
}

CH1 = {
    "kick": "CHAPTER ONE",
    "title": "Nobody Votes On It",
    "blocks": [
        "The law of use goes like this: <b>whatever you don&rsquo;t use, you lose.</b> Lack of use causes loss. "
        "Today, unused, is lost. Not next year. Today.",
        "There is a kind of person who says, &ldquo;I&rsquo;ll work twice as hard tomorrow to make up for today.&rdquo; "
        "That is arithmetic that feels honest and is not. You could have worked twice as hard tomorrow <i>and</i> "
        "done something today. The day is not a bank. You cannot deposit it back.",
        "Here is the picture that never leaves you once you have seen it. Tie your arm to your side. Leave it there long enough "
        "and you will never use it again. Not because anything dramatic happened. No accident, no diagnosis, no enemy. "
        "You simply stopped. And stopping was enough.",
        "The only way to keep the use of the arm is to keep using the arm. If you quit, you lose automatically. "
        "They do not bring it up for a vote. Nobody asks whether you meant well. There is no appeal. "
        "<b>You lose automatically when you quit.</b>",
        "This is why the law is so easy to ignore. It never argues with you. It never sends a bill on the day. "
        "It waits. And then it quietly closes the window, and you discover that ambition you did not exercise has declined, "
        "that vitality you did not spend has diminished, that energy you tried to &ldquo;save up&rdquo; has decreased. "
        "You cannot save energy. Energy is spent into existence. Rest is not the same thing as storage.",
        ("pull", "You do not usually lose your gift in a tragedy. You lose it in an ordinary Tuesday, when you decided to start next week.", ""),
        "So the first act of wisdom is not dramatic. It is an audit. Before you ask God for more, ask Him what you have done "
        "with what He already gave you. That question is the doorway to everything else in this book.",
        "The second chapter names the leak by name, so that you stop guessing.",
    ],
}

CH2 = {
    "kick": "CHAPTER TWO",
    "title": "Seven Things That Leak",
    "intro": "The law of use does not only apply to money or muscles. It applies to the invisible things that decide what a life becomes. "
             "Name them plainly, and they stop being vague.",
    "items": [
        ("01", "Talent",
         "The thing you are unusually good at and unusually lazy about. It does not wait for you forever. "
         "Ask: what am I good at that I have not touched this year?"),
        ("02", "Ability",
         "Talent you have trained. Untrained, it stays a rumour your family repeats at gatherings. "
         "Ask: what skill is one deliberate hour a day away from being real?"),
        ("03", "Ambition",
         "Unused ambition does not stay at full strength; it declines into cynicism. Ask: what do I still want, "
         "and when did I stop saying it out loud?"),
        ("04", "Vitality",
         "Unused vitality diminishes, in the body first. Ask: what would be different in six months if I moved, "
         "slept and ate like my body was on assignment?"),
        ("05", "Energy",
         "Energy unused decreases. You cannot store it like grain. Ask: where have I been resting and calling it preparation?"),
        ("06", "Strong feelings",
         "Conviction, compassion, grief over wrong: these grow only by being acted on. "
         "Ask: what moved me recently that I have not yet done anything about?"),
        ("07", "Faith",
         "Faith unused decreases. Not faith spoken about. Faith exercised. Ask: what am I asking God for that "
         "requires nothing of me?"),
    ],
    "outro": "Seven things. One law. And a mercy buried inside it: the leak is reversible while you can still read these words.",
}

CH3 = {
    "kick": "CHAPTER THREE",
    "title": "The Servant Who Played It Safe",
    "blocks": [
        "Jesus told a story about a man going on a long journey. He called three servants and handed them his property: "
        "five talents to one, two to another, one to the last. In those days a talent was a weight of gold, not a personality trait. "
        "These were real, heavy, transferable assets.",
        "&ldquo;Trade with these until I return,&rdquo; he said. Then he left.",
        "The first two went to work. It was shaky at first, because markets are markets, but things got rolling, and by the time "
        "the master came home the five had become ten and the two had become four. Both had doubled. Neither had been spectacular. "
        "Both had been faithful.",
        "The third servant had a different strategy. He wrapped his talent in cloth, dug a hole, and buried it. "
        "It was, by his own account, a success: he had not lost it. Nothing had been stolen. He handed it back exactly as received, "
        "and he said so with a straight face, as if safety were the same thing as obedience.",
        "<b>Read Matthew 25:14 to 30.</b> The master&rsquo;s verdict is one of the hardest sentences in the Bible: "
        "the talent is taken from the man and given to the one who already has ten. Not because the servant was cruel. "
        "Because he was <i>idle</i>. Because he had confused doing no harm with doing good.",
        ("pull", "The servant was not condemned for what he did with the talent. He was condemned for what he did with the hole.", ""),
        "Before you decide the master was harsh, notice what the story is actually defending: the master&rsquo;s reputation. "
        "A servant who buries what his master gave him publishes a message about his master: that he is a hard man, "
        "that nothing is worth the risk, that the safest thing to do with God is nothing.",
        "That is the lie this book exists to break. God is not glorified by your caution. He is glorified by your use.",
        "Which raises a question only you can answer: what is wrapped in cloth in your life right now, and who told you burying it was wise?",
    ],
}

CH4 = {
    "kick": "CHAPTER FOUR",
    "title": "Take a New Inventory of Yourself",
    "intro": "An inventory is not a guilt trip. It is a map. Fill this in honestly, in pencil, and revisit it every quarter.",
    "table": (
        ["What I have been given", "Where I last used it", "One way to use it this week"],
        [
            ["", "", ""], ["", "", ""], ["", "", ""],
            ["", "", ""], ["", "", ""], ["", "", ""],
        ],
        [0.38, 0.31, 0.31],
    ),
    "prompts": [
        "The gift people keep thanking me for is&hellip;",
        "The thing I have been calling &ldquo;not yet&rdquo; for over a year is&hellip;",
        "What I would attempt this month if I truly believed unused is lost:",
    ],
    "lines": 3,
    "outro": "Show this page to one person who loves you and is not impressed by you. Ask them what they see. "
             "Then act on the first line before Sunday.",
}

CH5 = {
    "kick": "CHAPTER FIVE",
    "title": "Look in the Mirror",
    "blocks": [
        "The second law comes in two quotings, and the second one is the useful one.",
        "The polite version is: <b>you reap what you sow.</b> Everyone nods at that. It is the version that makes a good poster.",
        "The honest version is: <b>whatever you are reaping is what you have sown.</b> That one has a name and an address.",
        "If the harvest is bitter, the question is not &ldquo;why is God doing this?&rdquo; The question is &ldquo;who planted this?&rdquo; "
        "And when you go looking for the farmer, you do not have to search far. You will find him in the mirror.",
        ("scripture", "Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.", "Galatians 6:7"),
        "This is not fatalism, and it is not shame. It is the most hopeful doctrine in the world, because it puts the harvest back "
        "inside your reach. If the crop is the problem, you cannot fix the crop, but you can change the seed, and you can start today.",
        "That is why the next chapter is not a lecture. It is a set of keys: seven things that are true about this law, "
        "whether you believe them or not, whether you are sixteen or sixty.",
        ("pull", "You cannot argue with a harvest. You can only plant again.", ""),
    ],
}

CH6 = {
    "kick": "CHAPTER SIX",
    "title": "Seven Keys to Sowing and Reaping",
    "intro": "Seven statements. Learn them like you learned your own name, because they explain almost every outcome you will live through.",
    "items": [
        ("01", "The law is negative",
         "Sow bad, reap bad. Blunt, but clear. Nobody escapes it by being sincere, well-liked or young."),
        ("02", "The law is positive",
         "Sow good, reap good. The same machinery that ruins a careless life will quietly build a faithful one."),
        ("03", "The law is <i>more</i>",
         "You do not get back what you put out. You get back much more. A small compromise becomes a character. "
         "A small obedience becomes a calling."),
        ("04", "There are many ways to sow",
         "Many ways to change a life, to be promoted, to move up, to become free. Do not fixate on the one door "
         "you are angry at. The field is wide."),
        ("05", "Anyone can sow",
         "The question was never <i>can</i>. It is <i>will</i>. Ten years from now you will arrive somewhere; "
         "the only open question is where."),
        ("06", "You can still lose",
         "Sometimes you do everything right and still lose. That is this planet: opportunity mixed with difficulty. "
         "Do not be naive and do not be bitter. Be ready."),
        ("07", "No sowing, no reaping",
         "If you do not sow, you do not even have a chance. Not a smaller harvest: no harvest. "
         "That is the quiet tragedy of a careful life."),
    ],
    "outro": "And one instruction before you close the book: <b>don&rsquo;t try to beat the law.</b> You might as well try to sit on the sun "
             "to keep it from coming up. Work with it instead. It is the friendliest force in the universe once you stop fighting it.",
}

CH7 = {
    "kick": "CHAPTER SEVEN",
    "title": "The Seed Already in Your Hand",
    "blocks": [
        "You may be reading this with very little: no salary, no title, no platform, a rented room and a phone with a cracked screen. "
        "Good. The law of sowing does not require capital. It requires seed, and you already have some.",
        ("list", [
            "<b>Time.</b> The most honest seed you own. Where it goes, your life goes.",
            "<b>Words.</b> Encouragement sown in private comes back as courage in public.",
            "<b>Work.</b> Excellence in an unglamorous task is seed in the ground, not time wasted.",
            "<b>Money.</b> However small. Generosity is the only thing you can give away and keep.",
            "<b>Attention.</b> What you study becomes what you can carry for others.",
            "<b>Presence.</b> Showing up for people who cannot repay you.",
        ]),
        "And the field is just as ordinary: your home, your church, your school, your job, your friendships, and the person "
        "nobody else is checking on.",
        ("scripture", "He which soweth sparingly shall reap also sparingly; and he which soweth bountifully shall reap also bountifully.", "2 Corinthians 9:6"),
        "In the morning sow your seed, and in the evening do not withhold your hand, because you do not know which will prosper, "
        "this or that, or whether both alike will be good (Ecclesiastes 11:6). That is not a promise of instant results. "
        "It is a promise that seed in the ground is never wasted, even when the harvest is late.",
        ("img", "06-maize-farmer.jpg", "Seed in the ground looks like nothing for a long time. That is the nature of seed.", 168),
        "So do not wait for a big field. Sow in the one you can see. The size of the harvest is not decided on the day you plant; "
        "it is decided by whether you planted at all.",
    ],
}

CH8 = {
    "kick": "CHAPTER EIGHT",
    "title": "Thirty Days of Sowing",
    "intro": "A law you agree with changes nothing. A law you practise changes everything. Here is one month of deliberate sowing: "
             "small enough to finish, serious enough to matter.",
    "weeks": [
        ("WEEK 1", "Sow in your walk with God",
         "Fifteen minutes a day in Scripture and prayer, same time, same chair, no phone. Write one sentence a day about what you read."),
        ("WEEK 2", "Sow in your body",
         "Three sessions of movement, one earlier night, one honest meal plan. Your body is not a passenger; it is the vehicle."),
        ("WEEK 3", "Sow in a person",
         "Choose one person younger or needier than you and give them four hours this week. Mentor, tutor, visit, help, listen."),
        ("WEEK 4", "Sow in your craft",
         "Forty-five minutes a day on the thing you want to be excellent at. Not scrolling about it. Doing it."),
    ],
    "table": (
        ["Day", "What I sowed", "What I noticed"],
        [["%d" % d, "", ""] for d in range(1, 31)],
        [0.11, 0.46, 0.43],
    ),
    "outro": "At the end of thirty days, do not grade yourself on results. Grade yourself on days sown. "
             "Results are God&rsquo;s department; sowing is yours.",
}

CLOSE = {
    "kick": "A CHARGE",
    "title": "Don&rsquo;t Let the Springs Pass",
    "blocks": [
        "Life is brief. Not sad, only brief. Which means the springs do not come around twice. "
        "The year you are in will pass whether or not you plant anything in it, and it will not come back to be used properly.",
        "So here is the charge, and it is short.",
        "Take a new inventory of yourself. Make sure that all of your talent, your ability, your mind, your ingenuity, "
        "your vitality, your strong feelings, your faith and your courage are being <i>used</i>. Otherwise you lose. It is a law.",
        "Then go and sow. Not tomorrow. Not after the exams, the wedding, the salary, the breakthrough. Now, with what you have, "
        "in the field you can see.",
        ("scripture", "They that sow in tears shall reap in joy. He that goeth forth and weepeth, bearing precious seed, "
                      "shall doubtless come again with rejoicing, bringing his sheaves with him.", "Psalm 126:5 and 6"),
        "And when you fail, and you will, do not go and hide in shame. Shame buries seed. Repentance replants it.",
        ("h2", "A prayer to close"),
        "Father, thank You for what You have placed in my hands. Show me what I have buried, and give me the courage to dig it up. "
        "Teach me to sow where I am, with what I have, while I still can. Make my life a field and not a warehouse. "
        "In the name of Jesus, amen.",
    ],
}

CREDITS = [
    ("h2", "About this book"),
    "UNUSED IS LOST is Book One of the CHRISCO Youth Aflame library, a ministry of CHRISCO Fellowship of Churches. "
    "It is written for young people between roughly fifteen and thirty, and for the adults who refuse to give up on them.",
    "The two laws in this book, the law of use and the law of sowing and reaping, are set out in a talk by "
    "Jim Rohn on basic laws taken from Scripture. This book is an original work written in our own words in response to "
    "that teaching, and is not a transcript or an authorised edition of it. Scripture quotations are from the King James "
    "Version, which is in the public domain.",
    ("h2", "Design and photography"),
    "Interior design: CHRISCO Youth Aflame creative team. The type follows the two families of the house template this "
    "book is set to: a geometric display sans (Anantason, stood in for by Poppins) and a humanist text face "
    "(Univers LT Pro, stood in for by Lato). Photography is licensed royalty-free and used without modification of its "
    "licence terms:",
    ("imgcredits", [
        ("Campfire at night", "Unsplash", "unsplash.com/photos/_wR0kpSkt9A"),
        ("Leap at sunset", "Unsplash", "unsplash.com/photos/fMIsAL72P3U"),
        ("Starting blocks", "Unsplash", "unsplash.com/s/photos/young-athlete"),
        ("Choir in light", "Pexels", "pexels.com/photo/7520355"),
        ("Maize farmer, Kenya", "The Habari Network", "thehabarinetwork.com"),
        ("Wheat field at dusk", "Unsplash", "unsplash.com/photos/1627230768827"),
        ("Young man at a window", "Unsplash", "unsplash.com/photos/zBBlSdn6fVA"),
        ("Hands planting seedlings", "Unsplash", "unsplash.com/photos/q13Zq1Jufks"),
        ("Guitar in the light", "Unsplash", "unsplash.com/photos/jt8lLfH7mcw"),
        ("Friends walking", "Pexels", "pexels.com/photo/7972657"),
        ("Notebook and pen", "Pexels", "pexels.com/photo/17237364"),
        ("Empty road at dawn", "Pexels", "pexels.com/photo/28202556"),
    ]),
    "Images are the property of their respective photographers and are used under the Unsplash Licence, the Pexels Licence "
    "or with editorial credit as noted. No image in this book is AI-generated.",
    ("h2", "Contact"),
    "CHRISCO Youth Aflame &middot; A Ministry of CHRISCO Fellowship of Churches",
    "First edition &middot; Book One of the Aflame Library",
]
