"""The script for the long edition of "Peace, Be Still" (Mark 4:35-41).

SEVEN TAKES, one per movement of the story. Every line is a single spoken sentence, because the
narration engine cuts on pauses and one line becomes one caption and one beat on the timeline.

`art` is the illustration that line belongs under. The film cuts to a new picture whenever the art
key changes, and holds each picture for as long as its lines run — so the gallery is paced by the
story rather than by a timer, and no picture overstays.

The text is a retelling: it lives inside the scene (the boat, the water, the men, the night) and
does not explain or apply anything until the storm is over. Scripture is WEB.
"""

TAKES = [
    # ------------------------------------------------------------------ T01
    {
        "take": "T01_evening",
        "title": "The long day",
        "lines": [
            ("It had been a long day by the water.", "01_shore_dusk"),
            ("All afternoon Jesus had been teaching from a boat, pushed a little way out from the shore, because the crowd had grown too thick to stand in.", "01_shore_dusk"),
            ("They came down the hillside in twos and threes and then in dozens, farmers and fishermen, mothers with children on their hips, old men who had walked further than they meant to.", "02_teaching_from_boat"),
            ("They stood at the edge of the lake with their sandals in their hands and the water around their ankles, and they did not leave.", "02_teaching_from_boat"),
            ("So He sat down in a boat and taught them from the water, and His voice carried across the shallows to the last person on the bank.", "02_teaching_from_boat"),
            ("He told them about a farmer who went out to sow, and threw seed on the path and on the rock and among the thorns and into good soil.", "03_seed_and_soil"),
            ("He told them about a lamp that no one lights in order to put it under a basket.", "03_seed_and_soil"),
            ("He told them about a mustard seed, the smallest thing a man can hold between two fingers, that becomes a tree big enough for the birds to nest in.", "03_seed_and_soil"),
            ("The afternoon went slowly, the way afternoons do when there is nowhere else to be.", "04_let_us_go_over"),
            ("The sun came down the sky and touched the water and turned the whole lake the colour of copper.", "04_let_us_go_over"),
            ("When evening had come, He looked at the men in the boat with Him and said the simplest thing in the world.", "04_let_us_go_over"),
            ("Let us go over to the other side.", "04_let_us_go_over"),
            ("Not, let us find shelter. Not, let us wait for morning. Let us go over to the other side, as though the far shore were the most ordinary place to spend the night.", "04_let_us_go_over"),
            ("So they left the crowd standing on the beach and put their hands to the oars.", "05_other_boats"),
        ],
    },
    # ------------------------------------------------------------------ T02
    {
        "take": "T02_the_storm",
        "title": "The storm",
        "lines": [
            ("The lake is not a gentle place, whatever it looks like at sunset.", "05_other_boats"),
            ("It sits in a bowl of hills, and cold air comes down those hills without warning and meets the warm air off the water, and the surface stands up as if something underneath had turned over in its sleep.", "05_other_boats"),
            ("Other small boats had put out with them, and their lamps were scattered across the black water behind, each one a small warm dot in the dark.", "05_other_boats"),
            ("Nobody on that water that night was thinking about a sermon.", "06_storm_rising"),
            ("It came down on them all at once.", "06_storm_rising"),
            ("A great storm of wind, the kind that takes the breath out of a man's mouth and throws it back in his face.", "06_storm_rising"),
            ("The sail cracked and fought and the mast leaned, and the oars that had been pulling steadily a moment before were suddenly only sticks in a man's hands.", "06_storm_rising"),
            ("The waves beat into the boat, one after another, so that the boat was already filling.", "07_waves_into_boat"),
            ("They bailed with whatever came to hand, a wooden bucket, a clay jar, two cupped hands, and the water came in faster than they could throw it out.", "07_waves_into_boat"),
            ("This was not weather to them. These were fishermen. They had spent their whole lives on this lake and they knew exactly what it was saying.", "07_waves_into_boat"),
            ("They knew the weight a boat can take before it stops answering the oar.", "08_boat_filling"),
            ("They knew the sound a hull makes when the sea has decided to have it.", "08_boat_filling"),
            ("The water was over their ankles now, cold as a knife, slapping between the benches as the boat came down off each wave.", "08_boat_filling"),
            ("Their nets were a sodden heap. The clay jar had gone over. One man had lost his grip on the rigging and a second man caught his arm and held it.", "08_boat_filling"),
            ("And in the middle of all of it, in the back of the boat, on the little leather cushion where the steersman usually sits, Jesus was asleep.", "09_asleep_on_cushion"),
        ],
    },
    # ------------------------------------------------------------------ T03
    {
        "take": "T03_the_question",
        "title": "\"Do you not care?\"",
        "lines": [
            ("He himself was in the stern, asleep on the cushion.", "09_asleep_on_cushion"),
            ("Not sitting with His eyes closed. Not braced and waiting. Asleep, with His head on the cushion and the water coming over the side of the boat.", "09_asleep_on_cushion"),
            ("It is the strangest detail in the whole story, and Mark does not soften it.", "09_asleep_on_cushion"),
            ("The sea is trying to kill them and the one they came out with is resting.", "09_asleep_on_cushion"),
            ("They woke Him.", "10_they_wake_him"),
            ("They did not wake Him gently. Men do not wake anyone gently on a night like that.", "10_they_wake_him"),
            ("Hands on His shoulder, voices in His face, water running off their elbows onto Him.", "10_they_wake_him"),
            ("Their words come to us still wet.", "10_they_wake_him"),
            ("Teacher, don't you care that we are dying.", "10_they_wake_him"),
            ("And a question like that is never only a question.", "11_do_you_not_care"),
            ("Underneath it there is an accusation, and underneath the accusation there is something older and harder than the storm.", "11_do_you_not_care"),
            ("They had left their boats and their families and their trade for Him. They had believed He was worth more than all of it combined.", "11_do_you_not_care"),
            ("And now the water was coming in, and He was not doing anything about it.", "11_do_you_not_care"),
            ("So they said, don't you care.", "11_do_you_not_care"),
            ("It is the question of every person who has ever prayed hard and heard the wind keep going.", "11_do_you_not_care"),
        ],
    },
    # ------------------------------------------------------------------ T04
    {
        "take": "T04_peace_be_still",
        "title": "Peace, be still",
        "lines": [
            ("He got up.", "12_peace_be_still"),
            ("That is the first thing to notice. He did not shout from where He lay. He stood up in the boat, on legs that had to find the boards as they dropped and lifted.", "12_peace_be_still"),
            ("And He rebuked the wind, and said to the sea, Peace. Be still.", "12_peace_be_still"),
            ("The words in the oldest copies are not calm words.", "12_peace_be_still"),
            ("They are the words a man uses to tell a violent animal to get down.", "12_peace_be_still"),
            ("Silence. Muzzle it. Come to a stop.", "12_peace_be_still"),
            ("The wind dropped, and there was a great calm.", "13_the_calm"),
            ("Great is the word. Mark could have said the sea grew quiet. He says a great calm came over it, the way a great fear had come over them a minute before.", "13_the_calm"),
            ("The waves did not subside. They stopped.", "13_the_calm"),
            ("The sail came down and hung still. The water in the bottom of the boat stopped slapping and simply lay there, reflecting the lamp.", "13_the_calm"),
            ("And the silence after that kind of noise is a thing a person never forgets.", "13_the_calm"),
            ("Imagine the next thirty seconds in that boat.", "13_the_calm"),
            ("Men standing in ankle-deep water, holding a bucket, holding a rope, holding a jar, not moving, listening.", "13_the_calm"),
            ("The storm had been the loudest thing any of them had ever heard, and it had stopped in the middle of a sentence.", "13_the_calm"),
        ],
    },
    # ------------------------------------------------------------------ T05
    {
        "take": "T05_why_afraid",
        "title": "\"Why are you so afraid?\"",
        "lines": [
            ("Now the sea is flat, and the storm is over, and you would expect relief.", "14_why_are_you_afraid"),
            ("Instead He said to them, Why are you so afraid. How is it that you have no faith.", "14_why_are_you_afraid"),
            ("He does not say, why did you wake me.", "14_why_are_you_afraid"),
            ("He does not say, I told you we were going to the other side.", "14_why_are_you_afraid"),
            ("He asks about the fear, and He asks it after the water is flat.", "14_why_are_you_afraid"),
            ("That is the mercy in the question. He does not interrogate them in the wind. He gets them safe first, and then He asks them to look at their own hearts.", "14_why_are_you_afraid"),
            ("Because the fear was never really about the water.", "15_fear_in_boat"),
            ("The water only made it visible.", "15_fear_in_boat"),
            ("They had been in a boat with Him the entire time.", "15_fear_in_boat"),
            ("The storm did not change who was in the boat with them. It only revealed what they actually believed about Him.", "15_fear_in_boat"),
            ("That He might sleep through their dying.", "15_fear_in_boat"),
            ("That He might not care.", "16_he_cares"),
            ("Anyone who has sat up at night with that question knows how heavy it is.", "16_he_cares"),
            ("And He answers it, not with a lecture, but by standing up and stopping the sea.", "16_he_cares"),
            ("So now the question turns around and rests on them.", "16_he_cares"),
        ],
    },
    # ------------------------------------------------------------------ T06
    {
        "take": "T06_who_is_this",
        "title": "\"Who then is this?\"",
        "lines": [
            ("They were greatly afraid, and said to one another, Who then is this, that even the wind and the sea obey him.", "16_he_cares"),
            ("Look at that. They went out afraid of the storm. They came back afraid of Him.", "17_who_then_is_this"),
            ("The first fear was the fear of drowning, and any man on any sea knows it.", "17_who_then_is_this"),
            ("The second fear is a different thing entirely. It is what happens when you realise the person in the boat with you is not only a person.", "17_who_then_is_this"),
            ("They had heard Him teach all afternoon. They thought they knew exactly who they had.", "17_who_then_is_this"),
            ("And then He spoke to the wind like a man calling a dog off the road.", "17_who_then_is_this"),
            ("Mark does not tell us the answer.", "18_open_question"),
            ("He tells us the question, and leaves it standing at the edge of the water for every person who reads it after them.", "18_open_question"),
            ("Who then is this.", "18_open_question"),
            ("That is the last verse of the story, and it is left open on purpose.", "18_open_question"),
            ("Not a lesson about storms. Not a promise that your particular sea will go flat tonight.", "18_open_question"),
            ("Just this: there is a man in your boat who can say peace to the wind.", "18_open_question"),
            ("And the men who were there that night did not go home and forget it.", "19_after"),
            ("They told it, and told it again, and eventually a man named Mark wrote it down, and the detail he kept, out of all the details he could have kept, was the cushion.", "19_after"),
        ],
    },
    # ------------------------------------------------------------------ T07
    {
        "take": "T07_prayer",
        "title": "Let us pray",
        "lines": [
            ("Let us pray.", "20_prayer"),
            ("Father, thank You that You were in the boat.", "20_prayer"),
            ("You were not on the shore watching us drown. You were in the stern, in the same water, in the same night.", "20_prayer"),
            ("Whatever we are facing tonight, You are not far off from it. You are in it with us.", "20_prayer"),
            ("Forgive us for the ways our fear has sounded like accusation.", "20_prayer"),
            ("Forgive us for believing that Your silence meant You did not care.", "20_prayer"),
            ("You were not indifferent. You were at rest. Teach us the difference.", "21_prayer_hands"),
            ("Lord Jesus, You spoke to the wind and it stopped.", "21_prayer_hands"),
            ("Speak to what is rising in us tonight.", "21_prayer_hands"),
            ("Where there is noise, say peace. Where there is chaos, say be still.", "21_prayer_hands"),
            ("Where there is a storm we have been bailing out for years, stand up in our boat.", "21_prayer_hands"),
            ("And when the water is flat, give us the courage to answer Your question honestly.", "21_prayer_hands"),
            ("To look at our own fear and call it what it is.", "22_peace_lake"),
            ("And then to ask the question the disciples asked, and to keep asking it all our lives.", "22_peace_lake"),
            ("Who then is this.", "22_peace_lake"),
            ("We want to know You, not only Your calm.", "22_peace_lake"),
            ("In Jesus' name, amen.", "22_peace_lake"),
        ],
    },
    # ------------------------------------------------------------------ T08
    {
        "take": "T08_close",
        "title": "Sit, listen, and rest",
        "lines": [
            ("The psalm says, in peace I will both lay myself down and sleep, for You, Yahweh alone, make me live in safety.", "23_sleep_in_peace"),
            ("He slept in the storm because He trusted the Father in the storm.", "23_sleep_in_peace"),
            ("Tonight, if you can, sleep.", "24_lamp_window"),
            ("He is still in the boat.", "24_lamp_window"),
            ("Sit, listen, and encounter God. One story, one prayer at a time.", "24_lamp_window"),
        ],
    },
]


def lines():
    """Every line in order, with ids, art keys and take names — the one source the film is built on."""
    out = []
    for take in TAKES:
        for text, art in take["lines"]:
            out.append({"id": len(out) + 1, "take": take["take"], "title": take["title"],
                        "text": text, "art": art})
    return out


if __name__ == "__main__":
    ls = lines()
    chars = sum(len(l["text"]) for l in ls)
    est = chars / 13.2          # the old read ran ~13.2 letters/s including pauses
    for take in TAKES:
        n = sum(1 for l in ls if l["take"] == take["take"])
        print(f"  {take['take']:<18} {n:3} lines")
    print(f"{len(ls)} lines, {chars} characters, natural read ~{est / 60:.1f} min at the old rate")
