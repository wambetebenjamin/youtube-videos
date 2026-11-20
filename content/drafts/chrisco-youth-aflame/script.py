"""The rally edit for CHRISCO Youth Aflame — scene timeline, measured from the real takes.

The spoken Swahili comes to 89 s at the pace the voice actually delivers, not the 55 s the script
originally allocated. The owner chose to keep the delivery unprocessed and let the film run longer
rather than speed it up, so the scene windows here are measured from the audio and will not drift.

Each scene is one shot of the poster with its own camera move: a slow push, a lateral drift, a
settle back. The movement is deliberately small — a poster is a flat image, and a large move makes
it obvious that nothing in the frame is alive. What sells it is the grain, the shake on the accent
beats, and text that lands on the word being said.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent

# The five scenes, in order, with the lines the poster already carries.
SCENES = [
    {
        "id": 1,
        "take": "S1_greeting",
        "title": "Kufika Litein",
        "vo": "Bwana Yesu asifiwe! Vijana wa Kericho, mko tayari? Hapa Litein mambo iko sawa ama "
              "namna gani? Chamgei! Sasa tuko pamoja!",
        # audio, measured: start of the line inside the take, and where it ends
        "start": 0.0,
        "duration": 10.60,
        # camera: (from scale, to scale, from x%, to x%, from y%, to y%)
        "cam": (1.025, 1.075, 50.0, 48.5, 45.0, 42.5),
        "kicker": "CHRISCO YOUTH AFLAME",
        "caption": "BWANA YESU ASIFIWE",
    },
    {
        "id": 2,
        "take": "S2_enemy",
        "title": "Hatutishwi",
        "vo": "Watu wangu, nataka tuongee ukweli mtupu. Kwa muda mrefu, shetani amejaribu "
              "kupangia vijana wetu maisha ya giza. Lakini leo nataka nimwambie shetani "
              "waziwazi: Hatutishwi na hatukubali!",
        "start": 10.60,
        "duration": 15.64,
        "cam": (1.075, 1.025, 48.5, 51.5, 42.5, 40.0),
        "kicker": "KUHUSU VITA",
        "caption": "HATUTISHWI",
    },
    {
        "id": 3,
        "take": "S3_plan",
        "title": "Mpango Kamili",
        "vo": "Sisi kama CHRISCO Youth Aflame tuko na mpango kamili! Kwanza, katika siku kumi "
              "zijazo, tarehe thelathini Novemba hadi tano Desemba elfu mbili ishirini na sita, "
              "tunakutana Nyabokeki Youth Camp pale Litein Senior School! Pili, tumetenga ada "
              "nafuu ya shilingi mia sita pekee kwa kila kijana! Tatu, tunaenda na Kwanza Samueli "
              "thelathini na nane, Pursue, Overtake, and Recover all!",
        "start": 26.24,
        "duration": 32.36,
        "cam": (1.025, 1.07, 51.5, 50.0, 40.0, 43.5),
        "kicker": "TUKUTANE NYABOKEKI",
        "caption": "30 NOV - 5 DEC 2026",
    },
    {
        "id": 4,
        "take": "S4_question",
        "title": "Hapana!",
        "vo": "Wacha niwaulize swali, vijana wenzangu. Kwani sisi tunakaa watu wa kuibiwa baraka "
              "zetu na shetani, jameni? Hapana! Hapana! La hasha! Ingia ndani ya msafara mapema!",
        "start": 58.60,
        "duration": 14.04,
        "cam": (1.07, 1.025, 50.0, 52.0, 43.5, 40.5),
        "kicker": "SWALI KWA VIJANA",
        "caption": "HAPANA! LA HASHA!",
    },
    {
        "id": 5,
        "take": "S5_finale",
        "title": "Zaidi!",
        "vo": "Kufikia mwisho wa hii kambi pale Litein, vijana wetu wote watajazwa na Roho "
              "Mtakatifu, na shetani tutammaliza asubuhi na mapema! Yesu Juu! Youth Aflame! "
              "Tukutane Litein tarehe thelathini!",
        "start": 72.64,
        "duration": 16.44,
        "cam": (1.025, 1.08, 52.0, 50.0, 40.5, 46.0),
        "kicker": "MWISHO WA KAMBI",
        "caption": "YOUTH AFLAME",
    },
]

# Where a crowd reacts: seconds into the line. These are the rhetorical beats, and they are where
# the mix adds the swell — at the question marks and the punchlines, not evenly.
ACCENTS = [
    {"scene": 1, "at": 9.4, "kind": "roar"},        # "Sasa tuko pamoja!"
    {"scene": 2, "at": 14.2, "kind": "roar"},       # "hatukubali!"
    {"scene": 3, "at": 20.6, "kind": "cheer"},      # "shilingi mia sita"
    {"scene": 3, "at": 31.3, "kind": "roar"},       # "Recover all!"
    {"scene": 4, "at": 10.6, "kind": "cheer"},      # "Hapana!"
    {"scene": 4, "at": 12.0, "kind": "cheer"},
    {"scene": 5, "at": 8.2, "kind": "roar"},        # "Yesu Juu!"
    {"scene": 5, "at": 15.2, "kind": "roar"},       # "tukutane Litein"
]


def timeline(lead=0.9, tail=3.2, pad=0.55):
    """Absolute times for each scene, from the measured take durations."""
    out, t = [], lead
    for sc in SCENES:
        dur = sc["duration"]
        out.append({"id": sc["id"], "title": sc["title"], "vo": sc["vo"], "caption": sc["caption"],
                    "cam": sc["cam"], "kicker": sc.get("kicker", ""), "start": round(t, 3),
                    "duration": round(dur, 3),
                    "end": round(t + dur, 3)})
        t += dur + pad
    total = round(t - pad + tail, 3)
    return out, lead, total


if __name__ == "__main__":
    tl, lead, total = timeline()
    for s in tl:
        print(f"  scene {s['id']}  {s['start']:6.2f} -> {s['end']:6.2f}  ({s['duration']:5.2f}s)  {s['title']}")
    print(f"total {total:.2f}s ({total/60:.2f} min)")
